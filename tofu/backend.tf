# ============================================================================
# Azure Container Apps (Serverless Container Hosting)
# ============================================================================
#
# The backend runs as a Container App with a system-assigned managed identity.
# This identity gets role assignments for:
#   1. Cosmos DB Data Contributor (read/write workout data)
#   2. App Configuration Data Reader (fetch Microsoft OAuth config at startup)
#   3. Key Vault Secrets User (fetch JWT signing secret)
#
# Custom domain setup follows Azure's three-step dance:
#   1. TXT record for domain ownership verification
#   2. CNAME record pointing to the container ingress FQDN
#   3. Custom domain resource (cert binding managed outside Terraform via lifecycle ignore)

locals {
  back_app_dns_name = "${local.front_app_dns_name}.api"
}

# Container App for the backend API
resource "azurerm_container_app" "workout_api" {
  name                         = "workout-api"
  resource_group_name          = azurerm_resource_group.workout.name
  container_app_environment_id = data.azurerm_container_app_environment.infra.id
  revision_mode                = "Single"

  # Enable system-assigned managed identity
  identity {
    type = "SystemAssigned"
  }

  # Container configuration
  template {
    container {
      name = "workout-api"
      # 🚀 Pull from GitHub Container Registry (Public)
      image  = "ghcr.io/nelsong6/kill-me/workout-api:latest"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "PORT"
        value = "3000"
      }

      env {
        name  = "AZURE_APP_CONFIG_ENDPOINT"
        value = data.azurerm_app_configuration.infra.endpoint
      }

      env {
        name  = "APP_CONFIG_PREFIX"
        value = local.front_app_dns_name
      }

      env {
        name  = "KEY_VAULT_URL"
        value = "https://${data.azurerm_key_vault.main.name}.vault.azure.net"
      }

      env {
        name  = "MICROSOFT_CLIENT_ID"
        value = azuread_application.microsoft_login.client_id
      }
    }

    min_replicas = 0 # Scale to zero when not in use
    max_replicas = 3
  }

  # The deploy workflow updates the image tag via `az containerapp update`.
  # Ignore drift so tofu doesn't fight the deploy pipeline over the tag.
  lifecycle {
    ignore_changes = [template[0].container[0].image]
  }

  # Ingress configuration
  ingress {
    external_enabled = true
    target_port      = 3000

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }

    # 🔒 NATIVE CORS POLICY
    # Note: Custom domain CORS rules are managed by core infrastructure repo
    cors {
      allowed_origins = [
        # Production: Default Azure hostname
        "https://${azurerm_static_web_app.workout.default_host_name}",
        "https://${local.front_app_dns_name}.${local.infra.dns_zone_name}",

        # Development: Localhost ports for Vite
        "http://localhost:5173",
        "http://localhost:4173"
      ]

      allowed_methods           = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
      allowed_headers           = ["*"]
      exposed_headers           = ["*"]
      max_age_in_seconds        = 3600
      allow_credentials_enabled = true
    }
  }
}

# Grant Container App managed identity access to Cosmos DB
resource "azurerm_cosmosdb_sql_role_assignment" "container_app_cosmos" {
  resource_group_name = local.infra.resource_group_name
  account_name        = data.azurerm_cosmosdb_account.infra.name
  role_definition_id  = "${data.azurerm_cosmosdb_account.infra.id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000002" # Built-in Data Contributor
  principal_id        = azurerm_container_app.workout_api.identity[0].principal_id
  scope               = data.azurerm_cosmosdb_account.infra.id
}

# Grant Container App managed identity read access to Azure App Configuration
resource "azurerm_role_assignment" "container_app_appconfig_reader" {
  scope                = data.azurerm_app_configuration.infra.id
  role_definition_name = "App Configuration Data Reader"
  principal_id         = azurerm_container_app.workout_api.identity[0].principal_id
}

# Import the manually-created role assignment into state.
# Remove this block after the first successful apply.
import {
  to = azurerm_role_assignment.container_app_keyvault_reader
  id = "/subscriptions/aee0cbd2-8074-4001-b610-0f8edb4eaa3c/resourceGroups/infra/providers/Microsoft.KeyVault/vaults/romaine-kv/providers/Microsoft.Authorization/roleAssignments/b76fd73c-8496-4007-8c68-6c4f3af5018f"
}

# Grant Container App managed identity read access to Key Vault secrets (JWT signing secret)
resource "azurerm_role_assignment" "container_app_keyvault_reader" {
  scope                = data.azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_container_app.workout_api.identity[0].principal_id
}

# 1. The Verification Record (Proves to Azure you own the domain)
resource "azurerm_dns_txt_record" "workout_api_verification" {
  name                = "asuid.${local.back_app_dns_name}"
  zone_name           = local.infra.dns_zone_name
  resource_group_name = local.infra.resource_group_name
  ttl                 = 3600

  record {
    value = azurerm_container_app.workout_api.custom_domain_verification_id
  }
}

# 2. The Routing Record (Points to the container ingress)
resource "azurerm_dns_cname_record" "workout_api" {
  name                = local.back_app_dns_name
  zone_name           = local.infra.dns_zone_name
  resource_group_name = local.infra.resource_group_name
  ttl                 = 3600
  record              = azurerm_container_app.workout_api.ingress[0].fqdn
}

# 3. The Custom Domain (Unsecured initially)
resource "azurerm_container_app_custom_domain" "workout_api" {
  name             = "${local.back_app_dns_name}.${local.infra.dns_zone_name}"
  container_app_id = azurerm_container_app.workout_api.id

  # We must completely omit the certificate binding fields and tell Terraform 
  # to ignore them, so it doesn't destroy the cert once Azure generates it.
  lifecycle {
    ignore_changes = [
      certificate_binding_type,
      container_app_environment_certificate_id
    ]
  }

  depends_on = [
    azurerm_dns_txt_record.workout_api_verification,
    azurerm_dns_cname_record.workout_api
  ]
}

# ============================================================================
# Azure Container Apps (Serverless Container Hosting)
# ============================================================================

# Container App for the backend API
resource "azurerm_container_app" "workout_api" {
  name                         = "workout-api"
  resource_group_name          = azurerm_resource_group.workout.name
  container_app_environment_id = data.terraform_remote_state.infra.outputs.container_app_environment_id
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

      # Environment variables
      env {
        name  = "COSMOS_DB_ENDPOINT"
        value = data.terraform_remote_state.infra.outputs.cosmos_db_endpoint
      }

      env {
        name  = "COSMOS_DB_DATABASE_NAME"
        value = azurerm_cosmosdb_sql_database.workout.name
      }

      env {
        name  = "COSMOS_DB_CONTAINER_NAME"
        value = azurerm_cosmosdb_sql_container.workouts.name
      }

      env {
        name  = "PORT"
        value = "3000"
      }

      # Frontend URL will be set via environment variable or app config
      # Custom domain configuration is managed by core infrastructure repo
    }

    min_replicas = 0 # Scale to zero when not in use
    max_replicas = 3
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
        "https://${local.front_app_dns_name}.${data.terraform_remote_state.infra.outputs.dns_zone_name}",

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
  resource_group_name = data.terraform_remote_state.infra.outputs.resource_group_name
  account_name        = data.terraform_remote_state.infra.outputs.cosmos_db_account_name
  role_definition_id  = "${data.terraform_remote_state.infra.outputs.cosmos_db_account_id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000002" # Built-in Data Contributor
  principal_id        = azurerm_container_app.workout_api.identity[0].principal_id
  scope               = data.terraform_remote_state.infra.outputs.cosmos_db_account_id
}

resource "auth0_resource_server" "backend_api" {
  name = "WorkoutTracker Backend API"
  # The audience identifier doesn't have to be a publicly routable URL, 
  # but using your domain is best practice to guarantee uniqueness.
  identifier  = "https://api.${data.terraform_remote_state.infra.outputs.dns_zone_name}"
  signing_alg = "RS256"

  # Allows the frontend to request refresh tokens so users stay logged in
  allow_offline_access = true

  # Prevents the "WorkoutTracker is requesting access to your account" 
  # prompt since you own both the frontend and backend.
  skip_consent_for_verifiable_first_party_clients = true
}

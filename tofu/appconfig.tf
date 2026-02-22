# ============================================================================
# Azure App Configuration Key-Values
# ============================================================================
# These keys are read at runtime by the backend via fetchAppConfig() in
# backend/startup/appConfig.js. The Container App's managed identity has the
# "App Configuration Data Reader" role assigned in backend.tf.

locals {
  # Must match the domain hardcoded in provider.tf
  auth0_domain = "dev-gtdi5x5p0nmticqd.us.auth0.com"
}

resource "azurerm_app_configuration_key" "auth0_domain" {
  configuration_store_id = var.azure_app_config_resource_id
  key                    = "${local.front_app_dns_name}/AUTH0_DOMAIN"
  value                  = local.auth0_domain
}

resource "azurerm_app_configuration_key" "auth0_audience" {
  configuration_store_id = var.azure_app_config_resource_id
  key                    = "${local.front_app_dns_name}/AUTH0_AUDIENCE"
  value                  = auth0_resource_server.backend_api.identifier
}

resource "azurerm_app_configuration_key" "cosmos_db_endpoint" {
  configuration_store_id = var.azure_app_config_resource_id
  key                    = "${local.front_app_dns_name}/cosmos_db_endpoint"
  value                  = "https://${var.cosmos_db_account_name}.documents.azure.com:443/"
}

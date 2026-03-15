# ============================================================================
# Azure App Configuration Key-Values
# ============================================================================
# These keys are read at runtime by the backend via fetchAppConfig() in
# backend/startup/appConfig.js. The Container App's managed identity has the
# "App Configuration Data Reader" role assigned in backend.tf.
#
# Keys are namespaced by the frontend DNS name (e.g., "workout/AUTH0_AUDIENCE")
# so multiple apps can share the same App Configuration store without collisions.
# The AUTH0_DOMAIN and cosmos_db_endpoint keys are global (no prefix) because
# they're shared across all apps — they're managed by infra-bootstrap.

resource "azurerm_app_configuration_key" "auth0_audience" {
  configuration_store_id = data.azurerm_app_configuration.infra.id
  key                    = "${local.front_app_dns_name}/AUTH0_AUDIENCE"
  value                  = auth0_resource_server.backend_api.identifier
}

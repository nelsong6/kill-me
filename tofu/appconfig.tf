# ============================================================================
# Azure App Configuration Key-Values
# ============================================================================

# Per-app Microsoft OAuth client ID (kill-me has its own app registration,
# unlike apps that use the shared infra-bootstrap registration).
resource "azurerm_app_configuration_key" "microsoft_client_id" {
  configuration_store_id = data.azurerm_app_configuration.infra.id
  key                    = "${local.front_app_dns_name}:microsoft_client_id"
  value                  = azuread_application.microsoft_login.client_id
}

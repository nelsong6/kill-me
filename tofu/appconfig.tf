# Per-app Microsoft OAuth client ID published under the convention key
# `<app>/microsoft_oauth_client_id` — matches the `*/microsoft_oauth_client_id`
# filter used by the shared api middleware and this app's backend to discover
# accepted audiences across all per-app registrations.
resource "azurerm_app_configuration_key" "microsoft_oauth_client_id" {
  configuration_store_id = data.azurerm_app_configuration.infra.id
  key                    = "${local.front_app_dns_name}/microsoft_oauth_client_id"
  value                  = azuread_application.microsoft_login.client_id
}

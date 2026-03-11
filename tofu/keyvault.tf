data "azurerm_key_vault" "main" {
  name                = local.infra.key_vault_name
  resource_group_name = local.infra.resource_group_name
}

data "azurerm_key_vault_secret" "auth0_client_secret" {
  name         = "auth0-client-secret"
  key_vault_id = data.azurerm_key_vault.main.id
}

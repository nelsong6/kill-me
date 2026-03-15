data "azurerm_key_vault" "main" {
  name                = "romaine-kv"
  resource_group_name = local.infra.resource_group_name
}

# Self-signed JWT signing secret for the backend auth middleware.
# Generated once by Terraform; the backend reads it from Key Vault at startup.
resource "random_password" "jwt_signing_secret" {
  length  = 64
  special = false
}

resource "azurerm_key_vault_secret" "jwt_signing_secret" {
  name         = "kill-me-jwt-signing-secret"
  value        = random_password.jwt_signing_secret.result
  key_vault_id = data.azurerm_key_vault.main.id
}

# TODO: Remove after first successful apply (needed by auth0 provider for teardown)
data "azurerm_key_vault_secret" "auth0_client_secret" {
  name         = "auth0-client-secret"
  key_vault_id = data.azurerm_key_vault.main.id
}

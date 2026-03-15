# Remote state in Azure Storage (backend config passed via -backend-config in CI).
# OIDC auth for Azure and Azure AD providers — no static credentials stored.

terraform {
  backend "azurerm" {}
}

provider "azurerm" {
  features {}
  use_oidc = true
}

provider "azuread" {
  use_oidc = true
}

# TODO: Remove after first successful apply (lets tofu destroy Auth0 resources in state)
provider "auth0" {
  domain        = "dev-gtdi5x5p0nmticqd.us.auth0.com"
  client_id     = "7qsN7zrBAh7TwhjEUcgtU46yOSs9TXbg"
  client_secret = data.azurerm_key_vault_secret.auth0_client_secret.value
}

# Remote state in Azure Storage (backend config passed via -backend-config in CI).
# OIDC auth for both Azure and Auth0 providers — no static credentials stored.
# The Auth0 client_secret is fetched from Key Vault at plan/apply time, keeping
# it out of the repo and state file.

terraform {
  backend "azurerm" {}
}

provider "azurerm" {
  features {}
  use_oidc = true
}

provider "auth0" {
  domain        = "dev-gtdi5x5p0nmticqd.us.auth0.com"
  client_id     = "7qsN7zrBAh7TwhjEUcgtU46yOSs9TXbg"
  client_secret = data.azurerm_key_vault_secret.auth0_client_secret.value
}

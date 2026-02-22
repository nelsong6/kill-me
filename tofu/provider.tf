terraform {
  required_version = ">= 1.6.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    spacelift = {
      source  = "spacelift-io/spacelift"
      version = "~> 1.0"
    }
  }
}

provider "azurerm" {
  features {}
  use_oidc = true # Enable OIDC authentication
}


provider "infisical" {
  host = "https://app.infisical.com"
  auth = {
    oidc = {
      identity_id                     = "474b7b4f-9205-48f6-8ae1-2f4f2a248af1"
      token_environment_variable_name = "GITHUB_OIDC_TOKEN" 
    }
  }
}

provider "spacelift" {}

provider "auth0" {
  domain        = "dev-gtdi5x5p0nmticqd.us.auth0.com"
  client_id     = "7qsN7zrBAh7TwhjEUcgtU46yOSs9TXbg"
  client_secret = var.auth0_client_secret
}

resource "azurerm_resource_group" "workout" {
  name     = "workout-rg"
  location = var.location
}

# Used as the App Configuration key prefix and the DNS hostname.
# Previously also named the SWA + DNS CNAME; now that the app runs on AKS,
# the remaining users are the App Config key prefix and the redirect URI
# in oauth.tf.
locals {
  front_app_dns_name = "workout"
}

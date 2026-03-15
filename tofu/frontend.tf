# Azure Static Web App for the React frontend. Free tier — deployment is handled
# by GitHub Actions (container-app-build workflow), not by SWA's built-in CI.
# The lifecycle ignore on repository_url/branch prevents Terraform from fighting
# with the GitHub integration.
resource "azurerm_static_web_app" "workout" {
  name                = "workout-app"
  resource_group_name = azurerm_resource_group.workout.name
  location            = azurerm_resource_group.workout.location
  sku_tier            = "Free"
  sku_size            = "Free"
  lifecycle {
    ignore_changes = [
      repository_url,
      repository_branch
    ]
  }
}

locals {
  front_app_dns_name = "workout"
}

resource "azurerm_dns_cname_record" "workout" {
  name                = local.front_app_dns_name
  zone_name           = local.infra.dns_zone_name
  resource_group_name = local.infra.resource_group_name
  ttl                 = 3600
  record              = azurerm_static_web_app.workout.default_host_name
}

resource "azurerm_static_web_app_custom_domain" "workout" {
  static_web_app_id = azurerm_static_web_app.workout.id
  domain_name       = "${local.front_app_dns_name}.${local.infra.dns_zone_name}"
  validation_type   = "cname-delegation"
  depends_on        = [azurerm_dns_cname_record.workout]
}

# User-facing Microsoft sign-in app registration (separate from the CI/CD app reg).
# Supports personal Microsoft accounts via MSAL.js redirect flow.
resource "azuread_application" "microsoft_login" {
  display_name     = "kill-me-microsoft-login"
  sign_in_audience = "AzureADandPersonalMicrosoftAccount"

  api {
    requested_access_token_version = 2
  }

  single_page_application {
    redirect_uris = [
      "https://${local.front_app_dns_name}.${local.infra.dns_zone_name}/",
      "http://localhost:5173/",
    ]
  }
}

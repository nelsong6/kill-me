# Azure Static Web App (Free Tier)
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

# ============================================================================
# Custom Domain Configuration
# ============================================================================

locals {
  front_app_dns_name = "workout"
}

# 1. Create the CNAME record in your shared DNS zone
resource "azurerm_dns_cname_record" "workout" {
  name                = local.front_app_dns_name
  zone_name           = data.spacelift_stack_output.dns_zone_name.value
  resource_group_name = data.spacelift_stack_output.resource_group_name.value
  ttl                 = 3600
  record              = azurerm_static_web_app.workout.default_host_name
}

# 2. Bind the custom domain to the Static Web App
resource "azurerm_static_web_app_custom_domain" "workout" {
  static_web_app_id = azurerm_static_web_app.workout.id
  domain_name       = "${local.front_app_dns_name}.${data.spacelift_stack_output.dns_zone_name.value}"
  validation_type   = "cname-delegation"

  # Ensure the DNS record exists before Azure tries to validate the domain
  depends_on = [azurerm_dns_cname_record.workout]
}

resource "auth0_client" "frontend_spa" {
  name           = "WorkoutTracker Web UI"
  app_type       = "spa"
  is_first_party = true

  # The exact URLs Auth0 will allow post-login redirects to.
  # Includes your local Vite dev server and the future Azure Static Web App URL.
  callbacks = [
    "http://localhost:5173",
    "https://${local.front_app_dns_name}.${data.spacelift_stack_output.dns_zone_name.value}"
  ]

  # Where users are allowed to be sent after clicking logout
  allowed_logout_urls = [
    "http://localhost:5173",
    "https://${local.front_app_dns_name}.${data.spacelift_stack_output.dns_zone_name.value}"
  ]

  # Enforces CORS so only your domain and localhost can make requests to Auth0
  web_origins = [
    "http://localhost:5173",
    "https://${local.front_app_dns_name}.${data.spacelift_stack_output.dns_zone_name.value}"
  ]

  jwt_configuration {
    alg = "RS256"
  }

  # The specific OIDC flows a Single Page Application is allowed to use
  grant_types = [
    "authorization_code",
    "implicit",
    "refresh_token"
  ]
}

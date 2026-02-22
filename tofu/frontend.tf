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
  zone_name           = var.dns_zone_name
  resource_group_name = var.resource_group_name
  ttl                 = 3600
  record              = azurerm_static_web_app.workout.default_host_name
}

resource "azurerm_static_web_app_custom_domain" "workout" {
  static_web_app_id = azurerm_static_web_app.workout.id
  domain_name       = "${local.front_app_dns_name}.${var.dns_zone_name}"
  validation_type   = "cname-delegation"
  depends_on = [azurerm_dns_cname_record.workout]
}

resource "auth0_client" "frontend_spa" {
  name           = "WorkoutTracker Web UI"
  app_type       = "spa"
  is_first_party = true
  callbacks = [
    "http://localhost:5173",
    "https://${local.front_app_dns_name}.${var.dns_zone_name}"
  ]
  allowed_logout_urls = [
    "http://localhost:5173",
    "https://${local.front_app_dns_name}.${var.dns_zone_name}"
  ]
  web_origins = [
    "http://localhost:5173",
    "https://${local.front_app_dns_name}.${var.dns_zone_name}"
  ]
  jwt_configuration {
    alg = "RS256"
  }
  grant_types = [
    "authorization_code",
    "implicit",
    "refresh_token"
  ]
}

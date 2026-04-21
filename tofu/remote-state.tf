# References to shared infrastructure provisioned by infra-bootstrap.
# Only resource names are stored here — full IDs and endpoints are resolved
# via data source lookups at plan time.

locals {
  infra = {
    resource_group_name = "infra"
    dns_zone_name       = "romaine.life"
  }
}

data "azurerm_cosmosdb_account" "infra" {
  name                = "infra-cosmos-serverless"
  resource_group_name = local.infra.resource_group_name
}

data "azurerm_app_configuration" "infra" {
  name                = "infra-appconfig"
  resource_group_name = local.infra.resource_group_name
}

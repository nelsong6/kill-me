# Outputs
output "resource_group_name" {
  value       = azurerm_resource_group.workout.name
  description = "Name of the resource group"
}

output "static_web_app_name" {
  value       = azurerm_static_web_app.workout.name
  description = "Name of the Azure Static Web App"
}

output "static_web_app_default_hostname" {
  value       = azurerm_static_web_app.workout.default_host_name
  description = "Default hostname of the Static Web App"
}

output "cosmos_db_name" {
  value       = var.cosmos_db_account_name
  description = "Cosmos DB account name"
}

output "cosmos_db_database_name" {
  value       = azurerm_cosmosdb_sql_database.workout.name
  description = "Cosmos DB database name"
}

output "cosmos_db_container_name" {
  value       = azurerm_cosmosdb_sql_container.workouts.name
  description = "Cosmos DB container name for workouts"
}

output "backend_api_url" {
  value       = "https://${local.back_app_dns_name}.${var.dns_zone_name}"
  description = "The URL of the backend Container App API"
}

output "container_app_name" {
  value       = azurerm_container_app.workout_api.name
  description = "Name of the backend Container App, picked up by github actions to handle custom dns for container app."
}

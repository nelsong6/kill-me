# ============================================================================
# Resource Group
# ============================================================================

resource "azurerm_resource_group" "workout" {
  name     = "workout-rg"
  location = var.location
}


# ============================================================================
# Note: User/developer role assignments for Cosmos DB should be managed
# separately (e.g., via Azure Portal, CLI, or core infrastructure repo)
# to avoid hardcoding user-specific principal IDs in application code.
# ============================================================================

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


output "cosmos_db_endpoint" {
  value       = var.cosmos_db_endpoint
  description = "Cosmos DB account endpoint"
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

variable "commit_sha" {
  type        = string
  description = "The Git SHA passed dynamically from Spacelift to force an apply"
}

resource "terraform_data" "cd_webhook_trigger" {
  triggers_replace = [
    var.commit_sha
  ]
}

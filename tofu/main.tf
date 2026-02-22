# ============================================================================
# Resource Group
# ============================================================================

resource "azurerm_resource_group" "workout" {
  name     = "workout-rg"
  location = var.location
}

# ============================================================================
# Shared Infrastructure (Spacelift Stack Outputs)
# ============================================================================

locals {
  infra_stack_id = "infra-bootstrap"
}

data "spacelift_stack_output" "resource_group_name" {
  stack_id = local.infra_stack_id
  name     = "resource_group_name"
}

data "spacelift_stack_output" "cosmos_db_endpoint" {
  stack_id = local.infra_stack_id
  name     = "cosmos_db_endpoint"
}

data "spacelift_stack_output" "cosmos_db_account_name" {
  stack_id = local.infra_stack_id
  name     = "cosmos_db_account_name"
}

data "spacelift_stack_output" "cosmos_db_account_id" {
  stack_id = local.infra_stack_id
  name     = "cosmos_db_account_id"
}

data "spacelift_stack_output" "dns_zone_name" {
  stack_id = local.infra_stack_id
  name     = "dns_zone_name"
}

data "spacelift_stack_output" "container_app_environment_id" {
  stack_id = local.infra_stack_id
  name     = "container_app_environment_id"
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
  value       = data.spacelift_stack_output.cosmos_db_endpoint.value
  description = "Cosmos DB account endpoint"
}

output "cosmos_db_name" {
  value       = data.spacelift_stack_output.cosmos_db_account_name.value
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


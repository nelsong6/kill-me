# Cosmos DB NoSQL Database (app-specific; account is managed by shared infra)
resource "azurerm_cosmosdb_sql_database" "workout" {
  name                = "WorkoutTrackerDB"
  resource_group_name = data.spacelift_stack_output.resource_group_name.value
  account_name        = data.spacelift_stack_output.cosmos_db_account_name.value
}

# Cosmos DB Container for Workouts
resource "azurerm_cosmosdb_sql_container" "workouts" {
  name                = "workouts"
  resource_group_name = data.spacelift_stack_output.resource_group_name.value
  account_name        = data.spacelift_stack_output.cosmos_db_account_name.value
  database_name       = azurerm_cosmosdb_sql_database.workout.name
  partition_key_paths = ["/userId"]

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }
  }
}

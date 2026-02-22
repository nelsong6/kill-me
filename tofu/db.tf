# Cosmos DB NoSQL Database (app-specific; account is managed by shared infra)
resource "azurerm_cosmosdb_sql_database" "workout" {
  name                = "WorkoutTrackerDB"
  resource_group_name = data.terraform_remote_state.infra.outputs.resource_group_name
  account_name        = data.terraform_remote_state.infra.outputs.cosmos_db_account_name
}

# Cosmos DB Container for Workouts
resource "azurerm_cosmosdb_sql_container" "workouts" {
  name                = "workouts"
  resource_group_name = data.terraform_remote_state.infra.outputs.resource_group_name
  account_name        = data.terraform_remote_state.infra.outputs.cosmos_db_account_name
  database_name       = azurerm_cosmosdb_sql_database.workout.name
  partition_key_paths = ["/userId"]

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }
  }
}

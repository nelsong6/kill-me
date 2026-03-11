# Cosmos DB NoSQL Database (app-specific; account is managed by shared infra)
resource "azurerm_cosmosdb_sql_database" "workout" {
  name                = "WorkoutTrackerDB"
  resource_group_name = local.infra.resource_group_name
  account_name        = local.infra.cosmos_db_account_name
  # throughput          = 400 # I tried setting this but azurerm didn't like it, and it's already 400 in the
  lifecycle {
    ignore_changes = [throughput]
  }
}

resource "azurerm_cosmosdb_sql_container" "workouts" {
  name                = "workouts"
  resource_group_name = local.infra.resource_group_name
  account_name        = local.infra.cosmos_db_account_name
  database_name       = azurerm_cosmosdb_sql_database.workout.name
  partition_key_paths = ["/userId"]

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }
  }
}

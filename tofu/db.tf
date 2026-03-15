# Cosmos DB NoSQL Database (app-specific; the account itself is managed by
# infra-bootstrap as a shared resource across all apps).
#
# Single container partitioned by /userId — all document types (workout-day-definition,
# exercise, logged-workout, settings) share this container. The partition key means
# each user's data is co-located for efficient queries, and cross-user access is
# naturally isolated by the backend's Auth0 JWT sub claim filtering.
resource "azurerm_cosmosdb_sql_database" "workout" {
  name                = "WorkoutTrackerDB"
  resource_group_name = local.infra.resource_group_name
  account_name        = data.azurerm_cosmosdb_account.infra.name
  # throughput          = 400 # I tried setting this but azurerm didn't like it, and it's already 400 in the
  lifecycle {
    ignore_changes = [throughput]
  }
}

resource "azurerm_cosmosdb_sql_container" "workouts" {
  name                = "workouts"
  resource_group_name = local.infra.resource_group_name
  account_name        = data.azurerm_cosmosdb_account.infra.name
  database_name       = azurerm_cosmosdb_sql_database.workout.name
  partition_key_paths = ["/userId"]

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }
  }
}

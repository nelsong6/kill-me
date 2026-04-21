# Cosmos DB NoSQL Database (app-specific; the account itself is managed by
# infra-bootstrap as a shared resource across all apps).
#
# Single container partitioned by /userId — all document types (workout-day-definition,
# exercise, logged-workout, settings, account) share this container. The partition key
# means each user's data is co-located for efficient queries.
resource "azurerm_cosmosdb_sql_database" "workout" {
  name                = "WorkoutTrackerDB"
  resource_group_name = local.infra.resource_group_name
  account_name        = data.azurerm_cosmosdb_account.infra.name
}

# Serverless account has no throughput to ignore. DB + container live on
# the new account; imports adopt them after a prior `tofu state rm` drops
# the old-account state entries.
import {
  to = azurerm_cosmosdb_sql_database.workout
  id = "/subscriptions/aee0cbd2-8074-4001-b610-0f8edb4eaa3c/resourceGroups/infra/providers/Microsoft.DocumentDB/databaseAccounts/infra-cosmos-serverless/sqlDatabases/WorkoutTrackerDB"
}

import {
  to = azurerm_cosmosdb_sql_container.workouts
  id = "/subscriptions/aee0cbd2-8074-4001-b610-0f8edb4eaa3c/resourceGroups/infra/providers/Microsoft.DocumentDB/databaseAccounts/infra-cosmos-serverless/sqlDatabases/WorkoutTrackerDB/containers/workouts"
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

locals {
  _sub = "aee0cbd2-8074-4001-b610-0f8edb4eaa3c"
  _rg  = "infra"
  _dns = "romaine.life"
}

import {
  to = azurerm_resource_group.workout
  id = "/subscriptions/${local._sub}/resourceGroups/workout-rg"
}

import {
  to = azurerm_static_web_app.workout
  id = "/subscriptions/${local._sub}/resourceGroups/workout-rg/providers/Microsoft.Web/staticSites/workout-app"
}

import {
  to = azurerm_dns_cname_record.workout
  id = "/subscriptions/${local._sub}/resourceGroups/${local._rg}/providers/Microsoft.Network/dnsZones/${local._dns}/CNAME/workout"
}

import {
  to = azurerm_static_web_app_custom_domain.workout
  id = "/subscriptions/${local._sub}/resourceGroups/workout-rg/providers/Microsoft.Web/staticSites/workout-app/customDomains/workout.romaine.life"
}

import {
  to = azurerm_container_app.workout_api
  id = "/subscriptions/${local._sub}/resourceGroups/workout-rg/providers/Microsoft.App/containerApps/workout-api"
}

import {
  to = azurerm_dns_txt_record.workout_api_verification
  id = "/subscriptions/${local._sub}/resourceGroups/${local._rg}/providers/Microsoft.Network/dnsZones/${local._dns}/TXT/asuid.workout.api"
}

import {
  to = azurerm_dns_cname_record.workout_api
  id = "/subscriptions/${local._sub}/resourceGroups/${local._rg}/providers/Microsoft.Network/dnsZones/${local._dns}/CNAME/workout.api"
}

import {
  to = azurerm_cosmosdb_sql_database.workout
  id = "/subscriptions/${local._sub}/resourceGroups/${local._rg}/providers/Microsoft.DocumentDB/databaseAccounts/infra-cosmos/sqlDatabases/WorkoutTrackerDB"
}

import {
  to = azurerm_cosmosdb_sql_container.workouts
  id = "/subscriptions/${local._sub}/resourceGroups/${local._rg}/providers/Microsoft.DocumentDB/databaseAccounts/infra-cosmos/sqlDatabases/WorkoutTrackerDB/containers/workouts"
}

import {
  to = azurerm_app_configuration_key.auth0_audience
  id = "https://infra-appconfig.azconfig.io/kv/workout%2FAUTH0_AUDIENCE?label="
}

import {
  to = azurerm_container_app_custom_domain.workout_api
  id = "/subscriptions/${local._sub}/resourceGroups/workout-rg/providers/Microsoft.App/containerApps/workout-api/customDomainName/workout.api.romaine.life"
}

import {
  to = azurerm_role_assignment.container_app_appconfig_reader
  id = "/subscriptions/${local._sub}/resourceGroups/${local._rg}/providers/Microsoft.AppConfiguration/configurationStores/infra-appconfig/providers/Microsoft.Authorization/roleAssignments/bf96b614-4197-2cc8-938a-491ea5288d0f"
}

import {
  to = azurerm_cosmosdb_sql_role_assignment.container_app_cosmos
  id = "/subscriptions/${local._sub}/resourceGroups/${local._rg}/providers/Microsoft.DocumentDB/databaseAccounts/infra-cosmos/sqlRoleAssignments/008225ce-baba-8cf6-f839-a04f75957750"
}

import {
  to = auth0_resource_server.backend_api
  id = "699b952de05eefdd70899fcb"
}

import {
  to = auth0_client.frontend_spa
  id = "tk1v0W9XHoIJAXk1GdW0oTRPpALTnTF4"
}

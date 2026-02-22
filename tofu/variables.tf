# ============================================================================
# Application Variables
# ============================================================================

variable "location" {
  description = "Azure region where the resource group will be created"
  type        = string
  default     = "westus2"
}

variable "auth0_client_secret" {
  type      = string
  sensitive = true
}

# ============================================================================
# Shared Infrastructure Variables
# ============================================================================

variable "resource_group_name" {
  description = "Name of the shared resource group"
  type        = string
}

variable "resource_group_location" {
  description = "Location of the shared resource group"
  type        = string
}

variable "resource_group_id" {
  description = "ID of the shared resource group"
  type        = string
}

variable "dns_zone_name" {
  description = "Name of the DNS zone"
  type        = string
}

variable "dns_zone_id" {
  description = "ID of the DNS zone"
  type        = string
}

variable "dns_zone_nameservers" {
  description = "Nameservers for the DNS zone"
  type        = string
}

variable "container_app_environment_name" {
  description = "Name of the Container App Environment"
  type        = string
}

variable "container_app_environment_id" {
  description = "ID of the Container App Environment"
  type        = string
}

variable "cosmos_db_account_name" {
  description = "Name of the Cosmos DB account"
  type        = string
}

variable "cosmos_db_account_id" {
  description = "ID of the Cosmos DB account"
  type        = string
}

variable "cosmos_db_endpoint" {
  description = "Endpoint URL of the Cosmos DB account"
  type        = string
}

variable "azure_subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

variable "azure_tenant_id" {
  description = "Azure tenant ID"
  type        = string
}

variable "spacelift_commit_sha" {
  description = "The Git SHA passed dynamically from Spacelift to force an apply"
  type        = string
}

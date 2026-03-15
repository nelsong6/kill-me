import { AppConfigurationClient } from '@azure/app-configuration';
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

/**
 * Fetches application configuration from Azure App Configuration and Key Vault.
 *
 * Environment variables consumed:
 *   AZURE_APP_CONFIG_ENDPOINT  – App Configuration endpoint URL
 *   APP_CONFIG_PREFIX          – key prefix (e.g. "workout")
 *   KEY_VAULT_URL              – Key Vault endpoint URL
 */
export async function fetchAppConfig() {
  const appConfigEndpoint = process.env.AZURE_APP_CONFIG_ENDPOINT;
  if (!appConfigEndpoint) {
    throw new Error('AZURE_APP_CONFIG_ENDPOINT environment variable is not set.');
  }

  const prefix = process.env.APP_CONFIG_PREFIX;
  if (!prefix) {
    throw new Error('APP_CONFIG_PREFIX environment variable is not set.');
  }

  const keyVaultUrl = process.env.KEY_VAULT_URL;
  if (!keyVaultUrl) {
    throw new Error('KEY_VAULT_URL environment variable is not set.');
  }

  const credential = new DefaultAzureCredential();
  const appConfigClient = new AppConfigurationClient(appConfigEndpoint, credential);
  const kvClient = new SecretClient(keyVaultUrl, credential);

  // App Configuration: shared values
  const cosmosEndpointSetting = await appConfigClient.getConfigurationSetting({
    key: 'cosmos_db_endpoint',
  });

  // Key Vault: per-app secret
  const jwtSigningSecret = (
    await kvClient.getSecret('kill-me-jwt-signing-secret')
  ).value;

  // Microsoft OAuth client ID comes from a Container App env var (set by tofu),
  // not from App Config — kill-me owns its own app registration.
  const microsoftClientId = process.env.MICROSOFT_CLIENT_ID;

  const config = {
    cosmosDbEndpoint: cosmosEndpointSetting.value,
    jwtSigningSecret,
    microsoftClientId,
  };

  const required = ['cosmosDbEndpoint', 'jwtSigningSecret', 'microsoftClientId'];
  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Configuration value "${key}" is missing or empty.`);
    }
  }

  console.log('[appConfig] Application config fetched from Azure App Configuration');
  return config;
}

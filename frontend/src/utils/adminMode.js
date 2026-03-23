// Admin mode gates access to dev-only features: database initialization and
// LocalStorage migration. It's enabled only when running on localhost in Vite's
// dev mode — production builds never expose the admin tab.
//
// The "Must have Azure CLI session" note in the original docstring is misleading —
// admin mode detection doesn't check for Azure CLI. The CLI session is needed by
// the backend's DefaultAzureCredential, not by this frontend check.

export const isLocalhost = () => {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || 
         hostname === '127.0.0.1' || 
         hostname === '[::1]' ||
         hostname.includes('local');
};

export const isAdminMode = () => {
  // Admin mode only available on localhost
  if (!isLocalhost()) {
    return false;
  }

  // Check if we're in development mode
  const isDev = import.meta.env.DEV;
  
  return isDev;
};

export const getAdminInfo = () => {
  return {
    isAdmin: isAdminMode(),
    isLocalhost: isLocalhost(),
    isDev: import.meta.env.DEV,
    hostname: window.location.hostname,
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/workout'
  };
};

/**
 * Admin Mode Detection
 * 
 * Determines if the app is running in admin mode:
 * - Must be running on localhost
 * - Must have Azure CLI session (for local dev)
 */

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
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000'
  };
};

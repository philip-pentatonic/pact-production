// Configuration for the admin application
export const ADMIN_CONFIG = {
  // Backend configuration
  backend: {
    url: import.meta.env.VITE_API_URL || "http://localhost:8787",
    endpoints: {
      auth: "/api/auth",
      dashboard: "/api/dashboard",
      upload: "/api/upload",
      members: "/api/members",
      stores: "/api/stores",
      analytics: "/api/analytics",
      warehouse: "/api/admin/warehouse",
      kiosk: "/api/kiosk",
      keys: "/api/keys",
      ingestionLogs: "/api/ingestion-logs",
      materialTypes: "/api/material-types"
    }
  },
  
  // App settings
  app: {
    name: "Admin Dashboard",
    version: "1.0.0"
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  const baseUrl = ADMIN_CONFIG.backend.url;
  
  // If baseUrl already ends with /api, don't add it again
  if (baseUrl.endsWith('/api')) {
    // Remove /api from endpoint if it starts with it
    const cleanEndpoint = endpoint.startsWith('/api') ? endpoint.substring(4) : endpoint;
    return `${baseUrl}${cleanEndpoint}`;
  }
  
  // Otherwise, ensure endpoint starts with /api
  const normalizedEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
  return `${baseUrl}${normalizedEndpoint}`;
};

export default ADMIN_CONFIG; 
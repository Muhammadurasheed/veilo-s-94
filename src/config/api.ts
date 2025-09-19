/**
 * 🔧 API Configuration
 * Centralized configuration for all API endpoints and URLs
 */

// Backend URL Configuration - Environment Based
const backendUrl = import.meta.env.VITE_API_BASE_URL || 'https://veilos-backend.onrender.com';

export const API_CONFIG = {
  // Base URLs - Smart backend selection
  BASE_URL: backendUrl,
  BACKEND_URL: backendUrl,
  API_URL: backendUrl,
  
  // WebSocket URLs
  SOCKET_URL: backendUrl,
  WS_URL: backendUrl.replace('http', 'ws'),
  
  // Development fallbacks
  DEV_FALLBACK: 'http://localhost:3000',
  
  // Environment detection
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
} as const;

console.log('🔗 API Configuration:', {
  environment: import.meta.env.DEV ? 'development' : 'production',
  backendUrl: backendUrl
});

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: '/api/auth',
  
  // Sanctuary
  SANCTUARY: '/api/sanctuary',
  FLAGSHIP_SANCTUARY: '/api/flagship-sanctuary',
  LIVE_SANCTUARY: '/api/live-sanctuary',
  
  // Users & Experts
  USERS: '/api/users',
  EXPERTS: '/api/experts',
  
  // Admin
  ADMIN: '/api/admin',
  
  // Host Recovery
  HOST_RECOVERY: '/api/host-recovery',
  
  // Breakout Rooms
  BREAKOUT_ROOMS: '/api/flagship-sanctuary',
  
  // Chat & Messaging
  CHAT: '/api/chat',
  
  // Agora
  AGORA: '/api/agora',
} as const;

// Helper functions
export const getApiUrl = (endpoint: string = '') => {
  const baseUrl = API_CONFIG.BASE_URL;
  return endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`;
};

export const getSocketUrl = () => {
  return API_CONFIG.SOCKET_URL;
};

export const getWebSocketUrl = (path: string = '') => {
  const wsUrl = API_CONFIG.WS_URL;
  return path ? `${wsUrl}${path}` : wsUrl;
};

// Export for backward compatibility
export default API_CONFIG;
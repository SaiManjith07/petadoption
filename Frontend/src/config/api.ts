/**
 * Centralized API Configuration
 * Update the API URL here and it will be used throughout the application
 */

// API Base URL - Update this when deploying to a new environment
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://petadoption-v2q3.onrender.com/api';

// WebSocket URL - Update this when deploying to a new environment
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'wss://petadoption-v2q3.onrender.com/ws';

// Get base URL without /api suffix (for image serving, etc.)
export const getBaseUrl = (): string => {
  return API_BASE_URL.replace(/\/api\/?$/, '');
};

// Helper to get full API URL for a given endpoint
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Helper to get full WebSocket URL
export const getWsUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${WS_BASE_URL}/${cleanEndpoint}`;
};


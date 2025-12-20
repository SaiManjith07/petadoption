/**
 * Centralized API Configuration
 * Update the API URL here and it will be used throughout the application
 */

// Helper function to validate and fix URL
const validateUrl = (url: string | undefined, defaultUrl: string): string => {
  if (!url) return defaultUrl;
  
  // Trim whitespace
  url = url.trim();
  
  // Fix common typos: if it starts with "ttps://" instead of "https://"
  if (url.startsWith('ttps://')) {
    console.warn('Fixed URL typo: "ttps://" -> "https://"');
    url = 'h' + url;
  }
  
  // Ensure it starts with http:// or https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    console.warn(`Invalid URL format: ${url}, using default`);
    return defaultUrl;
  }
  
  return url;
};

// API Base URL - Update this when deploying to a new environment
const envApiUrl = import.meta.env.VITE_API_URL;
export const API_BASE_URL = validateUrl(envApiUrl, 'https://petadoption-v2q3.onrender.com/api');

// WebSocket URL - Update this when deploying to a new environment
const envWsUrl = import.meta.env.VITE_WS_URL;
export const WS_BASE_URL = validateUrl(envWsUrl, 'wss://petadoption-v2q3.onrender.com/ws');

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


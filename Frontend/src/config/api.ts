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
  
  // Ensure it starts with http://, https://, ws://, or wss://
  if (!url.startsWith('http://') && !url.startsWith('https://') && 
      !url.startsWith('ws://') && !url.startsWith('wss://')) {
    console.warn(`Invalid URL format: ${url}, using default`);
    return defaultUrl;
  }
  
  return url;
};

// API Base URL - Update this when deploying to a new environment
// Defaults to localhost in development, Render in production
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const defaultApiUrl = isDevelopment ? 'http://localhost:8000/api' : 'https://petadoption-v2q3.onrender.com/api';
const envApiUrl = import.meta.env.VITE_API_URL;

// If on localhost but env var points to Render, use localhost instead
let finalApiUrl = envApiUrl;
if (isDevelopment && envApiUrl && envApiUrl.includes('render.com')) {
  console.log('[API Config] Overriding Render URL with localhost for local development');
  finalApiUrl = defaultApiUrl;
}

export const API_BASE_URL = validateUrl(finalApiUrl, defaultApiUrl);

// Debug logging
if (isDevelopment) {
  console.log('[API Config] Development mode detected, using:', API_BASE_URL);
}

// WebSocket URL - Update this when deploying to a new environment
// Defaults to localhost in development, Render in production
const defaultWsUrl = isDevelopment ? 'ws://localhost:8000/ws' : 'wss://petadoption-v2q3.onrender.com/ws';
const envWsUrl = import.meta.env.VITE_WS_URL;

// If on localhost but env var points to Render, use localhost instead
let finalWsUrl = envWsUrl;
if (isDevelopment && envWsUrl && envWsUrl.includes('render.com')) {
  console.log('[API Config] Overriding Render WebSocket URL with localhost for local development');
  finalWsUrl = defaultWsUrl;
}

export const WS_BASE_URL = validateUrl(finalWsUrl, defaultWsUrl);

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


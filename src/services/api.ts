import axios from 'axios';

// Get base URL from environment or fallback
const baseURL = import.meta.env.VITE_API_URL || 'https://api.rapidtasker.in/api/v1';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const isDev = import.meta.env.DEV || import.meta.env.VITE_SKIP_AUTH === 'true';

// Request interceptor to attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken') || (isDev ? 'dev-mock-admin-token' : null);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (isDev) {
        console.warn('[DEV] 401/403 received from backend. Dev auth skip is active; suppressed redirect to /login.');
        return Promise.reject(error);
      }
      // Clear token and force redirect to login in production
      localStorage.removeItem('adminToken');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

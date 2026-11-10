import axios from 'axios';
import { Capacitor } from '@capacitor/core';

/**
 * Dynamically resolves the best backend API URL based on runtime environment:
 * 1. Saved custom URL in localStorage ('careerready_api_url')
 * 2. Saved server IP in localStorage ('careerready_server_ip') -> http://<IP>:8080/api
 * 3. Mobile LAN build URL (VITE_MOBILE_API_URL) when running in Capacitor
 * 4. LAN host if running in mobile browser (window.location.hostname != localhost)
 * 5. Environment variable VITE_API_BASE_URL
 * 6. Default fallback for laptop website mode: http://localhost:8080/api
 */
export const resolveApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // 1. Explicit override in localStorage
    const savedUrl = localStorage.getItem('careerready_api_url');
    if (savedUrl && savedUrl.trim()) {
      return savedUrl.trim();
    }

    const savedIp = localStorage.getItem('careerready_server_ip');
    if (savedIp && savedIp.trim()) {
      return `http://${savedIp.trim()}:8080/api`;
    }

    // 2. Running inside native Capacitor Android app
    if (Capacitor.isNativePlatform()) {
      if (import.meta.env.VITE_MOBILE_API_URL) {
        return import.meta.env.VITE_MOBILE_API_URL;
      }
      if (import.meta.env.VITE_API_BASE_URL && !import.meta.env.VITE_API_BASE_URL.includes('localhost')) {
        return import.meta.env.VITE_API_BASE_URL;
      }
    }

    // 3. Running in a phone browser accessing the laptop over LAN
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1' && !Capacitor.isNativePlatform()) {
      return `http://${host}:8080/api`;
    }
  }

  // 4. Default for laptop website mode
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
};

/**
 * Helper to update server address dynamically without code edits
 */
export const setServerAddress = (ipOrUrl) => {
  if (!ipOrUrl || !ipOrUrl.trim()) return;
  const trimmed = ipOrUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const formatted = trimmed.endsWith('/api') ? trimmed : `${trimmed.replace(/\/+$/, '')}/api`;
    localStorage.setItem('careerready_api_url', formatted);
  } else {
    // Raw IP address or hostname
    const cleanIp = trimmed.replace(/\/.*$/, '').replace(/^http:\/\//, '');
    localStorage.setItem('careerready_server_ip', cleanIp);
    localStorage.setItem('careerready_api_url', `http://${cleanIp}:8080/api`);
  }
};

export const getServerAddress = () => {
  return resolveApiBaseUrl();
};

export const resetServerAddress = () => {
  localStorage.removeItem('careerready_api_url');
  localStorage.removeItem('careerready_server_ip');
};

/**
 * Centralized Axios instance
 */
const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Request Interceptor: Attach base URL and bearer token if authenticated
api.interceptors.request.use(
  (config) => {
    config.baseURL = resolveApiBaseUrl();
    const token = localStorage.getItem('careerready_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Format errors or handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Session expired or unauthorized credentials');
    }
    return Promise.reject(error);
  }
);

/**
 * Standardized human-readable error extractor for components
 */
export const getErrorMessage = (error) => {
  if (error?.response?.data) {
    const resData = error.response.data;
    if (resData.data && typeof resData.data === 'object' && !Array.isArray(resData.data)) {
      const fieldErrors = Object.values(resData.data).filter(Boolean);
      if (fieldErrors.length > 0) {
        return fieldErrors.join('. ');
      }
    }
    if (resData.message) {
      return resData.message;
    }
  }
  if (error?.message === 'Network Error' || error?.code === 'ERR_NETWORK') {
    return 'Backend server is disconnected. Please start the Spring Boot backend using "mvn spring-boot:run" in the backend directory.';
  }
  return error?.message || 'A server communication error occurred.';
};

/**
 * Check whether the configured Spring Boot backend /api/health endpoint is online
 */
export const checkBackendHealth = async (customBaseUrl) => {
  try {
    const url = customBaseUrl ? `${customBaseUrl.replace(/\/+$/, '')}/health` : '/health';
    const client = customBaseUrl ? axios.create({ timeout: 2500 }) : api;
    const res = await client.get(url, { timeout: 2500 });
    return Boolean(res.data && res.data.success && res.data.data?.status === 'UP');
  } catch {
    return false;
  }
};

export default api;

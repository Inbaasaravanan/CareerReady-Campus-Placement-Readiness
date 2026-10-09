import axios from 'axios';

/**
 * Centralized Axios instance
 * Configured with environment-based base URL and interceptors
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Request Interceptor: Attach bearer token if authenticated
api.interceptors.request.use(
  (config) => {
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
    return 'Unable to connect to server. Please make sure the backend is running.';
  }
  return error?.message || 'A server communication error occurred.';
};

/**
 * Check whether the Spring Boot backend /api/health endpoint is online
 */
export const checkBackendHealth = async () => {
  try {
    const res = await api.get('/health', { timeout: 3000 });
    return res.data && res.data.success;
  } catch {
    return false;
  }
};

export default api;

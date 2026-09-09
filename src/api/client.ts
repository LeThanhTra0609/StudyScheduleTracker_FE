import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Attach JWT token & x-student-id to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const authState = useAuthStore.getState();
    if (authState?.user?.role === 'PARENT' && authState.selectedChildId) {
      config.headers['x-student-id'] = authState.selectedChildId;
    }
  } catch {
    // Ignore store access errors before init
  }

  return config;
});

// Flag to prevent duplicate redirects from parallel 401 requests
let isRedirecting = false;

// Handle 401 globally → clear auth and redirect to login cleanly
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/forgot-password') ||
      requestUrl.includes('/auth/reset-password');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      // 1. Completely clear auth state in Zustand store and localStorage
      try {
        useAuthStore.getState().clearAuth();
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('auth-storage');
      }

      // 2. Prevent infinite reload loop: only redirect if not already on an auth page
      const currentPath = window.location.pathname;
      const isAuthPage =
        currentPath === '/login' ||
        currentPath === '/register' ||
        currentPath === '/forgot-password' ||
        currentPath === '/reset-password';

      if (!isRedirecting && !isAuthPage) {
        isRedirecting = true;
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

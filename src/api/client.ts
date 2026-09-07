import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Attach JWT token & x-student-id to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
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

// Handle 401 globally → redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

import apiClient from './client';

export const authApi = {
  register: (data: { name: string; email: string; password: string; role?: string }) =>
    apiClient.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),

  logout: () => apiClient.post('/auth/logout'),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (data: { token: string; password: string }) =>
    apiClient.post('/auth/reset-password', data),

  getMe: () => apiClient.get('/auth/me'),

  updateProfile: (data: Partial<{ name: string; avatar: string; phone: string; bio: string; notificationPreferences: object }>) =>
    apiClient.put('/auth/profile', data),
};

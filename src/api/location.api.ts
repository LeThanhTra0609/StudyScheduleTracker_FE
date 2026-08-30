import apiClient from './client';

export const locationApi = {
  getAll: () => apiClient.get('/locations'),
  create: (data: object) => apiClient.post('/locations', data),
  update: (id: string, data: object) => apiClient.put(`/locations/${id}`, data),
  delete: (id: string) => apiClient.delete(`/locations/${id}`),
};

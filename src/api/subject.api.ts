import apiClient from './client';

export const subjectApi = {
  getAll: () => apiClient.get('/subjects'),
  create: (data: object) => apiClient.post('/subjects', data),
  update: (id: string, data: object) => apiClient.put(`/subjects/${id}`, data),
  delete: (id: string) => apiClient.delete(`/subjects/${id}`),
};

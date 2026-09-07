import apiClient from './client';

export const paymentApi = {
  getAll: () => apiClient.get('/payments'),
  getSummary: () => apiClient.get('/payments/summary'),
  create: (data: object) => apiClient.post('/payments', data),
  update: (id: string, data: object) => apiClient.put(`/payments/${id}`, data),
  toggleStatus: (id: string) => apiClient.patch(`/payments/${id}/toggle`),
  delete: (id: string) => apiClient.delete(`/payments/${id}`),
  addTransaction: (id: string, data: { amount: number; paidAt: string; method: string; notes?: string }) =>
    apiClient.post(`/payments/${id}/transaction`, data),
};

export const statsApi = {
  getStudy: () => apiClient.get('/stats/study'),
  getWeekly: () => apiClient.get('/stats/weekly'),
  getMonthly: (params?: { month?: number; year?: number }) => apiClient.get('/stats/monthly', { params }),
  getTuition: () => apiClient.get('/stats/tuition'),
};

export const attendanceApi = {
  getAll: (params?: object) => apiClient.get('/attendance', { params }),
  getHistory: () => apiClient.get('/attendance/history'),
  getClassStats: (scheduleId: string) => apiClient.get(`/attendance/stats/${scheduleId}`),
};

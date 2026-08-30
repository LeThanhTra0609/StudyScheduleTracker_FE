import apiClient from './client';

export interface ScheduleFilters {
  date?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  status?: string;
  subjectId?: string;
}

export const scheduleApi = {
  getAll: (filters?: ScheduleFilters) => apiClient.get('/schedules', { params: filters }),
  getToday: () => apiClient.get('/schedules/today'),
  getUpcoming: () => apiClient.get('/schedules/upcoming'),
  checkConflict: (params: { date: string; startTime: string; endTime: string; excludeId?: string }) =>
    apiClient.get('/schedules/conflict-check', { params }),
  getById: (id: string) => apiClient.get(`/schedules/${id}`),
  create: (data: object) => apiClient.post('/schedules', data),
  update: (id: string, data: object) => apiClient.put(`/schedules/${id}`, data),
  delete: (id: string) => apiClient.delete(`/schedules/${id}`),
  deleteRecurringSeries: (groupId: string) => apiClient.delete(`/schedules/recurring/${groupId}`),
  markAttendance: (id: string, data: { status: string; notes?: string }) =>
    apiClient.patch(`/schedules/${id}/attendance`, data),
};

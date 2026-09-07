import apiClient from './client';
import type { User, ApiResponse } from '../types';

export const userApi = {
  linkChild: (linkCode: string) =>
    apiClient.post<{ success: boolean; message: string; children: User[] }>('/users/link-child', { linkCode }),

  unlinkChild: (studentId: string) =>
    apiClient.delete<{ success: boolean; message: string; children: User[] }>(`/users/unlink-child/${studentId}`),

  getChildren: () =>
    apiClient.get<{ success: boolean; children: User[] }>('/users/children'),

  getProfile: () =>
    apiClient.get<{ success: boolean; user: User }>('/auth/me'),

  updateProfile: (data: Partial<User>) =>
    apiClient.put<{ success: boolean; user: User }>('/auth/profile', data),
};

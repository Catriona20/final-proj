import { apiClient } from './apiClient';

export interface DoctorNotificationItem {
  id: string;
  recipient_id?: string;
  recipient_type?: string;
  doctor_id?: string;
  clinic_id?: string;
  appointment_id?: string;
  queue_id?: string;
  title: string;
  message: string;
  timestamp?: string;
  read?: boolean;
  is_read?: boolean;
  category: string;
  type: string;
  action_data?: any;
  created_at?: string;
}

export const notificationApi = {
  getNotifications: async (doctorId: string): Promise<{ notifications: DoctorNotificationItem[]; unreadCount: number }> => {
    try {
      const res = await apiClient.get('/notifications', { params: { doctorId } });
      return {
        notifications: res.data?.notifications || [],
        unreadCount: res.data?.unreadCount || 0,
      };
    } catch (err) {
      console.warn('Failed to fetch doctor notifications:', err);
      return { notifications: [], unreadCount: 0 };
    }
  },

  markAsRead: async (id: string): Promise<boolean> => {
    try {
      const res = await apiClient.put(`/notifications/${id}/read`);
      return res.data?.success || false;
    } catch (err) {
      return false;
    }
  },

  markAllAsRead: async (doctorId: string): Promise<number> => {
    try {
      const res = await apiClient.put('/notifications/read-all', { doctorId });
      return res.data?.markedCount || 0;
    } catch (err) {
      return 0;
    }
  },

  clearAll: async (doctorId: string): Promise<number> => {
    try {
      const res = await apiClient.delete('/notifications/clear', { data: { doctorId } });
      return res.data?.clearedCount || 0;
    } catch (err) {
      return 0;
    }
  },
};

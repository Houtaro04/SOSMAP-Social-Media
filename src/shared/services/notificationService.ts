import { apiGet, apiPatch } from '../../lib/api';
import type { NotificationItem } from '@/store/notificationStore';

export const notificationService = {
  getMyNotifications: async (): Promise<{ data: NotificationItem[] }> => {
    try {
      // By default the framework's BaseModel will filter by user if implemented, or we fetch all and let the endpoint filter.
      // Assuming GET /Notification with FilterJson by UserId or just general endpoint.
      const rawUser = localStorage.getItem('sosmap-auth-storage');
      let userId = '';
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        userId = parsed.state?.user?.id || '';
      }

      const query: any = { limit: 50, sort: '-CreatedAt' };
      if (userId) {
         query.FilterJson = JSON.stringify([{ Column: 'UserId', Condition: 'equals', Value: userId }]);
      }

      const res = await apiGet<any>('/Notification', query);
      const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
      return { data: items };
    } catch (e) {
      console.error('getNotifications error:', e);
      return { data: [] };
    }
  },

  markAsRead: async (id: string): Promise<void> => {
    try {
      await apiPatch(`/Notification/${id}/read`, {});
    } catch (e) {
      console.error('markAsRead error:', e);
    }
  }
};

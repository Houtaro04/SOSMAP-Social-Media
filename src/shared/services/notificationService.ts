import { apiGet, apiPatch, apiDelete } from '../../lib/api';
import type { NotificationItem } from '@/store/notificationStore';

// Các loại thông báo dành riêng cho Admin
const ADMIN_ALLOWED_TYPES = ['SosReport', 'UserReport', 'VolunteerRegistration'];

// Các từ khóa trong nội dung thông báo cập nhật trạng thái (chỉ dành cho người dùng thường)
const STATUS_UPDATE_KEYWORDS = ['trạng thái', 'đã được duyệt', 'tiếp nhận', 'hoàn thành', 'bị từ chối'];

// Hàm lấy thông tin user từ localStorage (hỗ trợ cả admin và user thường)
const getUserFromStorage = (): { id: string; role: string } | null => {
  try {
    // Ưu tiên theo đường dẫn hiện tại
    const isAdminPath = window.location.pathname.startsWith('/admin');
    const storageKeys = isAdminPath
      ? ['sosmap-admin-storage', 'sosmap-auth-storage']
      : ['sosmap-auth-storage', 'sosmap-admin-storage'];

    for (const key of storageKeys) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        const user = parsed.state?.user;
        if (user?.id) return { id: user.id, role: user.role || 'CITIZEN' };
      }
    }
  } catch { /* ignore */ }
  return null;
};

export const notificationService = {
  getMyNotifications: async (): Promise<{ data: NotificationItem[] }> => {
    try {
      const currentUser = getUserFromStorage();
      if (!currentUser?.id) return { data: [] };

      const isAdmin = currentUser.role === 'ADMIN';

      // Backend tự lọc theo UserId từ JWT token - không cần gửi FilterJson
      const query: any = { limit: 100, sort: '-CreatedAt' };

      const res = await apiGet<any>('/Notification', query);
      let items: NotificationItem[] = res?.data || res?.items || (Array.isArray(res) ? res : []);

      // Lọc thêm phía frontend cho Admin: chỉ hiển thị các loại thông báo phù hợp
      if (isAdmin) {
        items = items.filter(n => {
          const isAllowedType = ADMIN_ALLOWED_TYPES.includes(n.referenceType || '');
          const isStatusUpdate = STATUS_UPDATE_KEYWORDS.some(kw => n.content?.includes(kw));
          return isAllowedType && !isStatusUpdate;
        });
      }

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
  },

  clearAll: async (): Promise<void> => {
    try {
      // Gọi API xóa tất cả - backend sẽ lấy UserId từ JWT token
      await apiDelete('/Notification/clear-all');
    } catch (e) {
      console.error('clearAll error:', e);
      throw e;
    }
  }
};

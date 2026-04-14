import { apiGet, apiPut, apiPost, BASE_URL } from '../../lib/api';
import { ProfileResponse, ProfileUpdateRequest, SosStatsResponse, SosHistoryItemResponse } from '@/shared/entities/ProfileEntity';

const BACKEND_HOST = BASE_URL.replace('/api', ''); // Tách lấy https://localhost:44340

function getCurrentUserFromStorage(): { id?: string; token?: string } {
  try {
    const raw = localStorage.getItem('sosmap-auth-storage');
    if (!raw) return {};
    const { state } = JSON.parse(raw);
    return { id: state?.user?.id, token: state?.token };
  } catch {
    return {};
  }
}

function statusToHistory(status: string): SosHistoryItemResponse['status'] {
  const s = (status || '').toUpperCase();
  if (s === 'PENDING') return 'PENDING';
  if (s === 'APPROVED') return 'APPROVED';
  if (s === 'PROCESSING' || s === 'RESPONDING' || s === 'IN_PROGRESS') return 'PROCESSING';
  if (s === 'RESOLVED' || s === 'COMPLETED' || s === 'DONE') return 'COMPLETED';
  return 'CLOSED';
}

/**
 * Đảm bảo URL ảnh là tuyệt đối và cung cấp ảnh mẫu nếu trống
 */
export function ensureFullUrl(url?: any, name?: string): string {
  if (typeof url !== 'string' || !url || url.trim() === '') {
    // Trả về ảnh mẫu theo tên (UI Avatars)
    const displayName = encodeURIComponent(name || 'User');
    return `https://ui-avatars.com/api/?name=${displayName}&background=0D8ABC&color=fff&size=200`;
  }
  
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  
  // Thay thế tất cả backslash thành slash
  const normalizedUrl = url.replace(/\\/g, '/');
  
  // Nếu là đường dẫn tương đối (ví dụ: uploads/abc.png), nối với host
  const cleanUrl = normalizedUrl.startsWith('/') ? normalizedUrl : `/${normalizedUrl}`;
  return `${BACKEND_HOST}${cleanUrl}`;
}

export const profileService = {
  getProfile: async (): Promise<{ data: ProfileResponse }> => {
    try {
      const res = await apiGet<any>('/User/profile');
      const raw = res?.data || res;
      const userId = raw.userId || raw.id;
      
      // Nếu có ID người dùng, gọi trực tiếp API chi tiết để lấy đầy đủ thông tin (bao gồm imageUrl)
      if (userId) {
        return await profileService.getUserById(userId);
      }

      const profile = {
        id: userId || '',
        fullName: raw.fullName || raw.name || '',
        phone: raw.phone || raw.phoneNumber || '',
        idCard: raw.idCard || raw.id_card || '',
        address: raw.address || '',
        imageUrl: ensureFullUrl(raw.imageUrl || raw.image_url || raw.ImageUrl || raw.avatarUrl || raw.AvatarUrl || raw.avatar, raw.fullName || raw.name),
        role: raw.role || 'CITIZEN',
        email: raw.email || '',
      };
      return { data: new ProfileResponse(profile) };
    } catch (e) {
      console.error('[ProfileService] getProfile error:', e);
      const { id } = getCurrentUserFromStorage();
      return {
        data: new ProfileResponse({
          id: id || '',
          fullName: '',
          phone: '',
          idCard: '',
          address: '',
          imageUrl: '',
          role: 'CITIZEN',
          email: '',
        })
      };
    }
  },

  getUserById: async (id: string): Promise<{ data: ProfileResponse }> => {
    try {
      const res = await apiGet<any>(`/User/${id}`);
      const raw = res?.data || res;
      const profile = new ProfileResponse({
        id: raw.id || id,
        fullName: raw.fullName || '',
        phone: raw.phone || raw.phoneNumber || '',
        idCard: raw.idCard || raw.id_card || '',
        address: raw.address || '',
        imageUrl: ensureFullUrl(raw.imageUrl || raw.image_url || raw.ImageUrl || raw.avatarUrl || raw.AvatarUrl || raw.avatar, raw.fullName),
        role: raw.role || 'CITIZEN',
        email: raw.email || '',
      });
      return { data: profile };
    } catch (e) {
      console.error('[ProfileService] getUserById error:', e);
      throw e;
    }
  },

  uploadFile: async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      // Use the new /User/avatar endpoint
      const res = await apiPost<any>('/User/avatar', formData);
      let urlStr = '';
      if (typeof res === 'string') {
        urlStr = res;
      } else if (res && typeof res === 'object') {
        urlStr = res.data?.url || res.data?.imageUrl || res.data?.image_url || res.data?.avatarUrl || res.data?.AvatarUrl || res.data?.path || 
                 res.url || res.imageUrl || res.image_url || res.avatarUrl || res.AvatarUrl || res.path;
        if (!urlStr && typeof res.data === 'string') {
          urlStr = res.data;
        }
      }
      return urlStr || '';
    } catch (e: any) {
      console.error('[ProfileService] uploadFile error:', e);
      throw new Error(e.message || 'Lỗi tải ảnh lên');
    }
  },

  getStats: async (): Promise<{ data: SosStatsResponse }> => {
    try {
      const res = await apiGet<any>('/SosReport', { pageSize: 200 });
      const items = res?.data || res?.items || [];
      return {
        data: {
          totalSent: items.length,
          completed: items.filter((r: any) => ['RESOLVED', 'COMPLETED', 'DONE'].includes(r.status?.toUpperCase())).length,
          processing: items.filter((r: any) => ['PROCESSING', 'RESPONDING', 'IN_PROGRESS', 'APPROVED'].includes(r.status?.toUpperCase())).length,
        }
      };
    } catch (e) {
      return { data: { totalSent: 0, completed: 0, processing: 0 } };
    }
  },

  getHistory: async (): Promise<{ data: SosHistoryItemResponse[] }> => {
    try {
      const res = await apiGet<any>('/SosReport', { pageSize: 20 });
      const items = res?.data || res?.items || [];
      const history: SosHistoryItemResponse[] = items.map((r: any) => new SosHistoryItemResponse({
        id: r.id,
        title: r.details || r.address || 'Yêu cầu cứu trợ',
        address: r.address || '',
        timeLine: r.createdAt ? formatRelativeTime(r.createdAt) : '',
        status: statusToHistory(r.status),
        type: r.level === 'HIGH' ? 'MEDICAL' : r.level === 'MEDIUM' ? 'FOOD' : 'WATER',
      }));
      return { data: history };
    } catch (e) {
      return { data: [] };
    }
  },

  updateProfile: async (payload: ProfileUpdateRequest | Partial<ProfileUpdateRequest>): Promise<{ data: ProfileResponse; message: string }> => {
    const request = payload instanceof ProfileUpdateRequest ? payload : new ProfileUpdateRequest(payload);
    const error = request.validate();
    if (error) throw new Error(error);

    const { id } = getCurrentUserFromStorage();
    if (!id) throw new Error('Không tìm thấy thông tin người dùng.');

    try {
      // Update specific fields. We send both imageUrl and image_url to be 100% sure the backend catches it.
      const backendPayload = {
        id: id,
        fullName: request.fullName,
        phone: request.phone,
        email: request.email,
        address: request.address,
        imageUrl: request.imageUrl,
        image_url: request.imageUrl, // Alias for snake_case compatibility
      };

      const res = await apiPut<any>(`/User/${id}`, backendPayload);
      const updated = res?.data || res;
      
      return {
        data: new ProfileResponse({
          id: updated.id || id,
          fullName: updated.fullName || request.fullName,
          phone: updated.phone || updated.phoneNumber || request.phone || '',
          address: updated.address || request.address || '',
          imageUrl: ensureFullUrl(updated.imageUrl || request.imageUrl, updated.fullName || request.fullName),
          role: updated.role || 'CITIZEN',
          email: updated.email || '',
        }),
        message: 'Cập nhật hồ sơ thành công!',
      };
    } catch (err: any) {
      console.error('[ProfileService] updateProfile error:', err);
      throw new Error(err.message || 'Không thể cập nhật hồ sơ.');
    }
  },
};

function formatRelativeTime(dateStr: string): string {
  try {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    return `${diffDays} ngày trước`;
  } catch {
    return dateStr;
  }
}

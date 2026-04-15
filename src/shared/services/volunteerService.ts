import { apiGet } from '../../lib/api';
import { VolunteerResponse, VolunteerStats, MissionHistory } from '@/shared/entities/VolunteerEntity';
import { ensureFullUrl } from './profileService';

export const volunteerService = {
  /**
   * Lấy danh sách tình nguyện viên từ backend (query User có role VOLUNTEER).
   */
  getVolunteers: async (params?: { region?: string; status?: string }): Promise<{ data: VolunteerResponse[] }> => {
    try {
      const res = await apiGet<any>('/User', { limit: 100, searchTerm: params?.region || '' });
      const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
      // Lọc chỉ lấy VOLUNTEER, map sang VolunteerResponse
      const volunteers = items
        .filter((u: any) => {
          const role = (u.role || u.Role || '').toUpperCase();
          return role === 'VOLUNTEER';
        })
        .map((u: any) => new VolunteerResponse({
          id: u.id || u.Id || '',
          name: u.fullName || u.FullName || u.name || 'Tình nguyện viên',
          status: (u.status || u.Status || 'OFFLINE').toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'OFFLINE',
          regions: u.address ? [u.address] : [],
          skills: [],
          avatarUrl: ensureFullUrl(u.imageUrl || u.image_url || u.ImageUrl, u.fullName || u.FullName),
          phone: u.phone || u.Phone || null,
        }));
      return { data: volunteers };
    } catch (e) {
      console.error('[VolunteerService] getVolunteers error:', e);
      return { data: [] };
    }
  },

  /**
   * Lấy chi tiết thông tin một đội tình nguyện.
   */
  getVolunteerById: async (id: string): Promise<{ data: VolunteerResponse | null }> => {
    try {
      const res = await apiGet<any>(`/Volunteer/${id}`);
      const raw = res?.data || res;
      return { data: raw ? new VolunteerResponse(raw) : null };
    } catch (e) {
      console.error('[VolunteerService] getVolunteerById error:', e);
      return { data: null };
    }
  },

  /**
   * Lấy thống kê hoạt động của đội.
   */
  getStats: async (volunteerId: string): Promise<{ data: VolunteerStats }> => {
    try {
      const res = await apiGet<any>(`/Volunteer/${volunteerId}/stats`);
      return { data: new VolunteerStats(res?.data || res) };
    } catch (e) {
      console.error('[VolunteerService] getStats error:', e);
      return { data: new VolunteerStats() };
    }
  },

  /**
   * Lấy lịch sử nhiệm vụ.
   */
  getMissionHistory: async (volunteerId: string): Promise<{ data: MissionHistory[] }> => {
    try {
      const res = await apiGet<any>(`/Volunteer/${volunteerId}/missions`);
      const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
      return { data: items.map((m: any) => new MissionHistory(m)) };
    } catch (e) {
      console.error('[VolunteerService] getMissionHistory error:', e);
      return { data: [] };
    }
  },
};

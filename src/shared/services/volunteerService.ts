import { apiGet } from '../../lib/api';
import { VolunteerResponse, VolunteerStats, MissionHistory } from '@/shared/entities/VolunteerEntity';

export const volunteerService = {
  /**
   * Lấy danh sách đội tình nguyện (volunteer/rescuer) thực tế từ backend.
   */
  getVolunteers: async (params?: { region?: string; status?: string }): Promise<{ data: VolunteerResponse[] }> => {
    try {
      const res = await apiGet<any>('/Volunteer', params);
      const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
      return { data: items.map((v: any) => new VolunteerResponse(v)) };
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

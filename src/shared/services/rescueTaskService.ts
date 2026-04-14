import { apiGet, apiPost, apiPatch } from '../../lib/api';
import { RescueTaskEntity } from '../entities/RescueTaskEntity';

export const rescueTaskService = {
  /**
   * Tạo nhiệm vụ cứu trợ mới (Tiếp nhận SOS)
   */
  createTask: async (reportId: string): Promise<{ success: boolean; data?: RescueTaskEntity; error?: string }> => {
    try {
      const res = await apiPost<any>('/RescueTask', {
        ReportId: reportId,
        Status: 'IN_PROGRESS'
      });
      return { success: true, data: new RescueTaskEntity(res?.data || res) };
    } catch (e: any) {
      console.error('[RescueTaskService] createTask error:', e);
      return { success: false, error: e.message || 'Không thể tiếp nhận nhiệm vụ.' };
    }
  },

  /**
   * Lấy danh sách tất cả nhiệm vụ (vô hạn paged)
   */
  getTasks: async (): Promise<{ data: RescueTaskEntity[] }> => {
    try {
      const res = await apiGet<any>('/RescueTask');
      const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
      return { data: items.map((item: any) => new RescueTaskEntity(item)) };
    } catch (e) {
      console.error('[RescueTaskService] getTasks error:', e);
      return { data: [] };
    }
  },
  
  /**
   * Lấy danh sách nhiệm vụ của một user cụ thể
   */
  getTasksByUserId: async (userId: string): Promise<{ data: RescueTaskEntity[] }> => {
    try {
      const { data: all } = await rescueTaskService.getTasks();
      return { data: all.filter(t => t.userId === userId) };
    } catch (e) {
      console.error('[RescueTaskService] getTasksByUserId error:', e);
      return { data: [] };
    }
  },

  /**
   * Lấy nhiệm vụ đang hoạt động của tôi (Volunteer)
   */
  getMyActiveTask: async (userId: string): Promise<{ data: RescueTaskEntity | null }> => {
    try {
      const { data: all } = await rescueTaskService.getTasks();
      // Lọc các task thuộc về user này và chưa hoàn thành
      const active = all.find(t => 
        t.userId === userId && 
        ['IN_PROGRESS', 'PENDING', 'CANCEL_REQUESTING'].includes(t.status)
      );
      return { data: active || null };
    } catch (e) {
      console.error('[RescueTaskService] getMyActiveTask error:', e);
      return { data: null };
    }
  },

  /**
   * Cập nhật trạng thái nhiệm vụ
   */
  updateStatus: async (id: string, status: string, note?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiPatch(`/RescueTask/${id}/status`, { status, note });
      return { success: true };
    } catch (e: any) {
      console.error('[RescueTaskService] updateStatus error:', e);
      return { success: false, error: e.message || 'Không thể cập nhật trạng thái nhiệm vụ.' };
    }
  }
};

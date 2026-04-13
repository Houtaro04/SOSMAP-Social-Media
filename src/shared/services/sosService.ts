import { apiGet, apiPost } from '../../lib/api';
import { SosCreateRequest, SosReportResponse } from '@/shared/entities/SosEntity';

export const sosService = {
  submitSosRequest: async (payload: SosCreateRequest | Partial<SosCreateRequest>): Promise<{ success: boolean; data?: SosReportResponse; error?: string }> => {
    try {
      const request = payload instanceof SosCreateRequest ? payload : new SosCreateRequest(payload);
      const error = request.validate();
      if (error) return { success: false, error };

      const formData = new FormData();
      formData.append('Address', request.address);
      formData.append('Details', request.details);
      formData.append('Level', request.level);
      if (request.latitude) formData.append('Latitude', request.latitude.toString());
      if (request.longitude) formData.append('Longitude', request.longitude.toString());
      if ((request as any).userId) formData.append('UserId', (request as any).userId);
      
      if (request.images && request.images.length > 0) {
        request.images.forEach((file) => {
          formData.append('Images', file);
        });
      }

      const res = await apiPost<any>('/SosReport', formData);
      return { success: true, data: new SosReportResponse(res?.data || res) };
    } catch (e: any) {
      return { success: false, error: e.message || 'Không thể gửi yêu cầu SOS.' };
    }
  },

  getSosReports: async (): Promise<{ data: SosReportResponse[] }> => {
    try {
      const res = await apiGet<any>('/SosReport');
      const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
      return { data: items.map((item: any) => new SosReportResponse(item)) };
    } catch (e) {
      console.error('[SosService] getSosReports error:', e);
      return { data: [] };
    }
  },

  /**
   * Lấy yêu cầu SOS đang hoạt động (không phải COMPLETED/CLOSED) của một user cụ thể.
   */
  getActiveSosReport: async (userId: string): Promise<{ data: SosReportResponse | null }> => {
    try {
      // Vì backend chưa có endpoint riêng theo userId, ta lấy tất cả và lọc ở frontend (Lưu ý: Không tối ưu nếu data lớn)
      const { data: all } = await sosService.getSosReports();
      const active = all.find(r => 
        r.userId === userId && 
        r.status !== 'COMPLETED' && 
        r.status !== 'CLOSED'
      );
      return { data: active || null };
    } catch (e) {
      console.error('[SosService] getActiveSosReport error:', e);
      return { data: null };
    }
  }
};

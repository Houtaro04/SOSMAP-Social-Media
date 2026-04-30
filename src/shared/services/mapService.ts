import { apiGet, apiPost, apiDelete } from '@/lib/api';
import { SosReportResponse, SafetyPointResponse } from '@/shared/entities/MapEntity';

export const mapService = {
  getSosReports: async (): Promise<{ data: SosReportResponse[] }> => {
    try {
      const res = await apiGet<any>('/SosReport', { Limit: 100 });
      const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
      return { data: items.map((item: any) => new SosReportResponse(item)) };
    } catch (e) {
      console.error('[MapService] getSosReports error:', e);
      return { data: [] };
    }
  },

  getSafetyPoints: async (): Promise<{ data: SafetyPointResponse[] }> => {
    try {
      const res = await apiGet<any>('/SafetyPoint', { Limit: 100 });
      const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
      return { data: items.map((item: any) => new SafetyPointResponse(item)) };
    } catch (e) {
      console.error('[MapService] getSafetyPoints error:', e);
      return { data: [] };
    }
  },

  createSosReport: async (payload: Partial<SosReportResponse>): Promise<SosReportResponse> => {
    const res = await apiPost<any>('/SosReport', payload);
    return res?.data || res;
  },

  createSafetyPoint: async (payload: Partial<SafetyPointResponse>): Promise<SafetyPointResponse> => {
    const res = await apiPost<any>('/SafetyPoint', payload);
    return res?.data || res;
  },

  deleteSafetyPoint: async (id: string): Promise<{ success: boolean; message?: string }> => {
    try {
      await apiDelete<any>(`/SafetyPoint/${id}`);
      return { success: true };
    } catch (e: any) {
      console.error('[MapService] deleteSafetyPoint error:', e);
      return { success: false, message: e.message || 'Không thể xóa điểm an toàn.' };
    }
  }
};

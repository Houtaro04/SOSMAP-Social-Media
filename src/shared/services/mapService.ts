import { apiGet, apiPost } from '@/lib/api';
import { SosReportResponse, SafetyPointResponse } from '@/shared/entities/MapEntity';

export const mapService = {
  getSosReports: async (): Promise<{ data: SosReportResponse[] }> => {
    try {
      const res = await apiGet<any>('/SosReport');
      const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
      return { data: items.map((item: any) => new SosReportResponse(item)) };
    } catch (e) {
      console.error('[MapService] getSafetyPoints error:', e);
      return { data: [] };
    }
  },

  getSafetyPoints: async (): Promise<{ data: SafetyPointResponse[] }> => {
    try {
      const res = await apiGet<any>('/SafetyPoint', { pageSize: 200 });
      const items: SafetyPointResponse[] = res?.data || res?.items || (Array.isArray(res) ? res : []);
      return { data: items };
    } catch (e) {
      console.error('[MapService] getSafetyPoints error:', e);
      return { data: [] };
    }
  },

  createSosReport: async (payload: Partial<SosReportResponse>): Promise<SosReportResponse> => {
    const res = await apiPost<any>('/SosReport', payload);
    return res?.data || res;
  },
};

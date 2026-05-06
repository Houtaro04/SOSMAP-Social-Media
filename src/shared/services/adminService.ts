import { apiGet, apiPost, apiPatch } from '../../lib/api';

export interface UserResponse {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  imageUrl: string;
  createdAt: string;
}

export interface GetUsersParams {
  pageNumber: number;
  pageSize: number;
  searchValue?: string;
  [key: string]: any;
}

export const adminService = {
  /**
   * Lấy danh sách người dùng có phân trang và tìm kiếm
   */
  getUsers: async (params: GetUsersParams): Promise<{ items: UserResponse[]; totalCount: number }> => {
    const res = await apiGet<any>('/User', {
      Page: params.pageNumber,
      Limit: params.pageSize,
      SearchTerm: params.searchValue
    });
    
    // Đảm bảo ánh xạ dữ liệu đúng cấu trúc (Mapping logic)
    const items: UserResponse[] = (res?.data || res?.items || res || []).map((u: any) => ({
      ...u,
      id: u.id || u.Id,
      fullName: u.fullName || u.full_name || u.FullName || '',
      phone: u.phone || u.phoneNumber || u.Phone || '',
      email: u.email || u.Email || '',
      imageUrl: u.imageUrl || u.image_url || u.ImageUrl || '',
      status: u.status || u.Status || 'ACTIVE',
      role: u.role || u.Role || 'CITIZEN'
    }));

    return {
      items,
      totalCount: res?.totalCount || items.length
    };
  },

  /**
   * Cập nhật Role hoặc Trạng thái người dùng
   * @param State 0: Role, 1: Status
   */
  updateRoleOrStatus: async (userId: string, roleOrStatus: string, state: number): Promise<void> => {
    await apiPost('/Admin/update-role-or-status-users', { 
      id: userId, 
      roleOrStatus: roleOrStatus, 
      State: state 
    });
  },

  /**
   * Lấy thống kê tổng quan (Dashboard stats)
   */
  getDashboardStats: async (): Promise<any> => {
    return await apiGet('/Admin/dashboard-stats');
  },

  /**
   * Lấy danh sách báo cáo vi phạm
   */
  getUserReports: async (): Promise<any> => {
    return await apiGet('/UserReport/admin/all');
  },

  /**
   * Xử lý báo cáo vi phạm
   */
  resolveUserReport: async (reportId: string, status: string): Promise<any> => {
    return await apiPatch(`/UserReport/admin/resolve/${reportId}?status=${status}`, {});
  }
};

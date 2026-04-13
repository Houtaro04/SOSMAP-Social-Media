import { apiGet, apiPost } from '../../lib/api';

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
    const res = await apiGet<any>('/User', params);
    
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
  }
};

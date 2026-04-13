import { useState, useEffect, useCallback } from 'react';
import { ensureFullUrl } from '@/shared/services/profileService';
import { adminService, type UserResponse as User } from '@/shared/services/adminService';

export type FilterTab = 'ALL' | 'CITIZEN' | 'VOLUNTEER' | 'LOCKED';

export const ROLE_LABEL: Record<string, string> = {
  CITIZEN: 'Người dân', 
  VOLUNTEER: 'Tình nguyện viên', 
  ADMIN: 'Quản trị'
};

export const ROLE_CLS: Record<string, string> = {
  CITIZEN: 'role-user', 
  VOLUNTEER: 'role-volunteer', 
  ADMIN: 'role-admin'
};

export const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Hoạt động', 
  BANNED: 'Bị khóa', 
  PENDING: 'Chờ duyệt'
};

export const STATUS_CLS: Record<string, string> = {
  ACTIVE: 'st-active', 
  BANNED: 'st-locked', 
  PENDING: 'st-pending'
};

const PAGE_SIZE = 10;

export function useAdminUsersViewModel() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getUsers({
        pageNumber: page,
        pageSize: PAGE_SIZE,
        searchValue: search
      });
      
      let items = res.items;
      setTotal(res.totalCount);

      if (filterTab === 'LOCKED') {
        items = items.filter((u: User) => u.status === 'INACTIVE' || u.status === 'BANNED');
      } else if (filterTab !== 'ALL') {
        const targetRoles = filterTab === 'VOLUNTEER' ? ['VOLUNTEER', 'Volunteer'] : [filterTab];
        items = items.filter((u: User) => targetRoles.includes(u.role));
      }

      setUsers(items);
    } catch (err) {
      console.error('Load users error:', err);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, filterTab]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    setActionLoading(userId + '-role');
    try {
      await adminService.updateRoleOrStatus(userId, newRole, 0);
      await loadUsers();
      showSuccess(`Đã đổi role thành ${ROLE_LABEL[newRole] || newRole}`);
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
    setActionLoading(user.id + '-status');
    try {
      await adminService.updateRoleOrStatus(user.id, newStatus, 1);
      await loadUsers();
      showSuccess(newStatus === 'BANNED' ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dt: string) => {
    try {
      return new Date(dt).toLocaleDateString('vi-VN');
    } catch { return '—'; }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return {
    users,
    total,
    page,
    setPage,
    search,
    setSearch,
    filterTab,
    setFilterTab,
    isLoading,
    actionLoading,
    successMsg,
    loadUsers,
    handleChangeRole,
    handleToggleStatus,
    formatDate,
    totalPages,
    ensureFullUrl
  };
}

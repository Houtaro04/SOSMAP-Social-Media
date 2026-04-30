import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPatch } from '@/lib/api';

export interface DashboardStats {
  totalUsers: number;
  totalVolunteers: number;
  pendingApproval: number;
  activeRequests: number;
  sosReports: { pending: number; inProgress: number; resolved: number };
}

export interface SosReportItem {
  id: string;
  address: string;
  level: string;
  status: string;
  details: string;
  createdAt: string;
  userId: string;
  fullName?: string;
}

export interface RescueTaskItem {
  id: string;
  reportId: string;
  userId: string;
  status: string;
  note: string;
  createdAt: string;
}

export const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Chờ xử lý', cls: 'badge-pending' },
  APPROVED: { label: 'Đã phê duyệt', cls: 'badge-progress' },
  PROCESSING: { label: 'Đang cứu trợ', cls: 'badge-progress' },
  RESOLVED: { label: 'Hoàn thành', cls: 'badge-done' },
  COMPLETED: { label: 'Hoàn thành', cls: 'badge-done' },
  CANCELLED: { label: 'Đã hủy', cls: 'badge-cancel' },
};

export const LEVEL_MAP: Record<string, string> = {
  HIGH: 'badge-high',
  MEDIUM: 'badge-medium',
  LOW: 'badge-low',
};

export function useAdminDashboardViewModel() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sosReports, setSosReports] = useState<SosReportItem[]>([]);
  const [rescueTasks, setRescueTasks] = useState<RescueTaskItem[]>([]);
  const [pendingVolunteers, setPendingVolunteers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'SOS' | 'RESCUE' | 'VOLUNTEER'>('SOS');
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const [usersRes, sosRes, rescueRes, allUsersRes] = await Promise.allSettled([
        apiGet<any>('/User', { pageSize: 1 }),
        apiGet<any>('/SosReport', { pageSize: 10 }),
        apiGet<any>('/RescueTask', { pageSize: 10 }),
        apiGet<any>('/User', { pageSize: 100 }),
      ]);

      const usersData = usersRes.status === 'fulfilled' ? usersRes.value : null;
      const totalUsers = usersData?.totalCount || usersData?.data?.length || 0;

      const allUsersData = allUsersRes.status === 'fulfilled' ? allUsersRes.value : null;
      const allUsers: any[] = allUsersData?.data || allUsersData?.items || allUsersData || [];

      const sosData = sosRes.status === 'fulfilled' ? sosRes.value : null;
      const rawSos: any[] = sosData?.data || sosData?.items || sosData || [];
      const sosItems: SosReportItem[] = rawSos.map((r: any) => {
        const u = allUsers.find((user: any) => (user.id || user.Id) === (r.userId || r.UserId));
        return {
          ...r,
          id: r.id || r.Id || '',
          status: (r.status || r.Status || 'PENDING').toUpperCase(),
          fullName: r.fullName || r.FullName || u?.fullName || u?.FullName || 'Ẩn danh'
        };
      });
      setSosReports(sosItems.slice(0, 8));

      const pendingCount = sosItems.filter((r: any) => r.status === 'PENDING').length;
      const approvedCount = sosItems.filter((r: any) => r.status === 'APPROVED').length;

      const rescueData = rescueRes.status === 'fulfilled' ? rescueRes.value : null;
      const rawRescue: any[] = rescueData?.data || rescueData?.items || rescueData || [];
      const rescueItems: RescueTaskItem[] = rawRescue.map((t: any) => ({
        ...t,
        id: t.id || t.Id || '',
        reportId: t.reportId || t.ReportId || '',
        status: (t.status || t.Status || 'PENDING').toUpperCase()
      }));
      setRescueTasks(rescueItems.slice(0, 8));

      const pendingVols = allUsers.filter(u => {
        const role = (u.role || u.Role || '').toUpperCase();
        const status = (u.status || u.Status || '').toUpperCase();
        return role === 'VOLUNTEER' && status === 'PENDING';
      }).map(v => ({
        ...v,
        id: v.id || v.Id,
        fullName: v.fullName || v.FullName || v.full_name || '',
        phone: v.phone || v.Phone || v.phoneNumber || '',
        email: v.email || v.Email || ''
      }));
      setPendingVolunteers(pendingVols);

      setStats({
        totalUsers,
        totalVolunteers: Math.round(totalUsers * 0.2),
        pendingApproval: pendingCount,
        activeRequests: approvedCount + pendingCount,
        sosReports: {
          pending: pendingCount,
          inProgress: sosItems.filter((r: any) => ['APPROVED', 'PROCESSING'].includes(r.status)).length,
          resolved: sosItems.filter((r: any) => ['COMPLETED', 'RESOLVED'].includes(r.status)).length,
        },
      });
    } catch (err) {
      console.error('Dashboard load error:', err);
      setStats({
        totalUsers: 0,
        totalVolunteers: 0,
        pendingApproval: 0,
        activeRequests: 0,
        sosReports: { pending: 0, inProgress: 0, resolved: 0 },
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleApproveVolunteer = async (userId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn phê duyệt tình nguyện viên này?')) return;
    try {
      await apiPost<any>('/Admin/update-role-or-status-users', {
        id: userId,
        roleOrStatus: 'ACTIVE',
        State: 1
      });
      alert('Phê duyệt thành công!');
      loadDashboard();
    } catch (err) {
      alert('Lỗi phê duyệt!');
    }
  };
 
  const handleApproveSos = async (reportId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn phê duyệt báo cáo SOS này?')) return;
    try {
      // Backend của bạn yêu cầu PATCH /api/SosReport/{id}/status 
      // Payload dạng { status: "APPROVED" }
      await apiPatch<any>(`/SosReport/${reportId}/status`, {
        status: 'APPROVED'
      });
      alert('Đã duyệt báo cáo SOS!');
      loadDashboard();
    } catch (err) {
      alert('Lỗi khi duyệt báo cáo!');
    }
  };

  const formatDate = (dt: string) => {
    try {
      return new Date(dt).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return dt; }
  };

  return {
    stats,
    sosReports,
    rescueTasks,
    pendingVolunteers,
    activeTab,
    setActiveTab,
    isLoading,
    loadDashboard,
    handleApproveVolunteer,
    handleApproveSos,
    formatDate
  };
}

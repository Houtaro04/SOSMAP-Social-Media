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

export interface ViolationReportItem {
  id: string;
  reporterId: string;
  reporterName?: string;
  reportedUserId: string;
  reportedUserName?: string;
  reason: string;
  details?: string;
  status: string;
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
  const [violationReports, setViolationReports] = useState<ViolationReportItem[]>([]);
  const [activeTab, setActiveTab] = useState<'SOS' | 'RESCUE' | 'VOLUNTEER' | 'VIOLATION'>('SOS');
  const [isLoading, setIsLoading] = useState(true);

  // Pagination states
  const [sosPage, setSosPage] = useState(1);
  const [sosTotal, setSosTotal] = useState(0);
  
  const [rescuePage, setRescuePage] = useState(1);
  const [rescueTotal, setRescueTotal] = useState(0);

  const [volunteerPage, setVolunteerPage] = useState(1);
  const [volunteerTotal, setVolunteerTotal] = useState(0);

  const [violationPage, setViolationPage] = useState(1);
  const [violationTotal, setViolationTotal] = useState(0);

  const pageSize = 10;

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Stats & All Users (for mapping)
      const [statsRes, allUsersRes] = await Promise.all([
        apiGet<any>('/Admin/dashboard-stats'),
        apiGet<any>('/User', { pageSize: 200 }) // Load more users for better mapping
      ]);

      if (statsRes?.data) {
        setStats(statsRes.data);
      }

      const allUsers: any[] = allUsersRes?.data || allUsersRes?.items || allUsersRes || [];

      // 2. Fetch data for each category based on current page
      const [sosRes, rescueRes, reportsRes] = await Promise.all([
        apiGet<any>('/SosReport', { page: sosPage, pageSize }),
        apiGet<any>('/RescueTask', { page: rescuePage, pageSize }),
        apiGet<any>('/UserReport/admin/all', { page: violationPage, pageSize }),
      ]);

      // Process SOS Reports
      const sosData = sosRes?.data || sosRes?.items || [];
      const sosItems: SosReportItem[] = (Array.isArray(sosData) ? sosData : []).map((r: any) => {
        const u = allUsers.find((user: any) => (user.id || user.Id) === (r.userId || r.UserId));
        return {
          ...r,
          id: r.id || r.Id || '',
          status: (r.status || r.Status || 'PENDING').toUpperCase(),
          fullName: r.fullName || r.FullName || u?.fullName || u?.FullName || 'Ẩn danh'
        };
      });
      setSosReports(sosItems);
      setSosTotal(sosRes?.meta?.totalItems || sosRes?.meta?.TotalItems || sosRes?.total || sosRes?.Total || sosItems.length);

      // Process Rescue Tasks
      const rescueData = rescueRes?.data || rescueRes?.items || [];
      const rescueItems: RescueTaskItem[] = (Array.isArray(rescueData) ? rescueData : []).map((t: any) => ({
        ...t,
        id: t.id || t.Id || '',
        reportId: t.reportId || t.ReportId || '',
        status: (t.status || t.Status || 'PENDING').toUpperCase()
      }));
      setRescueTasks(rescueItems);
      setRescueTotal(rescueRes?.meta?.totalItems || rescueRes?.meta?.TotalItems || rescueRes?.total || rescueRes?.Total || rescueItems.length);

      // Process Pending Volunteers (This one is special as it's filtered from all users)
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
      
      // Local pagination for volunteers since they are filtered from allUsers
      const volStart = (volunteerPage - 1) * pageSize;
      setPendingVolunteers(pendingVols.slice(volStart, volStart + pageSize));
      setVolunteerTotal(pendingVols.length);

      // Process Violation Reports
      const reportsData = reportsRes?.data || reportsRes?.items || reportsRes || [];
      const reportItems = (Array.isArray(reportsData) ? reportsData : []).map(r => ({
        ...r,
        id: r.id || r.Id,
        status: (r.status || r.Status || 'PENDING').toUpperCase()
      }));
      setViolationReports(reportItems);
      setViolationTotal(reportsRes?.meta?.totalItems || reportsRes?.meta?.TotalItems || reportsRes?.total || reportsRes?.Total || reportItems.length);

    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [sosPage, rescuePage, volunteerPage, violationPage]);

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
    violationReports,
    activeTab,
    setActiveTab,
    isLoading,
    loadDashboard,
    handleApproveVolunteer,
    handleApproveSos,
    formatDate,
    // Pagination
    pageSize,
    sosPage, setSosPage, sosTotal,
    rescuePage, setRescuePage, rescueTotal,
    volunteerPage, setVolunteerPage, volunteerTotal,
    violationPage, setViolationPage, violationTotal
  };
}

import React from 'react';
import {
  Users,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Clock,
  Eye,
  UserCheck,
  CheckCircle,
} from 'lucide-react';
import {
  useAdminDashboardViewModel,
  STATUS_MAP,
  LEVEL_MAP,
} from '../viewmodels/useAdminDashboardViewModel';
import type {
  SosReportItem,
  RescueTaskItem,
} from '../viewmodels/useAdminDashboardViewModel';
import { AdminSosDetailModal } from '../components/AdminSosDetailModal';
import { AdminRescueTaskDetailModal } from '../components/AdminRescueTaskDetailModal';
import './AdminDashboardView.css';

export const AdminDashboardView: React.FC = () => {
  const {
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
    formatDate,
  } = useAdminDashboardViewModel();

  const [selectedSos, setSelectedSos] = React.useState<SosReportItem | null>(null);
  const [selectedTask, setSelectedTask] = React.useState<RescueTaskItem | null>(null);

  if (isLoading) {
    return (
      <div className="adm-dash-loading">
        <div className="adm-dash-spinner" />
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <>
      <div className="adm-dash">
        <div className="adm-dash-header">
          <h1>Tổng quan hệ thống</h1>
          <p>Theo dõi hoạt động cứu hộ theo thời gian thực</p>
        </div>

        {/* STAT CARDS */}
        <div className="adm-stat-grid">
          <div className="adm-stat-card orange">
            <div className="adm-stat-top">
              <div className="adm-stat-icon">
                <AlertTriangle size={22} />
              </div>
              <span className="adm-trend">
                <TrendingUp size={14} /> +5 hôm nay
              </span>
            </div>
            <div className="adm-stat-num">{stats?.pendingApproval ?? 0}</div>
            <div className="adm-stat-lbl">CHỜ PHÊ DUYỆT</div>
          </div>

          <div className="adm-stat-card blue">
            <div className="adm-stat-top">
              <div className="adm-stat-icon">
                <Clock size={22} />
              </div>
              <span className="adm-trend">
                <TrendingUp size={14} /> 12 ưu tiên cao
              </span>
            </div>
            <div className="adm-stat-num">{stats?.activeRequests ?? 0}</div>
            <div className="adm-stat-lbl">YÊU CẦU ĐANG HOẠT ĐỘNG</div>
          </div>

          <div className="adm-stat-card green">
            <div className="adm-stat-top">
              <div className="adm-stat-icon">
                <ShieldCheck size={22} />
              </div>
              <span className="adm-trend adm-trend-green">Đã xác thực</span>
            </div>
            <div className="adm-stat-num">{stats?.totalVolunteers ?? 0}</div>
            <div className="adm-stat-lbl">TỔNG SỐ TÌNH NGUYỆN VIÊN</div>
          </div>

          <div className="adm-stat-card purple">
            <div className="adm-stat-top">
              <div className="adm-stat-icon">
                <Users size={22} />
              </div>
              <span className="adm-trend">Tổng cộng</span>
            </div>
            <div className="adm-stat-num">{stats?.totalUsers ?? 0}</div>
            <div className="adm-stat-lbl">TỔNG TÀI KHOẢN</div>
          </div>
        </div>

        {/* MAIN TABLE */}
        <div className="adm-table-card">
          <div className="adm-table-header">
            <div className="adm-table-tabs">
              <button
                className={`adm-tab ${activeTab === 'SOS' ? 'active' : ''}`}
                onClick={() => setActiveTab('SOS')}
              >
                Báo cáo SOS
              </button>
              <button
                className={`adm-tab ${activeTab === 'RESCUE' ? 'active' : ''}`}
                onClick={() => setActiveTab('RESCUE')}
              >
                Nhiệm vụ cứu trợ
              </button>
              <button
                className={`adm-tab ${activeTab === 'VOLUNTEER' ? 'active' : ''}`}
                onClick={() => setActiveTab('VOLUNTEER')}
              >
                Duyệt Tình nguyện viên{' '}
                {pendingVolunteers.length > 0 && (
                  <span className="tab-count">{pendingVolunteers.length}</span>
                )}
              </button>
            </div>
            <button className="adm-refresh-btn" onClick={loadDashboard}>
              Làm mới
            </button>
          </div>

          {activeTab === 'SOS' && (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Địa chỉ</th>
                  <th>Mức độ</th>
                  <th>Trạng thái</th>
                  <th>Chi tiết</th>
                  <th>Thời gian</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {sosReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="adm-empty-row">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  sosReports.map((r, idx) => {
                    const statusCfg = STATUS_MAP[r.status] || {
                      label: r.status,
                      cls: 'badge-pending',
                    };
                    return (
                      <tr key={r.id}>
                        <td className="adm-td-num">{idx + 1}</td>
                        <td className="adm-td-addr">{r.address}</td>
                        <td>
                          <span
                            className={`adm-badge ${LEVEL_MAP[r.level] || 'badge-low'
                              }`}
                          >
                            {r.level || '—'}
                          </span>
                        </td>
                        <td>
                          <span className={`adm-badge ${statusCfg.cls}`}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="adm-td-detail">{r.details || '—'}</td>
                        <td className="adm-td-time">{formatDate(r.createdAt)}</td>
                        <td>
                          <div className="adm-action-group">
                            <button
                              className="adm-action-btn view"
                              title="Xem chi tiết"
                              onClick={() => setSelectedSos(r)}
                            >
                              <Eye size={14} />
                            </button>
                            {r.status === 'PENDING' && (
                              <button
                                className="adm-action-btn approve"
                                title="Duyệt báo cáo"
                                onClick={() => handleApproveSos(r.id)}
                              >
                                <CheckCircle size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'RESCUE' && (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Report ID</th>
                  <th>Trạng thái</th>
                  <th>Ghi chú</th>
                  <th>Thời gian</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {rescueTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="adm-empty-row">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  rescueTasks.map((t, idx) => {
                    const statusCfg = STATUS_MAP[t.status] || {
                      label: t.status,
                      cls: 'badge-pending',
                    };
                    return (
                      <tr key={t.id}>
                        <td className="adm-td-num">{idx + 1}</td>
                        <td className="adm-td-id">
                          {t.reportId?.slice(0, 8)}...
                        </td>
                        <td>
                          <span className={`adm-badge ${statusCfg.cls}`}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="adm-td-detail">{t.note || '—'}</td>
                        <td className="adm-td-time">{formatDate(t.createdAt)}</td>
                        <td>
                          <button
                            className="adm-action-btn view"
                            onClick={() => setSelectedTask(t)}
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'VOLUNTEER' && (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Họ tên</th>
                  <th>Số điện thoại</th>
                  <th>Email</th>
                  <th>Thời gian đăng ký</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {pendingVolunteers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="adm-empty-row">
                      Không có tình nguyện viên chờ duyệt
                    </td>
                  </tr>
                ) : (
                  pendingVolunteers.map((v, idx) => (
                    <tr key={v.id}>
                      <td className="adm-td-num">{idx + 1}</td>
                      <td className="adm-td-name">
                        <strong>{v.fullName}</strong>
                      </td>
                      <td>{v.phone || '—'}</td>
                      <td>{v.email || '—'}</td>
                      <td className="adm-td-time">{formatDate(v.createdAt)}</td>
                      <td>
                        <div className="adm-action-group">
                          <button
                            className="adm-action-btn approve"
                            title="Phê duyệt"
                            onClick={() => handleApproveVolunteer(v.id)}
                          >
                            <UserCheck size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SOS DETAIL MODAL */}
      <AdminSosDetailModal
        report={selectedSos}
        isOpen={!!selectedSos}
        onClose={() => setSelectedSos(null)}
        onApprove={(id) => {
          handleApproveSos(id);
        }}
        formatDate={formatDate}
      />

      {/* RESCUE TASK DETAIL MODAL */}
      <AdminRescueTaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        formatDate={formatDate}
      />
    </>
  );
};

export default AdminDashboardView;
import React from 'react';
import {
  Search, Eye, Lock, Unlock,
  ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react';
import { 
  useAdminUsersViewModel, 
  ROLE_LABEL, 
  ROLE_CLS, 
  STATUS_LABEL, 
  STATUS_CLS
} from '../viewmodels/useAdminUsersViewModel';
import type { FilterTab } from '../viewmodels/useAdminUsersViewModel';
import { AdminUserDetailModal } from '../components/AdminUserDetailModal';
import type { AdminUserDetail } from '../components/AdminUserDetailModal';
import './AdminUsersView.css';

export const AdminUsersView: React.FC = () => {
  const {
    users,
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
    ensureFullUrl,
    stats
  } = useAdminUsersViewModel();

  const [selectedUser, setSelectedUser] = React.useState<AdminUserDetail | null>(null);

  return (
    <div className="adm-users">
      <div className="adm-users-header">
        <div>
          <h1>Quản lý tài khoản</h1>
          <p>Danh sách và phân quyền người dùng trong hệ thống</p>
        </div>
        <button className="adm-users-refresh" onClick={loadUsers}>
          <RefreshCw size={16} />
        </button>
      </div>

      {successMsg && (
        <div className="adm-success-msg">
          ✓ {successMsg}
        </div>
      )}

      {/* FILTER TABS */}
      <div className="adm-filter-bar">
        {(['ALL', 'CITIZEN', 'VOLUNTEER', 'LOCKED'] as FilterTab[]).map(tab => (
          <button
            key={tab}
            className={`adm-filter-tab ${filterTab === tab ? 'active' : ''}`}
            onClick={() => { setFilterTab(tab); setPage(1); }}
          >
            {{
              ALL: 'Tất cả',
              CITIZEN: 'Người dân',
              VOLUNTEER: 'Tình nguyện viên',
              LOCKED: 'Bị khóa',
            }[tab]}
          </button>
        ))}

        <div className="adm-search-wrap">
          <Search size={16} />
          <input
            type="text"
            placeholder="Tìm kiếm tên, email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="adm-table-card">
        {isLoading ? (
          <div className="adm-users-loading">
            <div className="adm-dash-spinner" />
            <p>Đang tải...</p>
          </div>
        ) : (
          <table className="adm-users-table">
            <thead>
              <tr>
                <th>Tài khoản</th>
                <th>Quyền</th>
                <th>Ngày đăng ký</th>
                <th>Trạng thái</th>
                <th>Đổi quyền</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="adm-empty-row">
                    Không tìm thấy tài khoản nào.
                  </td>
                </tr>
              ) : users.map(u => (
                <tr key={u.id}>
                  {/* ACCOUNT */}
                  <td>
                    <div className="adm-user-cell">
                      <div className="adm-user-avatar">
                        <img
                          src={ensureFullUrl(u.imageUrl, u.fullName)}
                          alt={u.fullName}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.parentElement) {
                              e.currentTarget.parentElement.innerText = u.fullName?.charAt(0)?.toUpperCase() || '?';
                            }
                          }}
                        />
                      </div>
                      <div>
                        <p className="adm-user-name">{u.fullName}</p>
                        <p className="adm-user-email">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* ROLE */}
                  <td>
                    <span className={`adm-badge-role ${ROLE_CLS[u.role] || 'role-user'}`}>
                      {ROLE_LABEL[u.role] || u.role}
                    </span>
                  </td>

                  {/* DATE */}
                  <td className="adm-td-date">{formatDate(u.createdAt)}</td>

                  {/* STATUS */}
                  <td>
                    <span className={`adm-badge-status ${STATUS_CLS[u.status] || 'st-active'}`}>
                      {STATUS_LABEL[u.status] || u.status}
                    </span>
                  </td>

                  {/* ROLE CHANGE */}
                  <td>
                    <select
                      className="adm-role-select"
                      value={u.role}
                      disabled={actionLoading === u.id + '-role'}
                      onChange={e => handleChangeRole(u.id, e.target.value)}
                    >
                      <option value="CITIZEN">Người dân</option>
                      <option value="VOLUNTEER">Tình nguyện viên</option>
                      <option value="ADMIN">Quản trị</option>
                    </select>
                  </td>

                  {/* ACTIONS */}
                  <td>
                    <div className="adm-actions-row">
                      <button
                        className="adm-action-btn view"
                        title="Xem chi tiết"
                        onClick={() => setSelectedUser(u as AdminUserDetail)}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className={`adm-action-btn ${u.status === 'ACTIVE' ? 'lock' : 'unlock'}`}
                        title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
                        disabled={actionLoading === u.id + '-status'}
                        onClick={() => handleToggleStatus(u)}
                      >
                        {u.status === 'ACTIVE' ? <Lock size={14} /> : <Unlock size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="adm-pagination">
          <button
            className="adm-page-btn"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="adm-page-info">
            Trang {page} / {totalPages} · {users.length} tài khoản
          </span>
          <button
            className="adm-page-btn"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* BOTTOM STATS */}
      <div className="adm-bottom-stats">
        <div className="adm-bot-stat">
          <span className="adm-bot-num">{stats?.totalUsers ?? '—'}</span>
          <span className="adm-bot-lbl">TỔNG TÀI KHOẢN</span>
        </div>
        <div className="adm-bot-stat">
          <span className="adm-bot-num">{stats?.totalVolunteers ?? '—'}</span>
          <span className="adm-bot-lbl">TÌNH NGUYỆN VIÊN</span>
        </div>
        <div className="adm-bot-stat">
          <span className="adm-bot-num">{stats?.totalCitizens ?? '—'}</span>
          <span className="adm-bot-lbl">NGƯỜI DÂN</span>
        </div>
      </div>

      <AdminUserDetailModal
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        onToggleStatus={(u) => { handleToggleStatus(u as any); }}
        formatDate={formatDate}
        actionLoading={actionLoading}
      />
    </div>
  );
};

export default AdminUsersView;

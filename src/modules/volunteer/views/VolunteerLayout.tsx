import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Map as MapIcon,
  MessageSquare,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  HandHelping,
  AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Topbar } from '@/shared/components/Topbar';
import { BottomNav } from '@/shared/components/BottomNav';
import { useNotificationHub } from '@/hooks/useNotificationHub';
import { useNotificationStore } from '@/store/notificationStore';
import '@/styles/VolunteerLayout.css';

export const VolunteerLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isPending = user?.status === 'PENDING';

  // Kích hoạt lắng nghe thông báo toàn cục
  useNotificationHub();

  const { notifications } = useNotificationStore();
  const unreadMessageCount = notifications.filter(n => !n.isRead && n.referenceType === 'MESSAGE').length;

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const navItems = [
    { path: '/volunteer', label: 'Bảng tin', icon: <LayoutDashboard size={22} /> },
    { path: '/volunteer/requests', label: 'Cứu trợ', icon: <HandHelping size={22} /> },
    { path: '/volunteer/map', label: 'Bản đồ', icon: <MapIcon size={22} /> },
    { path: '/volunteer/messages', label: 'Tin nhắn', icon: <MessageSquare size={22} /> },
    { path: '/volunteer/profile', label: 'Hồ sơ', icon: <User size={22} /> },
  ];

  return (
    <div className="volunteer-layout volunteer-theme">
      {/* SIDEBAR - Hidden on Mobile via CSS */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand-container">
          <div className="brand-logo-img volunteer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <div className="brand-info">
            <h2 className="brand-name">SOSMap</h2>
            <p className="brand-subtitle">Ứng dụng cứu hộ cộng đồng</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/volunteer' && location.pathname === '/volunteer/');
            const isDisabled = isPending && item.path !== '/volunteer/profile' && item.path !== '/volunteer';
            return (
              <div
                key={item.path}
                className={`nav-link ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={() => {
                  if (isDisabled) return;
                  navigate(item.path);
                }}
              >
                <div className="nav-icon">
                  {item.icon}
                  {item.label === 'Tin nhắn' && unreadMessageCount > 0 && (
                    <span className="nav-badge">{unreadMessageCount > 9 ? '9+' : unreadMessageCount}</span>
                  )}
                </div>
                <span className="nav-text">{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer-actions">
          <button
            className="action-button collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            <span className="action-text">Thu gọn</span>
          </button>

          <button
            className="action-button logout-btn"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span className="action-text">Đăng xuất</span>
          </button>
        </div>

        {user && (
          <div className="profile-card">
            <div className="profile-avatar volunteer">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'V'}
            </div>
            <div className="profile-info">
              <span className="profile-name">{user.fullName || 'Tình nguyện viên'}</span>
              <span className="profile-role">Tình nguyện viên</span>
            </div>
          </div>
        )}
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="volunteer-main">
        <Topbar />
        <div className="volunteer-content-area">
          {isPending && (
            <div className="pending-banner">
              <div className="pending-banner-content">
                <AlertTriangle size={20} className="pending-icon" />
                <div className="pending-text">
                  <strong>Tài khoản đang chờ duyệt:</strong> Hệ thống đang kiểm tra thông tin. Bạn có thể sử dụng Bảng tin và Hồ sơ.
                </div>
              </div>
            </div>
          )}

          <div className="volunteer-content">
            <Outlet />
          </div>
        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <BottomNav items={navItems} isPending={isPending} />
    </div>
  );
};

export default VolunteerLayout;


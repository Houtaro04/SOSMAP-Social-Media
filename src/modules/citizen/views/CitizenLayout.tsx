import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutGrid,
  Map,
  ShieldAlert,
  MessageSquare,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import '@/styles/CitizenLayout.css';

export const CitizenLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const menuItems = [
    { path: '/citizen', label: 'Bảng tin', icon: <LayoutGrid size={22} /> },
    { path: '/citizen/map', label: 'Bản đồ vận hành', icon: <Map size={22} /> },
    { path: '/citizen/rescue', label: 'Đội cứu hộ', icon: <ShieldAlert size={22} /> },
    { path: '/citizen/messages', label: 'Tin nhắn', icon: <MessageSquare size={22} /> },
    { path: '/citizen/profile', label: 'Hồ sơ', icon: <User size={22} /> },
  ];

  return (
    <div className="citizen-layout">
      {/* SIDEBAR */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand-container">
          <div className="brand-logo-img">
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
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/citizen' && location.pathname === '/citizen/');
            return (
              <div
                key={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <div className="nav-icon">{item.icon}</div>
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
            <div className="profile-avatar">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="profile-info">
              <span className="profile-name">{user.fullName || 'Người dùng'}</span>
              <span className="profile-role">Người dân</span>
            </div>
          </div>
        )}
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default CitizenLayout;

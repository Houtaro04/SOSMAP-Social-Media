import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, ShieldAlert, LogOut,
  Bell
} from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';
import './AdminLayout.css';

const NAV_ITEMS = [
  { to: '/admin/dashboard', icon: <LayoutDashboard size={18} />, label: 'Tổng quan' },
  { to: '/admin/users', icon: <Users size={18} />, label: 'Quản lý tài khoản' },
];

export const AdminLayout: React.FC = () => {
  const { adminUser, logout } = useAdminStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  return (
    <div className="adm-layout">
      {/* SIDEBAR */}
      <aside className="adm-sidebar">
        <div className="adm-sidebar-top">
          <div className="adm-logo">
            <div className="adm-logo-icon">
              <ShieldAlert size={20} color="white" />
            </div>
            <div>
              <p className="adm-logo-name">SOSMap</p>
              <p className="adm-logo-sub">Quản trị hệ thống</p>
            </div>
          </div>

          <nav className="adm-nav">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `adm-nav-item ${isActive ? 'active' : ''}`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="adm-sidebar-bottom">
          <div className="adm-admin-info">
            <div className="adm-admin-avatar">
              {adminUser?.fullName?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="adm-admin-text">
              <p className="adm-admin-name">{adminUser?.fullName || 'Admin'}</p>
              <p className="adm-admin-role">Quản trị viên</p>
            </div>
          </div>
          <button className="adm-logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="adm-main">
        <header className="adm-topbar">
          <div className="adm-topbar-left">
            <p className="adm-topbar-greeting">
              Xin chào, <strong>{adminUser?.fullName || 'Admin'}</strong> 👋
            </p>
          </div>
          <div className="adm-topbar-right">
            <button className="adm-notif-btn">
              <Bell size={18} />
              <span className="adm-notif-dot" />
            </button>
          </div>
        </header>

        <main className="adm-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

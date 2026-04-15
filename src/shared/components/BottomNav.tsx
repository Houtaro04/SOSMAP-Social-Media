import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '@/styles/BottomNav.css';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

interface BottomNavProps {
  items: NavItem[];
  isPending?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ items, isPending }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const isActive = location.pathname === item.path || (item.path.split('/')[1] === location.pathname.split('/')[1] && item.path !== '/' && location.pathname !== '/');
        // Special case for dashboard
        const isDashboard = item.path === '/volunteer' || item.path === '/citizen';
        const isExactActive = (isDashboard && (location.pathname === item.path || location.pathname === `${item.path}/`)) 
                            || (!isDashboard && location.pathname.startsWith(item.path));

        const isDisabled = isPending && item.path.includes('/profile') === false && item.path.includes('/volunteer') === false;

        return (
          <div
            key={item.path}
            className={`bottom-nav-item ${isExactActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
            onClick={() => !isDisabled && navigate(item.path)}
          >
            <div className="bottom-nav-icon">{item.icon}</div>
            <span className="bottom-nav-text">{item.label}</span>
          </div>
        );
      })}
    </nav>
  );
};

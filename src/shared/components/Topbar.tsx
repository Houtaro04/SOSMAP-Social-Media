import React from 'react';
import { useLocation } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import '@/styles/Topbar.css';

interface TopbarProps {
    title?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ title }) => {
    const location = useLocation();

    const getPageTitle = () => {
        if (title) return title;
        const path = location.pathname;
        if (path.includes('/citizen')) {
            if (path === '/citizen' || path === '/citizen/') return 'Bảng tin cộng đồng';
            if (path.includes('/map')) return 'Bản đồ vận hành';
            if (path.includes('/rescue')) return 'Đội cứu hộ';
            if (path.includes('/messages')) return 'Tin nhắn';
            if (path.includes('/profile')) return 'Hồ sơ cá nhân';
        }
        if (path.includes('/volunteer')) {
            if (path === '/volunteer' || path === '/volunteer/') return 'Bảng tin tình nguyện';
            if (path.includes('/requests')) return 'Yêu cầu cứu trợ';
            if (path.includes('/map')) return 'Bản đồ cứu trợ';
            if (path.includes('/messages')) return 'Hộp thư hỗ trợ';
            if (path.includes('/profile')) return 'Hồ sơ tình nguyện';
        }
        return 'SOSMap';
    };

    return (
        <header className="topbar">
            <div className="topbar-left">
                <h2 className="page-title">{getPageTitle()}</h2>
            </div>
            <div className="topbar-right">
                <NotificationBell />
            </div>
        </header>
    );
};

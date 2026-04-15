import React, { useState, useRef, useEffect } from 'react';
import { Bell, Clock } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { formatRelativeTime } from '@/shared/services/messageService';
import '@/styles/NotificationBell.css';

export const NotificationBell: React.FC = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="notification-bell-container" ref={dropdownRef}>
            <button
                className={`bell-btn ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="Thông báo"
            >
                <Bell size={22} />
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="dropdown-header">
                        <h3>Thông báo</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead}>Đánh dấu đã đọc hết</button>
                        )}
                    </div>

                    <div className="dropdown-list">
                        {notifications.length === 0 ? (
                            <div className="empty-notif">Không có thông báo nào</div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                                    onClick={() => markAsRead(n.id)}
                                >
                                    <div className="notif-content">
                                        <p>{n.content}</p>
                                        <div className="notif-meta">
                                            <Clock size={12} />
                                            <span>{formatRelativeTime(n.createdAt)}</span>
                                        </div>
                                    </div>
                                    {!n.isRead && <div className="unread-dot" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

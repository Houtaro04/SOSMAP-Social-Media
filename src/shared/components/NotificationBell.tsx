import React, { useState, useRef, useEffect } from 'react';
import { Bell, Clock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotificationStore } from '@/store/notificationStore';
import type { NotificationItem } from '@/store/notificationStore';
import { formatRelativeTime } from '@/shared/services/messageService';
import { notificationService } from '@/shared/services/notificationService';
import '@/styles/NotificationBell.css';

export const NotificationBell: React.FC = () => {
    const store = useNotificationStore();
    const notifications = store?.notifications || [];
    const unreadCount = store?.unreadCount || 0;
    const { markAsRead, markAllAsRead, setNotifications } = store;

    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const fetchNotifs = async () => {
            try {
                const res = await notificationService.getMyNotifications();
                if (res && res.data && setNotifications) {
                    setNotifications(res.data);
                }
            } catch (error) {
                console.error('Error fetching notifications:', error);
            }
        };
        fetchNotifs();

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setNotifications]);

    const handleMarkAsRead = async (id: string, isRead: boolean) => {
        if (isRead) return;
        if (markAsRead) markAsRead(id);
        try {
            await notificationService.markAsRead(id);
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleNotificationClick = async (n: NotificationItem) => {
        if (!n) return;
        await handleMarkAsRead(n.id, n.isRead);
        setIsOpen(false);

        const isVolunteerPath = location.pathname.startsWith('/volunteer');
        const basePath = isVolunteerPath ? '/volunteer' : '/citizen';

        const refType = n.referenceType || '';
        if (['PostComment', 'PostCommentReply', 'PostLike'].includes(refType)) {
            if (n.referenceId) {
                navigate(`${basePath}?postId=${n.referenceId}`);
            }
        } else if (refType === 'RescueTask' || refType === 'SosReport') {
            navigate(`${basePath}/map`);
        }
    };

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
                            <button onClick={() => {
                                if (markAllAsRead) markAllAsRead();
                                const unreadList = notifications.filter(item => !item.isRead);
                                unreadList.forEach(item => notificationService.markAsRead(item.id));
                            }}>Đánh dấu đã đọc hết</button>
                        )}
                    </div>

                    <div className="dropdown-list">
                        {notifications.length === 0 ? (
                            <div className="empty-notif">Không có thông báo nào</div>
                        ) : (
                            [...notifications]
                            .sort((a, b) => {
                                const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                                const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                                return timeB - timeA;
                            })
                            .map((n) => (
                                <div
                                    key={n.id}
                                    className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(n)}
                                    style={{ cursor: 'pointer' }}
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





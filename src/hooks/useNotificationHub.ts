import { useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import type { NotificationItem } from '@/store/notificationStore';
import { BASE_URL } from '@/lib/api';

const HUB_URL = BASE_URL.replace('/api', '') + '/notificationhub';

/**
 * Hook để lắng nghe các cập nhật thời gian thực từ NotificationHub.
 * @param onPostUpdate Callback khi có cập nhật bài viết (Like/Comment).
 * @param onSosUpdate Callback khi có cập nhật SOS/Cứu trợ.
 */
export const useNotificationHub = (
    onPostUpdate?: (data: any) => void,
    onSosUpdate?: (data: any) => void
) => {
    const { user, token } = useAuthStore();
    const { addNotification } = useNotificationStore();
    const connectionRef = useRef<signalR.HubConnection | null>(null);

    const startConnection = useCallback(async (conn: signalR.HubConnection) => {
        try {
            if (conn.state === signalR.HubConnectionState.Disconnected) {
                await conn.start();
                console.log('[SignalR Notification] Connected');
                if (user?.id) {
                    await conn.invoke('JoinUserGroup', user.id);
                }
            }
        } catch (err) {
            console.error('[SignalR Notification] Connection Error:', err);
            setTimeout(() => startConnection(conn), 5000);
        }
    }, [user?.id]);

    useEffect(() => {
        if (!token || !user?.id) return;

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL, {
                accessTokenFactory: () => token,
                skipNegotiation: false,
                transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        // 1. Nhận thông báo cá nhân/hệ thống
        connection.on('ReceiveNotification', (message: string, data: any) => {
            console.log('[SignalR] Received Notification:', message, data);
            const notif: NotificationItem = {
                id: data.id || Math.random().toString(36).substr(2, 9),
                userId: user.id,
                content: message,
                referenceId: data.referenceId || data.ReferenceId,
                referenceType: data.referenceType || data.ReferenceType,
                createdAt: data.createdAt || data.CreatedAt || new Date().toISOString(),
                isRead: false
            };
            addNotification(notif);

            // Hiển thị toast nếu cần (có thể tích hợp thư viện toast sau)
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Thông báo mới', { body: message });
            }
        });

        // 2. Nhận cập nhật bài viết (Like/Comment)
        connection.on('ReceivePostUpdate', (data: any) => {
            console.log('[SignalR] Received Post Update:', data);
            if (onPostUpdate) onPostUpdate(data);
        });

        // 3. Nhận cập nhật SOS
        connection.on('ReceiveSosUpdate', (data: any) => {
            console.log('[SignalR] Received SOS Update:', data);
            if (onSosUpdate) onSosUpdate(data);
        });

        startConnection(connection);
        connectionRef.current = connection;

        return () => {
            if (connection) {
                connection.stop().catch(() => { });
            }
        };
    }, [token, user?.id, addNotification, onPostUpdate, onSosUpdate, startConnection]);

    return connectionRef.current;
};

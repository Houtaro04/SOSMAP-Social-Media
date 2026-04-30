import { useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuthStore } from '@/store/authStore';
import { useAdminStore } from '@/store/adminStore';
import { useNotificationStore } from '@/store/notificationStore';
import type { NotificationItem } from '@/store/notificationStore';
import { BASE_URL } from '@/lib/api';

const HUB_URL = BASE_URL.replace('/api', '') + '/notificationhub';

/**
 * Hook để lắng nghe các cập nhật thời gian thực từ NotificationHub.
 */
export const useNotificationHub = (
    onPostUpdate?: (data: any) => void,
    onSosUpdate?: (data: any) => void
) => {
    const { user: citizenUser, token: citizenToken } = useAuthStore();
    const { adminUser, token: adminToken } = useAdminStore();
    
    const user = citizenUser || (adminUser ? { id: adminUser.id, fullName: adminUser.fullName } : null);
    const token = citizenToken || adminToken;

    const { addNotification } = useNotificationStore();
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const isMounted = useRef(true);

    const onPostUpdateRef = useRef(onPostUpdate);
    const onSosUpdateRef = useRef(onSosUpdate);

    useEffect(() => {
        onPostUpdateRef.current = onPostUpdate;
    }, [onPostUpdate]);

    useEffect(() => {
        onSosUpdateRef.current = onSosUpdate;
    }, [onSosUpdate]);

    const startConnection = useCallback(async (conn: signalR.HubConnection) => {
        if (!isMounted.current) return;
        
        try {
            if (conn.state === signalR.HubConnectionState.Disconnected) {
                await conn.start();
                console.log('[SignalR Notification] Connected');
                if (user?.id && isMounted.current) {
                    await conn.invoke('JoinUserGroup', user.id);
                }
            }
        } catch (err: any) {
            if (err?.name === 'AbortError' || !isMounted.current) return;
            
            console.error('[SignalR Notification] Connection Error:', err);
            if (token && user?.id && isMounted.current) {
                setTimeout(() => {
                    if (isMounted.current && connectionRef.current === conn) {
                        startConnection(conn);
                    }
                }, 5000);
            }
        }
    }, [user?.id, token]);

    useEffect(() => {
        isMounted.current = true;
        if (!token || !user?.id) return;

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL, {
                accessTokenFactory: () => token,
                skipNegotiation: false,
                transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.None)
            .build();

        connection.on('ReceiveNotification', (message: string, data: any) => {
            if (!isMounted.current) return;
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
        });

        connection.on('ReceivePostUpdate', (data: any) => {
            if (onPostUpdateRef.current && isMounted.current) {
                onPostUpdateRef.current(data);
            }
        });

        connection.on('ReceiveSosUpdate', (data: any) => {
            if (onSosUpdateRef.current && isMounted.current) {
                onSosUpdateRef.current(data);
            }
        });

        connection.on('ReceiveCommentReply', (data: any) => {
            if (!isMounted.current) return;
            console.log('[SignalR] Received Comment Reply:', data);
            
            const message = `${data.userName || 'Ai đó'} đã trả lời bình luận của bạn.`;
            const notif: NotificationItem = {
                id: data.id || Math.random().toString(36).substr(2, 9),
                userId: user.id,
                content: message,
                referenceId: data.postId || data.PostId,
                referenceType: 'POST_COMMENT',
                createdAt: new Date().toISOString(),
                isRead: false
            };
            addNotification(notif);
            
            // Hiện cảnh báo hoặc Toast nếu cần
            console.log('%c [NOTIFICATION] ' + message, 'background: #222; color: #bada55; padding: 10px;');
        });

        connection.on('ReceiveMessage', (msg: any) => {
            if (!isMounted.current) return;
            const senderName = msg.senderName || msg.SenderName || 'Ai đó';
            const content = msg.content || msg.Content || 'đã gửi một tin nhắn';
            
            // Nếu không phải tin nhắn của chính mình
            if ((msg.senderId || msg.SenderId) !== user.id) {
                const notif: NotificationItem = {
                    id: msg.id || Math.random().toString(36).substr(2, 9),
                    userId: user.id,
                    content: `${senderName}: ${content}`,
                    referenceId: msg.conversationId || msg.ConversationId,
                    referenceType: 'MESSAGE',
                    createdAt: new Date().toISOString(),
                    isRead: false
                };
                addNotification(notif);
                console.log('%c [MESSAGE] ' + senderName + ': ' + content, 'background: #222; color: #3498db; padding: 10px;');
            }
        });

        connectionRef.current = connection;
        startConnection(connection);

        return () => {
            isMounted.current = false;
            if (connection) {
                connection.stop().catch(() => {});
            }
            connectionRef.current = null;
        };
    }, [token, user?.id, addNotification, startConnection]);

    return connectionRef.current;
};

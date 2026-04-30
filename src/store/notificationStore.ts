import { create } from 'zustand';

export interface NotificationItem {
    id: string;
    userId: string;
    referenceId?: string;
    referenceType?: string;
    content: string;
    createdAt: string;
    isRead: boolean;
}

interface NotificationState {
    notifications: NotificationItem[];
    unreadCount: number;
    addNotification: (notif: NotificationItem) => void;
    setNotifications: (notifs: NotificationItem[]) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    markMessagesAsRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],
    unreadCount: 0,

    addNotification: (notif) => set((state) => {
        // Avoid duplicates
        if (state.notifications.some(n => n.id === notif.id)) return state;
        const newList = [notif, ...state.notifications];
        return {
            notifications: newList,
            unreadCount: newList.filter(n => !n.isRead).length
        };
    }),

    setNotifications: (notifs) => set({
        notifications: notifs,
        unreadCount: notifs.filter(n => !n.isRead).length
    }),

    markAsRead: (id) => set((state) => {
        const newList = state.notifications.map(n =>
            n.id === id ? { ...n, isRead: true } : n
        );
        return {
            notifications: newList,
            unreadCount: newList.filter(n => !n.isRead).length
        };
    }),

    markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
    })),

    markMessagesAsRead: () => set((state) => {
        const newList = state.notifications.map(n =>
            n.referenceType === 'MESSAGE' ? { ...n, isRead: true } : n
        );
        return {
            notifications: newList,
            unreadCount: newList.filter(n => !n.isRead).length
        };
    })
}));

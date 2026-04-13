import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface AdminState {
  isAuthenticated: boolean;
  token: string | null;
  adminUser: AdminUser | null;
  login: (token: string, user: AdminUser) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      adminUser: null,

      login: (token: string, user: AdminUser) =>
        set({ isAuthenticated: true, token, adminUser: user }),

      logout: () =>
        set({ isAuthenticated: false, token: null, adminUser: null }),
    }),
    { name: 'sosmap-admin-storage' }
  )
);

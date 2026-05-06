import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthResponse } from '@/shared/entities/AuthEntity';
import type { UserRole } from '@/shared/types/UserRole';
import { apiGet } from '@/lib/api';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: AuthResponse['data']['user'] | null;
  selectedRole: UserRole; // Role được chọn từ UI lúc đăng nhập
  login: (data: AuthResponse['data'], role?: UserRole) => void;
  updateUser: (userData: Partial<AuthResponse['data']['user']>) => void;
  checkAccountStatus: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      user: null,
      selectedRole: 'CITIZEN',

      login: (data: AuthResponse['data'], role: UserRole = 'CITIZEN') => {
        const payload: any = data;
        set({
          isAuthenticated: true,
          token: payload.token || payload.Token,
          user: payload.user || payload.User,
          selectedRole: role,
        });
      },

      updateUser: (userData: Partial<AuthResponse['data']['user']>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : (userData as any),
        }));
      },

      checkAccountStatus: async () => {
        try {
          const res = await apiGet<any>('/Auth/me');
          const latestUser = res.data || res;
          console.log('[AuthStore] Syncing status:', latestUser?.status);
          
          if (latestUser) {
            set((state) => ({
              user: state.user ? { ...state.user, ...latestUser } : latestUser,
            }));
          }
        } catch (err: any) {
          console.error('[AuthStore] Check status error:', err);
          // Nếu gặp lỗi 403 (Forbidden), khả năng cao là tài khoản đã bị khóa
          if (err.message?.includes('403') || err.message?.includes('Forbidden')) {
            console.warn('[AuthStore] 403 Forbidden detected. Force setting status to LOCKED.');
            set((state) => ({
              user: state.user ? { ...state.user, status: 'LOCKED' } : { status: 'LOCKED' } as any
            }));
          }
        }
      },

      logout: () => set({
        isAuthenticated: false,
        token: null,
        user: null,
        selectedRole: 'CITIZEN',
      })
    }),
    {
      name: 'sosmap-auth-storage', // Tên key trong localStorage
    }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthResponse, UserRole } from '@/shared/entities/AuthEntity';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: AuthResponse['data']['user'] | null;
  selectedRole: UserRole; // Role được chọn từ UI lúc đăng nhập
  login: (data: AuthResponse['data'], role?: UserRole) => void;
  updateUser: (userData: Partial<AuthResponse['data']['user']>) => void;
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

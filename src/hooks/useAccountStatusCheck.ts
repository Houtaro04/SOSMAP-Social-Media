import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export const useAccountStatusCheck = () => {
  const { isAuthenticated, user, checkAccountStatus } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Kiểm tra định kỳ mỗi 5 giây
    const interval = setInterval(async () => {
      try {
        await checkAccountStatus();
        
        const latestUser = useAuthStore.getState().user;
        const currentPath = window.location.pathname;
        console.log(`[StatusCheck] Status: ${latestUser?.status}, Path: ${currentPath}`);

        // 1. Nếu bị khóa (LOCKED/BANNED) mà đang ở trong App -> Đẩy ra /locked
        if (latestUser?.status === 'LOCKED' || latestUser?.status === 'BANNED') {
          if (currentPath !== '/locked') {
            console.warn('Account LOCKED! Kicking out...');
            window.location.href = '/locked';
          }
        } 
        // 2. Nếu đã được mở khóa (ACTIVE) mà đang ở trang /locked -> Đẩy vào App
        else if (latestUser?.status === 'ACTIVE' || latestUser?.status === 'APPROVED' || !latestUser?.status) {
          if (currentPath === '/locked') {
            console.info('Account UNLOCKED! Welcome back.');
            window.location.href = '/';
          }
        }
      } catch (err: any) {
        if (err.message?.includes('403')) {
          if (window.location.pathname !== '/locked') {
            console.warn('Access forbidden - possible lock. Kicking out...');
            window.location.href = '/locked';
          }
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isAuthenticated, checkAccountStatus, navigate]);
};

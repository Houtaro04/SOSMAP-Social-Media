import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export const useAccountStatusCheck = () => {
  const { isAuthenticated, user, checkAccountStatus } = useAuthStore();
  const navigate = useNavigate();

  // Kiểm tra lần đầu khi ứng dụng khởi chạy
  useEffect(() => {
    if (!isAuthenticated) return;
    checkAccountStatus();
  }, [isAuthenticated, checkAccountStatus]);

  // Phản ứng khi trạng thái user thay đổi (được cập nhật qua SignalR hoặc API trả về)
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const currentPath = window.location.pathname;
    
    // 1. Nếu bị khóa (LOCKED/BANNED) mà đang ở trong App -> Đẩy ra /locked
    if (user.status === 'LOCKED' || user.status === 'BANNED') {
      if (currentPath !== '/locked') {
        console.warn('Account LOCKED! Kicking out...');
        window.location.href = '/locked';
      }
    } 
    // 2. Nếu đã được mở khóa (ACTIVE/APPROVED) mà đang ở trang /locked -> Đẩy vào App
    else if (user.status === 'ACTIVE' || user.status === 'APPROVED' || !user.status) {
      if (currentPath === '/locked') {
        console.info('Account UNLOCKED! Welcome back.');
        window.location.href = '/';
      }
    }
  }, [isAuthenticated, user?.status]);
};

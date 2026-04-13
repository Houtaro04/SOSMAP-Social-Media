import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '@/shared/entities/AuthEntity';

interface PrivateRouteProps {
  /** Role bắt buộc để truy cập route này */
  requiredRole?: UserRole;
}

/**
 * Bảo vệ route:
 * 1. Nếu chưa đăng nhập → redirect về /auth
 * 2. Nếu đăng nhập nhưng sai role → redirect về trang tương ứng với role của mình
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({ requiredRole }) => {
  const { isAuthenticated, selectedRole } = useAuthStore();

  // Chưa đăng nhập → về trang auth
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Đã đăng nhập nhưng sai role → redirect về đúng trang
  if (requiredRole && selectedRole !== requiredRole) {
    if (selectedRole === 'VOLUNTEER') {
      return <Navigate to="/volunteer" replace />;
    } else {
      // Mặc định cho CITIZEN là /citizen
      return <Navigate to="/citizen" replace />;
    }
  }

  return <Outlet />;
};

export default PrivateRoute;

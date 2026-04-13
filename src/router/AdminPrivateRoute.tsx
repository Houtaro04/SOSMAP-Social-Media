import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAdminStore } from '@/store/adminStore';

/**
 * Guard cho các route admin. Chuyển hướng về /admin nếu chưa đăng nhập.
 */
const AdminPrivateRoute: React.FC = () => {
  const { isAuthenticated, adminUser } = useAdminStore();

  if (!isAuthenticated || !adminUser) {
    return <Navigate to="/admin" replace />;
  }

  // Đảm bảo role thực sự là ADMIN
  if (adminUser.role !== 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default AdminPrivateRoute;

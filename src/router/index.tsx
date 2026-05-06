import { createBrowserRouter, Navigate } from 'react-router-dom';
import AuthView from '../modules/auth/views/AuthView';
import CitizenLayout from '../modules/citizen/views/CitizenLayout';
import HomeView from '../modules/citizen/views/HomeView';
import OperationMapView from '../modules/citizen/views/OperationMapView';
import RescueView from '../modules/citizen/views/RescueView';
import MessageView from '../modules/citizen/views/MessageView';
import ProfileView from '../modules/citizen/views/ProfileView';

import VolunteerLayout from '../modules/volunteer/views/VolunteerLayout';
import VolunteerHomeView from '../modules/volunteer/views/VolunteerHomeView';
import VolunteerRequestsView from '../modules/volunteer/views/VolunteerRequestsView';
import VolunteerMapView from '../modules/volunteer/views/VolunteerMapView';
import VolunteerMessageView from '../modules/volunteer/views/VolunteerMessageView';
import VolunteerProfileView from '../modules/volunteer/views/VolunteerProfileView';

import AdminLoginView from '../modules/admin/views/AdminLoginView';
import AdminLayout from '../modules/admin/views/AdminLayout';
import AdminDashboardView from '../modules/admin/views/AdminDashboardView';
import AdminUsersView from '../modules/admin/views/AdminUsersView';

import PrivateRoute from './PrivateRoute';
import AdminPrivateRoute from './AdminPrivateRoute';
import LockedView from '../modules/auth/views/LockedView';

export const router = createBrowserRouter([
  // ─── AUTH (công khai) ──────────────────────────────────────────────────────
  { path: '/auth', element: <AuthView /> },
  { path: '/login', element: <Navigate to="/auth" replace /> },
  { path: '/register', element: <Navigate to="/auth" replace /> },
  { path: '/locked', element: <LockedView /> },

  // ─── ADMIN (Quản trị) ────────────────────────────────────────────────────
  {
    path: '/admin',
    children: [
      // 1. Màn hình đăng nhập (chỉ hiện khi chưa login hoặc truy cập trực tiếp /admin)
      {
        index: true,
        element: <AdminLoginView />,
        // Lưu ý: AdminLoginView sẽ tự điều hướng vào /admin/dashboard nếu đã login
      },
      // 2. Các route cần bảo vệ
      {
        element: <AdminPrivateRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: 'dashboard', element: <AdminDashboardView /> },
              { path: 'users', element: <AdminUsersView /> },
              { path: 'reports', element: <AdminDashboardView /> },
            ],
          },
        ],
      },
    ],
  },

  // ─── CITIZEN (role CITIZEN) ──────────────────────────────────────────────────
  {
    element: <PrivateRoute requiredRole="CITIZEN" />,
    children: [
      {
        path: '/citizen',
        element: <CitizenLayout />,
        children: [
          { index: true, element: <HomeView /> },
          { path: 'map', element: <OperationMapView /> },
          { path: 'rescue', element: <RescueView /> },
          { path: 'messages', element: <MessageView /> },
          { path: 'profile', element: <ProfileView /> },
          { path: 'profile/:userId', element: <ProfileView /> },
        ],
      },
      { path: '/', element: <Navigate to="/citizen" replace /> },
    ],
  },

  // ─── VOLUNTEER (role VOLUNTEER) ───────────────────────────────────────────────
  {
    element: <PrivateRoute requiredRole="VOLUNTEER" />,
    children: [
      {
        path: '/volunteer',
        element: <VolunteerLayout />,
        children: [
          { index: true, element: <VolunteerHomeView /> },
          { path: 'requests', element: <VolunteerRequestsView /> },
          { path: 'map', element: <VolunteerMapView /> },
          { path: 'messages', element: <VolunteerMessageView /> },
          { path: 'profile', element: <VolunteerProfileView /> },
          { path: 'profile/:userId', element: <VolunteerProfileView /> },
        ],
      },
    ],
  },
]);


import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, isAuthenticated, role } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect to user's assigned dashboard
    const redirectMap = {
      student: '/student/dashboard',
      staff: '/staff/dashboard',
      hod: '/hod/dashboard',
      admin: '/admin/dashboard'
    };
    return <Navigate to={redirectMap[role] || '/'} replace />;
  }

  return <Outlet />;
};

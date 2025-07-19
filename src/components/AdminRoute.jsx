// src/components/AdminRoute.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
  const { currentUser, isAdmin } = useAuth();

  if (!currentUser) {
    // If not logged in, redirect to login
    return <Navigate to="/login" />;
  }

  if (!isAdmin) {
    // If logged in but NOT an admin, redirect to dashboard
    return <Navigate to="/dashboard" />;
  }

  // If logged in AND an admin, render the requested page
  return <Outlet />;
};

export default AdminRoute;
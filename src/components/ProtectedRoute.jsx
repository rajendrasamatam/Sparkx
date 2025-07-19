import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const { currentUser } = useAuth();

  // If there's no user, redirect to the login page.
  // The <Outlet> will render the child route's element if the user is logged in.
  return currentUser ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
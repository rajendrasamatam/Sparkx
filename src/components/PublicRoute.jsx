import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

const PublicRoute = () => {
  const { currentUser } = useAuth();

  // If a user is currently logged in, redirect them away from the public page
  // and send them to the dashboard.
  if (currentUser) {
    return <Navigate to="/dashboard" />;
  }

  // If there is no user, render the child route's element (e.g., the Home page).
  return <Outlet />;
};

export default PublicRoute;
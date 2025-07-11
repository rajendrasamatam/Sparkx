// src/components/ProtectedRoute.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    // If no user is logged in, redirect them to the login page
    return <Navigate to="/login" />;
  }

  // If a user is logged in, render the component they are trying to access
  return children;
};

export default ProtectedRoute;
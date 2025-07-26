// src/App.jsx

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import useLocationTracker from './hooks/useLocationTracker';

// Import Page Components
import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import ManageLights from './pages/ManageLights';
import LightDetails from './pages/LightDetails';
import Tasks from './pages/Tasks'; // Assuming you renamed MyTasks to Tasks
import ManageUsers from './pages/ManageUsers';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Tickets from './pages/Tickets';

// Import Route & Layout Components
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import PublicRoute from './components/PublicRoute';
import Sidebar from './components/Sidebar';

// Logic-only component for location tracking
const LocationTracker = () => {
  useLocationTracker();
  return null;
};

// Layout component to manage the sidebar
const AppLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const publicPaths = ['/', '/login', '/signup', '/forgot-password'];
  const isPublicPage = publicPaths.includes(location.pathname);

  if (isPublicPage) {
    return children(null);
  }

  return (
    <div className="app-container">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="main-content-wrapper">
        {children(setIsSidebarOpen)}
      </div>
    </div>
  );
};

function App() {
  return (
    <>
      <Router>
        <LocationTracker />
        
        <AppLayout>
          {(setIsSidebarOpen) => (
            <Routes>
              {/* --- THIS IS THE CORRECTED SECTION --- */}
              {/* Public Routes - Only accessible when NOT logged in */}
              <Route element={<PublicRoute />}>
                <Route path="/" element={<Home />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              </Route>
              {/* ------------------------------------ */}

              {/* Protected Routes for All Logged-in Users */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard setIsSidebarOpen={setIsSidebarOpen} />} />
                <Route path="/manage-lights" element={<ManageLights setIsSidebarOpen={setIsSidebarOpen} />} />
                <Route path="/light/:id" element={<LightDetails setIsSidebarOpen={setIsSidebarOpen} />} />
                <Route path="/tasks" element={<Tasks setIsSidebarOpen={setIsSidebarOpen} />} />
                <Route path="/profile" element={<Profile setIsSidebarOpen={setIsSidebarOpen} />} />
              </Route>

              {/* Protected Routes for Admins Only */}
              <Route element={<AdminRoute />}>
                <Route path="/manage-users" element={<ManageUsers setIsSidebarOpen={setIsSidebarOpen} />} />
                <Route path="/tickets" element={<Tickets setIsSidebarOpen={setIsSidebarOpen} />} />
              </Route>

              {/* Catch-All 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          )}
        </AppLayout>
      </Router>
      <Toaster position="top-right" />
    </>
  );
}

export default App;
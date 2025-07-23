// src/App.jsx

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Import Page Components
import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import ManageLights from './pages/ManageLights';
import LightDetails from './pages/LightDetails';
import MyTasks from './pages/MyTasks';
import ManageUsers from './pages/ManageUsers';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Tickets from './pages/Tickets';

// Import Route & Layout Components
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Sidebar from './components/Sidebar';

// A new Layout component to wrap our application and manage the sidebar state.
// This prevents the sidebar from being shown on public pages like Login/Signup.
const AppLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Define which paths are considered "public" and should not show the sidebar/header.
  const publicPaths = ['/', '/login', '/signup', '/forgot-password'];
  const isPublicPage = publicPaths.includes(location.pathname);

  if (isPublicPage) {
    // For public pages, just render the content without any layout wrappers.
    return children(null); // Pass null because setIsSidebarOpen is not needed
  }

  // For protected pages, render the main layout structure.
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
        <AppLayout>
          {(setIsSidebarOpen) => (
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Protected Routes for All Logged-in Users */}
              <Route element={<ProtectedRoute />}>
                {/* Pass setIsSidebarOpen to every page that uses the Header component */}
                <Route path="/dashboard" element={<Dashboard setIsSidebarOpen={setIsSidebarOpen} />} />
                <Route path="/manage-lights" element={<ManageLights setIsSidebarOpen={setIsSidebarOpen} />} />
                <Route path="/light/:id" element={<LightDetails setIsSidebarOpen={setIsSidebarOpen} />} />
                <Route path="/my-tasks" element={<MyTasks setIsSidebarOpen={setIsSidebarOpen} />} />
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
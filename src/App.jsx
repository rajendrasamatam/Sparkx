// src/App.jsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Import all page components
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ManageLights from './pages/ManageLights'; // The new page
import LightDetails from './pages/LightDetails';
import NotFound from './pages/NotFound';

// Import utility components
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/manage-lights" element={<ProtectedRoute><ManageLights /></ProtectedRoute>} />
          <Route path="/light/:id" element={<ProtectedRoute><LightDetails /></ProtectedRoute>} />

          {/* Catch-All 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </>
  );
}

export default App;
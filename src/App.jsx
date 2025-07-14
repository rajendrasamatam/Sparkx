// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Streetlights from './pages/Streetlights'; 
import InstallPage from './pages/InstallPage'; // <-- 1. Import the new page

function App() {
  return (
    <> {/* Use a fragment to wrap Router and Toaster */}
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* 👇 2. Add the new PUBLIC installation route 👇 */}
          <Route path="/install/:lightId" element={<InstallPage />} />
          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} /> {/* <-- Add Profile Route */}
          {/* 👇 2. Add the new route for managing lights 👇 */}
          <Route path="/streetlights" element={<ProtectedRoute><Streetlights /></ProtectedRoute>} />

          {/* Catch-All 404 Route */}
          <Route path="*" element={<NotFound />} /> {/* <-- 2. Add this as the last route */}

        </Routes>
      </Router>
      <Toaster position="top-right" /> {/* <-- Add the Toaster component here */}
    </>
  );
}

export default App;
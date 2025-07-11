import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Welcome, {currentUser && currentUser.email}!</p>
      <p>This page is protected and can only be seen by logged-in users.</p>
      <button onClick={handleLogout}>Log Out</button>
    </div>
  );
};

export default Dashboard;
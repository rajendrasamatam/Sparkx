// src/components/Sidebar.jsx

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import styles from '../styles/Sidebar.module.css';
import { FiLogOut, FiUser, FiZap, FiGrid, FiCpu } from 'react-icons/fi'; // Added FiCpu icon
import toast from 'react-hot-toast';

const Sidebar = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
      toast.success('Logged out successfully!');
    } catch (error) {
      console.error('Failed to log out', error);
      toast.error('Failed to log out.');
    }
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.logo}>
        <FiZap />
        Sparkx
      </div>

      <NavLink to="/profile" className={({isActive}) => isActive ? `${styles.profile} ${styles.activeLink}` : styles.profile}>
        {currentUser?.photoURL ? (
          <img src={currentUser.photoURL} alt="Avatar" className={styles.profileAvatar} />
        ) : (
          <FiUser className={styles.profileIcon} />
        )}
        <div className={styles.profileInfo}>
          <span className={styles.profileName}>{currentUser?.displayName || 'Welcome'}</span>
          <span className={styles.profileEmail}>{currentUser?.email}</span>
        </div>
      </NavLink>
      
      <nav className={styles.nav}>
        <NavLink to="/dashboard" className={({isActive}) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}>
          <FiGrid />
          <span>Dashboard</span>
        </NavLink>
        {/* The New Link */}
        <NavLink to="/manage-lights" className={({isActive}) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}>
          <FiCpu />
          <span>Manage Lights</span>
        </NavLink>
        <NavLink to="/profile" className={({isActive}) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}>
          <FiUser />
          <span>My Profile</span>
        </NavLink>
      </nav>

      <button onClick={handleLogout} className={styles.logoutButton}>
        <FiLogOut />
        <span>Log Out</span>
      </button>
    </div>
  );
};

export default Sidebar;
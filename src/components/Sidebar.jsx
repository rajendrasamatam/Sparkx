// src/components/Sidebar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom'; // <-- Use NavLink for active styles
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import styles from '../styles/Sidebar.module.css';
import { FiLogOut, FiUser, FiZap, FiGrid } from 'react-icons/fi'; // <-- Add FiGrid for Dashboard icon

const Sidebar = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => { /* ... (same as before) */ };

  return (
    <div className={styles.sidebar}>
      <div className={styles.logo}>
        <FiZap />
        Sparkx
      </div>

      {/* Profile Section - Use NavLink to make it clickable */}
      <NavLink to="/profile" className={({isActive}) => isActive ? `${styles.profile} ${styles.activeLink}` : styles.profile}>
        <FiUser className={styles.profileIcon} />
        <div className={styles.profileInfo}>
          {/* Show display name if it exists, otherwise "Welcome" */}
          <span className={styles.profileName}>{currentUser?.displayName || 'Welcome'}</span>
          <span className={styles.profileEmail}>{currentUser?.email}</span>
        </div>
      </NavLink>
      
      {/* Navigation Links */}
      <nav className={styles.nav}>
        <NavLink to="/dashboard" className={({isActive}) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}>
          <FiGrid />
          <span>Dashboard</span>
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
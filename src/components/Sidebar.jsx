// src/components/Sidebar.jsx

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import styles from '../styles/Sidebar.module.css';
import { FiLogOut, FiUser, FiZap, FiGrid, FiCpu, FiUsers, FiTag, FiClipboard, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

// The component now accepts props to control its state
const Sidebar = ({ isOpen, setIsOpen }) => {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsOpen(false); // Close sidebar on logout
      navigate('/login');
      toast.success('Logged out successfully!');
    } catch (error) {
      console.error('Failed to log out', error);
      toast.error('Failed to log out.');
    }
  };

  // A helper to close the sidebar after clicking a link
  const closeSidebar = () => {
    if (window.innerWidth <= 1024) { // Only close on mobile-sized screens
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Overlay for mobile view to dim the background */}
      {isOpen && <div className={styles.overlay} onClick={() => setIsOpen(false)}></div>}
      
      <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <FiZap />
            Sparkx
          </div>
          <button className={styles.closeButton} onClick={() => setIsOpen(false)}>
            <FiX />
          </button>
        </div>

        <NavLink to="/profile" className={({isActive}) => isActive ? `${styles.profile} ${styles.activeLink}` : styles.profile} onClick={closeSidebar}>
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
          <NavLink to="/dashboard" className={({isActive}) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink} onClick={closeSidebar}>
            <FiGrid />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/my-tasks" className={({isActive}) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink} onClick={closeSidebar}>
            <FiClipboard />
            <span>My Tasks</span>
          </NavLink>
          <NavLink to="/manage-lights" className={({isActive}) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink} onClick={closeSidebar}>
            <FiCpu />
            <span>Manage Lights</span>
          </NavLink>
          <NavLink to="/profile" className={({isActive}) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink} onClick={closeSidebar}>
            <FiUser />
            <span>My Profile</span>
          </NavLink>
          {isAdmin && (
            <>
              <NavLink to="/manage-users" className={({isActive}) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink} onClick={closeSidebar}>
                <FiUsers />
                <span>Manage Users</span>
              </NavLink>
              <NavLink to="/tickets" className={({isActive}) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink} onClick={closeSidebar}>
                <FiTag />
                <span>All Tickets</span>
              </NavLink>
            </>
          )}
        </nav>

        <button onClick={handleLogout} className={styles.logoutButton}>
          <FiLogOut />
          <span>Log Out</span>
        </button>
      </div>
    </>
  );
};

export default Sidebar;
// src/components/Header.jsx

import React from 'react';
import styles from '../styles/Header.module.css';
import { FiBell, FiMenu } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

// The component now accepts the setIsSidebarOpen function as a prop
const Header = ({ title, subtitle, setIsSidebarOpen }) => {
  const { currentUser } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        {/* The hamburger menu button, visible only on mobile via CSS */}
        <button className={styles.menuButton} onClick={() => setIsSidebarOpen(true)}>
          <FiMenu />
        </button>
        <div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>
      <div className={styles.headerControls}>
        <div className={styles.notificationBell}>
          <FiBell />
        </div>
        <div className={styles.userProfile}>
          <img 
            src={currentUser?.photoURL || 'https://i.ibb.co/688dA2x/user-placeholder.png'} 
            alt="User Avatar" 
          />
          <span className={styles.userProfileName}>{currentUser?.displayName || currentUser?.email}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
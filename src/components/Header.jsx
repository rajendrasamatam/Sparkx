import React from 'react';
import styles from '../styles/Header.module.css';
import { FiBell } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Header = ({ title, subtitle }) => {
  const { currentUser } = useAuth();

  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
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
          <span>{currentUser?.displayName || currentUser?.email}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
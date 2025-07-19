import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Form.module.css';
import { FiAlertTriangle } from 'react-icons/fi';

const NotFound = () => {
  return (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
      <div className={styles.formContainer} style={{ textAlign: 'center' }}>
        <FiAlertTriangle size={60} color="#f59e0b" />
        <h1 className={styles.title} style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
          404 - Page Not Found
        </h1>
        <p style={{ color: '#4b5563', marginBottom: '2rem' }}>
          Sorry, the page you are looking for does not exist.
        </p>
        <Link to="/dashboard" className={styles.button}>
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};
export default NotFound;
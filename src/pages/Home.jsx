// src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
// We'll borrow some styles from our form container for a consistent look
import styles from '../styles/Form.module.css'; 

const Home = () => {
  return (
    <div className={styles.formContainer}>
      <h1 className={styles.title}>Welcome to Sparkx</h1>
      <p style={{ color: '#4b5563', marginBottom: '2rem' }}>
        This is a demo project showcasing authentication with React and Firebase.
      </p>
      <nav style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link to="/signup" className={styles.button}>Sign Up</Link>
        <Link to="/login" className={styles.button} style={{backgroundColor: '#4b5563'}}>Log In</Link>
      </nav>
    </div>
  );
};

export default Home;
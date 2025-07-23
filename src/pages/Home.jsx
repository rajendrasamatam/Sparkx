import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Form.module.css'; 
import { FiZap } from 'react-icons/fi';

const Home = () => {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.formContainer}>
        <div className={styles.iconWrapper}>
          <FiZap size={28} />
        </div>
        <h1 className={styles.title}>Welcome to Sparkx</h1>
        <p className={styles.subtitle}>
          The central hub for managing your entire streetlight network with ease.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
          <Link to="/signup" className={styles.button}>Get Started</Link>
          <Link to="/login" className={styles.button} style={{backgroundColor: '#374151'}}>Log In</Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
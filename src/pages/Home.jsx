import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Form.module.css'; 
import { FiZap } from 'react-icons/fi';

const Home = () => {
  return (
    <div className={styles.formContainer}>
      <FiZap size={48} color="var(--primary-color)" />
      <h1 className={styles.title} style={{marginTop: '1.5rem'}}>Welcome to Sparkx</h1>
      <p style={{ color: '#4b5563', marginBottom: '2rem', maxWidth: '300px', margin: '0 auto 2rem auto' }}>
        The central control system for monitoring and managing your entire streetlight network.
      </p>
      <nav style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link to="/signup" className={styles.button}>Get Started</Link>
        <Link to="/login" className={styles.button} style={{backgroundColor: '#4b5563'}}>Log In</Link>
      </nav>
    </div>
  );
};
export default Home;

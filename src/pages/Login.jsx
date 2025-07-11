// src/pages/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import styles from '../styles/Form.module.css'; // Import the styles

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError("Failed to log in. Please check your email and password.");
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.title}>Log In to Your Account</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Email Address"
          className={styles.input}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Password"
          className={styles.input}
        />
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.button}>Log In</button>
      </form>
       <p className={styles.redirect}>
        <Link to="/forgot-password">Forgot Password?</Link>
      </p>
      <p className={styles.redirect}>
        Need an account? <Link to="/signup">Sign Up</Link>
      </p>
    </div>
  );
};

export default Login;
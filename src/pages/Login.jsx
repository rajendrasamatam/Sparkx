// src/pages/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth'; // <-- Import persistence functions
import { auth } from '../firebase';
import styles from '../styles/Form.module.css';
import toast from 'react-hot-toast'; // Import toast for better feedback

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true); // <-- State for checkbox, default to true
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Set persistence based on the checkbox
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);

      await signInWithEmailAndPassword(auth, email, password);
      // No need for a toast here, successful login is obvious by redirection
      navigate('/dashboard');
    } catch (err) {
      toast.error("Failed to log in. Please check your credentials.");
      console.error(err);
    } finally {
      setLoading(false);
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

        {/* Remember Me Checkbox */}
        <div className={styles.extraOptions}>
          <label>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Remember Me
          </label>
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? 'Logging In...' : 'Log In'}
        </button>
      </form>
      <p className={styles.redirect}>
        Need an account? <Link to="/signup">Sign Up</Link>
      </p>
    </div>
  );
};

export default Login;
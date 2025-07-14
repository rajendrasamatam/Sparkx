// src/pages/Login.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  setPersistence, 
  browserLocalPersistence, // Remembers user after browser is closed
  browserSessionPersistence,
  GoogleAuthProvider, // <-- Import Google provider
  signInWithPopup,   // Forgets user when browser is closed
} from 'firebase/auth';
import { auth } from '../firebase';
import styles from '../styles/Form.module.css';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc'; // <-- Google Icon

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true); // Default to "Remember Me"
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Determine which persistence level to use
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      // 2. Set the persistence for the auth instance
      await setPersistence(auth, persistence);
      // 3. Proceed with the sign-in attempt
      await signInWithEmailAndPassword(auth, email, password);      
      // On success, navigate to the dashboard. No toast needed here.
      navigate('/dashboard');

    } catch (err) {
      // On failure, show an error message
      toast.error("Login failed. Please check your email and password.");
      console.error("Login error:", err);
    } finally {
      // 4. Always stop the loading indicator
      setLoading(false);
    }
  };

    const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success("Signed in with Google successfully!");
      navigate('/dashboard');
    } catch (error) {
      toast.error("Failed to sign in with Google.");
      console.error("Google sign-in error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.title}>Log In to Your Account</h2>
      {/* Google Sign-in Button */}
      <button onClick={handleGoogleSignIn} className={`${styles.button} ${styles.googleButton}`} disabled={loading}>
        <FcGoogle size={22} />
        <span>Continue with Google</span>
      </button>

      <div className={styles.divider}>
        <span>OR</span>
      </div>
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
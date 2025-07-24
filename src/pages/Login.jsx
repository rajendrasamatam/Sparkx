// src/pages/Login.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { setDoc, doc, getDoc, GeoPoint } from 'firebase/firestore'; // Import GeoPoint
import { auth, db } from '../firebase';
import styles from '../styles/Form.module.css';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { FiZap } from 'react-icons/fi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- THIS IS THE UPDATED FUNCTION ---
  // Helper function to create user doc if it doesn't exist
  const createUserDocument = async (user) => {
    const userDocRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        role: 'lineman',
        // FIX: Add the missing fields with default values
        lastKnownLocation: new GeoPoint(0, 0),
        availability: 'inactive'
      });
    }
  };
  // ------------------------------------

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      toast.error("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In logic remains the same, as it calls the helper above
  const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      await createUserDocument(result.user);
      toast.success("Signed in with Google successfully!");
      navigate('/dashboard');
    } catch (error) {
      toast.error("Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formContainer}>
        <div className={styles.iconWrapper}><FiZap size={28} /></div>
        <h2 className={styles.title}>Welcome Back!</h2>
        <p className={styles.subtitle}>Log in to access the control center.</p>
        <button onClick={handleGoogleSignIn} className={`${styles.button} ${styles.googleButton}`} disabled={loading}>
          <FcGoogle size={22} />
          <span>Continue with Google</span>
        </button>
        <div className={styles.divider}><span>OR</span></div>
        <form onSubmit={handleEmailSubmit} className={styles.form}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email Address" className={styles.input} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password" className={styles.input} />
          <div className={styles.extraOptions}>
            <label><input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /> Remember Me</label>
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
    </div>
  );
};
export default Login;
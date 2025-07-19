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
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import styles from '../styles/Form.module.css';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const createUserDocument = async (user) => {
    const userDocRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        role: 'lineman'
      });
    }
  };

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
    <div className={styles.formContainer}>
      <h2 className={styles.title}>Log In to Your Account</h2>
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
          {loading ? 'Logging In...' : 'Log In with Email'}
        </button>
      </form>
      <p className={styles.redirect}>
        Need an account? <Link to="/signup">Sign Up</Link>
      </p>
    </div>
  );
};
export default Login;
// src/pages/Signup.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { FcGoogle } from 'react-icons/fc';
import { FiZap } from 'react-icons/fi'; // <-- STYLE CHANGE: Import the brand icon
import styles from '../styles/Form.module.css';
import toast from 'react-hot-toast';

const Signup = () => {
  // --- All of your state and logic remains exactly the same ---
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const createUserDocument = async (user, displayNameOverride = null) => {
    const userDocRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        displayName: displayNameOverride || user.displayName,
        email: user.email,
        role: 'lineman',
      });
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      await createUserDocument(result.user);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to sign up with Google.');
    } finally {
      setLoading(false);
    }
  };

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'displayName':
        if (!value.trim()) error = 'Display Name is required.';
        break;
      case 'email':
        if (!value) error = 'Email is required.';
        else if (!/\S+@\S+\.\S+/.test(value)) error = 'Email address is invalid.';
        break;
      case 'password':
        if (!value) error = 'Password is required.';
        else if (value.length < 6) error = 'Password must be at least 6 characters.';
        break;
      case 'confirmPassword':
        if (value !== formData.password) error = 'Passwords do not match.';
        break;
      default:
        break;
    }
    setErrors((prevErrors) => ({ ...prevErrors, [name]: error }));
  };
  
  // A function to validate the whole form at once
  const validateForm = () => {
    // Manually trigger validation for all fields
    validateField('displayName', formData.displayName);
    validateField('email', formData.email);
    validateField('password', formData.password);
    validateField('confirmPassword', formData.confirmPassword);
    
    // Check if any error messages exist after validation
    return (
      !(!formData.displayName.trim()) &&
      !( !formData.email || !/\S+@\S+\.\S+/.test(formData.email) ) &&
      !( !formData.password || formData.password.length < 6 ) &&
      !( formData.password !== formData.confirmPassword )
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting.');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: formData.displayName });
      await createUserDocument(user, formData.displayName);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setErrors((prev) => ({ ...prev, email: 'This email is already registered.' }));
        toast.error('This email is already registered.');
      } else {
        toast.error('Failed to create an account.');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- JSX has been updated for the new styles ---
  return (
    <div className={styles.pageContainer}>
      <div className={styles.formContainer}>
        <div className={styles.iconWrapper}>
          <FiZap size={28} />
        </div>
        <h2 className={styles.title}>Create Your Account</h2>
        <p className={styles.subtitle}>Get started with the Sparkx platform.</p>

        <button
          onClick={handleGoogleSignIn}
          className={`${styles.button} ${styles.googleButton}`}
          disabled={loading}
        >
          <FcGoogle size={22} />
          <span>Sign Up with Google</span>
        </button>

        <div className={styles.divider}>
          <span>OR</span>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            name="displayName"
            type="text"
            value={formData.displayName}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Display Name"
            className={styles.input}
          />
          {errors.displayName && (
            <p className={styles.validationError}>{errors.displayName}</p>
          )}

          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Email Address"
            className={styles.input}
          />
          {errors.email && <p className={styles.validationError}>{errors.email}</p>}

          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Password (min. 6 characters)"
            className={styles.input}
          />
          {errors.password && (
            <p className={styles.validationError}>{errors.password}</p>
          )}

          <input
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Confirm Password"
            className={styles.input}
          />
          {errors.confirmPassword && (
            <p className={styles.validationError}>{errors.confirmPassword}</p>
          )}

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <p className={styles.redirect}>
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
// src/pages/ForgotPassword.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import styles from '../styles/Form.module.css';
import toast from 'react-hot-toast';
import { FiZap } from 'react-icons/fi';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
      setSent(true);
    } catch (err) {
      toast.error('Failed to send email. Please check the address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formContainer}>
        <div className={styles.iconWrapper}><FiZap size={28} /></div>
        <h2 className={styles.title}>Reset Your Password</h2>
        
        {sent ? (
          <p className={styles.subtitle}>Success! If an account exists for {email}, you will receive an email with reset instructions shortly.</p>
        ) : (
          <>
            <p className={styles.subtitle}>Enter your email and we'll send a link to get back into your account.</p>
            <form onSubmit={handleSubmit} className={styles.form}>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="Email Address" 
                className={styles.input}
              />
              <button type="submit" disabled={loading} className={styles.button}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}

        <p className={styles.redirect}>
          <Link to="/login">Back to Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
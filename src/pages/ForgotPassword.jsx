import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import styles from '../styles/Form.module.css';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent! Check your inbox.');
      setSent(true);
    } catch (err) {
      toast.error('Failed to send reset email. Please check the address.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.title}>Reset Password</h2>
      {sent ? (
        <p>A password reset link has been sent to your email address.</p>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <p style={{marginTop: 0, color: '#6b7280'}}>Enter your email address and we'll send you a link to reset your password.</p>
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
      )}
      <p className={styles.redirect}>
        <Link to="/login">Back to Log In</Link>
      </p>
    </div>
  );
};

export default ForgotPassword;
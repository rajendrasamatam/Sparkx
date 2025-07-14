// src/pages/Profile.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, updatePassword } from 'firebase/auth';
import Sidebar from '../components/Sidebar';
import styles from '../styles/Profile.module.css';
import toast from 'react-hot-toast';

const Profile = () => {
  const { currentUser } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (currentUser.displayName !== displayName) {
      try {
        await updateProfile(currentUser, { displayName });
        toast.success('Profile updated successfully!');
      } catch (error) {
        toast.error('Failed to update profile.');
        console.error(error);
      }
    } else {
        toast('No changes to display name detected.', { icon: 'ℹ️' });
    }
    setLoading(false);
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match.");
    }
    if (newPassword.length < 6) {
        return toast.error("Password should be at least 6 characters.");
    }

    setLoading(true);
    try {
      await updatePassword(currentUser, newPassword);
      toast.success('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Failed to update password. You may need to log out and log back in.');
      console.error(error);
    }
    setLoading(false);
  };


  return (
    <div className={styles.profilePage}>
      <Sidebar />
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1>My Profile</h1>
          <p>Manage your account settings and set your password.</p>
        </header>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Account Information</h2>
          <form onSubmit={handleProfileUpdate}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={currentUser?.email} disabled className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="displayName">Display Name</label>
              <input 
                id="displayName" 
                type="text" 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)} 
                placeholder="Your Name"
                className={styles.input}
              />
            </div>
            <button type="submit" disabled={loading} className={styles.button}>
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Change Password</h2>
          <form onSubmit={handlePasswordUpdate}>
            <div className={styles.formGroup}>
              <label htmlFor="newPassword">New Password</label>
              <input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Leave blank to keep the same" className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className={styles.input} />
            </div>
            <button type="submit" disabled={loading} className={styles.button}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Profile;
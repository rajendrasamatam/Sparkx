// src/pages/Profile.jsx

import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, updatePassword } from 'firebase/auth';
import { auth } from '../firebase';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import styles from '../styles/Profile.module.css'; // <-- FIX: Import the new, dedicated stylesheet
import toast from 'react-hot-toast';
import { FiCamera } from 'react-icons/fi';

const Profile = ({ setIsSidebarOpen }) => {
  const { currentUser } = useAuth();
  const fileInputRef = useRef(null);

  const imgbbApiKey = import.meta.env.VITE_IMGBB_API_KEY;

  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [photo, setPhoto] = useState(null);
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  // All handler functions are correct and remain the same
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoURL(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    const toastId = toast.loading('Updating profile...');
    try {
      let newPhotoURL = currentUser.photoURL;
      if (photo) {
        if (!imgbbApiKey) throw new Error("Image hosting service not configured.");
        const formData = new FormData();
        formData.append('image', photo);
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) {
          newPhotoURL = result.data.url;
        } else {
          throw new Error(result.error.message || 'Image upload failed.');
        }
      }
      await updateProfile(currentUser, { displayName, photoURL: newPhotoURL });
      toast.success('Profile updated successfully!', { id: toastId });
      setPhoto(null);
    } catch (error) {
      toast.error(error.message || 'Failed to update profile.', { id: toastId });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match.");
    if (newPassword.length > 0 && newPassword.length < 6) return toast.error("New password must be at least 6 characters.");
    if (!newPassword) return; // Do nothing if the field is empty
    
    setLoadingPassword(true);
    const toastId = toast.loading('Updating password...');
    try {
      await updatePassword(currentUser, newPassword);
      toast.success('Password updated successfully!', { id: toastId });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Failed to update. Please log out and log back in before trying again.', { id: toastId, duration: 6000 });
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Sidebar />
      <main className={styles.mainContent}>
        <Header 
          title="My Profile" 
          subtitle="Manage your account settings and profile picture."
          setIsSidebarOpen={setIsSidebarOpen}
        />

        {/* Use the dedicated responsive grid for the layout */}
        <div className={styles.profileGrid}>
          {/* --- Profile Information Card --- */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Profile Information</h2>
            <form onSubmit={handleProfileUpdate}>
              <div className={styles.avatarSection}>
                <img 
                  src={photoURL || 'https://i.ibb.co/688dA2x/user-placeholder.png'}
                  alt="Avatar" 
                  className={styles.avatar}
                />
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange} 
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                />
                <button 
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => fileInputRef.current.click()}
                >
                  <FiCamera /> Change Photo
                </button>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <input id="email" type="text" value={currentUser?.email} disabled className={styles.input} />
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
              <button type="submit" disabled={loadingProfile} className={styles.primaryButton}>
                {loadingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
          
          {/* --- Change Password Card --- */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Change Password</h2>
            <form onSubmit={handlePasswordUpdate}>
              <div className={styles.formGroup}>
                <label htmlFor="newPassword">New Password</label>
                <input 
                  id="newPassword" 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  placeholder="Leave blank to keep current password" 
                  className={styles.input} 
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input 
                  id="confirmPassword" 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  placeholder="Re-type new password" 
                  className={styles.input} 
                />
              </div>
              <button type="submit" disabled={loadingPassword} className={styles.primaryButton}>
                {loadingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
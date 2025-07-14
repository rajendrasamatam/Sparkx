// src/pages/Profile.jsx

import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, updatePassword } from 'firebase/auth';
import { storage } from '../firebase';
import Sidebar from '../components/Sidebar';
import styles from '../styles/Profile.module.css';
import toast from 'react-hot-toast';
import { FiCamera } from 'react-icons/fi';

const Profile = () => {
  const { currentUser } = useAuth();
  const fileInputRef = useRef(null);

    // Get the ImgBB API Key from our environment variables
  const imgbbApiKey = import.meta.env.VITE_IMGBB_API_KEY;

  // --- State Management ---
  // State for profile info
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [photo, setPhoto] = useState(null);
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL);
  
  // State for password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // General loading state
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);


  // --- Event Handlers ---

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoURL(URL.createObjectURL(file)); // Show a local preview instantly
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!imgbbApiKey) {
      toast.error("Image hosting service is not configured correctly.");
      return;
    }

    setLoadingProfile(true);
    const toastId = toast.loading('Updating profile...');

    try {
      let newPhotoURL = currentUser.photoURL;

      // THIS IS THE UPDATED BLOCK: Upload to ImgBB instead of Firebase Storage
      if (photo) {
        const formData = new FormData();
        formData.append('image', photo);
        
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        
        if (result.success) {
          newPhotoURL = result.data.url; // Get the URL from ImgBB's response
        } else {
          // If ImgBB fails, throw an error to be caught below
          throw new Error(result.error.message || 'Image upload failed.');
        }
      }

      // Update the user's profile in Firebase Auth with the new info
      await updateProfile(currentUser, { 
        displayName,
        photoURL: newPhotoURL,
      });

      toast.success('Profile updated successfully!', { id: toastId });
      setPhoto(null);
    } catch (error) {
      toast.error(error.message || 'Failed to update profile.', { id: toastId });
      console.error("Profile update error:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match.");
    }
    if (newPassword.length < 6) {
        return toast.error("New password must be at least 6 characters.");
    }

    setLoadingPassword(true);
    const toastId = toast.loading('Updating password...');
    try {
      await updatePassword(currentUser, newPassword);
      toast.success('Password updated successfully!', { id: toastId });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      // This error often means the user needs to re-authenticate for security reasons
      toast.error('Failed to update password. Please log out and log back in before trying again.', { id: toastId });
      console.error(error);
    } finally {
      setLoadingPassword(false);
    }
  };


  return (
    <div className={styles.profilePage}>
      <Sidebar />
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1>My Profile</h1>
          <p>Manage your account settings, profile picture, and password.</p>
        </header>

        {/* --- Profile Information Card --- */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Profile Information</h2>
          <form onSubmit={handleProfileUpdate}>
            <div className={styles.avatarSection}>
              <img 
                src={photoURL || 'https://i.stack.imgur.com/34AD2.jpg'}
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
                className={styles.uploadButton}
                onClick={() => fileInputRef.current.click()}
              >
                <FiCamera /> Change Photo
              </button>
            </div>
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
            <button type="submit" disabled={loadingProfile} className={styles.button}>
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
                placeholder="Must be at least 6 characters" 
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
            <button type="submit" disabled={loadingPassword} className={styles.button}>
              {loadingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

      </main>
    </div>
  );
};

export default Profile;
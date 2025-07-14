// src/pages/Signup.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { FcGoogle } from 'react-icons/fc';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import styles from '../styles/Form.module.css';
import toast from 'react-hot-toast';

const Signup = () => {
  const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success("Account created successfully!");
      navigate('/dashboard');
    } catch (error) {
      toast.error("Failed to sign in with Google.");
      console.error("Google sign-in error:", error);
    } finally {
      setLoading(false);
    }
};

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- Smarter Validation Logic ---
  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'displayName':
        if (!value) error = "Display Name is required.";
        break;
      case 'email':
        if (!value) {
          error = "Email is required.";
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          error = "Email address is invalid.";
        }
        break;
      case 'password':
        if (!value) {
          error = "Password is required.";
        } else if (value.length < 6) {
          error = "Password must be at least 6 characters.";
        }
        break;
      case 'confirmPassword':
        if (value !== formData.password) {
          error = "Passwords do not match.";
        }
        break;
      default:
        break;
    }
    // Update the errors state for the specific field
    setErrors(prevErrors => ({ ...prevErrors, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };
  
  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields on submit
    const newErrors = {};
    Object.keys(formData).forEach(key => {
        let error = '';
        const value = formData[key];
        // Re-run all validation logic here for the final check
        switch (key) {
            case 'displayName': if (!value) error = "Display Name is required."; break;
            case 'email': if (!value) error = "Email is required."; else if (!/\S+@\S+\.\S+/.test(value)) error = "Email address is invalid."; break;
            case 'password': if (!value) error = "Password is required."; else if (value.length < 6) error = "Password must be at least 6 characters."; break;
            case 'confirmPassword': if (value !== formData.password) error = "Passwords do not match."; break;
            default: break;
        }
        if (error) newErrors[key] = error;
    });

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the errors before submitting.");
      return;
    }
    
    setLoading(true);
    try {
      const { email, password, displayName } = formData;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      
      toast.success("Account created successfully!");
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setErrors(prev => ({...prev, email: "This email is already registered."}));
        toast.error("This email is already registered.");
      } else {
        toast.error("Failed to create an account.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.title}>Create an Account</h2>
      
      {/* Google Sign-in Button */}
      <button onClick={handleGoogleSignIn} className={`${styles.button} ${styles.googleButton}`} disabled={loading}>
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
        {errors.displayName && <p className={styles.validationError}>{errors.displayName}</p>}
        
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
        {errors.password && <p className={styles.validationError}>{errors.password}</p>}
        
        <input
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Confirm Password"
          className={styles.input}
        />
        {errors.confirmPassword && <p className={styles.validationError}>{errors.confirmPassword}</p>}
        
        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? 'Signing Up...' : 'Sign Up'}
        </button>
      </form>
      <p className={styles.redirect}>
        Already have an account? <Link to="/login">Log In</Link>
      </p>
    </div>
  );
};

export default Signup;
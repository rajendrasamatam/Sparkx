// src/pages/Signup.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { setDoc, doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase' // <-- FIX 1: Import BOTH auth and db
import { FcGoogle } from 'react-icons/fc'
import styles from '../styles/Form.module.css'
import toast from 'react-hot-toast'

const Signup = () => {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Helper function to create the user document in Firestore if it doesn't exist
  const createUserDocument = async (user, displayNameOverride = null) => {
    const userDocRef = doc(db, 'users', user.uid)
    const docSnap = await getDoc(userDocRef)

    // Only create the document if it's a new user
    if (!docSnap.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        displayName: displayNameOverride || user.displayName, // Use provided name or Google name
        email: user.email,
        role: 'lineman', // Default role for all new signups
      })
    }
  }

  // --- Google Sign-In (Now correctly creates a user document) ---
  const handleGoogleSignIn = async () => {
    setLoading(true)
    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      // FIX 4: Create user doc for Google sign-in user
      await createUserDocument(result.user)
      toast.success('Signed in with Google successfully!')
      navigate('/dashboard')
    } catch (error) {
      toast.error('Failed to sign in with Google.')
      console.error('Google sign-in error:', error)
    } finally {
      setLoading(false)
    }
  }

  // --- Live Validation Logic ---
  const validateField = (name, value) => {
    let error = ''
    switch (name) {
      case 'displayName':
        if (!value.trim()) error = 'Display Name is required.'
        break
      case 'email':
        if (!value) error = 'Email is required.'
        else if (!/\S+@\S+\.\S+/.test(value)) error = 'Email address is invalid.'
        break
      case 'password':
        if (!value) error = 'Password is required.'
        else if (value.length < 6)
          error = 'Password must be at least 6 characters.'
        break
      case 'confirmPassword':
        if (value !== formData.password) error = 'Passwords do not match.'
        break
      default:
        break
    }
    setErrors((prevErrors) => ({ ...prevErrors, [name]: error }))
    return error === '' // Return true if valid
  }

  // FIX 3: A function to validate the whole form at once
  const validateForm = () => {
    const { displayName, email, password, confirmPassword } = formData
    const isDisplayNameValid = validateField('displayName', displayName)
    const isEmailValid = validateField('email', email)
    const isPasswordValid = validateField('password', password)
    const isConfirmPasswordValid = validateField(
      'confirmPassword',
      confirmPassword,
    )
    return (
      isDisplayNameValid &&
      isEmailValid &&
      isPasswordValid &&
      isConfirmPasswordValid
    )
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prevData) => ({ ...prevData, [name]: value }))
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    validateField(name, value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Trigger validation for all fields on submit
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting.')
      return
    }

    setLoading(true)
    try {
      // FIX 2: Use formData.email and formData.password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      )
      const user = userCredential.user

      // Update their Auth profile with the display name
      await updateProfile(user, { displayName: formData.displayName })

      // Create their user document in Firestore
      await createUserDocument(user, formData.displayName)

      toast.success('Account created successfully!')
      navigate('/dashboard')
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setErrors((prev) => ({
          ...prev,
          email: 'This email is already registered.',
        }))
        toast.error('This email is already registered.')
      } else {
        toast.error('Failed to create an account.')
      }
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.title}>Create an Account</h2>

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
          {loading ? 'Signing Up...' : 'Sign Up'}
        </button>
      </form>
      <p className={styles.redirect}>
        Already have an account? <Link to="/login">Log In</Link>
      </p>
    </div>
  )
}

export default Signup
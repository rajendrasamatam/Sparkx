// src/context/AuthContext.jsx
import React, { useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This listener is triggered on sign-in, sign-out, and initial load
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false); // Set loading to false once we have the user status
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []); // Empty dependency array ensures this runs only once on mount

  const value = {
    currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Don't render the app until the auth status is confirmed */}
      {!loading && children}
    </AuthContext.Provider>
  );
}
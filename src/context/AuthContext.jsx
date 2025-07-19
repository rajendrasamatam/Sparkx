// src/context/AuthContext.jsx

import React, { useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase'; // Ensure 'db' is imported
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore'; // Ensure 'doc' and 'onSnapshot' are imported

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, user => {
      setCurrentUser(user);

      if (user) {
        // This is the critical part that fetches the role
        const userDocRef = doc(db, "users", user.uid);
        const unsubscribeRole = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            // It reads the 'role' field from the document
            setUserRole(doc.data().role);
          } else {
            console.error("User document not found in Firestore for UID:", user.uid);
            setUserRole(null);
          }
          setLoading(false);
        });
        return () => unsubscribeRole();
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // This is where the isAdmin flag is created
  const value = {
    currentUser,
    userRole,
    isAdmin: userRole === 'admin', // This must be a strict 'admin' check
    isLineman: userRole === 'lineman'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
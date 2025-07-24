import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc, GeoPoint } from 'firebase/firestore';

// Set the interval for location updates (e.g., every 3 minutes)
const LOCATION_UPDATE_INTERVAL = 3 * 60 * 1000;

const useLocationTracker = () => {
  const { currentUser, isLineman } = useAuth();
  const intervalIdRef = useRef(null); // Use a ref to hold the interval ID

  useEffect(() => {
    // This function gets the user's location and updates Firestore
    const updateLocation = () => {
      // Ensure we have a user before trying to get location
      if (!currentUser) return;

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const userDocRef = doc(db, 'users', currentUser.uid);
          
          try {
            // Update the user's document with the new GeoPoint
            await updateDoc(userDocRef, {
              lastKnownLocation: new GeoPoint(latitude, longitude)
            });
            console.log(`Location updated for user ${currentUser.uid}`);
          } catch (error) {
            console.error("Failed to update user location in Firestore:", error);
          }
        },
        (error) => {
          // This will be called if the user denies permission or GPS is unavailable
          console.warn("Could not get user location:", error.message);
        },
        // Options for higher accuracy
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    };

    // --- Main Logic to Start/Stop Tracking ---

    // Stop any existing timer before starting a new one
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
    }

    // Only start tracking if the logged-in user is a lineman
    if (isLineman) {
      console.log("Starting location tracking for lineman...");
      // Update location immediately on login
      updateLocation(); 
      // And then set up the interval to update periodically
      intervalIdRef.current = setInterval(updateLocation, LOCATION_UPDATE_INTERVAL);
    }

    // This is the effect's cleanup function. It runs when the component unmounts
    // or when the user logs out (because `isLineman` will become false).
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        console.log("Stopped location tracking.");
      }
    };
    
  }, [currentUser, isLineman]); // Rerun this effect if the user or their role changes
};

export default useLocationTracker;
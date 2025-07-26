// src/components/Header.jsx

import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/Header.module.css';
import { FiBell, FiMenu } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import NotificationPanel from './NotificationPanel'; // <-- Import the new component
import { db } from '../firebase';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';

const Header = ({ title, subtitle, setIsSidebarOpen }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const panelRef = useRef(null);

  // Listen for new tickets (faults) and resolved tickets
  useEffect(() => {
    if (!currentUser) return;

    const ticketsRef = collection(db, 'tickets');
    const q = query(
      ticketsRef, 
      where("createdAt", ">", Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))) // Only get tickets from the last 7 days
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lastSeenTimestamp = localStorage.getItem('lastSeenNotificationTimestamp') || 0;
      let newNotifications = [];
      let latestTimestamp = 0;

      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          const ticket = { ...change.doc.data(), id: change.doc.id };
          const timestamp = ticket.resolvedAt || ticket.createdAt;
          
          if (timestamp.toMillis() > latestTimestamp) {
            latestTimestamp = timestamp.toMillis();
          }

          // A notification is "new" if it was created/resolved after the last time the user checked.
          if (timestamp.toMillis() > lastSeenTimestamp) {
            // Determine notification type
            if (ticket.status === 'Open') {
              newNotifications.push({ ...ticket, type: 'fault', timestamp: ticket.createdAt });
            } else if (ticket.status === 'Resolved') {
              newNotifications.push({ ...ticket, type: 'resolved', timestamp: ticket.resolvedAt });
            }
          }
        }
      });

      if (newNotifications.length > 0) {
        setHasUnread(true);
      }
      
      // Fetch the full list for the panel display
      const allRecentTickets = snapshot.docs.map(doc => {
        const data = doc.data();
        const type = data.status === 'Open' ? 'fault' : data.status === 'Resolved' ? 'resolved' : null;
        const timestamp = data.resolvedAt || data.createdAt;
        return type ? { ...data, id: doc.id, type, timestamp } : null;
      }).filter(Boolean).sort((a,b) => b.timestamp - a.timestamp);
      
      setNotifications(allRecentTickets.slice(0, 10)); // Show latest 10
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Handle clicking outside the panel to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setIsPanelOpen(prev => !prev);
    if (hasUnread) {
      setHasUnread(false);
      localStorage.setItem('lastSeenNotificationTimestamp', Date.now().toString());
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <button className={styles.menuButton} onClick={() => setIsSidebarOpen(true)}>
          <FiMenu />
        </button>
        <div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>
      <div className={styles.headerControls}>
        <div className={styles.notificationBellWrapper} ref={panelRef}>
          <button className={styles.notificationBell} onClick={handleBellClick}>
            <FiBell />
            {hasUnread && <span className={styles.notificationDot}></span>}
          </button>
          {isPanelOpen && <NotificationPanel notifications={notifications} onClose={() => setIsPanelOpen(false)} />}
        </div>
        <div className={styles.userProfile}>
          <img 
            src={currentUser?.photoURL || 'https://i.ibb.co/688dA2x/user-placeholder.png'} 
            alt="User Avatar" 
          />
          <span className={styles.userProfileName}>{currentUser?.displayName || currentUser?.email}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
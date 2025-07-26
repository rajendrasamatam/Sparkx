// src/components/NotificationPanel.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Header.module.css'; // We'll add styles to Header.module.css
import { FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

const NotificationPanel = ({ notifications, onClose }) => {
  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return 'Just now';
    const date = timestamp.toDate();
    const diff = Math.round((new Date() - date) / 1000); // Difference in seconds

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={styles.notificationPanel}>
      <div className={styles.panelHeader}>
        <h3>Notifications</h3>
        <button onClick={onClose}>×</button>
      </div>
      <div className={styles.panelBody}>
        {notifications.length === 0 ? (
          <p className={styles.noNotifications}>You have no new notifications.</p>
        ) : (
          notifications.map(notif => (
            <Link to={`/light/${notif.lightDocId}`} key={notif.id} className={styles.notificationItem} onClick={onClose}>
              <div className={notif.type === 'fault' ? styles.faultIcon : styles.resolvedIcon}>
                {notif.type === 'fault' ? <FiAlertTriangle /> : <FiCheckCircle />}
              </div>
              <div className={styles.notificationContent}>
                <p className={styles.notificationText}>
                  <strong>{notif.lightId}</strong> has been marked as <strong>{notif.type === 'fault' ? 'Faulty' : 'Working'}</strong>.
                </p>
                <small className={styles.notificationTime}>{formatDate(notif.timestamp)}</small>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
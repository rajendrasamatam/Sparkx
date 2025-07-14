// src/pages/Dashboard.jsx
import React from 'react';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import styles from '../styles/Dashboard.module.css';

// Import icons for the cards
import { FiHardDrive, FiAlertTriangle, FiCheckCircle, FiMap } from 'react-icons/fi';

const Dashboard = () => {
  // Placeholder data. In a real app, this would come from Firebase.
  const stats = {
    totalLights: 1250,
    faultLights: 32,
    resolvedLights: 1218,
  };

  return (
    <div className={styles.dashboard}>
      <Sidebar />
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1>Dashboard Overview</h1>
          <p>Welcome back! Here's what's happening today.</p>
        </header>

        <div className={styles.cardsContainer}>
          <StatCard
            icon={<FiHardDrive />}
            title="Total Lights"
            count={stats.totalLights}
          />
          <StatCard
            icon={<FiAlertTriangle style={{ color: '#f59e0b' }} />}
            title="Fault Lights"
            count={stats.faultLights}
          />
          <StatCard
            icon={<FiCheckCircle style={{ color: '#10b981' }} />}
            title="Resolved Lights"
            count={stats.resolvedLights}
          />
        </div>

        <div className={styles.mapContainer}>
          <FiMap />
          <h2>Map View</h2>
          <p>The interactive map will be displayed in this area.</p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
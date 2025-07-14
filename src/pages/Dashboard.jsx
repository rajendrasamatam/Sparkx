// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import styles from '../styles/Dashboard.module.css';
import { db } from '../firebase'; // Import db
import { collection, onSnapshot } from 'firebase/firestore'; // Import firestore functions
import { FiHardDrive, FiAlertTriangle, FiCheckCircle, FiMap } from 'react-icons/fi';

const Dashboard = () => {
  // State to hold the dynamic stats
  const [stats, setStats] = useState({
    totalLights: 0,
    faultLights: 0,
    resolvedLights: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const lightsCollectionRef = collection(db, 'streetlights');
    
    // Listen for real-time data from the 'streetlights' collection
    const unsubscribe = onSnapshot(lightsCollectionRef, (snapshot) => {
      const lightsData = snapshot.docs.map(doc => doc.data());
      
      const total = lightsData.length;
      const faulty = lightsData.filter(light => light.status === 'faulty').length;
      
      setStats({
        totalLights: total,
        faultLights: faulty,
        resolvedLights: total - faulty, // Resolved is just total minus faulty
      });
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <div className={styles.dashboard}>
      <Sidebar />
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1>Dashboard Overview</h1>
          <p>Real-time status of all registered streetlights.</p>
        </header>

        <div className={styles.cardsContainer}>
          <StatCard
            icon={<FiHardDrive />}
            title="Total Lights"
            count={loading ? '...' : stats.totalLights}
          />
          <StatCard
            icon={<FiAlertTriangle style={{ color: '#f59e0b' }} />}
            title="Fault Lights"
            count={loading ? '...' : stats.faultLights}
          />
          <StatCard
            icon={<FiCheckCircle style={{ color: '#10b981' }} />}
            title="Resolved Lights"
            count={loading ? '...' : stats.resolvedLights}
          />
        </div>

        <div className={styles.mapContainer}>
          <FiMap />
          <h2>Map View</h2>
          <p>An interactive map could be integrated here in the future.</p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
// src/pages/LightDetails.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import { db, auth } from '../firebase';
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import styles from '../styles/LightDetails.module.css'; // <-- FIX: Import the new, dedicated stylesheet
import toast from 'react-hot-toast';

// --- LEAFLET MAP IMPORTS ---
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Reusable getMarkerIcon function (no changes)
const getMarkerIcon = (status) => {
  let color = '#6b7280';
  if (status === 'working') { color = '#10b981'; } 
  else if (status === 'faulty') { color = '#ef4444'; } 
  else if (status === 'under repair') { color = '#f59e0b'; }
  const markerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32px" height="32px"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>`;
  return divIcon({ className: '', html: `<div style="filter: drop-shadow(1px 3px 2px rgba(0,0,0,0.3));">${markerSvg}</div>`, iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });
};


const LightDetails = ({ setIsSidebarOpen }) => {
  const { id } = useParams();
  const [light, setLight] = useState(null);
  const [log, setLog] = useState([]);
  const [newLogEntry, setNewLogEntry] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // All logic functions remain the same
  useEffect(() => {
    const docRef = doc(db, "streetlights", id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setLight({ ...docSnap.data(), id: docSnap.id });
      } else {
        toast.error("Light not found!");
        setLight(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const logCollectionRef = collection(db, "streetlights", id, "log");
    const q = query(logCollectionRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLog(snapshot.docs.map(doc => ({...doc.data(), id: doc.id})));
    });
    return () => unsubscribe();
  }, [id]);

  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!newLogEntry.trim()) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "streetlights", id, "log"), {
        text: newLogEntry,
        author: auth.currentUser.displayName || auth.currentUser.email,
        createdAt: Timestamp.now(),
      });
      setNewLogEntry('');
      toast.success("Log entry added!");
    } catch (error) {
      toast.error("Failed to add log entry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (timestamp) => timestamp?.toDate().toLocaleString() || 'N/A';

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar />
        <main className={styles.mainContent}>
          <Header title="Loading..." subtitle="Fetching light details..." setIsSidebarOpen={setIsSidebarOpen} />
          <p>Please wait...</p>
        </main>
      </div>
    );
  }

  if (!light) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar />
        <main className={styles.mainContent}>
          <Header title="Error" subtitle="Light not found" setIsSidebarOpen={setIsSidebarOpen} />
          <p>The requested streetlight could not be found in the database.</p>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Sidebar />
      <main className={styles.mainContent}>
        <Header 
            title={`Light ID: ${light.lightId}`} 
            subtitle="Detailed information and maintenance history." 
            setIsSidebarOpen={setIsSidebarOpen}
        />
        <div className={styles.detailsGrid}>
          <div className={styles.leftColumn}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Details</h2>
              <dl className={styles.detailsList}>
                <dt>Status</dt>
                <dd><StatusBadge status={light.status} /></dd>
                <dt>Installed On</dt>
                <dd>{formatDate(light.installedAt)}</dd>
                <dt>Coordinates</dt>
                <dd>{`${light.location.latitude.toFixed(5)}, ${light.location.longitude.toFixed(5)}`}</dd>
              </dl>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Maintenance Log</h2>
              <form onSubmit={handleAddLog} className={styles.logForm}>
                <textarea 
                  value={newLogEntry}
                  onChange={(e) => setNewLogEntry(e.target.value)}
                  placeholder="Add a new log entry... e.g., 'Replaced faulty bulb.'"
                  className={styles.logTextarea}
                  rows="3"
                ></textarea>
                <button type="submit" disabled={isSubmitting} className={styles.primaryButton}>
                  {isSubmitting ? 'Adding...' : 'Add Log'}
                </button>
              </form>
              <div className={styles.logList}>
                {log.length > 0 ? (
                  log.map(entry => (
                    <div key={entry.id} className={styles.logEntry}>
                      <p className={styles.logText}>{entry.text}</p>
                      <p className={styles.logMeta}>
                        by <strong>{entry.author}</strong> on {formatDate(entry.createdAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className={styles.emptyState}>No log entries yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className={styles.rightColumn}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Location</h2>
              <div className={styles.mapWrapper}>
                <MapContainer 
                  center={[light.location.latitude, light.location.longitude]} 
                  zoom={16} 
                  style={{height: '100%', width: '100%'}}
                  scrollWheelZoom={true} // <-- FIX: Scroll wheel zoom is now enabled
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker 
                    position={[light.location.latitude, light.location.longitude]}
                    icon={getMarkerIcon(light.status)}
                  >
                    <Popup>ID: {light.lightId}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LightDetails;
// src/pages/LightDetails.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import { db, auth } from '../firebase';
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import styles from '../styles/ManageLights.module.css'; // We can reuse these styles
import toast from 'react-hot-toast';

// --- LEAFLET MAP IMPORTS ---
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const getMarkerIcon = (status) => {
  let iconHtml = '', color = '#6b7280';
  if (status === 'working') { color = '#10b981'; iconHtml = `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" style="color: white; font-size: 14px;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>`; } 
  else if (status === 'faulty') { color = '#ef4444'; iconHtml = `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" style="color: white; font-size: 14px;"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"></path></svg>`; } 
  else if (status === 'under repair') { color = '#f59e0b'; iconHtml = `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" style="color: white; font-size: 14px;"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.4-2.4c.4-.4.4-1 0-1.4z"></path></svg>`; }
  const markerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32px" height="32px"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>`;
  const iconContainerHtml = `<div style="position: absolute; top: 5.5px; left: 50%; transform: translateX(-50%); width: 15px; height: 15px; background: ${color}; border-radius: 50%; display: flex; justify-content: center; align-items: center; box-shadow: 0 0 0 2px white;">${iconHtml}</div>`;
  return divIcon({ className: 'custom-marker-icon', html: `<div style="position: relative; filter: drop-shadow(1px 3px 2px rgba(0,0,0,0.3));">${markerSvg}${iconContainerHtml}</div>`, iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });
};

const LightDetails = () => {
  const { id } = useParams(); // Get the light's document ID from the URL
  const [light, setLight] = useState(null);
  const [log, setLog] = useState([]);
  const [newLogEntry, setNewLogEntry] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch the specific light's data
  useEffect(() => {
    const getLightData = async () => {
      setLoading(true);
      const docRef = doc(db, "streetlights", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setLight({ ...docSnap.data(), id: docSnap.id });
      } else {
        toast.error("Light not found!");
      }
      setLoading(false);
    };
    getLightData();
  }, [id]);

  // Fetch and listen for real-time updates to the maintenance log
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
    const logCollectionRef = collection(db, "streetlights", id, "log");
    try {
      await addDoc(logCollectionRef, {
        text: newLogEntry,
        author: auth.currentUser.displayName || auth.currentUser.email,
        createdAt: Timestamp.now(),
      });
      setNewLogEntry('');
      toast.success("Log entry added!");
    } catch (error) {
      toast.error("Failed to add log entry.");
      console.error(error);
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
          <p>Loading light details...</p>
        </main>
      </div>
    );
  }

  if (!light) {
    return (
      <div className={styles.pageContainer}>
        <Sidebar />
        <main className={styles.mainContent}>
          <h1>Light Not Found</h1>
          <p>The requested streetlight could not be found in the database.</p>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Sidebar />
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Light ID: {light.lightId}</h1>
            <p className={styles.pageSubtitle}>Detailed information and maintenance history.</p>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* --- Left Column: Details & Log --- */}
          <div>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Details</h2>
              <p><strong>Status:</strong> <StatusBadge status={light.status} /></p>
              <p><strong>Installed On:</strong> {formatDate(light.installedAt)}</p>
              <p><strong>Location:</strong> {`${light.location.latitude}, ${light.location.longitude}`}</p>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Maintenance Log</h2>
              <form onSubmit={handleAddLog} style={{ marginBottom: '1.5rem' }}>
                <textarea 
                  value={newLogEntry}
                  onChange={(e) => setNewLogEntry(e.target.value)}
                  placeholder="Add a new log entry... e.g., 'Replaced faulty bulb.'"
                  className={styles.input}
                  rows="3"
                  style={{ maxWidth: '100%', marginBottom: '1rem' }}
                ></textarea>
                <button type="submit" disabled={isSubmitting} className={styles.button}>
                  {isSubmitting ? 'Adding...' : 'Add Log'}
                </button>
              </form>
              <div>
                {log.length > 0 ? (
                  log.map(entry => (
                    <div key={entry.id} style={{ borderBottom: '1px solid #eee', padding: '1rem 0' }}>
                      <p style={{ margin: 0 }}>{entry.text}</p>
                      <small style={{ color: '#6b7280' }}>
                        by <strong>{entry.author}</strong> on {formatDate(entry.createdAt)}
                      </small>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#6b7280' }}>No log entries yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* --- Right Column: Map --- */}
          <div>
            <div className={styles.mapCard} style={{height: '400px', position: 'sticky', top: '2rem' }}>
              <MapContainer 
                center={[light.location.latitude, light.location.longitude]} 
                zoom={16} 
                className={styles.mapContainer} // Reuse map styles
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
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
      </main>
    </div>
  );
};

export default LightDetails;
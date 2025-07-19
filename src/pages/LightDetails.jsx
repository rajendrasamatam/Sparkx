import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import { db, auth } from '../firebase';
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import styles from '../styles/ManageLights.module.css'; // Use the better ManageLights styles
import toast from 'react-hot-toast';

// --- LEAFLET MAP IMPORTS ---
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Reusable getMarkerIcon function
const getMarkerIcon = (status) => {
  let color = '#6b7280';
  if (status === 'working') { color = '#10b981'; } 
  else if (status === 'faulty') { color = '#ef4444'; } 
  else if (status === 'under repair') { color = '#f59e0b'; }
  const markerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32px" height="32px"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>`;
  return divIcon({ className: '', html: `<div style="filter: drop-shadow(1px 3px 2px rgba(0,0,0,0.3));">${markerSvg}</div>`, iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });
};


const LightDetails = () => {
  const { id } = useParams();
  const [light, setLight] = useState(null);
  const [log, setLog] = useState([]);
  const [newLogEntry, setNewLogEntry] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (timestamp) => timestamp?.toDate().toLocaleString() || 'N/A';

  if (loading) {
    return <div className={styles.pageContainer}><Sidebar /><main className={styles.mainContent}><p>Loading light details...</p></main></div>;
  }

  if (!light) {
    return <div className={styles.pageContainer}><Sidebar /><main className={styles.mainContent}><h1>Light Not Found</h1></main></div>;
  }

  return (
    <div className={styles.pageContainer}>
      <Sidebar />
      <main className={styles.mainContent}>
        <header className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Light ID: {light.lightId}</h1>
            <p className={styles.pageSubtitle}>Detailed information and maintenance history.</p>
          </div>
          <Link to="/manage-lights" className={styles.primaryButton}>Back to List</Link>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'flex-start' }}>
          <div>
            <div className={styles.dataCard}>
              <h2 className={styles.cardTitle}>Details</h2>
              <p><strong>Status:</strong> <StatusBadge status={light.status} /></p>
              <p><strong>Installed On:</strong> {formatDate(light.installedAt)}</p>
              <p><strong>Coordinates:</strong> {`${light.location.latitude}, ${light.location.longitude}`}</p>
            </div>

            <div className={styles.dataCard}>
              <h2 className={styles.cardTitle}>Maintenance Log</h2>
              <form onSubmit={handleAddLog} style={{ marginBottom: '1.5rem' }}>
                <textarea 
                  value={newLogEntry}
                  onChange={(e) => setNewLogEntry(e.target.value)}
                  placeholder="Add a new log entry..."
                  className={styles.input}
                  rows="3"
                  style={{ width: '100%', marginBottom: '1rem' }}
                ></textarea>
                <button type="submit" disabled={isSubmitting} className={styles.primaryButton}>
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
                  <p className={styles.emptyState} style={{padding: '1rem 0'}}>No log entries yet.</p>
                )}
              </div>
            </div>
          </div>

          <div style={{ position: 'sticky', top: '2rem' }}>
            <div className={styles.dataCard}>
              <div style={{height: '300px', borderRadius: '8px', overflow: 'hidden'}}>
                <MapContainer 
                  center={[light.location.latitude, light.location.longitude]} 
                  zoom={16} 
                  style={{height: '100%', width: '100%'}}
                  scrollWheelZoom={false}
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
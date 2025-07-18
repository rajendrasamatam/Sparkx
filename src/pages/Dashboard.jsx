// src/pages/Dashboard.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import styles from '../styles/Dashboard.module.css';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { FiHardDrive, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

// --- LEAFLET & MAP CLUSTER IMPORTS ---
import { MapContainer, TileLayer, Marker, Popup, LayersControl, LayerGroup } from 'react-leaflet';
import { divIcon, latLngBounds } from 'leaflet';
import MarkerClusterGroup from '@changey/react-leaflet-markercluster';
import 'leaflet/dist/leaflet.css';
import '@changey/react-leaflet-markercluster/dist/styles.min.css';
// --- HELPER COMPONENTS AND FUNCTIONS ---

// 1. Custom hook to parse URL query parameters
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// 2. Helper to fetch address from coordinates using OpenCage API
async function getAddressFromCoords(lat, lng) {
  const apiKey = import.meta.env.VITE_OPENCAGE_API_KEY;
  if (!apiKey) return "Address service not configured.";
  try {
    const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}`);
    const data = await response.json();
    return data.results?.[0]?.formatted || "Address not found.";
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return "Could not fetch address.";
  }
}

// 3. A new component for the Popup content to handle the async address fetching
function LocationPopup({ light }) {
  const [address, setAddress] = useState("Loading address...");
  useEffect(() => {
    getAddressFromCoords(light.location.latitude, light.location.longitude)
      .then(setAddress);
  }, [light.location.latitude, light.location.longitude]);

  return (
    <>
      <strong>ID: {light.lightId}</strong><br/>
      Status: <StatusBadge status={light.status} /><br/>
      <hr style={{margin: '5px 0', border: '0', borderTop: '1px solid #eee'}} />
      Address: {address}
    </>
  );
}

// 4. The advanced marker icon function
const getMarkerIcon = (status) => {
  let iconHtml = '', color = '#6b7280';
  if (status === 'working') { color = '#10b981'; iconHtml = `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" style="color: white; font-size: 14px;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>`; } 
  else if (status === 'faulty') { color = '#ef4444'; iconHtml = `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" style="color: white; font-size: 14px;"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"></path></svg>`; } 
  else if (status === 'under repair') { color = '#f59e0b'; iconHtml = `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" style="color: white; font-size: 14px;"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.4-2.4c.4-.4.4-1 0-1.4z"></path></svg>`; }
  const markerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32px" height="32px"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>`;
  const iconContainerHtml = `<div style="position: absolute; top: 5.5px; left: 50%; transform: translateX(-50%); width: 15px; height: 15px; background: ${color}; border-radius: 50%; display: flex; justify-content: center; align-items: center; box-shadow: 0 0 0 2px white;">${iconHtml}</div>`;
  return divIcon({ className: 'custom-marker-icon', html: `<div style="position: relative; filter: drop-shadow(1px 3px 2px rgba(0,0,0,0.3));">${markerSvg}${iconContainerHtml}</div>`, iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });
};


const Dashboard = () => {
  const [lights, setLights] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null); // Ref to hold the map instance

  // This single useEffect now handles both data fetching and map bounding.
  useEffect(() => {
    const q = query(collection(db, 'streetlights'), orderBy('installedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lightsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setLights(lightsData);
      
      // Update stats
      setStats({
        totalLights: lightsData.length,
        faultLights: lightsData.filter(l => l.status === 'faulty').length,
        workingLights: lightsData.filter(l => l.status === 'working').length
      });
      setLoading(false);

      // --- SIMPLIFIED MAP BOUNDING LOGIC ---
      const map = mapRef.current;
      if (map && lightsData.length > 0) {
        // When data loads, fit all markers into the view.
        const bounds = latLngBounds(lightsData.map(l => [l.location.latitude, l.location.longitude]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
      // ------------------------------------
    });

    return () => unsubscribe();
  }, []); // Empty dependency array is correct.

  return (
    <div className={styles.dashboard}>
      <Sidebar />
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1>Dashboard Overview</h1>
          <p>Real-time geographic and statistical summary of the network.</p>
        </header>

        <div className={styles.cardsContainer}>
          <StatCard icon={<FiHardDrive />} title="Total Lights" count={loading ? '...' : stats.totalLights} />
          <StatCard icon={<FiAlertTriangle style={{ color: '#ef4444' }} />} title="Faulty Lights" count={loading ? '...' : stats.faultLights} />
          <StatCard icon={<FiCheckCircle style={{ color: '#10b981' }} />} title="Working Lights" count={loading ? '...' : stats.workingLights} />
        </div>

        <div className={styles.mapCard}>
          <div className={styles.mapContainer}>
            {loading ? <p className={styles.loadingText}>Loading Map & Data...</p> : (
              <MapContainer 
                center={[20.5937, 78.9629]} // Initial center, will be overridden
                zoom={5} 
                className={styles.leafletMap}
                scrollWheelZoom={true}
                ref={mapRef}
              >
                {/* The ChangeView component is no longer needed */}
                <LayersControl position="topright">
                  <LayersControl.BaseLayer checked name="Street Map">
                    <TileLayer
                      attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, Geocoding by <a href="https://opencagedata.com">OpenCage</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                  </LayersControl.BaseLayer>
                  <LayersControl.BaseLayer name="Satellite View">
                    <TileLayer
                      attribution='© Esri, Maxar, GeoEye'
                      url='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                    />
                  </LayersControl.BaseLayer>
                  <LayersControl.Overlay checked name="Streetlights">
                    <LayerGroup>
                      <MarkerClusterGroup>
                        {lights.map(light => (
                          <Marker 
                            key={light.id} 
                            position={[light.location.latitude, light.location.longitude]}
                            icon={getMarkerIcon(light.status)}
                          >
                            <Popup><LocationPopup light={light} /></Popup>
                          </Marker>
                        ))}
                      </MarkerClusterGroup>
                    </LayerGroup>
                  </LayersControl.Overlay>
                </LayersControl>
              </MapContainer>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
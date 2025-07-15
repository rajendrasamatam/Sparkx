// src/pages/ManageLights.jsx

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Modal from 'react-modal';
import { QrReader } from 'react-qr-reader';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, where, getDocs, Timestamp, orderBy, updateDoc  } from 'firebase/firestore';
import toast from 'react-hot-toast';
import pageStyles from '../styles/Profile.module.css';
import modalStyles from '../styles/ScannerModal.module.css';
import { FiTrash2, FiMapPin, FiCpu, FiCheckCircle,FiEdit } from 'react-icons/fi';
import StatusBadge from '../components/StatusBadge'; // <-- 1. Import the new component

// Note: The setAppElement is now in main.jsx, which is the correct place.

const ManageLights = () => {
  const [lights, setLights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [scannerStatus, setScannerStatus] = useState('Looking for QR code...');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentLight, setCurrentLight] = useState(null); // To hold the light being edited
  const [newStatus, setNewStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const lightsCollectionRef = collection(db, 'streetlights');

  useEffect(() => {
    setLoading(true);
    const q = query(lightsCollectionRef, orderBy('installedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lightsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setLights(lightsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

    const handleEditClick = (light) => {
    setCurrentLight(light);       // Store the whole light object
    setNewStatus(light.status);   // Set the initial status for the dropdown
    setIsEditModalOpen(true);     // Open the modal
  };

  // This runs when the user clicks "Save Changes" in the Edit Modal
  const handleUpdateLight = async (e) => {
    e.preventDefault();
    if (!currentLight) return;

    setIsUpdating(true);
    const toastId = toast.loading('Updating light status...');

    const lightDocRef = doc(db, 'streetlights', currentLight.id);
    try {
      await updateDoc(lightDocRef, {
        status: newStatus
      });
      toast.success('Status updated successfully!', { id: toastId });
      setIsEditModalOpen(false); // Close the modal on success
      setCurrentLight(null);
    } catch (error) {
      toast.error('Failed to update status.', { id: toastId });
      console.error("Update error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleScanResult = (result) => {
    if (result && result.text !== scanResult) {
      setScanResult(result.text);
      setScannerStatus(`QR Code Detected! ID: ${result.text}`);
      processScannedData(result.text);
    }
  };

  const processScannedData = async (lightId) => {
    setIsModalOpen(false);
    const toastId = toast.loading(`Processing ID: ${lightId}...`);

    try {
      const q = query(lightsCollectionRef, where("lightId", "==", lightId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return toast.error(`Error: Light ID ${lightId} is already registered.`, { id: toastId });
      }

      toast.loading('Getting GPS location...', { id: toastId });
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          toast.loading('Saving to database...', { id: toastId });
          await addDoc(lightsCollectionRef, {
            lightId: lightId,
            location: { latitude, longitude },
            status: 'working',
            installedAt: Timestamp.fromDate(new Date())
          });
          toast.success(`Success! Light ${lightId} registered.`, { id: toastId });
        },
        (geoError) => {
          toast.error('Could not get location. Enable GPS and permissions.', { id: toastId });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } catch (error) {
      toast.error('An error occurred during processing.', { id: toastId });
    }
  };

  const handleDeleteLight = async (id) => {
    if (window.confirm("Are you sure?")) {
      const toastId = toast.loading('Deleting light...');
      try {
        await deleteDoc(doc(db, 'streetlights', id));
        toast.success('Light deleted!', { id: toastId });
      } catch (error) {
        toast.error('Failed to delete light.', { id: toastId });
      }
    }
  };

  const openScanner = () => {
    setScanResult('');
    setScannerStatus('Looking for QR code...');
    setIsModalOpen(true);
  }

  const formatDate = (timestamp) => {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return 'N/A';
  }

  return (
    <div className={pageStyles.profilePage}>
      <Sidebar />
      <main className={pageStyles.mainContent}>
        <header className={pageStyles.header}>
            <h1>Manage Streetlights</h1>
            <p>Scan a new light to register it, or manage existing lights below.</p>
        </header>

        <div className={pageStyles.card}>
            <h2 className={pageStyles.cardTitle}>Register New Light</h2>
            <button className={pageStyles.button} onClick={openScanner}>
                Scan QR Code
            </button>
        </div>

        <Modal
            isOpen={isModalOpen}
            onRequestClose={() => setIsModalOpen(false)}
            className={modalStyles.modal}
            overlayClassName={modalStyles.overlay}
            contentLabel="QR Code Scanner"
        >
            <button onClick={() => setIsModalOpen(false)} className={modalStyles.closeButton}>×</button>
            <div className={modalStyles.scannerContainer}>
                <QrReader
                    onResult={handleScanResult}
                    constraints={{ facingMode: 'environment' }}
                    ViewFinder={() => <div className={modalStyles.viewfinder}></div>}
                />
                <p className={modalStyles.statusText}>{scannerStatus}</p>
            </div>
        </Modal>

      {/* --- THE NEW EDIT MODAL --- */}
      {currentLight && (
        <Modal
          isOpen={isEditModalOpen}
          onRequestClose={() => setIsEditModalOpen(false)}
          className={modalStyles.modal}
          overlayClassName={modalStyles.overlay}
          contentLabel="Edit Streetlight"
        >
          <button onClick={() => setIsEditModalOpen(false)} className={modalStyles.closeButton}>×</button>
          <h2 className={pageStyles.cardTitle}>Edit Light: {currentLight.lightId}</h2>
          
          <form onSubmit={handleUpdateLight}>
            <div className={pageStyles.formGroup}>
              <label htmlFor="lightId">Light ID</label>
              <input id="lightId" type="text" value={currentLight.lightId} disabled className={pageStyles.input} />
            </div>

            <div className={pageStyles.formGroup}>
              <label htmlFor="status">Status</label>
              <select 
                id="status" 
                value={newStatus} 
                onChange={(e) => setNewStatus(e.target.value)}
                className={pageStyles.input} // We can reuse the input style
              >
                <option value="working">Working</option>
                <option value="faulty">Faulty</option>
                <option value="under repair">Under Repair</option>
              </select>
            </div>

            <button type="submit" disabled={isUpdating} className={pageStyles.button}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </Modal>
      )}

        <div className={pageStyles.card}>
            <h2 className={pageStyles.cardTitle}>Registered Lights ({lights.length})</h2>
            {loading ? <p>Loading...</p> : (
            <div style={{overflowX: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                  <thead>
                    <tr style={{borderBottom: '1px solid var(--border-color)'}}>
                        <th style={{textAlign: 'left', padding: '0.75rem'}}><FiCpu/> ID</th>
                        <th style={{textAlign: 'left', padding: '0.75rem'}}><FiMapPin/> Location</th>
                        <th style={{textAlign: 'left', padding: '0.75rem'}}><FiCheckCircle/> Status</th>
                        <th style={{textAlign: 'left', padding: '0.75rem'}}>Installed On</th>
                        <th style={{textAlign: 'right', padding: '0.75rem'}}>Actions</th>
                    </tr>
                  </thead>
                    <tbody>
                    {/* Check if there are no lights AND it's not in a loading state */}
                    {lights.length === 0 && !loading ? (
                        <tr>
                        {/* ColSpan="5" makes this single cell span all 5 columns of our table */}
                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                            No lights have been registered yet. <br />
                            Click "Scan QR Code" to add the first one.
                        </td>
                        </tr>
                    ) : (
                        // If there are lights, map over them and display them as before
                        lights.map(light => (
                        <tr key={light.id} style={{borderBottom: '1px solid var(--border-color)'}}>
                            <td style={{padding: '0.75rem', fontWeight: 'bold'}}>{light.lightId}</td>
                            <td style={{padding: '0.75rem'}}>{light.location.latitude.toFixed(4)}, {light.location.longitude.toFixed(4)}</td>
                            <td style={{padding: '0.75rem'}}><StatusBadge status={light.status} /></td>
                            <td style={{padding: '0.75rem'}}>{formatDate(light.installedAt)}</td>
                            <td style={{textAlign: 'right', padding: '0.75rem'}}>
                            <button 
                                onClick={() => handleEditClick(light)}
                                style={{background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontSize: '1.25rem', marginRight: '0.5rem'}}
                            >
                                <FiEdit />
                            </button>
                            <button onClick={() => handleDeleteLight(light.id)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1.25rem'}}>
                                <FiTrash2 />
                            </button>
                            </td>
                        </tr>
                        ))
                    )}
                    </tbody>
              </table>
            </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default ManageLights;
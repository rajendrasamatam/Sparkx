// src/pages/ManageLights.jsx

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Modal from 'react-modal';
import { Html5QrcodeScanner } from 'html5-qrcode'; // <-- Import the new scanner
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, where, getDocs, Timestamp, orderBy, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import pageStyles from '../styles/Profile.module.css';
import modalStyles from '../styles/ScannerModal.module.css';
import { FiTrash2, FiMapPin, FiCpu, FiCheckCircle, FiEdit } from 'react-icons/fi';
import StatusBadge from '../components/StatusBadge';

// --- A new, dedicated scanner component ---
function QrScannerComponent({ onScanSuccess, onScanError }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader", // The ID of the div to render the scanner in
      {
        qrbox: { width: 250, height: 250 }, // The viewfinder box size
        fps: 10, // Frames per second to scan
      },
      false // verbose = false
    );

    scanner.render(onScanSuccess, onScanError);

    // Cleanup function to stop the scanner when the component unmounts
    return () => {
      scanner.clear().catch(error => {
        console.error("Failed to clear html5-qrcode scanner.", error);
      });
    };
  }, []);

  return <div id="qr-reader" style={{ width: '100%' }}></div>;
}


const ManageLights = () => {
  const [lights, setLights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  
  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentLight, setCurrentLight] = useState(null);
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

  const onScanSuccess = async (decodedText, decodedResult) => {
    setIsScannerModalOpen(false); // Close the modal on successful scan
    const lightId = decodedText;
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
          await addDoc(lightsCollectionRef, { lightId, location: { latitude, longitude }, status: 'working', installedAt: Timestamp.fromDate(new Date()) });
          toast.success(`Success! Light ${lightId} registered.`, { id: toastId });
        },
        (geoError) => { toast.error('Could not get location. Enable GPS and permissions.', { id: toastId }); },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } catch (error) {
      toast.error('An error occurred during processing.', { id: toastId });
    }
  };

  const onScanError = (errorMessage) => {
    // This can be noisy, so we often leave it empty or log selectively
    // console.warn(`QR_SCAN_ERROR: ${errorMessage}`);
  };

  const handleEditClick = (light) => {
    setCurrentLight(light);
    setNewStatus(light.status);
    setIsEditModalOpen(true);
  };

  const handleUpdateLight = async (e) => {
    e.preventDefault();
    if (!currentLight) return;
    setIsUpdating(true);
    const toastId = toast.loading('Updating light status...');
    const lightDocRef = doc(db, 'streetlights', currentLight.id);
    try {
      await updateDoc(lightDocRef, { status: newStatus });
      toast.success('Status updated successfully!', { id: toastId });
      setIsEditModalOpen(false);
      setCurrentLight(null);
    } catch (error) {
      toast.error('Failed to update status.', { id: toastId });
    } finally {
      setIsUpdating(false);
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

  const formatDate = (timestamp) => timestamp?.toDate().toLocaleDateString() || 'N/A';

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
          <button className={pageStyles.button} onClick={() => setIsScannerModalOpen(true)}>
            Scan QR Code
          </button>
        </div>

        {/* --- QR Scanner Modal (using new library) --- */}
        <Modal
          isOpen={isScannerModalOpen}
          onRequestClose={() => setIsScannerModalOpen(false)}
          className={modalStyles.modal}
          overlayClassName={modalStyles.overlay}
          contentLabel="QR Code Scanner"
        >
          <button onClick={() => setIsScannerModalOpen(false)} className={modalStyles.closeButton}>×</button>
          <h2 style={{textAlign: 'center', marginTop: 0}}>Scan QR Code</h2>
          {isScannerModalOpen && <QrScannerComponent onScanSuccess={onScanSuccess} onScanError={onScanError} />}
        </Modal>

        {/* --- Edit Modal (no change) --- */}
        {currentLight && (
          <Modal isOpen={isEditModalOpen} onRequestClose={() => setIsEditModalOpen(false)} className={modalStyles.modal} overlayClassName={modalStyles.overlay} contentLabel="Edit Streetlight">
            <button onClick={() => setIsEditModalOpen(false)} className={modalStyles.closeButton}>×</button>
            <h2 className={pageStyles.cardTitle}>Edit Light: {currentLight.lightId}</h2>
            <form onSubmit={handleUpdateLight}>
              <div className={pageStyles.formGroup}><label htmlFor="lightId">Light ID</label><input id="lightId" type="text" value={currentLight.lightId} disabled className={pageStyles.input} /></div>
              <div className={pageStyles.formGroup}><label htmlFor="status">Status</label><select id="status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className={pageStyles.input}><option value="working">Working</option><option value="faulty">Faulty</option><option value="under repair">Under Repair</option></select></div>
              <button type="submit" disabled={isUpdating} className={pageStyles.button}>{isUpdating ? 'Saving...' : 'Save Changes'}</button>
            </form>
          </Modal>
        )}

        {/* --- List of Registered Lights (no change) --- */}
        <div className={pageStyles.card}>
          <h2 className={pageStyles.cardTitle}>Registered Lights ({lights.length})</h2>
          {loading ? <p>Loading...</p> : (<div style={{overflowX: 'auto'}}><table style={{width: '100%', borderCollapse: 'collapse'}}><thead><tr style={{borderBottom: '1px solid var(--border-color)'}}><th style={{textAlign: 'left', padding: '0.75rem'}}><FiCpu/> ID</th><th style={{textAlign: 'left', padding: '0.75rem'}}><FiMapPin/> Location</th><th style={{textAlign: 'left', padding: '0.75rem'}}><FiCheckCircle/> Status</th><th style={{textAlign: 'left', padding: '0.75rem'}}>Installed On</th><th style={{textAlign: 'right', padding: '0.75rem'}}>Actions</th></tr></thead><tbody>
          {lights.length === 0 && !loading ? (<tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>No lights have been registered yet. <br/>Click "Scan QR Code" to add the first one.</td></tr>) : (lights.map(light => (<tr key={light.id} style={{borderBottom: '1px solid var(--border-color)'}}><td style={{padding: '0.75rem', fontWeight: 'bold'}}>{light.lightId}</td><td style={{padding: '0.75rem'}}>{light.location.latitude.toFixed(4)}, {light.location.longitude.toFixed(4)}</td><td style={{padding: '0.75rem'}}><StatusBadge status={light.status} /></td><td style={{padding: '0.75rem'}}>{formatDate(light.installedAt)}</td><td style={{textAlign: 'right', padding: '0.75rem'}}><button onClick={() => handleEditClick(light)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontSize: '1.25rem', marginRight: '0.5rem'}}><FiEdit /></button><button onClick={() => handleDeleteLight(light.id)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1.25rem'}}><FiTrash2 /></button></td></tr>)))}
          </tbody></table></div>)}
        </div>
      </main>
    </div>
  );
};

export default ManageLights;
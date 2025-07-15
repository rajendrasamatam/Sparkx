// src/pages/ManageLights.jsx

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import Modal from 'react-modal';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy, updateDoc, where, getDocs, Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import styles from '../styles/ManageLights.module.css';
import { FiTrash2, FiEdit, FiCamera, FiXCircle, FiPlus } from 'react-icons/fi';
import StatusBadge from '../components/StatusBadge';

// QrScannerComponent remains the same
function QrScannerComponent({ onScanSuccess }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("qr-reader-element", { qrbox: { width: 250, height: 250 }, fps: 5 }, false);
    const handleSuccess = (decodedText) => {
      try { scanner.clear(); } catch (e) {}
      onScanSuccess(decodedText);
    };
    scanner.render(handleSuccess, (error) => {});
    return () => { try { scanner.clear(); } catch(e) {} };
  }, [onScanSuccess]);

  return <div id="qr-reader-element" className={styles.scannerContainer}></div>;
}

const ManageLights = () => {
  // Original States
  const [lights, setLights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentLight, setCurrentLight] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // --- NEW States for Search, Filter, and Pagination ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'working', 'faulty', etc.
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7; // Show 7 lights per page

  const lightsCollectionRef = collection(db, 'streetlights');

  useEffect(() => {
    const q = query(lightsCollectionRef, orderBy('installedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLights(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Filtering and Searching Logic ---
  const filteredLights = useMemo(() => {
    return lights
      .filter(light => {
        // Status filter logic
        if (statusFilter === 'all') return true;
        return light.status === statusFilter;
      })
      .filter(light => {
        // Search term logic (case-insensitive)
        return light.lightId.toLowerCase().includes(searchTerm.toLowerCase());
      });
  }, [lights, statusFilter, searchTerm]);

  // --- Pagination Logic ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLights.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLights.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // All other logic functions (onScanSuccess, handleEditClick, etc.) remain the same
  const onScanSuccess = async (lightId) => {
    setShowScanner(false);
    const toastId = toast.loading(`Processing ID: ${lightId}...`);
    try {
      const q = query(lightsCollectionRef, where("lightId", "==", lightId));
      if (!(await getDocs(q)).empty) {
        return toast.error(`Error: Light ID ${lightId} is already registered.`, { id: toastId });
      }
      toast.loading('Getting GPS location...', { id: toastId });
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          await addDoc(lightsCollectionRef, { lightId, location: { latitude, longitude }, status: 'working', installedAt: Timestamp.now() });
          toast.success(`Success! Light ${lightId} registered.`, { id: toastId });
        },
        () => toast.error('Could not get location. Enable GPS.', { id: toastId }),
        { enableHighAccuracy: true }
      );
    } catch (error) { toast.error('An error occurred.', { id: toastId }); }
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
    const toastId = toast.loading('Updating...');
    try {
      await updateDoc(doc(db, 'streetlights', currentLight.id), { status: newStatus });
      toast.success('Status updated!', { id: toastId });
      setIsEditModalOpen(false);
    } catch (error) { toast.error('Failed to update.', { id: toastId }); }
    finally { setIsUpdating(false); }
  };

  const handleDeleteLight = async (id) => {
    if (window.confirm("Are you sure?")) {
      const toastId = toast.loading('Deleting...');
      try {
        await deleteDoc(doc(db, 'streetlights', id));
        toast.success('Light deleted!', { id: toastId });
      } catch (error) { toast.error('Failed to delete.', { id: toastId }); }
    }
  };

  const formatDate = (timestamp) => timestamp?.toDate().toLocaleDateString() || 'N/A';

  return (
    <div className={styles.pageContainer}>
      <Sidebar />
      <main className={styles.mainContent}>
        <header className={styles.header}>
            <h1>Manage Streetlights</h1>
            <p>Scan, monitor, and manage the entire streetlight network.</p>
        </header>

        {/* --- Card for Registering New Lights --- */}
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className={styles.cardTitle} style={{ border: 'none', marginBottom: 0 }}>Register New Light</h2>
            <button className={styles.button} onClick={() => setShowScanner(prev => !prev)}>
              {showScanner ? <FiXCircle/> : <FiCamera/>}
              <span>{showScanner ? 'Close Scanner' : 'Open Scanner'}</span>
            </button>
          </div>
          {showScanner && (
            <div className={styles.scannerSection}>
              <p style={{ color: '#6b7280', marginTop: 0 }}>Point the camera at a valid QR Code.</p>
              <QrScannerComponent onScanSuccess={onScanSuccess} />
            </div>
          )}
        </div>

        {/* --- Edit Modal (No change needed here) --- */}
        {currentLight && ( <Modal isOpen={isEditModalOpen} onRequestClose={() => setIsEditModalOpen(false)} className={styles.modal} overlayClassName={styles.overlay}><button onClick={() => setIsEditModalOpen(false)} className={styles.closeButton}>×</button><h2 className={styles.cardTitle}>Edit Light: {currentLight.lightId}</h2><form onSubmit={handleUpdateLight}><div className={styles.formGroup}><label htmlFor="lightId">Light ID</label><input id="lightId" type="text" value={currentLight.lightId} disabled className={styles.input} /></div><div className={styles.formGroup}><label htmlFor="status">Status</label><select id="status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className={styles.input}><option value="working">Working</option><option value="faulty">Faulty</option><option value="under repair">Under Repair</option></select></div><button type="submit" disabled={isUpdating} className={styles.button}>{isUpdating ? 'Saving...' : 'Save Changes'}</button></form></Modal> )}
        
        {/* --- Data Table Card with New Controls --- */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Registered Lights ({filteredLights.length})</h2>
            <div className={styles.searchAndFilter}>
              <input 
                type="text" 
                placeholder="Search by ID..." 
                className={styles.searchInput}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className={styles.filterGroup}>
                <button onClick={() => setStatusFilter('all')} className={statusFilter === 'all' ? styles.active : ''}>All</button>
                <button onClick={() => setStatusFilter('working')} className={statusFilter === 'working' ? styles.active : ''}>Working</button>
                <button onClick={() => setStatusFilter('faulty')} className={statusFilter === 'faulty' ? styles.active : ''}>Faulty</button>
                <button onClick={() => setStatusFilter('under repair')} className={statusFilter === 'under repair' ? styles.active : ''}>Repairing</button>
              </div>
            </div>
          </div>
          <div className={styles.tableContainer}>
              <table className={styles.lightsTable}>
                  <thead><tr><th>ID</th><th>Location</th><th>Status</th><th>Installed On</th><th className={styles.actionsCell}>Actions</th></tr></thead>
                  <tbody>
                    {loading ? (<tr><td colSpan="5" className={styles.emptyState}>Loading...</td></tr>) : 
                     currentItems.length === 0 ? (<tr><td colSpan="5" className={styles.emptyState}>No lights match the current filter.</td></tr>) : 
                     (currentItems.map(light => (
                        <tr key={light.id}>
                            <td><strong>{light.lightId}</strong></td>
                            <td>{`${light.location.latitude.toFixed(4)}, ${light.location.longitude.toFixed(4)}`}</td>
                            <td><StatusBadge status={light.status} /></td>
                            <td>{formatDate(light.installedAt)}</td>
                            <td className={styles.actionsCell}>
                                <button onClick={() => handleEditClick(light)} className={`${styles.actionButton} ${styles.edit}`} title="Edit"><FiEdit /></button>
                                <button onClick={() => handleDeleteLight(light.id)} className={`${styles.actionButton} ${styles.delete}`} title="Delete"><FiTrash2 /></button>
                            </td>
                        </tr>
                     )))}
                  </tbody>
              </table>
            </div>
            {/* --- Pagination Controls --- */}
            {totalPages > 1 && (
              <div className={styles.paginationContainer}>
                <span>Page {currentPage} of {totalPages}</span>
                <div>
                  <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
                  <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} style={{marginLeft: '0.5rem'}}>Next</button>
                </div>
              </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default ManageLights;
// src/pages/Tickets.jsx

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Modal from 'react-modal';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, where, doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import styles from '../styles/ManageLights.module.css'; // Reuse styles
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Tickets = ({ setIsSidebarOpen }) => {
  const [tickets, setTickets] = useState([]);
  const [linemen, setLinemen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Open'); // 'Open', 'Assigned', 'Resolved'
  
  // State for the assignment modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [selectedLineman, setSelectedLineman] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch all tickets
  useEffect(() => {
    setLoading(true);
    const ticketsCollectionRef = collection(db, 'tickets');
    const q = query(ticketsCollectionRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTickets(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch all users with the 'lineman' role
  useEffect(() => {
    const usersCollectionRef = collection(db, 'users');
    const q = query(usersCollectionRef, where("role", "==", "lineman"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLinemen(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    return () => unsubscribe();
  }, []);

  const handleAssignClick = (ticket) => {
    setCurrentTicket(ticket);
    setIsModalOpen(true);
  };
  
  const handleAssignTicket = async (e) => {
    e.preventDefault();
    if (!selectedLineman || !currentTicket) return;

    setIsAssigning(true);
    const toastId = toast.loading('Assigning ticket...');
    const ticketDocRef = doc(db, 'tickets', currentTicket.id);
    const selectedLinemanData = linemen.find(l => l.uid === selectedLineman);

    try {
      await updateDoc(ticketDocRef, {
        status: 'Assigned',
        assignedTo_uid: selectedLinemanData.uid,
        assignedTo_name: selectedLinemanData.displayName,
      });
      toast.success(`Ticket assigned to ${selectedLinemanData.displayName}!`, { id: toastId });
      setIsModalOpen(false);
      setSelectedLineman('');
    } catch (error) {
      toast.error('Failed to assign ticket.', { id: toastId });
    } finally {
      setIsAssigning(false);
    }
  };
  
  const filteredTickets = tickets.filter(ticket => ticket.status === filter);
  const formatDate = (timestamp) => timestamp?.toDate().toLocaleString() || 'N/A';

  return (
    <div className={styles.pageContainer}>
      <Sidebar />
      <main className={styles.mainContent}>
        <Header title="Maintenance Tickets" subtitle="Assign and track all reported faults." setIsSidebarOpen={setIsSidebarOpen} />

        <div className={styles.dataCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>All Tickets ({filteredTickets.length})</h2>
            <div className={styles.filterGroup}>
              <button onClick={() => setFilter('Open')} className={filter === 'Open' ? styles.active : ''}>Open</button>
              <button onClick={() => setFilter('Assigned')} className={filter === 'Assigned' ? styles.active : ''}>Assigned</button>
              <button onClick={() => setFilter('Resolved')} className={filter === 'Resolved' ? styles.active : ''}>Resolved</button>
            </div>
          </div>
          <div className={styles.tableContainer}>
            <table className={styles.lightsTable}>
              <thead>
                <tr>
                  <th>Light ID</th>
                  <th>Status</th>
                  <th>Created On</th>
                  <th>Assigned To</th>
                  <th className={styles.actionsCell}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan="5" className={styles.emptyState}>Loading tickets...</td></tr>
                : filteredTickets.length === 0 ? <tr><td colSpan="5" className={styles.emptyState}>No {filter.toLowerCase()} tickets found.</td></tr>
                : filteredTickets.map(ticket => (
                    <tr key={ticket.id}>
                      <td><Link to={`/light/${ticket.lightDocId}`} className={styles.idLink}>{ticket.lightId}</Link></td>
                      <td>{ticket.status}</td>
                      <td>{formatDate(ticket.createdAt)}</td>
                      <td>{ticket.assignedTo_name || 'Unassigned'}</td>
                      <td className={styles.actionsCell}>
                        {ticket.status === 'Open' && (
                          <button className={styles.primaryButton} onClick={() => handleAssignClick(ticket)}>
                            Assign
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- Assign Ticket Modal --- */}
        {currentTicket && (
          <Modal
            isOpen={isModalOpen}
            onRequestClose={() => setIsModalOpen(false)}
            className={styles.modal}
            overlayClassName={styles.overlay}
            contentLabel="Assign Ticket"
          >
            <button onClick={() => setIsModalOpen(false)} className={styles.closeButton}>×</button>
            <h2 className={styles.modalTitle}>Assign Ticket for {currentTicket.lightId}</h2>
            <form onSubmit={handleAssignTicket}>
              <div className={styles.formGroup}>
                <label htmlFor="lineman">Select Lineman</label>
                <select 
                  id="lineman" 
                  value={selectedLineman} 
                  onChange={(e) => setSelectedLineman(e.target.value)}
                  className={styles.input}
                  required
                >
                  <option value="" disabled>Choose a lineman...</option>
                  {linemen.map(lineman => (
                    <option key={lineman.uid} value={lineman.uid}>{lineman.displayName} ({lineman.email})</option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={isAssigning} className={styles.primaryButton}>
                {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </form>
          </Modal>
        )}
      </main>
    </div>
  );
};

export default Tickets;
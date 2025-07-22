// src/pages/MyTasks.jsx

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, writeBatch, Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import styles from '../styles/ManageLights.module.css'; // Reuse styles for consistency
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { FiCheckCircle } from 'react-icons/fi';

const MyTasks = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isResolving, setIsResolving] = useState(null); // Track which task is being resolved

  // Fetch tickets assigned to the current user that are not yet resolved
  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    
    const ticketsCollectionRef = collection(db, 'tickets');
    const q = query(
      ticketsCollectionRef, 
      where("assignedTo_uid", "==", currentUser.uid),
      where("status", "==", "Assigned")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleResolveTask = async (task) => {
    if (!window.confirm(`Are you sure you want to resolve the task for light ${task.lightId}?`)) {
      return;
    }

    setIsResolving(task.id);
    const toastId = toast.loading('Resolving task...');

    // Use a batch write to update both documents atomically
    const batch = writeBatch(db);
    
    // 1. Reference to the ticket document
    const ticketDocRef = doc(db, 'tickets', task.id);
    batch.update(ticketDocRef, {
      status: 'Resolved',
      resolvedAt: Timestamp.now()
    });

    // 2. Reference to the streetlight document
    const lightDocRef = doc(db, 'streetlights', task.lightDocId);
    batch.update(lightDocRef, {
      status: 'working'
    });

    try {
      await batch.commit();
      toast.success(`Task for ${task.lightId} resolved!`, { id: toastId });
    } catch (error) {
      toast.error('Failed to resolve task.', { id: toastId });
      console.error("Resolve task error:", error);
    } finally {
      setIsResolving(null);
    }
  };

  const formatDate = (timestamp) => timestamp?.toDate().toLocaleString() || 'N/A';

  return (
    <div className={styles.pageContainer}>
      <Sidebar />
      <main className={styles.mainContent}>
        <Header title="My Assigned Tasks" subtitle="View and resolve maintenance tickets assigned to you." />

        <div className={styles.dataCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Open Tasks ({tasks.length})</h2>
          </div>
          <div>
            {loading ? <p className={styles.emptyState}>Loading tasks...</p>
            : tasks.length === 0 ? <p className={styles.emptyState}>You have no assigned tasks. Good job!</p>
            : (
                <div style={{padding: '0.5rem'}}>
                  {tasks.map(task => (
                    <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>
                          Light ID: <Link to={`/light/${task.lightDocId}`} className={styles.idLink}>{task.lightId}</Link>
                        </p>
                        <small style={{ color: '#6b7280' }}>
                          Reported on: {formatDate(task.createdAt)}
                        </small>
                      </div>
                      <button 
                        className={styles.primaryButton} 
                        onClick={() => handleResolveTask(task)}
                        disabled={isResolving === task.id}
                        style={{ backgroundColor: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        <FiCheckCircle />
                        {isResolving === task.id ? 'Resolving...' : 'Mark as Resolved'}
                      </button>
                    </div>
                  ))}
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyTasks;
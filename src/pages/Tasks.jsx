// src/pages/Tasks.jsx

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, writeBatch, Timestamp, runTransaction } from 'firebase/firestore';
import { getDistance } from 'geolib';
import toast from 'react-hot-toast';
import styles from '../styles/ManageLights.module.css';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { FiCheckCircle, FiNavigation } from 'react-icons/fi';

const SEARCH_RADIUS_METERS = 10000; // Increased to 10 km for better testing

const Tasks = ({ setIsSidebarOpen }) => {
  const { currentUser } = useAuth();
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [nearbyTasks, setNearbyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const assignedQuery = query(
      collection(db, 'tickets'), 
      where("assignedTo_uid", "==", currentUser.uid),
      where("status", "==", "Assigned")
    );
    const unsubscribeAssigned = onSnapshot(assignedQuery, (snapshot) => {
      if (isMounted) {
        setAssignedTasks(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      }
    });

    let unsubscribeOpen = () => {};

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isMounted) return;
        
        const { latitude, longitude } = position.coords;
        const linemanLocation = { latitude, longitude };
        
        const openQuery = query(collection(db, 'tickets'), where("status", "==", "Open"));
        unsubscribeOpen = onSnapshot(openQuery, (snapshot) => {
          const openTickets = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          
          const tasksWithDistance = openTickets.map(ticket => {
            const ticketLocationObject = { latitude: ticket.location.latitude, longitude: ticket.location.longitude };
            const distance = getDistance(linemanLocation, ticketLocationObject);
            return { ...ticket, distance };
          });
          
          const nearby = tasksWithDistance
            .filter(task => task.distance <= SEARCH_RADIUS_METERS)
            .sort((a, b) => a.distance - b.distance);
          
          if (isMounted) {
            setNearbyTasks(nearby);
            setError('');
          }
        });
        
        if(isMounted) setLoading(false);
      },
      (geoError) => {
        if (isMounted) {
          setError("Could not get your location. Please enable GPS to see available tasks.");
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribeAssigned();
      unsubscribeOpen();
    };
  }, [currentUser]);

  // --- THIS IS THE UPDATED FUNCTION ---
  const handleAcceptTask = async (task) => {
    if (!currentUser) return;
    setIsUpdating(task.id);
    const toastId = toast.loading(`Accepting task for ${task.lightId}...`);
    
    const ticketDocRef = doc(db, 'tickets', task.id);
    const lightDocRef = doc(db, 'streetlights', task.lightDocId); // Reference to the streetlight

    try {
      // Use a transaction to ensure the ticket is still "Open" before claiming it
      await runTransaction(db, async (transaction) => {
        const ticketDoc = await transaction.get(ticketDocRef);
        if (!ticketDoc.exists() || ticketDoc.data().status !== 'Open') {
          throw new Error("This ticket is no longer available.");
        }
        
        // Add both updates to the transaction
        transaction.update(ticketDocRef, {
          status: 'Assigned',
          assignedTo_uid: currentUser.uid,
          assignedTo_name: currentUser.displayName,
        });

        transaction.update(lightDocRef, {
          status: 'under repair' // <-- THE CRITICAL CHANGE
        });
      });
      toast.success(`Task ${task.lightId} is now assigned to you!`, { id: toastId });
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsUpdating(null);
    }
  };
  // ------------------------------------

  const handleResolveTask = async (task) => {
    if (!window.confirm(`Are you sure you want to resolve the task for ${task.lightId}?`)) return;
    setIsUpdating(task.id);
    const toastId = toast.loading('Resolving task...');
    const batch = writeBatch(db);
    batch.update(doc(db, 'tickets', task.id), { status: 'Resolved', resolvedAt: Timestamp.now() });
    batch.update(doc(db, 'streetlights', task.lightDocId), { status: 'working' });
    try {
      await batch.commit();
      toast.success(`Task for ${task.lightId} resolved!`, { id: toastId });
    } catch (error) {
      toast.error('Failed to resolve task.', { id: toastId });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleNavigate = (task) => {
    const { latitude, longitude } = task.location;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`, '_blank');
  };

  const formatDistance = (meters) => {
    if (meters < 1000) return `${meters} m away`;
    return `${(meters / 1000).toFixed(1)} km away`;
  };

  const TaskCard = ({ task, isAssigned }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
      <div>
        <p style={{ margin: 0, fontWeight: 'bold' }}>
          Light ID: <Link to={`/light/${task.lightDocId}`} className={styles.idLink}>{task.lightId}</Link>
        </p>
        <small style={{ color: '#6b7280' }}>
          {isAssigned ? `Reported on: ${task.createdAt?.toDate().toLocaleDateString()}` : formatDistance(task.distance)}
        </small>
      </div>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button className={styles.primaryButton} onClick={() => handleNavigate(task)} style={{ backgroundColor: '#4b5563' }} title="Get Directions">
          <FiNavigation />
        </button>
        {isAssigned ? (
          <button className={styles.primaryButton} onClick={() => handleResolveTask(task)} disabled={isUpdating === task.id} style={{ backgroundColor: '#10b981' }}>
            <FiCheckCircle />
            {isUpdating === task.id ? 'Resolving...' : 'Mark as Resolved'}
          </button>
        ) : (
          <button className={styles.primaryButton} onClick={() => handleAcceptTask(task)} disabled={isUpdating === task.id} style={{ backgroundColor: '#3b82f6' }}>
            {isUpdating === task.id ? 'Accepting...' : 'Accept Task'}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.pageContainer}>
      <Sidebar />
      <main className={styles.mainContent}>
        <Header title="Tasks" subtitle="Manage your assigned tasks and accept nearby work." setIsSidebarOpen={setIsSidebarOpen} />
        
        <div className={styles.dataCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>My Assigned Tasks ({assignedTasks.length})</h2>
          </div>
          <div>
            {loading ? <p className={styles.emptyState}>Loading...</p> :
             assignedTasks.length === 0 ? <p className={styles.emptyState}>You have no assigned tasks.</p> :
             (assignedTasks.map(task => <TaskCard key={task.id} task={task} isAssigned />))}
          </div>
        </div>

        <div className={styles.dataCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Nearby Available Tasks ({nearbyTasks.length})</h2>
          </div>
          <div>
            {error && <p className={styles.emptyState} style={{color: '#ef4444'}}>{error}</p>}
            {loading && !error && <p className={styles.emptyState}>Finding nearby tasks...</p>}
            {!loading && !error && nearbyTasks.length === 0 && <p className={styles.emptyState}>No open tasks found within {SEARCH_RADIUS_METERS / 1000}km of your current location.</p>}
            {!loading && !error && nearbyTasks.length > 0 && (
              nearbyTasks.map(task => <TaskCard key={task.id} task={task} />)
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Tasks;
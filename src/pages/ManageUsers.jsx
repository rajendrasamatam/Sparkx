import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import styles from '../styles/ManageLights.module.css';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const usersCollectionRef = collection(db, 'users');
    const q = query(usersCollectionRef, orderBy('displayName'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Exclude the current admin from the list to prevent self-demotion
      const usersData = snapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id }))
        .filter(user => user.uid !== auth.currentUser.uid);
      setUsers(usersData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    if (window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      const toastId = toast.loading('Updating role...');
      const userDocRef = doc(db, 'users', userId);
      try {
        await updateDoc(userDocRef, { role: newRole });
        toast.success('User role updated successfully!', { id: toastId });
      } catch (error) {
        toast.error('Failed to update role.', { id: toastId });
      }
    }
  };

  const filteredUsers = users.filter(user =>
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.pageContainer}>
      <Sidebar />
      <main className={styles.mainContent}>
        <Header title="Manage Users" subtitle="View all registered users and manage their roles." />
        <div className={styles.dataCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>All Users ({filteredUsers.length})</h2>
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              className={styles.searchInput}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className={styles.tableContainer}>
            <table className={styles.lightsTable}>
              <thead>
                <tr>
                  <th>Display Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th className={styles.actionsCell}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className={styles.emptyState}>Loading users...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan="4" className={styles.emptyState}>No users found.</td></tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td><strong>{user.displayName || 'N/A'}</strong></td>
                      <td>{user.email}</td>
                      <td style={{ textTransform: 'capitalize' }}>{user.role}</td>
                      <td className={styles.actionsCell}>
                        {user.role === 'lineman' && (
                          <button className={styles.primaryButton} onClick={() => handleRoleChange(user.id, 'admin')}>
                            Promote to Admin
                          </button>
                        )}
                        {user.role === 'admin' && (
                           <button className={styles.primaryButton} onClick={() => handleRoleChange(user.id, 'lineman')} style={{ backgroundColor: '#6b7280' }}>
                            Demote to Lineman
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
export default ManageUsers;
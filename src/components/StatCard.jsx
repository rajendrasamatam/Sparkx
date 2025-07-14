// src/components/StatCard.jsx
import React from 'react';
import styles from '../styles/StatCard.module.css';

const StatCard = ({ icon, title, count }) => {
  return (
    <div className={styles.card}>
      <div className={styles.iconWrapper}>
        {icon}
      </div>
      <div className={styles.textWrapper}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.count}>{count}</p>
      </div>
    </div>
  );
};

export default StatCard;
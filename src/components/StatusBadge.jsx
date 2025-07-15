// src/components/StatusBadge.jsx

import React from 'react';

const StatusBadge = ({ status }) => {
  // Define styles for each status type
  const statusStyles = {
    working: {
      backgroundColor: 'rgba(16, 185, 129, 0.1)', // Light green background
      color: '#059669', // Dark green text
    },
    faulty: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)', // Light red background
      color: '#dc2626', // Dark red text
    },
    'under repair': {
      backgroundColor: 'rgba(245, 158, 11, 0.1)', // Light yellow/amber background
      color: '#d97706', // Dark yellow/amber text
    },
  };

  // Base style for all badges
  const baseStyle = {
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px', // Creates a pill shape
    fontSize: '0.875rem',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    textTransform: 'capitalize',
  };

  // Select the appropriate style or a default
  const currentStyle = statusStyles[status] || {};

  return (
    <span style={{ ...baseStyle, ...currentStyle }}>
      {/* A small dot for a visual indicator */}
      <span style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: currentStyle.color || '#6b7280',
      }}></span>
      {status}
    </span>
  );
};

export default StatusBadge;
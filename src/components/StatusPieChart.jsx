// src/components/StatusPieChart.jsx

import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';

// We need to register the components we're using with Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, Title);

const StatusPieChart = ({ stats }) => {
  const data = {
    labels: ['Working', 'Faulty', 'Under Repair'],
    datasets: [
      {
        label: '# of Lights',
        data: [
          stats.workingLights || 0,
          stats.faultLights || 0,
          stats.repairingLights || 0,
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.7)',  // Green for Working
          'rgba(239, 68, 68, 0.7)',   // Red for Faulty
          'rgba(245, 158, 11, 0.7)',  // Yellow for Under Repair
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(245, 158, 11, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Streetlight Status Breakdown',
        font: {
          size: 16,
        },
      },
    },
  };

  return <Doughnut data={data} options={options} />;
};

export default StatusPieChart;
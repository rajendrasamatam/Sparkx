// src/components/InstallationsBarChart.jsx

import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const InstallationsBarChart = ({ lights }) => {
  // useMemo will prevent this heavy calculation from running on every render
  const chartData = useMemo(() => {
    const monthlyData = {};
    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Initialize all months of the current year to 0
    monthLabels.forEach((label, index) => {
        const year = new Date().getFullYear();
        // Format: YYYY-MM
        const key = `${year}-${String(index + 1).padStart(2, '0')}`;
        monthlyData[key] = 0;
    });

    lights.forEach(light => {
      if (light.installedAt && light.installedAt.toDate) {
        const date = light.installedAt.toDate();
        const year = date.getFullYear();
        const month = date.getMonth(); // 0-11
        const key = `${year}-${String(month + 1).padStart(2, '0')}`;
        
        if (monthlyData[key] !== undefined) {
          monthlyData[key] += 1;
        }
      }
    });

    // We only want to show the last 12 months for clarity
    const sortedKeys = Object.keys(monthlyData).sort().slice(-12);
    
    return {
      labels: sortedKeys.map(key => {
          const [year, month] = key.split('-');
          return `${monthLabels[parseInt(month) - 1]} ${year}`;
      }),
      datasets: [
        {
          label: 'Lights Installed',
          data: sortedKeys.map(key => monthlyData[key]),
          backgroundColor: 'rgba(99, 102, 241, 0.7)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [lights]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Installations (Last 12 Months)',
        font: {
          size: 16,
        },
      },
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                stepSize: 1 // Ensure we only show whole numbers for counts
            }
        }
    }
  };

  return <Bar options={options} data={chartData} />;
};

export default InstallationsBarChart;
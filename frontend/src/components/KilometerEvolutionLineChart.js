import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';
import { formatPrivacyMonthYear, roundPrivacyNumber, smoothPrivacySeries } from '../privacy/privacyDisplay';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#cbd5e1', boxWidth: 10, usePointStyle: true },
    },
    tooltip: {
      backgroundColor: '#020617',
      borderColor: '#1e40af',
      borderWidth: 1,
      titleColor: '#f8fafc',
      bodyColor: '#cbd5e1',
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(30, 64, 175, 0.18)' },
      ticks: { color: '#94a3b8', maxRotation: 0 },
    },
    y: {
      grid: { color: 'rgba(30, 64, 175, 0.18)' },
      ticks: { color: '#94a3b8' },
    },
  },
};

const KilometerEvolutionLineChart = ({ releverDetails, compact = false, isShieldModeLevel2 = false }) => {
  if (!releverDetails || releverDetails.length === 0) {
    return null;
  }

  // Préparer les données pour le graphique
  const kilometerData = releverDetails.map(releve => ({
    date: new Date(releve.Date),
    kilometers: releve.Kilometre,
  }));

  // Trier les dates
  kilometerData.sort((a, b) => a.date - b.date);

  const dataset = {
    label: 'Évolution des kilomètres',
    data: (isShieldModeLevel2
      ? smoothPrivacySeries(kilometerData.map(entry => entry.kilometers)).map(value => roundPrivacyNumber(value, 'kilometers'))
      : kilometerData.map(entry => entry.kilometers)),
    borderColor: 'rgba(54, 162, 235, 1)',
    fill: false,
    tension: isShieldModeLevel2 ? 0.6 : 0.4,
  };

  const chartData = {
    labels: kilometerData.map(entry => isShieldModeLevel2 ? formatPrivacyMonthYear(entry.date) : entry.date.toLocaleDateString()),
    datasets: [dataset],
  };

  return (
    <div className={compact ? 'h-72' : ''}>
      <Line data={chartData} options={compact ? chartOptions : undefined} />
    </div>
  );
};

export default KilometerEvolutionLineChart;

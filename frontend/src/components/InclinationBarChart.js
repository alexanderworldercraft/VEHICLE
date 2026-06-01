import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { formatPrivacyMonthYear, smoothPrivacySeries } from '../privacy/privacyDisplay';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

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

const InclinationBarChart = ({ releverDetails, compact = false, isShieldModeLevel2 = false }) => {
  if (!releverDetails || releverDetails.length === 0) {
    return null;
  }

  // Vérifiez s'il y a des valeurs d'inclinaison
  const hasInclinaison = releverDetails.some(releve => releve.InclinaisonGauche !== null || releve.InclinaisonDroite !== null);

  if (!hasInclinaison) {
    return null;
  }

  // Utiliser les dates des relevés comme labels
  const labels = releverDetails.map(releve => {
    const date = new Date(releve.Date);
    return isShieldModeLevel2 ? formatPrivacyMonthYear(date) : date.toLocaleDateString();
  });
  const inclinaisonGauche = releverDetails.map(releve => releve.InclinaisonGauche || 0);
  const inclinaisonDroite = releverDetails.map(releve => releve.InclinaisonDroite || 0);
  const chartInclinaisonGauche = isShieldModeLevel2 ? smoothPrivacySeries(inclinaisonGauche).map(Math.round) : inclinaisonGauche;
  const chartInclinaisonDroite = isShieldModeLevel2 ? smoothPrivacySeries(inclinaisonDroite).map(Math.round) : inclinaisonDroite;

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Inclinaison Gauche',
        data: chartInclinaisonGauche,
        backgroundColor: '#22d3ee',
      },
      {
        label: 'Inclinaison Droite',
        data: chartInclinaisonDroite,
        backgroundColor: '#f97316',
      },
    ],
  };

  return (
    <>
      {!compact && <h3 className="text-lg font-semibold">Inclinaisons par relevé</h3>}
      <div className={compact ? 'h-72' : 'min-w-192'}>
        <Bar data={chartData} options={compact ? chartOptions : undefined} />
      </div>
    </>
  );
};

export default InclinationBarChart;

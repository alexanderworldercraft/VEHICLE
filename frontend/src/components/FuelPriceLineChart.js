import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';
import { formatPrivacyMonthYear, roundToNearest, smoothPrivacySeries } from '../privacy/privacyDisplay';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#cbd5e1',
        boxWidth: 10,
        usePointStyle: true,
      },
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

const FuelPriceLineChart = ({ releverDetails, compact = false, isShieldModeLevel2 = false }) => {
  if (!releverDetails || releverDetails.length === 0) {
    return null;
  }

  // Regrouper les données par carburant et collecter toutes les dates
  const fuelData = releverDetails.reduce((acc, releve) => {
    const fuelName = releve.Carburant.Nom;
    const fuelColor = releve.Carburant.Couleur;
    const price = releve.PrixLitre;
    const date = new Date(releve.Date);

    if (!acc.allDates.includes(date)) {
      acc.allDates.push(date);
    }

    if (!acc.fuelData[fuelName]) {
      acc.fuelData[fuelName] = {
        label: fuelName,
        color: fuelColor,
        prices: {},
      };
    }

    acc.fuelData[fuelName].prices[date] = price;

    return acc;
  }, { allDates: [], fuelData: {} });

  // Trier les dates
  fuelData.allDates.sort((a, b) => a - b);

  // Préparer les données pour le graphique
  const datasets = Object.keys(fuelData.fuelData).map(fuelName => {
    const prices = fuelData.allDates.map(date => fuelData.fuelData[fuelName].prices[date] || null);
    const chartPrices = isShieldModeLevel2
      ? smoothPrivacySeries(prices).map(price => price === null ? null : roundToNearest(price, 0.1))
      : prices;

    return {
      label: fuelName,
      data: chartPrices,
      borderColor: fuelData.fuelData[fuelName].color,
      fill: false,
      tension: isShieldModeLevel2 ? 0.6 : 0.4,
      spanGaps: true, // Continuer la ligne même si des valeurs sont nulles
    };
  });

  // Calculer les moyennes et médianes pour chaque carburant
  const fuelStats = Object.keys(fuelData.fuelData).map(fuelName => {
    const prices = Object.values(fuelData.fuelData[fuelName].prices).filter(price => price !== null);
    const averagePrice = prices.reduce((sum, value) => sum + value, 0) / prices.length;
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const medianIndex = Math.floor(sortedPrices.length / 2);
    const medianPrice = sortedPrices.length % 2 !== 0
      ? sortedPrices[medianIndex]
      : (sortedPrices[medianIndex - 1] + sortedPrices[medianIndex]) / 2;

    // Calculer les moyennes et médianes des trois dernières valeurs
    const lastThreePrices = prices.slice(-3);
    const averageLastThree = lastThreePrices.length === 3
      ? lastThreePrices.reduce((sum, value) => sum + value, 0) / 3
      : `Manque ${3 - lastThreePrices.length} valeur(s)`;

    const sortedLastThreePrices = [...lastThreePrices].sort((a, b) => a - b);
    const medianLastThree = lastThreePrices.length === 3
      ? sortedLastThreePrices[1]
      : `Manque ${3 - lastThreePrices.length} valeur(s)`;

    return {
      fuelName,
      averagePrice,
      medianPrice,
      averageLastThree,
      medianLastThree,
      color: fuelData.fuelData[fuelName].color,
    };
  });

  // Fonction pour déterminer la couleur du texte en fonction du fond
  const getTextColor = (bgColor) => {
    const color = bgColor.replace('#', '');
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    const brightness = Math.round(((parseInt(r) * 299) + (parseInt(g) * 587) + (parseInt(b) * 114)) / 1000);
    return brightness > 125 ? '#000000' : '#FFFFFF';
  };

  const chartData = {
    labels: fuelData.allDates.map(date => isShieldModeLevel2 ? formatPrivacyMonthYear(date) : date.toLocaleDateString()),
    datasets,
  };

  return (
    <div>
      {!compact && <div className="legend">
        <div className='border border-blue-500 rounded-lg overflow-auto w-fit mx-auto'>
          <table className='table-auto'>
            <thead>
              <tr>
                <th className='border border-slate-600 px-4 py-2 bg-slate-800'>Carburant</th>
                <th className='border border-slate-600 px-4 py-2 bg-slate-800'>Moyenne (€/L)</th>
                <th className='border border-slate-600 px-4 py-2 bg-slate-800'>Médiane (€/L)</th>
                <th className='border border-slate-600 px-4 py-2 bg-slate-800'>Moyenne 3 Dernières</th>
                <th className='border border-slate-600 px-4 py-2 bg-slate-800'>Médiane 3 Dernières</th>
              </tr>
            </thead>
            <tbody>
              {fuelStats.map(stat => (
                <tr key={stat.fuelName}>
                  <td
                    className='border border-slate-600 px-4 py-2 bg-slate-900 font-medium'
                    style={{ backgroundColor: stat.color, color: getTextColor(stat.color) }}
                  >
                    {stat.fuelName}
                  </td>
                  <td className='border border-slate-600 px-4 py-2 bg-slate-900'>
                    {stat.averagePrice.toFixed(2)}
                  </td>
                  <td className='border border-slate-600 px-4 py-2 bg-slate-900'>
                    {stat.medianPrice.toFixed(2)}
                  </td>
                  <td className='border border-slate-600 px-4 py-2 bg-slate-900'>
                    {typeof stat.averageLastThree === 'number' ? stat.averageLastThree.toFixed(2) : stat.averageLastThree}
                  </td>
                  <td className='border border-slate-600 px-4 py-2 bg-slate-900'>
                    {typeof stat.medianLastThree === 'number' ? stat.medianLastThree.toFixed(2) : stat.medianLastThree}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>}
      <div className={compact ? 'h-72' : ''}>
        <Line data={chartData} options={compact ? chartOptions : undefined} />
      </div>
    </div>
  );
};

export default FuelPriceLineChart;

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

const FuelConsumptionLineChart = ({ releverDetails, compact = false, isShieldModeLevel2 = false }) => {
  if (!releverDetails || releverDetails.length < 2) {
    return null;
  }

  const consumptionData = [];
  const onBoardConsumptionData = [];
  let lastReleve = null;

  for (let i = 0; i < releverDetails.length; i++) {
    const currentReleve = releverDetails[i];

    if (lastReleve) {
      const distance = currentReleve.Kilometre - lastReleve.Kilometre;
      const fuelUsed = currentReleve.LitreTotal; // Carburant consommé entre les relevés

      if (distance > 0 && fuelUsed > 0) {
        const consumption = (fuelUsed / distance) * 100; // L/100km
        consumptionData.push({
          label: isShieldModeLevel2 ? formatPrivacyMonthYear(currentReleve.Date) : new Date(currentReleve.Date).toLocaleDateString(),
          consumption,
        });
      }
    }

    // Ajouter les données de consommation de l'ordinateur de bord, même si elles sont nulles
    onBoardConsumptionData.push({
      label: isShieldModeLevel2 ? formatPrivacyMonthYear(currentReleve.Date) : new Date(currentReleve.Date).toLocaleDateString(),
      consumption: currentReleve.Consommation !== null ? currentReleve.Consommation : null,
    });

    lastReleve = currentReleve;
  }

  const labels = consumptionData.map(data => data.label);
  const consumptionValues = consumptionData.map(data => data.consumption);
  const onBoardConsumptionValues = onBoardConsumptionData.map(data => data.consumption);
  const chartConsumptionValues = isShieldModeLevel2
    ? smoothPrivacySeries(consumptionValues).map(value => roundToNearest(value, 0.1))
    : consumptionValues;
  const chartOnBoardConsumptionValues = isShieldModeLevel2
    ? smoothPrivacySeries(onBoardConsumptionValues).map(value => value === null ? null : roundToNearest(value, 0.1))
    : onBoardConsumptionValues;

  // Filtrer les valeurs nulles pour le calcul des statistiques
  const validOnBoardConsumptionValues = onBoardConsumptionValues.filter(value => value !== null);

  // Calcul des moyennes
  const averageConsumption = consumptionValues.reduce((sum, value) => sum + value, 0) / consumptionValues.length;
  const averageOnBoardConsumption = validOnBoardConsumptionValues.reduce((sum, value) => sum + value, 0) / validOnBoardConsumptionValues.length;

  // Calcul des médianes
  const sortedConsumption = [...consumptionValues].sort((a, b) => a - b);
  const sortedOnBoardConsumption = [...validOnBoardConsumptionValues].sort((a, b) => a - b);

  const medianIndex = Math.floor(sortedConsumption.length / 2);
  const medianConsumption = sortedConsumption.length % 2 !== 0
    ? sortedConsumption[medianIndex]
    : (sortedConsumption[medianIndex - 1] + sortedConsumption[medianIndex]) / 2;

  const medianOnBoardIndex = Math.floor(sortedOnBoardConsumption.length / 2);
  const medianOnBoardConsumption = sortedOnBoardConsumption.length % 2 !== 0
    ? sortedOnBoardConsumption[medianOnBoardIndex]
    : (sortedOnBoardConsumption[medianOnBoardIndex - 1] + sortedOnBoardConsumption[medianOnBoardIndex]) / 2;

  // Calculer les moyennes et médianes des trois dernières valeurs
  const lastThreeConsumptionValues = consumptionValues.slice(-3);
  const lastThreeOnBoardConsumptionValues = validOnBoardConsumptionValues.slice(-3);

  const averageLastThreeConsumption = lastThreeConsumptionValues.length === 3
    ? lastThreeConsumptionValues.reduce((sum, value) => sum + value, 0) / 3
    : `Manque ${3 - lastThreeConsumptionValues.length} valeur(s)`;

  const averageLastThreeOnBoardConsumption = lastThreeOnBoardConsumptionValues.length === 3
    ? lastThreeOnBoardConsumptionValues.reduce((sum, value) => sum + value, 0) / 3
    : `Manque ${3 - lastThreeOnBoardConsumptionValues.length} valeur(s)`;

  const sortedLastThreeConsumptionValues = [...lastThreeConsumptionValues].sort((a, b) => a - b);
  const sortedLastThreeOnBoardConsumptionValues = [...lastThreeOnBoardConsumptionValues].sort((a, b) => a - b);

  const medianLastThreeConsumption = lastThreeConsumptionValues.length === 3
    ? sortedLastThreeConsumptionValues[1]
    : `Manque ${3 - lastThreeConsumptionValues.length} valeur(s)`;

  const medianLastThreeOnBoardConsumption = lastThreeOnBoardConsumptionValues.length === 3
    ? sortedLastThreeOnBoardConsumptionValues[1]
    : `Manque ${3 - lastThreeOnBoardConsumptionValues.length} valeur(s)`;

    // retire le premier relever de l'ordi de bord pour coller avec les relever reel
    const onBoardConsumptionValuesN1 = chartOnBoardConsumptionValues.slice(1);
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Consommation Réelle (L/100km)',
        data: chartConsumptionValues.map(value => Number.isFinite(Number(value)) ? Number(value).toFixed(isShieldModeLevel2 ? 1 : 2) : value),
        borderColor: '#22d3ee',
        fill: false,
        tension: isShieldModeLevel2 ? 0.55 : 0.3,
        spanGaps: true, // Continuer la ligne même si des valeurs sont nulles
      },
      {
        label: 'Consommation Ordinateur de Bord (L/100km)',
        data: onBoardConsumptionValuesN1.map(value => value !== null ? Number(value).toFixed(isShieldModeLevel2 ? 1 : 2) : null),
        borderColor: '#f97316',
        fill: false,
        tension: isShieldModeLevel2 ? 0.55 : 0.3,
        spanGaps: true, // Continuer la ligne même si des valeurs sont nulles
      },
    ],
  };
  return (
    <div>
      {!compact && <h3 className="text-lg font-semibold text-center">Consommation de carburant</h3>}

      {!compact && <div className='border border-blue-500 rounded-lg overflow-auto w-fit mx-auto'>
        <table className='table-auto'>
          <thead>
            <tr>
              <th className='border border-slate-600 px-4 py-2 bg-slate-800'></th>
              <th className='border border-slate-600 px-4 py-2 bg-slate-800'>Moyenne</th>
              <th className='border border-slate-600 px-4 py-2 bg-slate-800'>Médiane</th>
              <th className='border border-slate-600 px-4 py-2 bg-slate-800'>Moyenne 3 Dernières</th>
              <th className='border border-slate-600 px-4 py-2 bg-slate-800'>Médiane 3 Dernières</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className='border border-slate-600 px-4 py-2 bg-cyan-400 text-slate-900 font-medium'>Réelle</td>
              <td className='border border-slate-600 px-4 py-2 bg-slate-900'>{averageConsumption.toFixed(2)}L /100km</td>
              <td className='border border-slate-600 px-4 py-2 bg-slate-900'>{medianConsumption.toFixed(2)}L /100km</td>
              <td className='border border-slate-600 px-4 py-2 bg-slate-900'>
                {typeof averageLastThreeConsumption === 'number' ? averageLastThreeConsumption.toFixed(2) : averageLastThreeConsumption}L /100km
              </td>
              <td className='border border-slate-600 px-4 py-2 bg-slate-900'>
                {typeof medianLastThreeConsumption === 'number' ? medianLastThreeConsumption.toFixed(2) : medianLastThreeConsumption}L /100km
              </td>
            </tr>
            <tr>
              <td className='border border-slate-600 px-4 py-2 bg-orange-500 text-slate-900 font-medium'>Ordinateur de bord</td>
              <td className='border border-slate-600 px-4 py-2 bg-slate-900'>{averageOnBoardConsumption.toFixed(2)}L /100km</td>
              <td className='border border-slate-600 px-4 py-2 bg-slate-900'>{medianOnBoardConsumption.toFixed(2)}L /100km</td>
              <td className='border border-slate-600 px-4 py-2 bg-slate-900'>
                {typeof averageLastThreeOnBoardConsumption === 'number' ? averageLastThreeOnBoardConsumption.toFixed(2) : averageLastThreeOnBoardConsumption}L /100km
              </td>
              <td className='border border-slate-600 px-4 py-2 bg-slate-900'>
                {typeof medianLastThreeOnBoardConsumption === 'number' ? medianLastThreeOnBoardConsumption.toFixed(2) : medianLastThreeOnBoardConsumption}L /100km
              </td>
            </tr>
          </tbody>
        </table>
      </div>}

      <div id='canvasFuelConsumption' className={compact ? 'h-72' : 'min-w-192'}>
        <Line data={chartData} options={compact ? chartOptions : undefined} />
      </div>
    </div>
  );
};

export default FuelConsumptionLineChart;

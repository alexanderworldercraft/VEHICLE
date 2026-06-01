import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const KilometerLineChart = ({ releverDetails }) => {
  if (!releverDetails || releverDetails.length === 0) {
    return null;
  }

  // Calculer les kilomètres parcourus entre chaque relevé
  const kilometerData = releverDetails.reduce((acc, releve, index) => {
    const date = new Date(releve.Date);
    const kilometers = releve.Kilometre;

    if (index > 0) {
      const previousKilometers = releverDetails[index - 1].Kilometre;
      const distance = kilometers - previousKilometers;
      acc.distances.push({ date, distance });
    }

    if (!acc.allDates.includes(date)) {
      acc.allDates.push(date);
    }

    return acc;
  }, { allDates: [], distances: [] });

  // Trier les dates
  kilometerData.allDates.sort((a, b) => a - b);

  // Préparer les données pour le graphique
  const distances = kilometerData.allDates.map(date => {
    const entry = kilometerData.distances.find(d => d.date.getTime() === date.getTime());
    return entry ? entry.distance : null;
  });

  const dataset = {
    label: 'Kilomètres parcourus',
    data: distances,
    borderColor: 'rgba(75, 192, 192, 1)',
    fill: false,
    tension: 0.4,
    spanGaps: true,
  };

  // Calculer les moyennes et médianes
  const allDistances = kilometerData.distances.map(d => d.distance);
  const averageDistance = allDistances.reduce((sum, value) => sum + value, 0) / allDistances.length;
  const sortedDistances = [...allDistances].sort((a, b) => a - b);
  const medianIndex = Math.floor(sortedDistances.length / 2);
  const medianDistance = sortedDistances.length % 2 !== 0
    ? sortedDistances[medianIndex]
    : (sortedDistances[medianIndex - 1] + sortedDistances[medianIndex]) / 2;

  const lastThreeDistances = allDistances.slice(-3);
  const averageLastThree = lastThreeDistances.length === 3
    ? lastThreeDistances.reduce((sum, value) => sum + value, 0) / 3
    : `Manque ${3 - lastThreeDistances.length} valeur(s)`;

  const sortedLastThreeDistances = [...lastThreeDistances].sort((a, b) => a - b);
  const medianLastThree = lastThreeDistances.length === 3
    ? sortedLastThreeDistances[1]
    : `Manque ${3 - lastThreeDistances.length} valeur(s)`;

  const chartData = {
    labels: kilometerData.allDates.map(date => date.toLocaleDateString()),
    datasets: [dataset],
  };

  return (
    <div>
      <div className="legend">
        <div className='border border-blue-500 rounded-lg overflow-auto w-fit mx-auto'>
          <table className='table-auto'>
            <thead>
              <tr>
                <th className='border border-slate-600 px-4 py-2 bg-slate-800'>Moyenne (km)</th>
                <th className='border border-slate-600 px-4 py-2 bg-slate-800'>Médiane (km)</th>
                <th className='border border-slate-600 px-4 py-2 bg-slate-800'>Moyenne 3 Derniers</th>
                <th className='border border-slate-600 px-4 py-2 bg-slate-800'>Médiane 3 Derniers</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className='border border-slate-600 px-4 py-2 bg-slate-900'>{averageDistance.toFixed(2)}</td>
                <td className='border border-slate-600 px-4 py-2 bg-slate-900'>{medianDistance.toFixed(2)}</td>
                <td className='border border-slate-600 px-4 py-2 bg-slate-900'>
                  {typeof averageLastThree === 'number' ? averageLastThree.toFixed(2) : averageLastThree}
                </td>
                <td className='border border-slate-600 px-4 py-2 bg-slate-900'>
                  {typeof medianLastThree === 'number' ? medianLastThree.toFixed(2) : medianLastThree}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <Line data={chartData} />
    </div>
  );
};

export default KilometerLineChart;

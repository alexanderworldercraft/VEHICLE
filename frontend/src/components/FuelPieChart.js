import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: '#020617',
      borderColor: '#1e40af',
      borderWidth: 1,
      titleColor: '#f8fafc',
      bodyColor: '#cbd5e1',
    },
  },
  cutout: '64%',
};

const FuelPieChart = ({ releverDetails, compact = false }) => {
  if (!releverDetails || releverDetails.length === 0) {
    return null;
  }

  const fuelData = releverDetails.reduce((acc, releve) => {
    const fuelName = releve.Carburant.Nom;
    const fuelColor = releve.Carburant.Couleur;
    if (!acc[fuelName]) {
      acc[fuelName] = { count: 0, color: fuelColor };
    }
    acc[fuelName].count += 1;
    return acc;
  }, {});

  const labels = Object.keys(fuelData);
  const data = labels.map(label => fuelData[label].count);
  const backgroundColor = labels.map(label => fuelData[label].color);
  const total = data.reduce((sum, value) => sum + value, 0);

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor,
        borderColor: '#020617',
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  return (
    <>
      {!compact && <h3 className="text-lg font-semibold">Répartition des carburants</h3>}
      <div className={compact ? 'flex h-72 items-center gap-4' : 'relative mx-auto'}>
        <div className={compact ? 'relative h-full min-w-0 flex-1' : 'relative'}>
          <Doughnut data={chartData} options={compact ? chartOptions : { cutout: '58%' }} />
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="grid h-14 w-14 place-items-center rounded-full border border-sky-400/30 bg-slate-950/80 text-sky-200 shadow-[0_0_24px_rgba(14,165,233,0.2)]">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 21V5.5A2.5 2.5 0 0 1 8.5 3h5A2.5 2.5 0 0 1 16 5.5V21" />
                <path d="M5 21h12" />
                <path d="M8 7h6v4H8z" />
                <path d="M16 6h1.2L20 8.8V17a2 2 0 0 1-4 0v-3h1.5" />
              </svg>
            </div>
          </div>
        </div>
        {compact && (
          <div className="w-28 shrink-0 space-y-3">
            {labels.map((label, index) => (
              <div key={label} className="text-sm">
                <div className="flex items-center gap-2 text-slate-200">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: backgroundColor[index] }} />
                  <span className="truncate">{label}</span>
                </div>
                <p className="mt-1 pl-4 text-xs text-slate-500">
                  {Math.round((data[index] / total) * 100)}%
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default FuelPieChart;

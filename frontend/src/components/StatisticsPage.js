import React, { useEffect, useMemo, useState } from 'react';
import { BanknotesIcon, ChartBarIcon, FireIcon, TrophyIcon, TruckIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';
import { useNavigate } from 'react-router-dom';
import api, { shieldFetch } from '../services/api';
import FuelPieChart from './FuelPieChart';
import FuelPriceLineChart from './FuelPriceLineChart';
import { maskSensitiveValue, usePrivacy } from '../privacy/PrivacyContext';
import { formatPrivacyMonthYear, roundPrivacyNumber, smoothPrivacySeries } from '../privacy/privacyDisplay';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const apiUrl = process.env.REACT_APP_URL_LOCAL || "https://192.168.0.17:1234";
const chartColors = [
  '#38bdf8',
  '#22c55e',
  '#f97316',
  '#a78bfa',
  '#f43f5e',
  '#eab308',
  '#14b8a6',
  '#ec4899',
];

const lineChartOptions = {
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

const formatNumber = (value, digits = 0) => {
  if (!Number.isFinite(value)) return '-';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
};

const sortRelevesByVehicle = (releves = []) => (
  [...releves].sort((a, b) => {
    const vehicleDiff = Number(a.VehiculeID) - Number(b.VehiculeID);
    if (vehicleDiff !== 0) return vehicleDiff;
    const dateDiff = new Date(a.Date) - new Date(b.Date);
    if (dateDiff !== 0) return dateDiff;
    return (a.Kilometre || 0) - (b.Kilometre || 0);
  })
);

const sortRelevesByDate = (releves = []) => (
  [...releves].sort((a, b) => {
    const dateDiff = new Date(a.Date) - new Date(b.Date);
    if (dateDiff !== 0) return dateDiff;
    const vehicleDiff = Number(a.VehiculeID) - Number(b.VehiculeID);
    if (vehicleDiff !== 0) return vehicleDiff;
    return (a.Kilometre || 0) - (b.Kilometre || 0);
  })
);

const getReleveLabel = (releve, isShieldModeLevel2) => (
  isShieldModeLevel2
    ? formatPrivacyMonthYear(releve.Date)
    : new Date(releve.Date).toLocaleDateString()
);

const getMedian = (values = []) => {
  const sortedValues = values
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  if (sortedValues.length === 0) return null;

  const middleIndex = Math.floor(sortedValues.length / 2);
  return sortedValues.length % 2 === 0
    ? (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2
    : sortedValues[middleIndex];
};

const buildMileageChartData = (releves = [], isShieldModeLevel2 = false, mileageView = 'total') => {
  const relevesByVehicle = sortRelevesByVehicle(releves).reduce((acc, releve) => {
    if (!acc[releve.VehiculeID]) acc[releve.VehiculeID] = [];
    acc[releve.VehiculeID].push(releve);
    return acc;
  }, {});

  const labels = [...new Set(
    sortRelevesByDate(releves).map((releve) => getReleveLabel(releve, isShieldModeLevel2))
  )];

  const datasets = Object.values(relevesByVehicle).map((vehicleReleves, index) => {
    let cumulativeDistance = 0;
    const valuesByLabel = vehicleReleves.reduce((acc, releve, releveIndex) => {
      const label = getReleveLabel(releve, isShieldModeLevel2);
      const kilometer = Number(releve.Kilometre);

      if (mileageView === 'distance') {
        if (releveIndex === 0) {
          acc[label] = cumulativeDistance;
          return acc;
        }

        const previousKilometer = Number(vehicleReleves[releveIndex - 1]?.Kilometre);
        const distance = kilometer - previousKilometer;
        if (Number.isFinite(distance) && distance > 0) cumulativeDistance += distance;
        acc[label] = cumulativeDistance;
        return acc;
      }

      acc[label] = kilometer;
      return acc;
    }, {});
    const rawValues = labels.map((label) => valuesByLabel[label] ?? null);
    const color = chartColors[index % chartColors.length];

    return {
      label: vehicleReleves[0]?.Vehicule?.Nom || `Véhicule ${vehicleReleves[0]?.VehiculeID || index + 1}`,
      data: isShieldModeLevel2
        ? smoothPrivacySeries(rawValues).map((value) => (
          Number.isFinite(Number(value)) ? roundPrivacyNumber(value, 'kilometers') : value
        ))
        : rawValues,
      borderColor: color,
      backgroundColor: color,
      fill: false,
      spanGaps: true,
      tension: isShieldModeLevel2 ? 0.6 : 0.4,
    };
  });

  return { labels, datasets };
};

const getStatistics = (releves = []) => {
  const relevesByVehicle = sortRelevesByVehicle(releves).reduce((acc, releve) => {
    if (!acc[releve.VehiculeID]) acc[releve.VehiculeID] = [];
    acc[releve.VehiculeID].push(releve);
    return acc;
  }, {});

  return Object.values(relevesByVehicle).reduce((acc, vehicleReleves) => {
    vehicleReleves.forEach((releve, index) => {
      const litres = Number(releve.LitreTotal);
      const cost = Number(releve.PrixTotal);
      if (Number.isFinite(litres) && litres > 0) acc.litres += litres;
      if (Number.isFinite(cost) && cost >= 0) acc.cost += cost;

      if (index === 0) return;
      const previousReleve = vehicleReleves[index - 1];
      const distance = Number(releve.Kilometre) - Number(previousReleve.Kilometre);
      if (!Number.isFinite(distance) || distance <= 0) return;

      acc.declaredKilometers += distance;
      acc.distances.push(distance);
      if (Number.isFinite(litres) && litres > 0) {
        acc.consumptions.push((litres / distance) * 100);
      }
    });

    return acc;
  }, {
    declaredKilometers: 0,
    distances: [],
    consumptions: [],
    litres: 0,
    cost: 0,
  });
};

const getMaintenanceStats = (entretienRealises = []) => (
  entretienRealises.reduce((acc, entretien) => {
    const cost = Number(entretien.Cout);
    if (Number.isFinite(cost) && cost >= 0) acc.totalCost += cost;
    return acc;
  }, {
    totalCost: 0,
  })
);

const getMedianCostPer100 = (releves = []) => {
  const relevesByVehicle = sortRelevesByVehicle(releves).reduce((acc, releve) => {
    if (!acc[releve.VehiculeID]) acc[releve.VehiculeID] = [];
    acc[releve.VehiculeID].push(releve);
    return acc;
  }, {});

  const costsPer100 = Object.values(relevesByVehicle).flatMap((vehicleReleves) => (
    vehicleReleves.reduce((acc, releve, index) => {
      if (index === 0) return acc;

      const previousKilometer = Number(vehicleReleves[index - 1]?.Kilometre);
      const kilometer = Number(releve.Kilometre);
      const cost = Number(releve.PrixTotal);
      const distance = kilometer - previousKilometer;

      if (Number.isFinite(distance) && distance > 0 && Number.isFinite(cost) && cost >= 0) {
        acc.push((cost / distance) * 100);
      }

      return acc;
    }, [])
  ));

  return getMedian(costsPer100);
};

const getVehiclePerformanceStats = (releves = []) => {
  const relevesByVehicle = sortRelevesByVehicle(releves).reduce((acc, releve) => {
    if (!acc[releve.VehiculeID]) acc[releve.VehiculeID] = [];
    acc[releve.VehiculeID].push(releve);
    return acc;
  }, {});

  const vehicleStats = Object.values(relevesByVehicle).map((vehicleReleves) => {
    const intervalStats = vehicleReleves.reduce((acc, releve, index) => {
      if (index === 0) return acc;

      const previousKilometer = Number(vehicleReleves[index - 1]?.Kilometre);
      const kilometer = Number(releve.Kilometre);
      const distance = kilometer - previousKilometer;
      const cost = Number(releve.PrixTotal);
      const litres = Number(releve.LitreTotal);

      if (!Number.isFinite(distance) || distance <= 0) return acc;

      acc.distance += distance;
      if (Number.isFinite(cost) && cost >= 0) acc.costsPer100.push((cost / distance) * 100);
      if (Number.isFinite(litres) && litres > 0) acc.consumptions.push((litres / distance) * 100);
      return acc;
    }, {
      distance: 0,
      costsPer100: [],
      consumptions: [],
    });

    return {
      vehicleId: vehicleReleves[0]?.VehiculeID,
      name: vehicleReleves[0]?.Vehicule?.Nom || `Véhicule ${vehicleReleves[0]?.VehiculeID || '-'}`,
      distance: intervalStats.distance,
      medianCostPer100: getMedian(intervalStats.costsPer100),
      medianConsumption: getMedian(intervalStats.consumptions),
    };
  });

  return {
    mostUsed: vehicleStats
      .filter((vehicle) => Number.isFinite(vehicle.distance))
      .sort((a, b) => b.distance - a.distance)[0] || null,
    cheapest: vehicleStats
      .filter((vehicle) => Number.isFinite(vehicle.medianCostPer100))
      .sort((a, b) => a.medianCostPer100 - b.medianCostPer100)[0] || null,
    mostConsuming: vehicleStats
      .filter((vehicle) => Number.isFinite(vehicle.medianConsumption))
      .sort((a, b) => b.medianConsumption - a.medianConsumption)[0] || null,
  };
};

const displayNumber = (value, digits, { isPrivacyMode, isShieldModeLevel2 }, kind) => {
  if (!Number.isFinite(Number(value))) {
    return formatNumber(value, digits);
  }

  if (isShieldModeLevel2) {
    return formatNumber(roundPrivacyNumber(value, kind), 0);
  }

  const formattedValue = formatNumber(value, digits);
  return isPrivacyMode ? maskSensitiveValue(formattedValue) : formattedValue;
};

const ChartPanel = ({ title, subtitle, children, actions }) => (
  <section className="min-w-0 overflow-hidden rounded-lg border border-sky-500/20 bg-slate-950/60 p-5 shadow-[0_18px_50px_rgba(2,6,23,0.2)]">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-slate-50">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
      </div>
      {actions}
    </div>
    {children}
  </section>
);

const StatCard = ({ title, value, unit, icon: Icon, variant = 'secondary' }) => (
  <article className={`min-w-0 rounded-lg p-5 ${
    variant === 'primary'
      ? 'border border-sky-400/35 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_34%),rgba(2,6,23,0.72)] shadow-[0_22px_60px_rgba(14,165,233,0.12)]'
      : 'border border-slate-700/50 bg-slate-950/45 shadow-[0_14px_36px_rgba(2,6,23,0.22)]'
  }`}>
    <div className="flex items-start justify-between gap-4">
      <p className={`text-xs font-semibold uppercase tracking-wide ${variant === 'primary' ? 'text-sky-200' : 'text-slate-400'}`}>{title}</p>
      <span className={`grid h-8 w-8 place-items-center rounded-full ${variant === 'primary' ? 'bg-sky-500/15 text-sky-200' : 'bg-slate-800 text-slate-300'}`}>
        <Icon className="h-4 w-4" />
      </span>
    </div>
    <div className="mt-5 flex items-baseline gap-2">
      <span className="text-3xl font-semibold text-slate-50">{value}</span>
      {unit && <span className="text-sm text-slate-400">{unit}</span>}
    </div>
  </article>
);

const RankingCard = ({ title, vehicleName, value, unit, privacy, kind }) => (
  <article className="min-w-0 overflow-hidden rounded-lg border border-amber-400/25 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.18),transparent_38%),rgba(15,23,42,0.72)] p-5 shadow-[0_22px_60px_rgba(245,158,11,0.08)]">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">{title}</p>
        <h3 className="mt-3 truncate text-xl font-semibold text-slate-50">{vehicleName || '-'}</h3>
      </div>
      <span className="grid h-9 w-9 place-items-center rounded-full bg-amber-400/15 text-amber-200">
        <TrophyIcon className="h-5 w-5" />
      </span>
    </div>
    <div className="mt-5 flex items-baseline gap-2">
      <span className="text-3xl font-semibold text-white">{displayNumber(value, unit === 'km' ? 0 : 1, privacy, kind)}</span>
      <span className="text-sm text-slate-300">{unit}</span>
    </div>
  </article>
);

const MileageByVehicleChart = ({ chartData }) => (
  <div className="h-72">
    <Line data={chartData} options={lineChartOptions} />
  </div>
);

const SegmentedToggle = ({ value, onChange, options }) => (
  <div className="inline-flex rounded-lg border border-sky-500/20 bg-slate-900/70 p-1">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${value === option.value
          ? 'bg-sky-500 text-white shadow-lg shadow-sky-950/30'
          : 'text-slate-400 hover:bg-sky-500/10 hover:text-slate-100'
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
);

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    aria-pressed={checked}
    className="inline-flex items-center gap-3 rounded-xl border border-sky-500/20 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-sky-400/45 hover:bg-sky-500/10"
  >
    <span className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-sky-500' : 'bg-slate-700'}`}>
      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${checked ? 'left-6' : 'left-1'}`} />
    </span>
    <span>Inclure les véhicules vendus</span>
  </button>
);

const StatisticsPage = () => {
  const [user, setUser] = useState(null);
  const [includeSold, setIncludeSold] = useState(false);
  const [mileageView, setMileageView] = useState('total');
  const [statisticsData, setStatisticsData] = useState({ vehicles: [], releverDetails: [], entretienRealises: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const privacy = usePrivacy();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get('users/me');
        setUser(response.data);
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        navigate('/login');
      }
    };

    fetchUserProfile();
  }, [navigate]);

  useEffect(() => {
    if (!user?.UtilisateurID) return;

    let ignore = false;

    const fetchStatistics = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await shieldFetch(`${apiUrl}/api/vehicule/${user.UtilisateurID}/statistiques?includeSold=${includeSold}`);
        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }

        const result = await response.json();
        if (!ignore) {
          setStatisticsData({
            vehicles: Array.isArray(result.vehicles) ? result.vehicles : [],
            releverDetails: Array.isArray(result.releverDetails) ? result.releverDetails : [],
            entretienRealises: Array.isArray(result.entretienRealises) ? result.entretienRealises : [],
          });
        }
      } catch (err) {
        if (!ignore) {
          console.error('Failed to fetch statistics:', err);
          setError('Impossible de charger les statistiques.');
          setStatisticsData({ vehicles: [], releverDetails: [], entretienRealises: [] });
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchStatistics();

    return () => {
      ignore = true;
    };
  }, [includeSold, user]);

  const releves = useMemo(() => sortRelevesByDate(statisticsData.releverDetails), [statisticsData.releverDetails]);
  const mileageChartData = useMemo(
    () => buildMileageChartData(releves, privacy.isShieldModeLevel2, mileageView),
    [mileageView, privacy.isShieldModeLevel2, releves]
  );
  const stats = useMemo(() => getStatistics(releves), [releves]);
  const medianDistance = useMemo(() => getMedian(stats.distances), [stats.distances]);
  const medianConsumption = useMemo(() => getMedian(stats.consumptions), [stats.consumptions]);
  const medianCostPer100 = useMemo(() => getMedianCostPer100(releves), [releves]);
  const vehiclePerformanceStats = useMemo(() => getVehiclePerformanceStats(releves), [releves]);
  const maintenanceStats = useMemo(() => getMaintenanceStats(statisticsData.entretienRealises), [statisticsData.entretienRealises]);
  const averagePricePerLiter = stats.litres > 0 ? stats.cost / stats.litres : null;

  const activeVehiclesCount = statisticsData.vehicles.filter((vehicle) => vehicle.EtatID === 1).length;
  const soldVehiclesCount = statisticsData.vehicles.filter((vehicle) => vehicle.EtatID === 4).length;
  const scopeLabel = includeSold
    ? `${activeVehiclesCount} actif(s), ${soldVehiclesCount} vendu(s)`
    : `${activeVehiclesCount} véhicule(s) actif(s)`;

  return (
    <main className="mx-auto max-w-7xl grow">
      <div className="space-y-6 text-neutral-100">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">Statistiques</h1>
            <p className="mt-1 text-sm text-slate-400">Vue globale des véhicules de l'utilisateur actif.</p>
          </div>
          <Toggle checked={includeSold} onChange={setIncludeSold} />
        </header>

        {isLoading ? (
          <div className="rounded-lg border border-sky-500/20 bg-slate-950/60 p-8 text-center text-slate-300">
            Chargement des statistiques...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-8 text-center text-rose-100">
            {error}
          </div>
        ) : releves.length > 0 ? (
          <>
            <section className="grid min-w-0 gap-4 lg:grid-cols-3">
              <RankingCard
                title="Véhicule le plus utilisé"
                vehicleName={vehiclePerformanceStats.mostUsed?.name}
                value={vehiclePerformanceStats.mostUsed?.distance}
                unit="km"
                privacy={privacy}
                kind="kilometers"
              />
              <RankingCard
                title="Véhicule le moins cher"
                vehicleName={vehiclePerformanceStats.cheapest?.name}
                value={vehiclePerformanceStats.cheapest?.medianCostPer100}
                unit="€/100km"
                privacy={privacy}
                kind="price"
              />
              <RankingCard
                title="Véhicule le plus gourmand"
                vehicleName={vehiclePerformanceStats.mostConsuming?.name}
                value={vehiclePerformanceStats.mostConsuming?.medianConsumption}
                unit="L/100km"
                privacy={privacy}
                kind="consumption"
              />
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-sky-200">Indicateurs principaux</h2>
              </div>
              <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Km déclarés"
                  value={displayNumber(stats.declaredKilometers, 0, privacy, 'kilometers')}
                  unit="km"
                  icon={TruckIcon}
                  variant="primary"
                />
                <StatCard
                  title="Dépense carburant"
                  value={displayNumber(stats.cost, 2, privacy, 'price')}
                  unit="€"
                  icon={BanknotesIcon}
                  variant="primary"
                />
                <StatCard
                  title="Dépense entretien"
                  value={displayNumber(maintenanceStats.totalCost, 2, privacy, 'price')}
                  unit="€"
                  icon={WrenchScrewdriverIcon}
                  variant="primary"
                />
                <StatCard
                  title="Coût /100km"
                  value={displayNumber(medianCostPer100, 2, privacy, 'price')}
                  unit="€/100km"
                  icon={BanknotesIcon}
                  variant="primary"
                />
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Indicateurs secondaires</h2>
              </div>
              <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Nombre de véhicules"
                value={displayNumber(statisticsData.vehicles.length, 0, privacy, 'count')}
                unit=""
                icon={TruckIcon}
              />
              <StatCard
                title="Nombre de relevés"
                value={displayNumber(releves.length, 0, privacy, 'count')}
                unit=""
                icon={ChartBarIcon}
              />
              <StatCard
                title="Nombre d'entretiens"
                value={displayNumber(statisticsData.entretienRealises.length, 0, privacy, 'count')}
                unit=""
                icon={WrenchScrewdriverIcon}
              />
              <StatCard
                title="Consommation médiane"
                value={displayNumber(medianConsumption, 2, privacy, 'consumption')}
                unit="L/100km"
                icon={FireIcon}
              />
              </div>
            </section>

            <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.65fr)]">
              <ChartPanel
                title="Kilométrage"
                subtitle={`${mileageView === 'distance' ? 'Kilomètres parcourus par relevé' : 'Kilométrage total des relevés'} · ${displayNumber(stats.declaredKilometers, 0, privacy, 'kilometers')} km cumulés · ${displayNumber(medianDistance, 0, privacy, 'kilometers')} km médian/relevé · ${scopeLabel}`}
                actions={(
                  <SegmentedToggle
                    value={mileageView}
                    onChange={setMileageView}
                    options={[
                      { label: 'Km total', value: 'total' },
                      { label: 'Km parcourus', value: 'distance' },
                    ]}
                  />
                )}
              >
                <MileageByVehicleChart chartData={mileageChartData} />
              </ChartPanel>
              <ChartPanel
                title="Répartition des carburants"
                subtitle={`${displayNumber(stats.litres, 2, privacy, 'consumption')} L · ${displayNumber(averagePricePerLiter, 2, privacy, 'price')} €/L moyen`}
              >
                <FuelPieChart releverDetails={releves} compact />
              </ChartPanel>
            </section>

            <section className="grid min-w-0 gap-4">
              <ChartPanel
                title="Évolution du prix du carburant"
                subtitle="Prix par carburant sur les relevés sélectionnés"
              >
                <FuelPriceLineChart releverDetails={releves} compact isShieldModeLevel2={privacy.isShieldModeLevel2} />
              </ChartPanel>
            </section>
          </>
        ) : (
          <div className="rounded-lg border border-sky-500/20 bg-slate-950/60 p-8 text-center text-slate-300">
            Aucun relevé disponible pour les véhicules sélectionnés.
          </div>
        )}
      </div>
    </main>
  );
};

export default StatisticsPage;

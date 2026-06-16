import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api, { shieldFetch } from '../services/api';
import Notification from './Notification';
import { maskAlphanumeric, maskRegistration, maskSensitiveValue, usePrivacy } from '../privacy/PrivacyContext';
import { formatPrivacyYear, roundPrivacyNumber } from '../privacy/privacyDisplay';

const apiUrl = process.env.REACT_APP_URL_LOCAL || "https://192.168.0.17:1234";
const GENERIC_VEHICLE_IMAGE = '/imageDefault.png';

const formatNumber = (value, digits = 0) => {
  if (!Number.isFinite(value)) return '-';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
};

const sortReleves = (releves = []) => {
  return [...releves].sort((a, b) => {
    const dateDiff = new Date(a.Date) - new Date(b.Date);
    if (dateDiff !== 0) return dateDiff;
    return (a.Kilometre || 0) - (b.Kilometre || 0);
  });
};

const getDistanceForIndex = (releves, index) => {
  if (index <= 0 || !releves[index] || !releves[index - 1]) return null;
  const distance = Number(releves[index].Kilometre) - Number(releves[index - 1].Kilometre);
  return distance > 0 ? distance : null;
};

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

const getAverageStats = (releves = []) => {
  const firstKilometer = Number(releves[0]?.Kilometre);
  const lastKilometer = Number(releves[releves.length - 1]?.Kilometre);
  const declaredKilometers = Number.isFinite(firstKilometer) && Number.isFinite(lastKilometer) && lastKilometer > firstKilometer
    ? lastKilometer - firstKilometer
    : null;

  const intervalValues = releves.reduce((acc, releve, index) => {
    const distance = getDistanceForIndex(releves, index);
    if (!distance) return acc;

    const litres = Number(releve.LitreTotal);
    acc.distances.push(distance);
    if (Number.isFinite(litres) && litres > 0) acc.consumptions.push((litres / distance) * 100);
    return acc;
  }, {
    distances: [],
    consumptions: [],
  });

  const fuelStats = releves.reduce((acc, releve) => {
    const litres = Number(releve.LitreTotal);
    const cost = Number(releve.PrixTotal);
    if (Number.isFinite(litres) && litres > 0) acc.litres += litres;
    if (Number.isFinite(litres) && litres > 0 && Number.isFinite(cost) && cost >= 0) acc.cost += cost;
    return acc;
  }, { litres: 0, cost: 0 });

  return {
    declaredKilometers,
    medianConsumption: getMedian(intervalValues.consumptions),
    averagePricePerLiter: fuelStats.litres > 0
      ? fuelStats.cost / fuelStats.litres
      : null,
    medianDistancePerReleve: getMedian(intervalValues.distances),
  };
};

const getVehicleImage = (vehicule) => {
  const imagePath = vehicule?.CheminImage || vehicule?.Image || vehicule?.Photo || vehicule?.imageUrl;
  if (!imagePath) return GENERIC_VEHICLE_IMAGE;
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('/uploads/')) return `${apiUrl}${imagePath}`;
  if (imagePath.startsWith('/')) return imagePath;
  return `${apiUrl}/${imagePath}`;
};

const privacyValue = (value, isPrivacyMode, isShieldModeLevel2 = false, kind) => (
  isShieldModeLevel2 ? roundPrivacyNumber(value, kind) : isPrivacyMode ? maskSensitiveValue(value) : value
);

const VehicleDashboardCard = ({ vehicleDetails }) => {
  const vehicule = vehicleDetails?.vehicule;
  const releves = useMemo(() => sortReleves(vehicleDetails?.releverDetails || []), [vehicleDetails]);
  const averageStats = useMemo(() => getAverageStats(releves), [releves]);
  const { isPrivacyMode, isShieldModeLevel2 } = usePrivacy();
  const isSold = vehicule?.EtatID !== 1;

  if (!vehicule) return null;

  return (
    <Link
      to={`/vehicule?vehicleId=${vehicule.VehiculeID}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
      aria-label={`Voir le véhicule ${vehicule.Nom}`}
    >
      <section className="overflow-hidden rounded-lg border border-sky-500/30 bg-[radial-gradient(circle_at_25%_40%,rgba(14,165,233,0.16),transparent_34%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.9))] shadow-[0_24px_80px_rgba(2,6,23,0.38)] transition duration-200 group-hover:-translate-y-0.5 group-hover:border-sky-300/60 group-hover:shadow-[0_28px_90px_rgba(14,165,233,0.22)]">
        <div className="grid gap-6 p-6 lg:grid-cols-[minmax(280px,1.1fr)_minmax(320px,0.9fr)] lg:p-8">
          <div className="relative min-h-72">
            <div className="absolute inset-x-8 bottom-6 h-24 rounded-full bg-sky-500/20 blur-3xl" />
            <img
              src={getVehicleImage(vehicule)}
              alt={vehicule.Nom}
              className="relative h-full max-h-96 w-full object-contain drop-shadow-[0_28px_45px_rgba(0,0,0,0.65)]"
            />
          </div>
          <div className="flex flex-col justify-center">
            <div className="mb-5 flex items-center gap-2 text-sm">
              <span className={`h-2.5 w-2.5 rounded-full ${isSold ? 'bg-rose-400' : 'bg-emerald-400'} shadow-[0_0_14px_currentColor]`} />
              <span className={isSold ? 'text-rose-200' : 'text-emerald-200'}>{isSold ? 'Vendu' : 'Actif'}</span>
            </div>
            <h2 className="text-3xl font-semibold text-slate-50 lg:text-4xl">{vehicule.Nom}</h2>
            <p className="mt-2 text-sm text-slate-300">
              {isShieldModeLevel2 ? formatPrivacyYear(vehicule.DateImmatriculation) : privacyValue(vehicule.DateImmatriculation ? new Date(vehicule.DateImmatriculation).getFullYear() : '-', isPrivacyMode)} · {vehicule.Type?.Nom || '-'} · {vehicule.Marque?.Nom || '-'}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[isShieldModeLevel2 ? maskAlphanumeric(vehicule.Modele) : vehicule.Modele, isPrivacyMode ? maskRegistration(vehicule.Immatriculation) : vehicule.Immatriculation, vehicule.Marque?.Nom].filter(Boolean).map((item) => (
                <span key={item} className="rounded border border-sky-500/20 bg-slate-900/70 px-3 py-1 text-xs text-slate-200">
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4">
              <div>
                <p className="text-2xl font-semibold text-slate-50">
                  {isShieldModeLevel2 ? formatNumber(roundPrivacyNumber(averageStats.declaredKilometers, 'kilometers'), 0) : privacyValue(formatNumber(averageStats.declaredKilometers, 0), isPrivacyMode)}
                </p>
                <p className="mt-1 text-xs text-slate-400">km déclarés</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-50">{formatNumber(roundPrivacyNumber(averageStats.medianConsumption, isShieldModeLevel2 ? 'consumption' : undefined), isShieldModeLevel2 ? 0 : 2)}</p>
                <p className="mt-1 text-xs text-slate-400">L/100km médian</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-50">{formatNumber(roundPrivacyNumber(averageStats.averagePricePerLiter, isShieldModeLevel2 ? 'price' : undefined), isShieldModeLevel2 ? 0 : 2)} €</p>
                <p className="mt-1 text-xs text-slate-400">Prix moyen/L</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-50">{formatNumber(roundPrivacyNumber(averageStats.medianDistancePerReleve, isShieldModeLevel2 ? 'kilometers' : undefined), 0)}</p>
                <p className="mt-1 text-xs text-slate-400">km médian/relevé</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Link>
  );
};

const DashBoardPage = () => {
  const [user, setUser] = useState(null);
  const [vehicleDetails, setVehicleDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!location.state?.notification) return;

    setNotification(location.state.notification);
    window.history.replaceState({}, document.title);
    const timeoutId = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timeoutId);
  }, [location.state]);

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

    const fetchDashboardVehicles = async () => {
      setIsLoading(true);
      try {
        const listResponse = await shieldFetch(`${apiUrl}/api/vehicule/${user.UtilisateurID}`);
        if (!listResponse.ok) {
          throw new Error('Failed to fetch vehicles');
        }

        const vehicles = await listResponse.json();
        const details = await Promise.all(
          vehicles.map(async (vehicule) => {
            const detailResponse = await shieldFetch(`${apiUrl}/api/vehicule/${user.UtilisateurID}/${vehicule.VehiculeID}`);
            if (!detailResponse.ok) {
              throw new Error(`Failed to fetch vehicle ${vehicule.VehiculeID}`);
            }
            return detailResponse.json();
          })
        );

        if (!ignore) {
          setVehicleDetails(details);
        }
      } catch (error) {
        if (!ignore) {
          console.error('Failed to fetch dashboard vehicles:', error);
          setVehicleDetails([]);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboardVehicles();

    return () => {
      ignore = true;
    };
  }, [user]);

  return (
    <main className="mx-auto max-w-7xl grow">
      <div className="space-y-6 text-neutral-100">
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            icon={notification.icon}
          />
        )}

        <header>
          <h1 className="text-2xl font-semibold text-slate-50">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Vos véhicules actifs.</p>
        </header>

        {isLoading ? (
          <div className="rounded-lg border border-sky-500/20 bg-slate-950/60 p-8 text-center text-slate-300">
            Chargement des véhicules...
          </div>
        ) : vehicleDetails.length > 0 ? (
          <div className="grid grid-cols-1 gap-8">
            {vehicleDetails.map((details) => (
              <VehicleDashboardCard key={details.vehicule?.VehiculeID} vehicleDetails={details} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-sky-500/20 bg-slate-950/60 p-8 text-center text-slate-300">
            Aucun véhicule actif trouvé.
          </div>
        )}
        </div>
    </main>
  );
};

export default DashBoardPage;

import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronUpDownIcon } from '@heroicons/react/16/solid';
import {
  ArrowPathIcon,
  BeakerIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CheckCircleIcon,
  CurrencyEuroIcon,
  MapIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import Notification from './Notification';
import api, { shieldFetch } from '../services/api';

const ReleveField = ({ label, icon: Icon, ...inputProps }) => (
  <label className="rounded-lg border border-sky-500/20 bg-slate-950/40 px-4 py-3 transition focus-within:border-sky-400/60">
    <span className="flex items-center gap-2 text-sm text-slate-300">
      {Icon && (
        <Icon className="h-4 w-4 text-slate-500" aria-hidden="true" />
      )}
      {label}
    </span>
    <input
      {...inputProps}
      className="mt-3 w-full bg-transparent text-slate-100 outline-none placeholder:text-slate-600"
    />
  </label>
);

const DropdownSelect = ({ label, value, onChange, options = [], placeholder, searchPlaceholder, renderOption }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedOption = options.find((option) => String(option.value) === String(value));
  const filteredOptions = useMemo(() => (
    options.filter((option) =>
      `${option.label || ''} ${option.description || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ), [options, searchTerm]);

  const handleSelect = (optionValue) => {
    onChange(String(optionValue));
    setDropdownOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative">
      <span className="mb-2 block text-sm text-slate-300">{label}</span>
      <button
        type="button"
        onClick={() => setDropdownOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-lg border border-sky-500/20 bg-slate-950/40 px-4 py-3 text-sm font-semibold text-white transition hover:border-sky-400/60 hover:bg-sky-500/10 focus:outline-none focus:ring-2 focus:ring-sky-400"
      >
        <span className="min-w-0 flex-1 truncate text-left">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronUpDownIcon className="h-5 w-5 shrink-0 text-sky-300" />
      </button>

      {dropdownOpen && (
        <div className="absolute z-[9999] mt-2 max-h-72 w-full overflow-auto rounded-xl border border-sky-500/20 bg-slate-950 text-sm text-slate-100 shadow-2xl shadow-sky-950/40">
          <div className="sticky top-0 z-10 bg-slate-950 px-3 py-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={searchPlaceholder || placeholder}
              className="w-full rounded-lg border border-sky-500/20 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
            />
          </div>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left font-semibold transition hover:bg-sky-500/10"
              >
                {renderOption ? renderOption(option) : <span className="truncate">{option.label}</span>}
              </button>
            ))
          ) : (
            <div className="px-4 py-4 text-center text-slate-500">Aucun résultat trouvé</div>
          )}
        </div>
      )}
    </div>
  );
};

const ReleveVehiculeSelect = ({ vehicules, selectedVehicule, setSelectedVehicule }) => (
  <DropdownSelect
    label="Véhicule"
    value={selectedVehicule}
    onChange={setSelectedVehicule}
    options={vehicules.map((vehicule) => ({
      value: vehicule.VehiculeID,
      label: vehicule.Nom,
      description: [vehicule.Modele, vehicule.Immatriculation].filter(Boolean).join(' · '),
    }))}
    placeholder="Sélectionner un véhicule"
    searchPlaceholder="Rechercher un véhicule..."
    renderOption={(option) => (
      <span className="min-w-0">
        <span className="block truncate text-white">{option.label}</span>
        {option.description && <span className="block truncate text-xs text-slate-400">{option.description}</span>}
      </span>
    )}
  />
);

const ReleveCarburantSelect = ({ carburants, selectedCarburant, setSelectedCarburant }) => (
  <DropdownSelect
    label="Carburant"
    value={selectedCarburant}
    onChange={setSelectedCarburant}
    options={carburants.map((carburant) => ({
      value: carburant.CarburantID,
      label: carburant.Nom,
    }))}
    placeholder="Sélectionner un carburant"
    searchPlaceholder="Rechercher un carburant..."
  />
);

const AddRelever = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedVehicleId = searchParams.get('vehicleId');
  const preselectedDate = searchParams.get('date');
  const getTodayInputValue = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 10);
  };
  const [user, setUser] = useState(null);
  const [notification, setNotification] = useState(null);
  const [date, setDate] = useState(preselectedDate || getTodayInputValue());
  const [kilometre, setKilometre] = useState('');
  const [prixLitre, setPrixLitre] = useState('');
  const [prixTotal, setPrixTotal] = useState('');
  const [litreTotal, setLitreTotal] = useState('');
  const [inclinaisonGauche, setInclinaisonGauche] = useState('');
  const [inclinaisonDroite, setInclinaisonDroite] = useState('');
  const [carburants, setCarburants] = useState([]);
  const [consommation, setConsommation] = useState('');
  const [selectedCarburant, setSelectedCarburant] = useState('');
  const [vehicules, setVehicules] = useState([]);
  const [selectedVehicule, setSelectedVehicule] = useState('');

  const apiUrl = process.env.REACT_APP_URL_LOCAL || "https://192.168.0.17:1234";

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
    const fetchCarburants = async () => {
      try {
        const response = await shieldFetch(`${apiUrl}/api/vehicule/carburant`);
        if (!response.ok) {
          throw new Error('Failed to fetch carburants');
        }
        const data = await response.json();
        setCarburants(data);
      } catch (error) {
        console.error('Failed to fetch carburants:', error);
      }
    };

    const fetchVehicules = async () => {
      if (user) {
        try {
          const response = await shieldFetch(`${apiUrl}/api/vehicule/${user.UtilisateurID}`);
          if (!response.ok) {
            throw new Error('Failed to fetch vehicules');
          }
          const data = await response.json();
          setVehicules(data);
          if (preselectedVehicleId && data.some((vehicule) => String(vehicule.VehiculeID) === String(preselectedVehicleId))) {
            setSelectedVehicule(preselectedVehicleId);
          }
        } catch (error) {
          console.error('Failed to fetch vehicules:', error);
        }
      }
    };

    fetchCarburants();
    fetchVehicules();
  }, [user, apiUrl, preselectedVehicleId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = {
      date: date,
      kilometre: parseFloat(kilometre),
      prixLitre: parseFloat(prixLitre),
      prixTotal: parseFloat(prixTotal),
      litreTotal: parseFloat(litreTotal),
      inclinaisonGauche: inclinaisonGauche ? parseFloat(inclinaisonGauche) : null,
      inclinaisonDroite: inclinaisonDroite ? parseFloat(inclinaisonDroite) : null,
      carburant: parseInt(selectedCarburant),
      vehicule: parseInt(selectedVehicule),
      consommation: consommation ? parseFloat(consommation) : null,
    };

    console.log("Données envoyées au backend :");
    console.table({
      API: `${apiUrl}/api/vehicule/${user.UtilisateurID}/${formData.vehicule}/add/relever`,
      date: date,
      kilometre: parseFloat(kilometre),
      prixLitre: parseFloat(prixLitre),
      prixTotal: parseFloat(prixTotal),
      litreTotal: parseFloat(litreTotal),
      inclinaisonGauche: inclinaisonGauche ? parseFloat(inclinaisonGauche) : null,
      inclinaisonDroite: inclinaisonDroite ? parseFloat(inclinaisonDroite) : null,
      carburant: parseInt(selectedCarburant),
      vehicule: parseInt(selectedVehicule),
      consommation: consommation ? parseFloat(consommation) : null,
    });

    try {
      const response = await shieldFetch(`${apiUrl}/api/vehicule/${user.UtilisateurID}/${formData.vehicule}/add/relever`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setNotification({ message: 'Relevé ajouté avec succès.', type: 'success', icon: "✅" });
        setTimeout(() => setNotification(null), 5000);
        // Réinitialiser les champs du formulaire
        setDate(preselectedDate || getTodayInputValue());
        setKilometre('');
        setPrixLitre('');
        setPrixTotal('');
        setLitreTotal('');
        setConsommation('');
        setInclinaisonGauche('');
        setInclinaisonDroite('');
        setSelectedCarburant('');
        setSelectedVehicule(preselectedVehicleId || '');
      } else {
        const errorData = await response.json();
        setNotification({ message: errorData.error || 'Erreur lors de l\'ajout du relevé.', type: 'error', icon: "⚠️" });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (error) {
      console.error('Erreur lors de la requête API :', error);
      setNotification({ message: 'Erreur interne du serveur.', type: 'error', icon: "⚠️" });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          icon={notification.icon}
        />
      )}

      <header>
        <h1 className="text-2xl font-semibold text-slate-50">Relevés</h1>
        <p className="mt-1 text-sm text-slate-400">Ajoutez un plein et ses mesures au véhicule sélectionné.</p>
      </header>

      <section className="rounded-lg border border-sky-500/30 bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.16),transparent_30%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.9))] shadow-[0_24px_80px_rgba(2,6,23,0.38)]">
        <div className="border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-sky-300">Nouveau relevé</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-50">Données de carburant et kilométrage</h2>
            </div>
            <span className="inline-flex items-center gap-2 rounded border border-sky-500/20 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-200">
              <CheckCircleIcon className="h-4 w-4 text-emerald-300" />
              Saisie active
            </span>
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.36fr)]">
          <div className="min-w-0 rounded-lg border border-sky-500/20 bg-slate-950/60 p-5">
            <h3 className="text-base font-semibold text-slate-50">Informations du relevé</h3>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <ReleveField
                label="Date"
                icon={CalendarDaysIcon}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
              <ReleveField
                label="Kilométrage"
                icon={MapIcon}
                placeholder="17829"
                type="number"
                step="0"
                value={kilometre}
                onChange={(e) => setKilometre(e.target.value)}
                required
              />
              <ReleveField
                label="Prix par litre"
                icon={CurrencyEuroIcon}
                placeholder="1.789"
                type="number"
                step="0.001"
                value={prixLitre}
                onChange={(e) => setPrixLitre(e.target.value)}
                required
              />
              <ReleveField
                label="Prix total"
                icon={CurrencyEuroIcon}
                placeholder="25.59"
                type="number"
                step="0.01"
                value={prixTotal}
                onChange={(e) => setPrixTotal(e.target.value)}
                required
              />
              <ReleveField
                label="Litres totaux"
                icon={BeakerIcon}
                placeholder="16.14"
                type="number"
                step="0.01"
                value={litreTotal}
                onChange={(e) => setLitreTotal(e.target.value)}
                required
              />
              <ReleveField
                label="Consommation"
                icon={ChartBarIcon}
                placeholder="5.4"
                type="number"
                step="0.01"
                value={consommation}
                onChange={(e) => setConsommation(e.target.value)}
                required
              />
              <ReleveField
                label="Inclinaison gauche"
                placeholder="23"
                type="number"
                step="0.01"
                value={inclinaisonGauche}
                onChange={(e) => setInclinaisonGauche(e.target.value)}
              />
              <ReleveField
                label="Inclinaison droite"
                placeholder="88"
                type="number"
                step="0.01"
                value={inclinaisonDroite}
                onChange={(e) => setInclinaisonDroite(e.target.value)}
              />
            </div>
          </div>

          <aside className="min-w-0 rounded-lg border border-sky-500/20 bg-slate-950/60 p-5">
            <h3 className="text-base font-semibold text-slate-50">Affectation</h3>
            <div className="mt-5 space-y-4">
              <ReleveVehiculeSelect vehicules={vehicules} selectedVehicule={selectedVehicule} setSelectedVehicule={setSelectedVehicule} />
              <ReleveCarburantSelect carburants={carburants} selectedCarburant={selectedCarburant} setSelectedCarburant={setSelectedCarburant} />
            </div>
            <div className="mt-6 rounded-lg border border-white/10 bg-slate-900/50 p-4">
              <p className="text-sm font-semibold text-slate-100">Résumé</p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Date</span>
                  <span className="font-medium text-slate-100">{date || '-'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Kilométrage</span>
                  <span className="font-medium text-slate-100">{kilometre ? `${kilometre} km` : '-'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Total</span>
                  <span className="font-medium text-slate-100">{prixTotal ? `${prixTotal} €` : '-'}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => {
              setDate(preselectedDate || getTodayInputValue());
              setKilometre('');
              setPrixLitre('');
              setPrixTotal('');
              setLitreTotal('');
              setConsommation('');
              setInclinaisonGauche('');
              setInclinaisonDroite('');
              setSelectedCarburant('');
              setSelectedVehicule(preselectedVehicleId || '');
            }}
            className="inline-flex items-center gap-2 rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-400"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Réinitialiser
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400"
          >
            <PlusIcon className="h-4 w-4" />
            Ajouter le relevé
          </button>
        </div>
      </section>
    </form>
  );
};

export default AddRelever;

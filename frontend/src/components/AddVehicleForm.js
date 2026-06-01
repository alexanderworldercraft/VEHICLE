import React, { useMemo, useState, useEffect } from 'react';
import { ChevronUpDownIcon } from '@heroicons/react/16/solid';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  IdentificationIcon,
  PlusIcon,
  TagIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import Notification from "./Notification";
import api, { shieldFetch } from '../services/api';
import { useNavigate } from 'react-router-dom';

const apiUrl = process.env.REACT_APP_URL_LOCAL || "https://192.168.0.17:1234";

const VehicleField = ({ label, icon: Icon, ...inputProps }) => (
  <label className="rounded-lg border border-sky-500/20 bg-slate-950/40 px-4 py-3 transition focus-within:border-sky-400/60">
    <span className="flex items-center gap-2 text-sm text-slate-300">
      {Icon && <Icon className="h-4 w-4 text-slate-500" aria-hidden="true" />}
      {label}
    </span>
    <input
      {...inputProps}
      className="mt-3 w-full bg-transparent text-slate-100 outline-none placeholder:text-slate-600"
    />
  </label>
);

const DropdownSelect = ({ label, value, onChange, options = [], placeholder, searchPlaceholder }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectedOption = options.find((option) => String(option.value) === String(value));
  const filteredOptions = useMemo(() => (
    options.filter((option) =>
      `${option.label || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
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
                <span className="truncate text-white">{option.label}</span>
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

const AddVehicleForm = ({ onAddVehicle, onRefresh }) => {

  const [nom, setNom] = useState("");
  const [modele, setModele] = useState("");
  const [immatriculation, setImmatriculation] = useState("");
  const [dateFirstImmatriculation, setDateFirstImmatriculation] = useState("");

  const [types, setTypes] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState("");

  const [marques, setMarques] = useState([]);
  const [selectedMarques, setSelectedMarques] = useState("");

  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const [notification, setNotification] = useState(null);
  const typeOptions = useMemo(() => types.map((type) => ({
    value: type.TypeID,
    label: type.Nom,
  })), [types]);
  const marqueOptions = useMemo(() => marques.map((marque) => ({
    value: marque.MarqueID,
    label: marque.Nom,
  })), [marques]);

  const showNotification = (message, type = "success", icon = "ℹ️") => {
    setNotification({ message, type, icon });
    setTimeout(() => setNotification(null), 5000);
  };

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

  // Récupérer les types depuis l'API
  const fetchTypes = async () => {
    try {
      const response = await shieldFetch(`${apiUrl}/api/vehicule/type`);
      const data = await response.json();
      setTypes(data);
    } catch (error) {
      showNotification("Erreur lors de la récupération des types.", "⚠️", "error");
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  // Récupérer les marques depuis l'API
  const fetchMarques = async () => {
    try {
      const response = await shieldFetch(`${apiUrl}/api/vehicule/marque`);
      const data = await response.json();
      setMarques(data);
    } catch (error) {
      showNotification("Erreur lors de la récupération des types.", "⚠️", "error");
    }
  };

  useEffect(() => {
    fetchMarques();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = {
      nom: nom.trim(),
      modele: modele.trim(),
      immatriculation: immatriculation.trim(),
      dateFirstImmatriculation: dateFirstImmatriculation.trim(),
      types: selectedTypes.trim(),
      marques: selectedMarques.trim(),
    };

    console.log("Données envoyées au backend :", formData);

    try {
      const response = await shieldFetch(`${apiUrl}/api/vehicule/${user.UtilisateurID}/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        showNotification("Véhicule ajouté avec succès.", "success", "✅");
        setNom("");
        setModele("");
        setImmatriculation("");
        setDateFirstImmatriculation("");
        setSelectedTypes("");
        setSelectedMarques("");
        onRefresh(); // Recharge la liste des véhicules
      } else {
        showNotification(data.error || "Erreur lors de l'ajout du véhicule.", "error", "⚠️");
      }
    } catch (error) {
      console.error("Erreur :", error);
      showNotification("Erreur interne du serveur.", "error", "⚠️");
    }
  };

  const resetForm = () => {
    setNom("");
    setModele("");
    setImmatriculation("");
    setDateFirstImmatriculation("");
    setSelectedTypes("");
    setSelectedMarques("");
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
        <h1 className="text-2xl font-semibold text-slate-50">Ajouter un nouveau véhicule</h1>
        <p className="mt-1 text-sm text-slate-400">Renseignez l'identité du véhicule pour l'ajouter à votre garage.</p>
      </header>

      <section className="rounded-lg border border-sky-500/30 bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.16),transparent_30%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.9))] shadow-[0_24px_80px_rgba(2,6,23,0.38)]">
        <div className="border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-sky-300">Nouveau véhicule</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-50">Identité et classification</h2>
            </div>
            <span className="inline-flex items-center gap-2 rounded border border-sky-500/20 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-200">
              <TruckIcon className="h-4 w-4 text-sky-300" />
              Saisie active
            </span>
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.36fr)]">
          <div className="min-w-0 rounded-lg border border-sky-500/20 bg-slate-950/60 p-5">
            <h3 className="text-base font-semibold text-slate-50">Informations du véhicule</h3>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <VehicleField
                label="Nom du véhicule"
                icon={TagIcon}
                maxLength={100}
                placeholder="Choupette"
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
              />
              <VehicleField
                label="Modèle du véhicule"
                icon={TruckIcon}
                maxLength={100}
                placeholder="Coccinelle"
                type="text"
                value={modele}
                onChange={(e) => setModele(e.target.value)}
                required
              />
              <VehicleField
                label="Immatriculation"
                icon={IdentificationIcon}
                maxLength={20}
                placeholder="VW-969-DE"
                type="text"
                value={immatriculation}
                onChange={(e) => setImmatriculation(e.target.value)}
                required
              />
              <VehicleField
                label="Première immatriculation"
                icon={CalendarDaysIcon}
                type="date"
                value={dateFirstImmatriculation}
                onChange={(e) => setDateFirstImmatriculation(e.target.value)}
                required
              />
            </div>
          </div>

          <aside className="min-w-0 rounded-lg border border-sky-500/20 bg-slate-950/60 p-5">
            <h3 className="text-base font-semibold text-slate-50">Classification</h3>
            <div className="mt-5 space-y-4">
              <DropdownSelect
                label="Type"
                value={selectedTypes}
                onChange={setSelectedTypes}
                options={typeOptions}
                placeholder="Sélectionner un type"
                searchPlaceholder="Rechercher un type..."
              />
              <DropdownSelect
                label="Marque"
                value={selectedMarques}
                onChange={setSelectedMarques}
                options={marqueOptions}
                placeholder="Sélectionner une marque"
                searchPlaceholder="Rechercher une marque..."
              />
            </div>
            <div className="mt-6 rounded-lg border border-white/10 bg-slate-900/50 p-4">
              <p className="text-sm font-semibold text-slate-100">Résumé</p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Nom</span>
                  <span className="truncate font-medium text-slate-100">{nom || '-'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Modèle</span>
                  <span className="truncate font-medium text-slate-100">{modele || '-'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Immatriculation</span>
                  <span className="truncate font-medium text-slate-100">{immatriculation || '-'}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={resetForm}
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
            Ajouter le véhicule
          </button>
        </div>
      </section>
    </form>
  );
};

export default AddVehicleForm;

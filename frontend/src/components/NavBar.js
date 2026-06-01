import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, Menu, Transition } from '@headlessui/react';
import {
  ArrowPathIcon,
  Bars3Icon,
  BellIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  TruckIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Link, NavLink, useLocation } from 'react-router-dom';
import api, { shieldFetch } from '../services/api';
import { maskAlphanumeric, usePrivacy } from '../privacy/PrivacyContext';

const apiBaseUrl = process.env.REACT_APP_URL_LOCAL;
const appVersion = process.env.REACT_APP_VER || '0.0.0';
const defaultImage = 'https://via.placeholder.com/150?text=Profile';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function getUserImageSrc(user) {
  if (!user?.CheminImage) return defaultImage;
  if (user.CheminImage.startsWith('http')) return user.CheminImage;
  if (user.CheminImage.startsWith('/uploads/')) return `${apiBaseUrl}${user.CheminImage}`;
  return user.CheminImage;
}

function VehicleLogo() {
  return (
    <Link to="/vehicule" className="flex items-center gap-3" aria-label="Vehicle">
      <span className="relative grid size-9 place-items-center">
        <svg viewBox="0 0 48 48" className="size-9 drop-shadow-[0_0_14px_rgba(14,165,233,0.65)]" aria-hidden="true">
          <path
            d="M7 7h8.8l8.1 24.6L32.3 7H41L25.9 41h-5.2L7 7Z"
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M15 7h9.1l3.8 10.5L32.3 7"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-[15px] font-black uppercase tracking-[0.12em] text-white">Vehicle</span>
    </Link>
  );
}

function NavItem({ item, closeMenu }) {
  const Icon = item.icon;
  const content = (
    <>
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <span className="truncate">{item.name}</span>
    </>
  );

  const baseClass =
    'group flex h-12 items-center gap-3 rounded-xl px-4 text-sm font-semibold transition duration-200';

  if (item.disabled) {
    return (
      <button
        type="button"
        disabled
        className={`${baseClass} w-full cursor-not-allowed border border-transparent text-slate-500`}
        title={item.disabledTitle || 'Disponible prochainement'}
      >
        {content}
      </button>
    );
  }

  return (
    <NavLink
      to={item.href}
      onClick={closeMenu}
      className={({ isActive }) => classNames(
        baseClass,
        isActive
          ? 'border border-sky-400/45 bg-sky-500/15 text-white shadow-lg shadow-sky-950/40'
          : 'border border-transparent text-slate-300 hover:border-sky-400/30 hover:bg-sky-500/10 hover:text-white'
      )}
    >
      {content}
    </NavLink>
  );
}

function VehiclesDropdown({ activeVehicles, soldVehicles, closeMenu, isPrivacyMode, isShieldModeLevel2 }) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredActiveVehicles = useMemo(() => {
    return activeVehicles.filter((vehicle) =>
      `${vehicle.Nom || ''} ${vehicle.Modele || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activeVehicles, searchTerm]);

  const filteredSoldVehicles = useMemo(() => {
    return soldVehicles.filter((vehicle) =>
      `${vehicle.Nom || ''} ${vehicle.Modele || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [soldVehicles, searchTerm]);

  const renderVehicleLinks = (vehicles, sold = false) => (
    vehicles.map((vehicle) => (
      <Link
        key={vehicle.VehiculeID}
        to={`/vehicule?vehicleId=${vehicle.VehiculeID}`}
        onClick={() => {
          setOpen(false);
          closeMenu?.();
        }}
        className={classNames(
          'flex items-center justify-between gap-3 px-4 py-3 font-semibold transition duration-150 hover:bg-sky-500/10 hover:text-white',
          sold ? 'text-slate-400' : 'text-slate-200'
        )}
      >
        <span className="min-w-0">
          <span className="block truncate">{vehicle.Nom}</span>
          {vehicle.Modele && <span className="block truncate text-xs font-medium text-slate-500">{isShieldModeLevel2 ? maskAlphanumeric(vehicle.Modele) : vehicle.Modele}</span>}
        </span>
        <ChevronRightIcon className="size-4 shrink-0 text-sky-300" aria-hidden="true" />
      </Link>
    ))
  );

  return (
    <div className={open ? 'relative z-30' : 'relative'}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={classNames(
          'flex h-12 w-full items-center justify-between rounded-xl border px-4 text-sm font-semibold transition duration-200',
          open
            ? 'border-sky-400/45 bg-sky-500/15 text-white shadow-lg shadow-sky-950/40'
            : 'border-transparent text-slate-300 hover:border-sky-400/30 hover:bg-sky-500/10 hover:text-white'
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          <TruckIcon className="size-5 shrink-0" aria-hidden="true" />
          <span className="truncate">Véhicules</span>
        </span>
        <ChevronRightIcon
          className={classNames('size-4 shrink-0 transition duration-200 lg:block hidden', open && 'rotate-180')}
          aria-hidden="true"
        />
        <ChevronDownIcon
          className={classNames('size-4 shrink-0 transition duration-200 lg:hidden', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="mt-2 w-full overflow-hidden rounded-xl border border-sky-500/20 bg-slate-950 text-sm shadow-2xl shadow-sky-950/40 lg:absolute lg:left-[calc(100%+0.75rem)] lg:top-0 lg:mt-0 lg:w-80">
          <div className="border-b border-white/10 p-3">
            <div className="flex items-center gap-2 rounded-lg border border-sky-500/20 bg-slate-900/80 px-3 py-2">
              <MagnifyingGlassIcon className="size-4 text-sky-300" aria-hidden="true" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Rechercher un véhicule..."
                className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="max-h-72 overflow-auto py-2">
            {isPrivacyMode ? (
              <button
                type="button"
                disabled
                className="mx-2 mb-2 flex w-[calc(100%-1rem)] cursor-not-allowed items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 font-semibold text-emerald-100/60"
                title="Verrouillé par Shield Mode"
              >
                <PlusIcon className="size-4 shrink-0" aria-hidden="true" />
                <span>Ajouter un véhicule</span>
              </button>
            ) : (
              <Link
                to="/vehicule?addVehicle=true"
                onClick={() => {
                  setOpen(false);
                  closeMenu?.();
                }}
                className="mx-2 mb-2 flex items-center gap-3 rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-3 font-semibold text-sky-100 transition duration-150 hover:border-sky-400/50 hover:bg-sky-500/20"
              >
                <PlusIcon className="size-4 shrink-0" aria-hidden="true" />
                <span>Ajouter un véhicule</span>
              </Link>
            )}
            {filteredActiveVehicles.length > 0 || filteredSoldVehicles.length > 0 ? (
              <>
                <div className="px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Actifs</div>
                {filteredActiveVehicles.length > 0 ? (
                  renderVehicleLinks(filteredActiveVehicles)
                ) : (
                  <div className="px-4 py-3 text-sm font-semibold text-slate-600">Aucun véhicule actif</div>
                )}

                <div className="mt-2 border-t border-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Vendus</div>
                {filteredSoldVehicles.length > 0 ? (
                  renderVehicleLinks(filteredSoldVehicles, true)
                ) : (
                  <div className="px-4 py-3 text-sm font-semibold text-slate-600">Aucun véhicule vendu</div>
                )}
              </>
            ) : (
              <div className="px-4 py-5 text-center font-semibold text-slate-500">Aucun véhicule trouvé</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarContent({ user, activeVehicles, soldVehicles, closeMenu, isPrivacyMode, isShieldModeLevel2 }) {
  const dashboardItem = { name: 'Dashboard', href: '/dashboard', icon: Squares2X2Icon };
  const navItems = [
    { name: 'Relevés', href: '/relever', icon: ChartBarIcon, disabled: isPrivacyMode, disabledTitle: 'Verrouillé par Shield Mode' },
    { name: 'Simulations', href: '/simulation', icon: ArrowPathIcon },
    { name: 'Entretien', href: '/entretien', icon: WrenchScrewdriverIcon },
    { name: 'Statistiques', icon: ChartBarIcon, disabled: true },
    { name: 'Paramètres', href: '/settings', icon: Cog6ToothIcon, disabled: isPrivacyMode, disabledTitle: 'Verrouillé par Shield Mode' },
  ];

  return (
    <div className="flex h-full flex-col border-r border-sky-500/20 bg-slate-950/95 text-slate-100 shadow-2xl shadow-sky-950/40 backdrop-blur-xl">
      <div className="flex h-24 items-center px-6">
        <VehicleLogo />
      </div>

      <nav className="flex-1 space-y-2 px-4">
        <NavItem item={dashboardItem} closeMenu={closeMenu} />
        <VehiclesDropdown activeVehicles={activeVehicles} soldVehicles={soldVehicles} closeMenu={closeMenu} isPrivacyMode={isPrivacyMode} isShieldModeLevel2={isShieldModeLevel2} />
        {navItems.map((item) => (
          <NavItem key={item.name} item={item} closeMenu={closeMenu} />
        ))}
      </nav>

      <div className="space-y-3 px-4 pb-6">
        <Link
          to="/updates"
          onClick={closeMenu}
          className="flex h-11 items-center gap-3 rounded-xl border border-sky-500/20 bg-slate-900/70 px-4 text-sm font-semibold text-slate-300 transition duration-200 hover:border-sky-400/45 hover:bg-sky-500/10 hover:text-white"
        >
          <ArrowPathIcon className="size-5" aria-hidden="true" />
          <span>Mises à jour</span>
        </Link>
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/50 p-3">
          <img
            src={getUserImageSrc(user)}
            alt=""
            className="size-9 rounded-full object-cover ring-1 ring-sky-400/30"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{user?.Surnom || 'Utilisateur'}</p>
            <p className="truncate text-xs text-slate-500">v{appVersion}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [activeVehicles, setActiveVehicles] = useState([]);
  const [soldVehicles, setSoldVehicles] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const location = useLocation();
  const { isPrivacyMode, isShieldModeLevel2, enablePrivacyMode, enablePrivacyModeLevel2, disablePrivacyMode, getPrivacyUser } = usePrivacy();
  const displayUser = useMemo(() => getPrivacyUser(user), [getPrivacyUser, user]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get('/users/me');
        setUser(response.data);
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!user?.UtilisateurID) return;

      try {
        const [activeResponse, soldResponse] = await Promise.all([
          shieldFetch(`${apiBaseUrl}/api/vehicule/${user.UtilisateurID}`),
          shieldFetch(`${apiBaseUrl}/api/vehicule/${user.UtilisateurID}/sold`),
        ]);
        if (!activeResponse.ok || !soldResponse.ok) throw new Error('Failed to fetch vehicles');
        const [activeResult, soldResult] = await Promise.all([
          activeResponse.json(),
          soldResponse.json(),
        ]);
        setActiveVehicles(Array.isArray(activeResult) ? activeResult : []);
        setSoldVehicles(Array.isArray(soldResult) ? soldResult : []);
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
      }
    };

    fetchVehicles();
  }, [user, location.pathname, location.search]);

  const handleShieldToggle = () => {
    if (!isPrivacyMode) {
      enablePrivacyMode();
      return;
    }

    setUnlockError('');
    setUnlockPassword('');
    setUnlockModalOpen(true);
  };

  const handleUnlockSubmit = async (event) => {
    event.preventDefault();
    if (!user?.Surnom || !unlockPassword) return;

    setIsUnlocking(true);
    setUnlockError('');

    try {
      const response = await api.post('/users/login', {
        surnom: user.Surnom,
        motDePasse: unlockPassword,
      });

      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
      }

      disablePrivacyMode();
      setUnlockModalOpen(false);
      setUnlockPassword('');
    } catch (error) {
      setUnlockError('Mot de passe incorrect.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const pageLabel = useMemo(() => {
    if (location.pathname === '/relever') return 'vos relevés';
    if (location.pathname === '/simulation') return 'vos simulations';
    if (location.pathname === '/entretien') return 'vos entretiens';
    if (location.pathname === '/settings') return 'vos paramètres';
    if (location.pathname === '/updates') return 'les mises à jour';
    if (location.pathname === '/vehicule') return 'vos véhicules';
    return 'vos véhicules';
  }, [location.pathname]);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <SidebarContent user={displayUser} activeVehicles={activeVehicles} soldVehicles={soldVehicles} isPrivacyMode={isPrivacyMode} isShieldModeLevel2={isShieldModeLevel2} />
      </aside>

      <Transition show={mobileMenuOpen} as={React.Fragment}>
        <Dialog className="relative z-50 lg:hidden" onClose={setMobileMenuOpen}>
          <Transition.Child
            as={React.Fragment}
            enter="transition-opacity ease-linear duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-950/70" />
          </Transition.Child>
          <div className="fixed inset-0 flex">
            <Transition.Child
              as={React.Fragment}
              enter="transition ease-in-out duration-200 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-200 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative w-80 max-w-[88vw]">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="absolute right-3 top-3 z-10 rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  <span className="sr-only">Fermer le menu</span>
                  <XMarkIcon className="size-6" aria-hidden="true" />
                </button>
                <SidebarContent user={displayUser} activeVehicles={activeVehicles} soldVehicles={soldVehicles} closeMenu={() => setMobileMenuOpen(false)} isPrivacyMode={isPrivacyMode} isShieldModeLevel2={isShieldModeLevel2} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      <header className="sticky top-0 z-30 border-b border-sky-500/10 bg-slate-950/80 backdrop-blur-xl lg:pl-64">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl border border-sky-500/20 bg-slate-900/70 p-2 text-slate-200 transition hover:border-sky-400/45 hover:bg-sky-500/10 lg:hidden"
            >
              <span className="sr-only">Ouvrir le menu</span>
              <Bars3Icon className="size-6" aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-black text-white">
                Bonjour, {displayUser?.Surnom || 'Utilisateur'}
              </h1>
              <p className="mt-1 truncate text-sm font-medium text-slate-400">Voici l'état de {pageLabel} aujourd'hui.</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={handleShieldToggle}
              aria-pressed={isPrivacyMode}
              title={isPrivacyMode ? 'Déverrouiller Shield Mode' : 'Activer Shield Mode'}
              className={classNames(
                'inline-flex items-center gap-2 rounded-xl border p-2.5 text-sm font-semibold transition',
                isShieldModeLevel2
                  ? 'border-red-400/50 bg-red-500/15 text-red-100 shadow-lg shadow-red-950/30 hover:border-red-300 hover:bg-red-500/20'
                  : isPrivacyMode
                  ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-100 shadow-lg shadow-emerald-950/30 hover:border-emerald-300 hover:bg-emerald-500/20'
                  : 'border-sky-500/20 bg-slate-900/70 text-slate-300 hover:border-sky-400/45 hover:bg-sky-500/10 hover:text-white'
              )}
            >
              <span className="sr-only">Shield Mode</span>
              <ShieldCheckIcon className="size-5" aria-hidden="true" />
              <span className="hidden sm:inline">{isShieldModeLevel2 ? 'Shield 2 actif' : isPrivacyMode ? 'Shield actif' : 'Shield'}</span>
            </button>

            <button
              type="button"
              className="relative rounded-xl border border-sky-500/20 bg-slate-900/70 p-2.5 text-slate-300 transition hover:border-sky-400/45 hover:bg-sky-500/10 hover:text-white"
            >
              <span className="sr-only">Notifications</span>
              <BellIcon className="size-5" aria-hidden="true" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500 ring-2 ring-slate-950" />
            </button>

            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center gap-3 rounded-xl border border-sky-500/20 bg-slate-900/70 p-1.5 pr-3 text-sm font-semibold text-slate-200 transition hover:border-sky-400/45 hover:bg-sky-500/10 hover:text-white">
                <img
                  src={getUserImageSrc(displayUser)}
                  alt=""
                  className="size-8 rounded-full object-cover"
                />
                <span className="hidden max-w-28 truncate sm:block">{displayUser?.Surnom || 'Profil'}</span>
                <ChevronDownIcon className="hidden size-4 sm:block" aria-hidden="true" />
              </Menu.Button>
              <Menu.Items className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-sky-500/20 bg-slate-950 text-sm shadow-2xl shadow-sky-950/50 focus:outline-none">
                {[
                  { name: 'Votre profil', href: '/profile' },
                  ...(!isPrivacyMode ? [{ name: 'Paramètres', href: '/settings' }] : []),
                  ...(!isPrivacyMode && (user?.GradeID === 1 || user?.GradeID === 2) ? [{ name: 'Administration', href: '/administration' }] : []),
                ].map((item) => (
                  <Menu.Item key={item.name}>
                    {({ active }) => (
                      <Link
                        to={item.href}
                        className={classNames(
                          'block px-4 py-3 font-semibold text-slate-200',
                          active && 'bg-sky-500/10 text-white'
                        )}
                      >
                        {item.name}
                      </Link>
                    )}
                  </Menu.Item>
                ))}
                <Menu.Item>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={() => {
                        if (isPrivacyMode) return;
                        localStorage.removeItem('token');
                        localStorage.setItem('vehicleLogoutAt', String(Date.now()));
                        window.location.href = '/login';
                      }}
                      disabled={isPrivacyMode}
                      title={isPrivacyMode ? 'Verrouillé par Shield Mode' : undefined}
                      className={classNames(
                        'block w-full px-4 py-3 text-left font-semibold text-slate-200 disabled:cursor-not-allowed disabled:opacity-50',
                        active && !isPrivacyMode && 'bg-sky-500/10 text-white'
                      )}
                    >
                      Se déconnecter
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Menu>
          </div>
        </div>
      </header>

      <Transition show={unlockModalOpen} as={React.Fragment}>
        <Dialog className="relative z-50" onClose={() => !isUnlocking && setUnlockModalOpen(false)}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className={classNames(
                'w-full max-w-md rounded-xl border bg-slate-950 p-6 text-slate-100 shadow-2xl',
                isShieldModeLevel2
                  ? 'border-red-500/25 shadow-red-950/40'
                  : 'border-emerald-500/25 shadow-emerald-950/40'
              )}>
                <Dialog.Title className="text-lg font-semibold text-white">
                  {isShieldModeLevel2 ? 'Désactiver Shield Mode 2' : 'Désactiver Shield Mode'}
                </Dialog.Title>
                <p className="mt-2 text-sm text-slate-400">Entrez votre mot de passe pour restaurer les informations sensibles.</p>
                <form onSubmit={handleUnlockSubmit} className="mt-5 space-y-4">
                  <div>
                    <label htmlFor="shield-password" className="block text-xs font-semibold uppercase text-slate-400">Mot de passe</label>
                    <input
                      id="shield-password"
                      type="password"
                      value={unlockPassword}
                      onChange={(event) => setUnlockPassword(event.target.value)}
                      className="mt-1 block w-full rounded-md border-0 bg-slate-900/80 px-3 py-2 text-slate-100 ring-1 ring-inset ring-slate-700 focus:ring-2 focus:ring-emerald-500"
                      autoComplete="current-password"
                      autoFocus
                      required
                    />
                  </div>
                  {unlockError && <p className="text-sm font-semibold text-rose-300">{unlockError}</p>}
                  <div className="flex flex-wrap justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setUnlockModalOpen(false)}
                      disabled={isUnlocking}
                      className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Annuler
                    </button>
                    {!isShieldModeLevel2 && (
                      <button
                        type="button"
                        onClick={() => {
                          enablePrivacyModeLevel2();
                          setUnlockModalOpen(false);
                          setUnlockPassword('');
                          setUnlockError('');
                        }}
                        disabled={isUnlocking}
                        className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 hover:border-red-300 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Passer au niveau 2
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isUnlocking}
                      className={classNames(
                        'rounded-md px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60',
                        isShieldModeLevel2 ? 'bg-red-500 hover:bg-red-400' : 'bg-emerald-500 hover:bg-emerald-400'
                      )}
                    >
                      {isUnlocking ? 'Vérification...' : 'Déverrouiller'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}

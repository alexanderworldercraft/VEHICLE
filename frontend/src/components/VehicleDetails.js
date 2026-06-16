import React, { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { Menu, Transition } from '@headlessui/react';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  FireIcon,
  MapIcon,
  NoSymbolIcon,
  PencilSquareIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Notification from './Notification';
import ConfirmationModal from './ConfirmationModal';
import FuelPieChart from './FuelPieChart';
import InclinationBarChart from './InclinationBarChart';
import FuelConsumptionLineChart from './FuelConsumptionLineChart';
import FuelPriceLineChart from './FuelPriceLineChart';
import KilometerEvolutionLineChart from './KilometerEvolutionLineChart';
import { shieldFetch } from '../services/api';
import { maskAlphanumeric, maskRegistration, maskSensitiveValue, usePrivacy } from '../privacy/PrivacyContext';
import { formatPrivacyYear, roundPrivacyNumber } from '../privacy/privacyDisplay';

const apiUrl = process.env.REACT_APP_URL_LOCAL || "https://192.168.0.17:1234";
const GENERIC_VEHICLE_IMAGE = '/imageDefault.png';
const RELEVES_PER_PAGE = 10;
const CHART_LIMITS = [
  { label: '7', value: 7 },
  { label: '30', value: 30 },
  { label: '90', value: 90 },
  { label: 'Tout', value: 'all' },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const getTooltipViewportPadding = () => {
  if (typeof window === 'undefined') return 16;
  if (window.innerWidth >= 1024) return 32;
  if (window.innerWidth >= 640) return 24;
  return 16;
};

const formatNumber = (value, digits = 0) => {
  if (!Number.isFinite(value)) return '-';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getTodayInputValue = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const localDate = new Date(today.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 10);
};

const privacyValue = (value, isPrivacyMode) => (
  isPrivacyMode ? maskSensitiveValue(value) : value
);

const displayPrivacyNumber = (value, digits, isShieldModeLevel2, kind) => (
  formatNumber(roundPrivacyNumber(value, isShieldModeLevel2 ? kind : undefined), isShieldModeLevel2 ? 0 : digits)
);

const displayPrivacyDate = (date, isPrivacyMode, isShieldModeLevel2) => (
  isShieldModeLevel2 ? formatPrivacyYear(date) : privacyValue(formatDate(date), isPrivacyMode)
);

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

const getConsumptionForIndex = (releves, index) => {
  const releve = releves[index];
  const distance = getDistanceForIndex(releves, index);
  const litres = Number(releve?.LitreTotal);
  if (!distance || !Number.isFinite(litres) || litres <= 0) return null;

  return (litres / distance) * 100;
};

const getCostPer100ForIndex = (releves, index) => {
  const distance = getDistanceForIndex(releves, index);
  const total = Number(releves[index]?.PrixTotal);
  if (!distance || !Number.isFinite(total)) return null;
  return (total / distance) * 100;
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
    const cost = Number(releve.PrixTotal);

    acc.distances.push(distance);
    if (Number.isFinite(litres) && litres > 0) acc.consumptions.push((litres / distance) * 100);
    if (Number.isFinite(cost) && cost >= 0) acc.costsPer100.push((cost / distance) * 100);
    return acc;
  }, {
    distances: [],
    consumptions: [],
    costsPer100: [],
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
    medianCostPer100: getMedian(intervalValues.costsPer100),
    averagePricePerLiter: fuelStats.litres > 0
      ? fuelStats.cost / fuelStats.litres
      : null,
    medianDistancePerReleve: getMedian(intervalValues.distances),
    totalExpense: releves.reduce((total, releve) => {
      const value = Number(releve.PrixTotal);
      return Number.isFinite(value) ? total + value : total;
    }, 0),
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

const getDateInputValue = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().slice(0, 10);
};

const buildMetric = ({ title, value, unit, current, previous, icon: Icon, accent, positiveIsGood = false, helper, deltaDigits }) => {
  const delta = Number.isFinite(current) && Number.isFinite(previous) ? current - previous : null;
  const isUp = delta !== null && delta > 0;
  const isGood = delta === null ? null : positiveIsGood ? delta >= 0 : delta <= 0;

  return {
    title,
    value,
    unit,
    delta,
    isUp,
    isGood,
    Icon,
    accent,
    helper,
    deltaDigits,
  };
};

const MetricCard = ({ metric }) => {
  const TrendIcon = metric.isUp ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
  const deltaClass = metric.isGood === null ? 'text-slate-400' : metric.isGood ? 'text-emerald-400' : 'text-rose-400';

  return (
    <article className="min-w-0 rounded-lg border border-sky-500/20 bg-slate-950/60 p-5 shadow-[0_18px_50px_rgba(2,6,23,0.28)]">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-200">{metric.title}</p>
        <span className={`grid h-8 w-8 place-items-center rounded-full ${metric.accent}`}>
          <metric.Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-5 flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-slate-50">{metric.value}</span>
        <span className="text-sm text-slate-400">{metric.unit}</span>
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm">
        {metric.helper ? (
          <span className="text-slate-500">{metric.helper}</span>
        ) : metric.delta === null ? (
          <span className="text-slate-500">Comparaison indisponible</span>
        ) : (
          <>
            <TrendIcon className={`h-4 w-4 ${deltaClass}`} />
            <span className={deltaClass}>
              {metric.delta > 0 ? '+' : ''}{formatNumber(metric.delta, metric.deltaDigits ?? (metric.unit === 'km' ? 0 : 2))} {metric.unit}
            </span>
            <span className="text-slate-500">vs relevé précédent</span>
          </>
        )}
      </div>
    </article>
  );
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

const VehicleAddActionMenu = ({ vehicule, isDisabled }) => {
  const today = getTodayInputValue();
  const actions = [
    {
      label: 'Ajouter un relevé',
      description: 'Nouveau plein ou kilométrage',
      href: `/relever?vehicleId=${vehicule.VehiculeID}&date=${today}`,
      icon: PlusIcon,
    },
    {
      label: 'Ajouter un entretien',
      description: 'Planifié pour aujourd’hui',
      href: `/entretien?modal=add&vehicleId=${vehicule.VehiculeID}&date=${today}`,
      icon: WrenchScrewdriverIcon,
    },
  ];

  if (isDisabled) {
    return (
      <IconTooltip label="Ajouter">
        <button
          type="button"
          disabled
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-500/30 px-3 text-white/60 disabled:cursor-not-allowed"
          title="Verrouillé par Shield Mode"
          aria-label="Ajouter"
        >
          <PlusIcon className="h-4 w-4" />
          <ChevronDownIcon className="h-4 w-4" />
        </button>
      </IconTooltip>
    );
  }

  return (
    <Menu as="div" className="relative inline-flex text-left">
      <IconTooltip label="Ajouter">
        <Menu.Button
          type="button"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-sky-500 px-3 text-white shadow-lg shadow-sky-950/30 hover:bg-sky-400"
          aria-label="Ajouter"
        >
          <PlusIcon className="h-4 w-4" />
          <ChevronDownIcon className="h-4 w-4" />
        </Menu.Button>
      </IconTooltip>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 top-12 z-30 w-64 origin-top-right rounded-lg border border-sky-500/20 bg-slate-950 p-1.5 shadow-2xl shadow-slate-950/60 outline-none">
          {actions.map((action) => (
            <Menu.Item key={action.href}>
              {({ active }) => (
                <Link
                  to={action.href}
                  className={classNames(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition',
                    active ? 'bg-sky-500/10 text-slate-50' : 'text-slate-200'
                  )}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-sky-500/10 text-sky-300">
                    <action.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold">{action.label}</span>
                    <span className="block truncate text-xs text-slate-500">{action.description}</span>
                  </span>
                </Link>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

const IconTooltip = ({ label, children, placement = 'top', align = 'center' }) => {
  const tooltipRef = useRef(null);
  const [anchorPosition, setAnchorPosition] = useState(null);
  const [tooltipStyle, setTooltipStyle] = useState(null);

  useLayoutEffect(() => {
    if (!anchorPosition || !tooltipRef.current) return;

    const viewportPadding = getTooltipViewportPadding();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const preferredLeft = align === 'end'
      ? anchorPosition.left - tooltipRect.width
      : anchorPosition.left - tooltipRect.width / 2;
    const maxLeft = window.innerWidth - viewportPadding - tooltipRect.width;
    const left = Math.min(Math.max(preferredLeft, viewportPadding), Math.max(viewportPadding, maxLeft));
    const top = placement === 'bottom' ? anchorPosition.top : anchorPosition.top - tooltipRect.height;

    setTooltipStyle({
      left,
      top,
      maxWidth: `calc(100vw - ${viewportPadding * 2}px)`,
    });
  }, [align, anchorPosition, label, placement]);

  const showTooltip = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const top = placement === 'bottom' ? rect.bottom + 8 : rect.top - 8;
    const left = align === 'end' ? rect.right : rect.left + rect.width / 2;

    setAnchorPosition({ top, left });
    setTooltipStyle(null);
  };

  const hideTooltip = () => {
    setAnchorPosition(null);
    setTooltipStyle(null);
  };

  return (
    <>
      <span
        className="inline-flex"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </span>
      {anchorPosition && createPortal(
        <span
          ref={tooltipRef}
          role="tooltip"
          className="pointer-events-none fixed z-[9999] w-max max-w-56 rounded-md border border-sky-500/20 bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-slate-100 shadow-lg shadow-slate-950/40"
          style={{
            top: tooltipStyle?.top ?? anchorPosition.top,
            left: tooltipStyle?.left ?? anchorPosition.left,
            maxWidth: tooltipStyle?.maxWidth,
            visibility: tooltipStyle ? 'visible' : 'hidden',
          }}
        >
          {label}
        </span>,
        document.body
      )}
    </>
  );
};

const hasInclinationValue = (releve) => (
  (releve.InclinaisonGauche !== null && releve.InclinaisonGauche !== undefined && releve.InclinaisonGauche !== '') ||
  (releve.InclinaisonDroite !== null && releve.InclinaisonDroite !== undefined && releve.InclinaisonDroite !== '')
);

const ReleveDeleteConfirmationModal = ({ open, isDeleting, onCancel, onConfirm }) => {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center">
        <div className="w-full max-w-md rounded-lg border border-rose-500/25 bg-slate-950 p-5 text-slate-100 shadow-2xl shadow-black/60">
          <div className="mb-4 flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-rose-500/10 text-rose-300 ring-1 ring-rose-400/25">
              <TrashIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">Supprimer ce relevé ?</h3>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Cette action supprimera définitivement le relevé sélectionné. Elle est utile uniquement si l'entrée a été créée par erreur.
              </p>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="rounded-md border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 hover:border-slate-500 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="rounded-md border border-rose-400/30 bg-rose-500 px-4 py-2 text-sm font-bold text-white hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const RelevesTable = ({ rows, onEdit, onDelete, isPrivacyMode, isShieldModeLevel2 }) => {
  const shouldShowInclination = rows.some(({ releve }) => hasInclinationValue(releve));

  return (
    <div className="w-full max-w-full overflow-x-auto">
      <table className={classNames('w-full text-left text-sm', shouldShowInclination ? 'min-w-[840px]' : 'min-w-[760px]')}>
        <thead className="text-xs uppercase text-slate-500">
          <tr className="border-b border-slate-800">
            <th className="py-3 pr-4 font-semibold">Date</th>
            <th className="py-3 pr-4 font-semibold">Carburant</th>
            <th className="py-3 pr-4 font-semibold">Kilométrage</th>
            <th className="py-3 pr-4 font-semibold">Conso. réelle</th>
            <th className="py-3 pr-4 font-semibold">Prix/L</th>
            <th className="py-3 pr-4 font-semibold">Prix total</th>
            <th className="py-3 pr-4 font-semibold">Litres</th>
            {shouldShowInclination && <th className="py-3 font-semibold">Inclinaison</th>}
            {!isPrivacyMode && <th className="py-3 pl-4 font-semibold">Éditions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/80">
          {rows.map(({ releve, consumption }) => (
            <tr key={releve.ReleverID} className="text-slate-300">
              <td className="py-3 pr-4">{displayPrivacyDate(releve.Date, isPrivacyMode, isShieldModeLevel2)}</td>
              <td className="py-3 pr-4">
                <span style={{ color: releve.Carburant?.Couleur || '#86efac' }}>{releve.Carburant?.Nom || '-'}</span>
              </td>
              <td className="py-3 pr-4">
                {isShieldModeLevel2 ? displayPrivacyNumber(releve.Kilometre, 0, isShieldModeLevel2, 'kilometers') : privacyValue(formatNumber(releve.Kilometre, 0), isPrivacyMode)} km
              </td>
              <td className="py-3 pr-4">{displayPrivacyNumber(consumption, 2, isShieldModeLevel2, 'consumption')} L/100km</td>
              <td className="py-3 pr-4">{displayPrivacyNumber(releve.PrixLitre, 2, isShieldModeLevel2, 'price')} €</td>
              <td className="py-3 pr-4">
                {isShieldModeLevel2 ? displayPrivacyNumber(releve.PrixTotal, 2, isShieldModeLevel2, 'price') : privacyValue(formatNumber(releve.PrixTotal, 2), isPrivacyMode)} €
              </td>
              <td className="py-3 pr-4">{displayPrivacyNumber(releve.LitreTotal, 2, isShieldModeLevel2, 'consumption')} L</td>
              {shouldShowInclination && (
                <td className="py-3">{formatNumber(releve.InclinaisonGauche, 0)}° / {formatNumber(releve.InclinaisonDroite, 0)}°</td>
              )}
              {!isPrivacyMode && (
                <td className="py-3 pl-4">
                  <div className="flex gap-2">
                    <IconTooltip label="Modifier le relevé">
                      <button
                        type="button"
                        onClick={() => onEdit(releve)}
                        className="inline-flex items-center gap-2 rounded-md border border-sky-500/30 px-3 py-1.5 text-xs font-semibold text-sky-100 hover:border-sky-300 hover:bg-sky-500/10"
                        aria-label="Modifier le relevé"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                    </IconTooltip>
                    <IconTooltip label="Supprimer le relevé">
                      <button
                        type="button"
                        onClick={() => onDelete(releve)}
                        className="inline-flex items-center gap-2 rounded-md border border-rose-500/25 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:border-rose-300/50 hover:bg-rose-500/10"
                        aria-label="Supprimer le relevé"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </IconTooltip>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Pagination = ({ currentPage, totalPages, totalItems, onPageChange }) => {
  const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * RELEVES_PER_PAGE + 1;
  const lastItem = Math.min(currentPage * RELEVES_PER_PAGE, totalItems);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((page) => (
    page === 1 ||
    page === totalPages ||
    Math.abs(page - currentPage) <= 1
  ));
  const pageItems = pages.reduce((acc, page, index) => {
    if (index > 0 && page - pages[index - 1] > 1) {
      acc.push(`ellipsis-${page}`);
    }
    acc.push(page);
    return acc;
  }, []);

  return (
    <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="relative inline-flex items-center rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="relative ml-3 inline-flex items-center rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <p className="text-sm text-gray-300">
          Affichage <span className="font-medium">{firstItem}</span> à <span className="font-medium">{lastItem}</span> sur{' '}
          <span className="font-medium">{totalItems}</span> relevés
        </p>
        <nav aria-label="Pagination" className="isolate inline-flex -space-x-px rounded-md">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-700 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="sr-only">Previous</span>
            <ChevronLeftIcon aria-hidden="true" className="h-5 w-5" />
          </button>
          {pageItems.map((page) => (
            typeof page === 'string' ? (
              <span key={page} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-400 ring-1 ring-inset ring-gray-700">
                ...
              </span>
            ) : (
              <button
                key={page}
                type="button"
                aria-current={page === currentPage ? 'page' : undefined}
                onClick={() => onPageChange(page)}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${page === currentPage
                  ? 'z-10 bg-sky-500 text-white'
                  : 'text-gray-200 ring-1 ring-inset ring-gray-700 hover:bg-white/5'
                }`}
              >
                {page}
              </button>
            )
          ))}
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-700 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="sr-only">Next</span>
            <ChevronRightIcon aria-hidden="true" className="h-5 w-5" />
          </button>
        </nav>
      </div>
    </div>
  );
};

const VehicleDetails = ({ vehicle, onRefresh }) => {
  const navigate = useNavigate();
  const { isPrivacyMode, isShieldModeLevel2 } = usePrivacy();
  const [notification, setNotification] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showDownloadPasswordModal, setShowDownloadPasswordModal] = useState(false);
  const [showDeletePasswordModal, setShowDeletePasswordModal] = useState(false);
  const [resumeDeleteAfterDownload, setResumeDeleteAfterDownload] = useState(false);
  const [downloadPassword, setDownloadPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [downloadPasswordFeedback, setDownloadPasswordFeedback] = useState('');
  const [deletePasswordFeedback, setDeletePasswordFeedback] = useState('');
  const [isDownloadingFolder, setIsDownloadingFolder] = useState(false);
  const [isDeletingVehicle, setIsDeletingVehicle] = useState(false);
  const [showAllRelevesModal, setShowAllRelevesModal] = useState(false);
  const [relevesPage, setRelevesPage] = useState(1);
  const [chartLimit, setChartLimit] = useState(30);
  const [isEditingIdentity, setIsEditingIdentity] = useState(false);
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [isSavingReleve, setIsSavingReleve] = useState(false);
  const [deleteReleveModal, setDeleteReleveModal] = useState(null);
  const [isDeletingReleve, setIsDeletingReleve] = useState(false);
  const [types, setTypes] = useState([]);
  const [marques, setMarques] = useState([]);
  const [carburants, setCarburants] = useState([]);
  const [editForm, setEditForm] = useState({
    nom: '',
    modele: '',
    immatriculation: '',
    dateFirstImmatriculation: '',
    types: '',
    marques: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [removePhoto, setRemovePhoto] = useState(false);
  const [editingReleve, setEditingReleve] = useState(null);
  const [releveForm, setReleveForm] = useState({
    date: '',
    kilometre: '',
    prixLitre: '',
    prixTotal: '',
    litreTotal: '',
    inclinaisonGauche: '',
    inclinaisonDroite: '',
    carburant: '',
    consommation: '',
  });

  const vehicule = vehicle?.vehicule;
  const releves = useMemo(() => sortReleves(vehicle?.releverDetails || []), [vehicle]);
  const scopedReleves = useMemo(() => (
    chartLimit === 'all' ? releves : releves.slice(-chartLimit)
  ), [chartLimit, releves]);

  useEffect(() => {
    const fetchTypesAndMarques = async () => {
      try {
        const [typesResponse, marquesResponse, carburantsResponse] = await Promise.all([
          shieldFetch(`${apiUrl}/api/vehicule/type`),
          shieldFetch(`${apiUrl}/api/vehicule/marque`),
          shieldFetch(`${apiUrl}/api/vehicule/carburant`),
        ]);

        if (!typesResponse.ok || !marquesResponse.ok || !carburantsResponse.ok) {
          throw new Error('Failed to fetch vehicle reference lists');
        }

        const [typesData, marquesData, carburantsData] = await Promise.all([
          typesResponse.json(),
          marquesResponse.json(),
          carburantsResponse.json(),
        ]);

        setTypes(typesData);
        setMarques(marquesData);
        setCarburants(carburantsData);
      } catch (error) {
        console.error('Erreur lors de la récupération des listes véhicule :', error);
      }
    };

    fetchTypesAndMarques();
  }, []);

  useEffect(() => {
    if (!vehicule) return;

    setEditForm({
      nom: vehicule.Nom || '',
      modele: vehicule.Modele || '',
      immatriculation: vehicule.Immatriculation || '',
      dateFirstImmatriculation: getDateInputValue(vehicule.DateImmatriculation),
      types: String(vehicule.TypeID || ''),
      marques: String(vehicule.MarqueID || ''),
    });
    setPhotoFile(null);
    setPhotoPreview('');
    setRemovePhoto(false);
    setIsEditingIdentity(false);
  }, [vehicule]);

  useEffect(() => {
    if (!isPrivacyMode) return;
    setShowModal(false);
    setShowDeleteConfirmModal(false);
    setShowDownloadPasswordModal(false);
    setShowDeletePasswordModal(false);
    setDownloadPassword('');
    setDeletePassword('');
    setDownloadPasswordFeedback('');
    setDeletePasswordFeedback('');
    setIsEditingIdentity(false);
    setEditingReleve(null);
    setDeleteReleveModal(null);
  }, [isPrivacyMode]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview('');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [photoFile]);

  if (!vehicle || !vehicule) {
    return (
      <div className="rounded-lg border border-sky-500/20 bg-slate-950/60 p-8 text-center text-slate-300">
        Sélectionnez un véhicule pour voir les détails.
      </div>
    );
  }

  const lastIndex = releves.length - 1;
  const previousIndex = releves.length - 2;
  const lastReleve = releves[lastIndex];
  const previousReleve = releves[previousIndex];
  const lastDistance = getDistanceForIndex(releves, lastIndex);
  const previousDistance = getDistanceForIndex(releves, previousIndex);
  const lastConsumption = getConsumptionForIndex(releves, lastIndex);
  const previousConsumption = getConsumptionForIndex(releves, previousIndex);
  const lastCostPer100 = getCostPer100ForIndex(releves, lastIndex);
  const previousCostPer100 = getCostPer100ForIndex(releves, previousIndex);
  const lastExpense = Number(lastReleve?.PrixTotal);
  const previousExpense = Number(previousReleve?.PrixTotal);
  const averageStats = getAverageStats(releves);
  const isSold = vehicule.EtatID !== 1;
  const releveRows = releves.map((releve, index) => ({
    releve,
    consumption: getConsumptionForIndex(releves, index),
  }));
  const recentRows = releveRows.slice(-5).reverse();
  const modalRows = releveRows.slice().reverse();
  const totalRelevesPages = Math.max(1, Math.ceil(modalRows.length / RELEVES_PER_PAGE));
  const paginatedModalRows = modalRows.slice((relevesPage - 1) * RELEVES_PER_PAGE, relevesPage * RELEVES_PER_PAGE);
  const lastUpdatedReleve = releves
    .filter((releve) => releve.UpdateDate)
    .sort((a, b) => new Date(b.UpdateDate) - new Date(a.UpdateDate))[0];
  const hasInclinationData = scopedReleves.some(hasInclinationValue);

  const metrics = [
    buildMetric({
      title: 'Conso médiane',
      value: displayPrivacyNumber(averageStats.medianConsumption, 2, isShieldModeLevel2, 'consumption'),
      unit: 'L/100km',
      current: null,
      previous: null,
      icon: FireIcon,
      accent: 'bg-cyan-500/10 text-cyan-300',
      helper: 'Médiane entre deux relevés',
    }),
    buildMetric({
      title: 'Coût médian / 100km',
      value: `${displayPrivacyNumber(averageStats.medianCostPer100, 2, isShieldModeLevel2, 'price')} €`,
      unit: '€/100km',
      current: null,
      previous: null,
      icon: BanknotesIcon,
      accent: 'bg-emerald-500/10 text-emerald-300',
      helper: 'Médiane entre deux relevés',
    }),
    buildMetric({
      title: 'Dépense totale',
      value: `${isShieldModeLevel2 ? displayPrivacyNumber(averageStats.totalExpense, 2, isShieldModeLevel2, 'price') : privacyValue(formatNumber(averageStats.totalExpense, 2), isPrivacyMode)} €`,
      unit: '€',
      current: null,
      previous: null,
      icon: ChartBarIcon,
      accent: 'bg-violet-500/10 text-violet-300',
      helper: 'Tous les relevés du véhicule',
    }),
    buildMetric({
      title: 'Km médian / relevé',
      value: displayPrivacyNumber(averageStats.medianDistancePerReleve, 0, isShieldModeLevel2, 'kilometers'),
      unit: 'km',
      current: null,
      previous: null,
      icon: MapIcon,
      accent: 'bg-orange-500/10 text-orange-300',
      positiveIsGood: true,
      helper: 'Médiane entre deux relevés',
    }),
  ];

  const latestMetrics = [
    buildMetric({
      title: 'Conso dernier relevé',
      value: displayPrivacyNumber(lastConsumption, 2, isShieldModeLevel2, 'consumption'),
      unit: 'L/100km',
      current: roundPrivacyNumber(lastConsumption, isShieldModeLevel2 ? 'consumption' : undefined),
      previous: roundPrivacyNumber(previousConsumption, isShieldModeLevel2 ? 'consumption' : undefined),
      icon: FireIcon,
      accent: 'bg-cyan-500/10 text-cyan-300',
      deltaDigits: isShieldModeLevel2 ? 0 : 2,
    }),
    buildMetric({
      title: 'Coût dernier / 100km',
      value: `${displayPrivacyNumber(lastCostPer100, 2, isShieldModeLevel2, 'price')} €`,
      unit: '€/100km',
      current: roundPrivacyNumber(lastCostPer100, isShieldModeLevel2 ? 'price' : undefined),
      previous: roundPrivacyNumber(previousCostPer100, isShieldModeLevel2 ? 'price' : undefined),
      icon: BanknotesIcon,
      accent: 'bg-emerald-500/10 text-emerald-300',
      deltaDigits: isShieldModeLevel2 ? 0 : 2,
    }),
    buildMetric({
      title: 'Dépense dernier relevé',
      value: `${isShieldModeLevel2 ? displayPrivacyNumber(lastExpense, 2, isShieldModeLevel2, 'price') : privacyValue(formatNumber(lastExpense, 2), isPrivacyMode)} €`,
      unit: '€',
      current: roundPrivacyNumber(lastExpense, isShieldModeLevel2 ? 'price' : undefined),
      previous: roundPrivacyNumber(previousExpense, isShieldModeLevel2 ? 'price' : undefined),
      icon: ChartBarIcon,
      accent: 'bg-violet-500/10 text-violet-300',
      deltaDigits: isShieldModeLevel2 ? 0 : 2,
    }),
    buildMetric({
      title: 'Km dernier relevé',
      value: isShieldModeLevel2 ? displayPrivacyNumber(lastDistance, 0, isShieldModeLevel2, 'kilometers') : privacyValue(formatNumber(lastDistance, 0), isPrivacyMode),
      unit: 'km',
      current: roundPrivacyNumber(lastDistance, isShieldModeLevel2 ? 'kilometers' : undefined),
      previous: roundPrivacyNumber(previousDistance, isShieldModeLevel2 ? 'kilometers' : undefined),
      icon: MapIcon,
      accent: 'bg-orange-500/10 text-orange-300',
      positiveIsGood: true,
    }),
  ];

  const handleMarkAsSold = async () => {
    try {
      const response = await shieldFetch(`${apiUrl}/api/vehicule/${vehicule.VehiculeID}/sold`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        setNotification({ message: 'Véhicule marqué comme vendu avec succès.', type: 'success', icon: "✅" });
        setTimeout(() => setNotification(null), 5000);
        onRefresh();
        setShowModal(false);
      } else {
        setNotification({ message: 'Erreur lors de la mise à jour du véhicule.', type: 'error', icon: "⚠️" });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (error) {
      console.error('Erreur lors de la requête API :', error);
      setNotification({ message: 'Erreur interne du serveur.', type: 'error', icon: "⚠️" });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleReactivateVehicle = async () => {
    try {
      const response = await shieldFetch(`${apiUrl}/api/vehicule/${vehicule.VehiculeID}/active`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        setNotification({ message: 'Véhicule réhabilité avec succès.', type: 'success', icon: "✅" });
        setTimeout(() => setNotification(null), 5000);
        onRefresh();
        setShowModal(false);
      } else {
        setNotification({ message: 'Erreur lors de la réhabilitation du véhicule.', type: 'error', icon: "⚠️" });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (error) {
      console.error('Erreur lors de la requête API :', error);
      setNotification({ message: 'Erreur interne du serveur.', type: 'error', icon: "⚠️" });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const openDeletePasswordModal = () => {
    setShowDeleteConfirmModal(false);
    setShowDeletePasswordModal(true);
    setDeletePassword('');
    setDeletePasswordFeedback('');
  };

  const openDownloadPasswordModal = ({ resumeDelete = false } = {}) => {
    setShowDeleteConfirmModal(false);
    setShowDownloadPasswordModal(true);
    setResumeDeleteAfterDownload(resumeDelete);
    setDownloadPassword('');
    setDownloadPasswordFeedback('');
  };

  const closeDownloadPasswordModal = () => {
    if (isDownloadingFolder) return;
    setShowDownloadPasswordModal(false);
    setResumeDeleteAfterDownload(false);
    setDownloadPassword('');
    setDownloadPasswordFeedback('');
  };

  const closeDeletePasswordModal = () => {
    if (isDeletingVehicle) return;
    setShowDeletePasswordModal(false);
    setDeletePassword('');
    setDeletePasswordFeedback('');
  };

  const getPasswordErrorMessage = (data, fallbackMessage) => {
    if (!data) return fallbackMessage;
    if (data.retryAfterSeconds) {
      const minutes = Math.ceil(data.retryAfterSeconds / 60);
      return data.error || `Trop d'essais incorrects. Réessayez dans ${minutes} minute(s).`;
    }
    if (Number.isFinite(data.attemptsRemaining)) {
      return data.error || `Mot de passe incorrect. ${data.attemptsRemaining} essai(s) restant(s).`;
    }
    return data.error || fallbackMessage;
  };

  const handleDownloadVehicleFolder = async (event) => {
    event.preventDefault();
    setIsDownloadingFolder(true);
    setDownloadPasswordFeedback('');

    try {
      const response = await shieldFetch(`${apiUrl}/api/vehicule/${vehicule.UtilisateurID}/${vehicule.VehiculeID}/download-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: downloadPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(getPasswordErrorMessage(data, 'Erreur lors du téléchargement du dossier véhicule.'));
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const disposition = response.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filenameMatch?.[1] || `vehicule-${vehicule.VehiculeID}-dossier.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);

      setNotification({ message: 'Dossier du véhicule téléchargé avec succès.', type: 'success', icon: "✅" });
      setTimeout(() => setNotification(null), 5000);
      setShowDownloadPasswordModal(false);
      setDownloadPassword('');
      setDownloadPasswordFeedback('');
      if (resumeDeleteAfterDownload) {
        setShowDeletePasswordModal(true);
        setDeletePassword('');
        setDeletePasswordFeedback('');
      }
      setResumeDeleteAfterDownload(false);
    } catch (error) {
      console.error('Erreur lors du téléchargement du dossier véhicule :', error);
      setDownloadPasswordFeedback(error.message || 'Erreur interne du serveur.');
      setNotification({ message: error.message || 'Erreur interne du serveur.', type: 'error', icon: "⚠️" });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsDownloadingFolder(false);
    }
  };

  const handleDeleteVehicle = async (event) => {
    event.preventDefault();
    setIsDeletingVehicle(true);
    setDeletePasswordFeedback('');

    try {
      const response = await shieldFetch(`${apiUrl}/api/vehicule/${vehicule.UtilisateurID}/${vehicule.VehiculeID}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getPasswordErrorMessage(data, 'Erreur lors de la suppression du véhicule.'));
      }

      navigate('/dashboard', {
        replace: true,
        state: {
          notification: {
            message: 'Véhicule supprimé avec succès.',
            type: 'success',
            icon: '✅',
          },
        },
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du véhicule :', error);
      setDeletePasswordFeedback(error.message || 'Erreur interne du serveur.');
      setNotification({ message: error.message || 'Erreur interne du serveur.', type: 'error', icon: "⚠️" });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsDeletingVehicle(false);
    }
  };

  const updateEditField = (field, value) => {
    setEditForm((current) => ({ ...current, [field]: value }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0] || null;
    setPhotoFile(file);
    if (file) setRemovePhoto(false);
  };

  const handleCancelIdentityEdit = () => {
    setEditForm({
      nom: vehicule.Nom || '',
      modele: vehicule.Modele || '',
      immatriculation: vehicule.Immatriculation || '',
      dateFirstImmatriculation: getDateInputValue(vehicule.DateImmatriculation),
      types: String(vehicule.TypeID || ''),
      marques: String(vehicule.MarqueID || ''),
    });
    setPhotoFile(null);
    setPhotoPreview('');
    setRemovePhoto(false);
    setIsEditingIdentity(false);
  };

  const handleUpdateIdentity = async (event) => {
    event.preventDefault();
    setIsSavingIdentity(true);

    const formData = new FormData();
    formData.append('nom', editForm.nom.trim());
    formData.append('modele', editForm.modele.trim());
    formData.append('immatriculation', editForm.immatriculation.trim());
    formData.append('dateFirstImmatriculation', editForm.dateFirstImmatriculation);
    formData.append('types', editForm.types);
    formData.append('marques', editForm.marques);
    formData.append('removePhoto', removePhoto ? 'true' : 'false');
    if (photoFile && !removePhoto) {
      formData.append('photo', photoFile);
    }

    try {
      const response = await shieldFetch(`${apiUrl}/api/vehicule/${vehicule.UtilisateurID}/${vehicule.VehiculeID}`, {
        method: 'PUT',
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour du véhicule.');
      }

      setNotification({ message: 'Véhicule mis à jour avec succès.', type: 'success', icon: "✅" });
      setTimeout(() => setNotification(null), 5000);
      setIsEditingIdentity(false);
      setPhotoFile(null);
      setPhotoPreview('');
      setRemovePhoto(false);
      await onRefresh();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du véhicule :', error);
      setNotification({ message: error.message || 'Erreur interne du serveur.', type: 'error', icon: "⚠️" });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsSavingIdentity(false);
    }
  };

  const updateReleveField = (field, value) => {
    setReleveForm((current) => ({ ...current, [field]: value }));
  };

  const openReleveEditor = (releve) => {
    setShowAllRelevesModal(false);
    setEditingReleve(releve);
    setReleveForm({
      date: getDateInputValue(releve.Date),
      kilometre: releve.Kilometre ?? '',
      prixLitre: releve.PrixLitre ?? '',
      prixTotal: releve.PrixTotal ?? '',
      litreTotal: releve.LitreTotal ?? '',
      inclinaisonGauche: releve.InclinaisonGauche ?? '',
      inclinaisonDroite: releve.InclinaisonDroite ?? '',
      carburant: String(releve.CarburantID || ''),
      consommation: releve.Consommation ?? '',
    });
  };

  const closeReleveEditor = () => {
    setEditingReleve(null);
    setReleveForm({
      date: '',
      kilometre: '',
      prixLitre: '',
      prixTotal: '',
      litreTotal: '',
      inclinaisonGauche: '',
      inclinaisonDroite: '',
      carburant: '',
      consommation: '',
    });
  };

  const openDeleteReleveModal = (releve) => {
    if (isPrivacyMode) return;
    setShowAllRelevesModal(false);
    setDeleteReleveModal(releve);
  };

  const closeDeleteReleveModal = () => {
    if (isDeletingReleve) return;
    setDeleteReleveModal(null);
  };

  const handleDeleteReleve = async () => {
    if (!deleteReleveModal || isPrivacyMode) return;

    setIsDeletingReleve(true);
    try {
      const response = await shieldFetch(`${apiUrl}/api/vehicule/${vehicule.UtilisateurID}/${vehicule.VehiculeID}/relever/${deleteReleveModal.ReleverID}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression du relevé.');
      }

      setNotification({ message: 'Relevé supprimé avec succès.', type: 'success', icon: "✅" });
      setTimeout(() => setNotification(null), 5000);
      setDeleteReleveModal(null);
      await onRefresh();
    } catch (error) {
      console.error('Erreur lors de la suppression du relevé :', error);
      setNotification({ message: error.message || 'Erreur interne du serveur.', type: 'error', icon: "⚠️" });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsDeletingReleve(false);
    }
  };

  const handleUpdateReleve = async (event) => {
    event.preventDefault();
    if (!editingReleve) return;

    setIsSavingReleve(true);
    const payload = {
      date: releveForm.date,
      kilometre: parseFloat(releveForm.kilometre),
      prixLitre: parseFloat(releveForm.prixLitre),
      prixTotal: parseFloat(releveForm.prixTotal),
      litreTotal: parseFloat(releveForm.litreTotal),
      inclinaisonGauche: releveForm.inclinaisonGauche === '' ? null : parseFloat(releveForm.inclinaisonGauche),
      inclinaisonDroite: releveForm.inclinaisonDroite === '' ? null : parseFloat(releveForm.inclinaisonDroite),
      carburant: parseInt(releveForm.carburant),
      consommation: releveForm.consommation === '' ? null : parseFloat(releveForm.consommation),
    };

    try {
      const response = await shieldFetch(`${apiUrl}/api/vehicule/${vehicule.UtilisateurID}/${vehicule.VehiculeID}/relever/${editingReleve.ReleverID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour du relevé.');
      }

      setNotification({ message: 'Relevé mis à jour avec succès.', type: 'success', icon: "✅" });
      setTimeout(() => setNotification(null), 5000);
      closeReleveEditor();
      await onRefresh();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du relevé :', error);
      setNotification({ message: error.message || 'Erreur interne du serveur.', type: 'error', icon: "⚠️" });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsSavingReleve(false);
    }
  };

  const chartActions = (
    <div className="inline-flex rounded-md border border-sky-500/20 bg-slate-950/70 p-1">
      {CHART_LIMITS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setChartLimit(option.value)}
          className={`rounded px-3 py-1 text-xs font-semibold transition ${chartLimit === option.value
            ? 'bg-sky-500/30 text-sky-100'
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 text-slate-100">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          icon={notification.icon}
        />
      )}

      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">voici votre véhicule</h1>
          <p className="mt-1 text-sm text-slate-400">État basé sur le dernier relevé disponible.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {!isSold && (
            <VehicleAddActionMenu vehicule={vehicule} isDisabled={isPrivacyMode} />
          )}
          <IconTooltip label={isSold ? 'Réhabiliter' : 'Marquer vendu'}>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              disabled={isPrivacyMode}
              className={classNames(
                'inline-flex h-10 w-10 items-center justify-center rounded-md border text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50',
                isSold
                  ? 'border-emerald-500/50 text-emerald-100 hover:border-emerald-300 hover:bg-emerald-500/10'
                  : 'border-slate-600 text-slate-200 hover:border-rose-400 hover:text-rose-200'
              )}
              title={isPrivacyMode ? 'Verrouillé par Shield Mode' : undefined}
              aria-label={isSold ? 'Réhabiliter' : 'Marquer vendu'}
            >
              {isSold ? <CheckCircleIcon className="h-4 w-4" /> : <NoSymbolIcon className="h-4 w-4" />}
            </button>
          </IconTooltip>
          <IconTooltip label={isEditingIdentity ? 'Fermer l’édition du véhicule' : 'Modifier les informations du véhicule'}>
            <button
              type="button"
              onClick={() => setIsEditingIdentity((current) => !current)}
              disabled={isPrivacyMode}
              className="inline-flex items-center gap-2 rounded-md border border-sky-500/40 px-4 py-2 text-sm font-semibold text-sky-100 hover:border-sky-300 hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              title={isPrivacyMode ? 'Verrouillé par Shield Mode' : undefined}
              aria-label={isEditingIdentity ? 'Fermer l’édition du véhicule' : 'Modifier les informations du véhicule'}
            >
              <PencilSquareIcon className="h-4 w-4" />
              {isEditingIdentity ? 'Fermer édition' : ''}
            </button>
          </IconTooltip>
          <IconTooltip label="Télécharger les archives du véhicule">
            <button
              type="button"
              onClick={() => openDownloadPasswordModal()}
              disabled={isPrivacyMode}
              className="inline-flex items-center gap-2 rounded-md border border-sky-500/40 px-4 py-2 text-sm font-semibold text-sky-100 hover:border-sky-300 hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              title={isPrivacyMode ? 'Verrouillé par Shield Mode' : undefined}
              aria-label="Télécharger les archives du véhicule"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
            </button>
          </IconTooltip>
          <IconTooltip label="Supprimer le véhicule">
            <button
              type="button"
              onClick={() => setShowDeleteConfirmModal(true)}
              disabled={isPrivacyMode}
              className="inline-flex items-center gap-2 rounded-md border border-rose-500/50 px-4 py-2 text-sm font-semibold text-rose-100 hover:border-rose-300 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              title={isPrivacyMode ? 'Verrouillé par Shield Mode' : undefined}
              aria-label="Supprimer le véhicule"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </IconTooltip>
        </div>
      </header>

      <section className="overflow-hidden rounded-lg border border-sky-500/30 bg-[radial-gradient(circle_at_25%_40%,rgba(14,165,233,0.16),transparent_34%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.9))] shadow-[0_24px_80px_rgba(2,6,23,0.38)]">
        <form onSubmit={handleUpdateIdentity} className="grid gap-6 p-6 lg:grid-cols-[minmax(280px,1.1fr)_minmax(320px,0.9fr)] lg:p-8">
          <div className="relative min-h-72">
            <div className="absolute inset-x-8 bottom-6 h-24 rounded-full bg-sky-500/20 blur-3xl" />
            <img
              src={removePhoto ? GENERIC_VEHICLE_IMAGE : photoPreview || getVehicleImage(vehicule)}
              alt={vehicule.Nom}
              className="relative h-full max-h-96 w-full object-contain drop-shadow-[0_28px_45px_rgba(0,0,0,0.65)]"
            />
          </div>
          <div className="flex flex-col justify-center">
            {!isEditingIdentity && (
              <div className="mb-5 flex items-center gap-2 text-sm">
                <span className={`h-2.5 w-2.5 rounded-full ${isSold ? 'bg-rose-400' : 'bg-emerald-400'} shadow-[0_0_14px_currentColor]`} />
                <span className={isSold ? 'text-rose-200' : 'text-emerald-200'}>{isSold ? 'Vendu' : 'Actif'}</span>
              </div>
            )}
            {isEditingIdentity ? (
              <div className="space-y-4">
                <div className="space-y-3 rounded-lg border border-sky-500/20 bg-slate-950/70 p-4">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-sky-500/30 bg-slate-900/70 px-4 py-3 text-sm font-semibold text-sky-100 hover:border-sky-300">
                    <PhotoIcon className="h-5 w-5" />
                    Choisir une photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      disabled={removePhoto}
                      className="sr-only"
                    />
                  </label>
                  {photoFile && <p className="truncate text-xs text-slate-400">{photoFile.name}</p>}
                  <label className="flex items-center gap-3 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={removePhoto}
                      onChange={(event) => {
                        setRemovePhoto(event.target.checked);
                        if (event.target.checked) setPhotoFile(null);
                      }}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-500 focus:ring-sky-500"
                    />
                    Supprimer la photo actuelle
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400">Nom</label>
                  <input
                    type="text"
                    maxLength={100}
                    value={editForm.nom}
                    onChange={(event) => updateEditField('nom', event.target.value)}
                    className="mt-1 block w-full rounded-md border-0 bg-slate-900/80 px-3 py-2 text-slate-100 ring-1 ring-inset ring-slate-700 focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400">Modèle</label>
                    <input
                      type="text"
                      maxLength={100}
                      value={editForm.modele}
                      onChange={(event) => updateEditField('modele', event.target.value)}
                      className="mt-1 block w-full rounded-md border-0 bg-slate-900/80 px-3 py-2 text-slate-100 ring-1 ring-inset ring-slate-700 focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400">Immatriculation</label>
                    <input
                      type="text"
                      maxLength={20}
                      value={editForm.immatriculation}
                      onChange={(event) => updateEditField('immatriculation', event.target.value)}
                      className="mt-1 block w-full rounded-md border-0 bg-slate-900/80 px-3 py-2 text-slate-100 ring-1 ring-inset ring-slate-700 focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400">1re immat.</label>
                    <input
                      type="date"
                      value={editForm.dateFirstImmatriculation}
                      onChange={(event) => updateEditField('dateFirstImmatriculation', event.target.value)}
                      className="mt-1 block w-full rounded-md border-0 bg-slate-900/80 px-3 py-2 text-slate-100 ring-1 ring-inset ring-slate-700 focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400">Type</label>
                    <select
                      value={editForm.types}
                      onChange={(event) => updateEditField('types', event.target.value)}
                      className="mt-1 block w-full rounded-md border-0 bg-slate-900/80 px-3 py-2 text-slate-100 ring-1 ring-inset ring-slate-700 focus:ring-2 focus:ring-sky-500"
                      required
                    >
                      <option value="">Type</option>
                      {types.map((type) => (
                        <option key={type.TypeID} value={type.TypeID}>{type.Nom}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400">Marque</label>
                    <select
                      value={editForm.marques}
                      onChange={(event) => updateEditField('marques', event.target.value)}
                      className="mt-1 block w-full rounded-md border-0 bg-slate-900/80 px-3 py-2 text-slate-100 ring-1 ring-inset ring-slate-700 focus:ring-2 focus:ring-sky-500"
                      required
                    >
                      <option value="">Marque</option>
                      {marques.map((marque) => (
                        <option key={marque.MarqueID} value={marque.MarqueID}>{marque.Nom}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSavingIdentity}
                    className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingIdentity ? 'Validation...' : 'Valider les modifications'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelIdentityEdit}
                    className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-400"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-semibold text-slate-50 lg:text-4xl">{vehicule.Nom}</h2>
                <p className="mt-2 text-sm text-slate-300">
                  {isShieldModeLevel2 ? formatPrivacyYear(vehicule.DateImmatriculation) : privacyValue(new Date(vehicule.DateImmatriculation).getFullYear(), isPrivacyMode)} · {vehicule.Type?.Nom || '-'} · {vehicule.Marque?.Nom || '-'}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {[isShieldModeLevel2 ? maskAlphanumeric(vehicule.Modele) : vehicule.Modele, isPrivacyMode ? maskRegistration(vehicule.Immatriculation) : vehicule.Immatriculation, vehicule.Marque?.Nom].filter(Boolean).map((item) => (
                    <span key={item} className="rounded border border-sky-500/20 bg-slate-900/70 px-3 py-1 text-xs text-slate-200">
                      {item}
                    </span>
                  ))}
                </div>
              </>
            )}
            {!isEditingIdentity && (
              <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4">
                <div>
                  <p className="text-2xl font-semibold">
                    {isShieldModeLevel2 ? displayPrivacyNumber(averageStats.declaredKilometers, 0, isShieldModeLevel2, 'kilometers') : privacyValue(formatNumber(averageStats.declaredKilometers, 0), isPrivacyMode)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">km déclarés</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{displayPrivacyNumber(averageStats.medianConsumption, 2, isShieldModeLevel2, 'consumption')}</p>
                  <p className="mt-1 text-xs text-slate-400">L/100km médian</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{displayPrivacyNumber(averageStats.averagePricePerLiter, 2, isShieldModeLevel2, 'price')} €</p>
                  <p className="mt-1 text-xs text-slate-400">Prix moyen/L</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{displayPrivacyNumber(averageStats.medianDistancePerReleve, 0, isShieldModeLevel2, 'kilometers')}</p>
                  <p className="mt-1 text-xs text-slate-400">km médian/relevé</p>
                </div>
              </div>
            )}
          </div>
        </form>
      </section>

      {releves.length > 0 ? (
        <>
          <section className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {latestMetrics.map((metric) => (
              <MetricCard key={metric.title} metric={metric} />
            ))}
          </section>

          <section className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard key={metric.title} metric={metric} />
            ))}
          </section>

          <section className="grid min-w-0 gap-4 xl:grid-cols-2">
            <ChartPanel title="Consommation de carburant" subtitle={`Derniers ${chartLimit === 'all' ? 'relevés' : `${chartLimit} relevés`}`} actions={chartActions}>
              <FuelConsumptionLineChart releverDetails={scopedReleves} compact isShieldModeLevel2={isShieldModeLevel2} />
            </ChartPanel>
            <ChartPanel title="Évolution du prix du carburant" subtitle="Prix par carburant" actions={chartActions}>
              <FuelPriceLineChart releverDetails={scopedReleves} compact isShieldModeLevel2={isShieldModeLevel2} />
            </ChartPanel>
          </section>

          <section className={`grid min-w-0 gap-4 ${hasInclinationData ? 'xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.8fr)_minmax(0,1fr)]' : 'xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.65fr)]'}`}>
            <ChartPanel
              title="Kilométrage"
              subtitle={`${isShieldModeLevel2 ? displayPrivacyNumber(lastReleve?.Kilometre, 0, isShieldModeLevel2, 'kilometers') : privacyValue(formatNumber(lastReleve?.Kilometre, 0), isPrivacyMode)} km total · ${isShieldModeLevel2 ? displayPrivacyNumber(averageStats.declaredKilometers, 0, isShieldModeLevel2, 'kilometers') : privacyValue(formatNumber(averageStats.declaredKilometers, 0), isPrivacyMode)} km déclarés`}
            >
              <KilometerEvolutionLineChart releverDetails={scopedReleves} compact isShieldModeLevel2={isShieldModeLevel2} />
            </ChartPanel>
            <ChartPanel title="Répartition des carburants" subtitle={chartLimit === 'all' ? 'Tous les relevés' : `${chartLimit} derniers relevés`}>
              <FuelPieChart releverDetails={scopedReleves} compact />
            </ChartPanel>
            {hasInclinationData && (
              <ChartPanel title="Inclinaisons par relevé" subtitle="Gauche / droite">
                <InclinationBarChart releverDetails={scopedReleves} compact isShieldModeLevel2={isShieldModeLevel2} />
              </ChartPanel>
            )}
          </section>

          <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <div className="min-w-0 rounded-lg border border-sky-500/20 bg-slate-950/60 p-5">
              <h3 className="text-base font-semibold text-slate-50">Derniers relevés</h3>
              <div className="mt-4">
                <RelevesTable
                  rows={recentRows}
                  onEdit={openReleveEditor}
                  onDelete={openDeleteReleveModal}
                  isPrivacyMode={isPrivacyMode}
                  isShieldModeLevel2={isShieldModeLevel2}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setRelevesPage(1);
                  setShowAllRelevesModal(true);
                }}
                className="mt-5 w-full rounded-md border border-sky-500/20 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-sky-400/50 hover:bg-slate-800"
              >
                Voir tous les relevés
              </button>
            </div>

            <div className="min-w-0 rounded-lg border border-sky-500/20 bg-slate-950/60 p-5">
              <h3 className="text-base font-semibold text-slate-50">Activité récente</h3>
              <div className="mt-5 space-y-5">
                <div className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky-500/15 text-sky-300">
                    <CalendarDaysIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Dernier relevé ajouté</p>
                    <p className="mt-1 text-xs text-slate-400">{displayPrivacyDate(lastReleve?.Date, isPrivacyMode, isShieldModeLevel2)}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
                    <CheckCircleIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Dernière mise à jour véhicule</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {vehicule.UpdateDate ? displayPrivacyDate(vehicule.UpdateDate, isPrivacyMode, isShieldModeLevel2) : 'Aucune mise à jour'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-500/15 text-violet-300">
                    <PencilSquareIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Dernier relevé mis à jour</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {lastUpdatedReleve ? `${displayPrivacyDate(lastUpdatedReleve.UpdateDate, isPrivacyMode, isShieldModeLevel2)} · ${isShieldModeLevel2 ? displayPrivacyNumber(lastUpdatedReleve.Kilometre, 0, isShieldModeLevel2, 'kilometers') : privacyValue(formatNumber(lastUpdatedReleve.Kilometre, 0), isPrivacyMode)} km` : 'Aucune mise à jour'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-lg border border-sky-500/20 bg-slate-950/60 p-8 text-center">
          <p className="text-lg font-semibold text-slate-100">Aucun relevé pour ce véhicule</p>
          <p className="mt-2 text-sm text-slate-400">Ajoutez un relevé pour afficher les statistiques et graphiques.</p>
        </section>
      )}

      {showAllRelevesModal && createPortal(
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center">
            <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-xl border border-sky-500/30 bg-[radial-gradient(circle_at_10%_0%,rgba(59,130,246,0.18),transparent_34%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.96))] text-slate-100 shadow-2xl shadow-sky-950/50">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-50">Tous les relevés</h3>
                  <p className="mt-1 text-sm text-slate-400">{vehicule.Nom} · {modalRows.length} relevé{modalRows.length > 1 ? 's' : ''}</p>
                </div>
                <IconTooltip label="Fermer la liste des relevés" placement="bottom" align="end">
                  <button
                    type="button"
                    onClick={() => setShowAllRelevesModal(false)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                    aria-label="Fermer la liste des relevés"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </IconTooltip>
              </div>
              <div className="max-h-[62vh] overflow-auto px-5 py-4">
                <RelevesTable
                  rows={paginatedModalRows}
                  onEdit={openReleveEditor}
                  onDelete={openDeleteReleveModal}
                  isPrivacyMode={isPrivacyMode}
                  isShieldModeLevel2={isShieldModeLevel2}
                />
              </div>
              <Pagination
                currentPage={relevesPage}
                totalPages={totalRelevesPages}
                totalItems={modalRows.length}
                onPageChange={(page) => setRelevesPage(Math.min(Math.max(page, 1), totalRelevesPages))}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      <ReleveDeleteConfirmationModal
        open={Boolean(deleteReleveModal)}
        isDeleting={isDeletingReleve}
        onCancel={closeDeleteReleveModal}
        onConfirm={handleDeleteReleve}
      />

      {editingReleve && createPortal(
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm">
          <form onSubmit={handleUpdateReleve} className="mx-auto my-6 w-full max-w-4xl rounded-xl border border-sky-500/30 bg-[radial-gradient(circle_at_10%_0%,rgba(59,130,246,0.18),transparent_34%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.96))] p-5 text-slate-100 shadow-2xl shadow-sky-950/50">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-50">Modifier le relevé</h3>
                <p className="mt-1 text-sm text-slate-400">{vehicule.Nom} · {formatDate(editingReleve.Date)}</p>
              </div>
              <IconTooltip label="Fermer l’édition du relevé" placement="bottom" align="end">
                <button
                  type="button"
                  onClick={closeReleveEditor}
                  className="rounded-md p-2 text-slate-400 hover:bg-white/5 hover:text-slate-100"
                  aria-label="Fermer l’édition du relevé"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </IconTooltip>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400">Date</label>
                <input
                  type="date"
                  value={releveForm.date}
                  onChange={(event) => updateReleveField('date', event.target.value)}
                  className="mt-1 block w-full rounded-md border-0 bg-slate-900/80 px-3 py-2 text-slate-100 ring-1 ring-inset ring-slate-700 focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400">Carburant</label>
                <select
                  value={releveForm.carburant}
                  onChange={(event) => updateReleveField('carburant', event.target.value)}
                  className="mt-1 block w-full rounded-md border-0 bg-slate-900/80 px-3 py-2 text-slate-100 ring-1 ring-inset ring-slate-700 focus:ring-2 focus:ring-sky-500"
                  required
                >
                  <option value="">Carburant</option>
                  {carburants.map((carburant) => (
                    <option key={carburant.CarburantID} value={carburant.CarburantID}>{carburant.Nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400">Kilométrage</label>
                <input
                  type="number"
                  step="0.01"
                  value={releveForm.kilometre}
                  onChange={(event) => updateReleveField('kilometre', event.target.value)}
                  className="mt-1 block w-full rounded-md border-0 bg-slate-900/80 px-3 py-2 text-slate-100 ring-1 ring-inset ring-slate-700 focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400">Prix/L</label>
                <input
                  type="number"
                  step="0.001"
                  value={releveForm.prixLitre}
                  onChange={(event) => updateReleveField('prixLitre', event.target.value)}
                  className="mt-1 block w-full rounded-md border-0 bg-slate-900/80 px-3 py-2 text-slate-100 ring-1 ring-inset ring-slate-700 focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400">Prix total</label>
                <input
                  type="number"
                  step="0.01"
                  value={releveForm.prixTotal}
                  onChange={(event) => updateReleveField('prixTotal', event.target.value)}
                  className="mt-1 block w-full rounded-md border-0 bg-slate-900/80 px-3 py-2 text-slate-100 ring-1 ring-inset ring-slate-700 focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400">Litres</label>
                <input
                  type="number"
                  step="0.01"
                  value={releveForm.litreTotal}
                  onChange={(event) => updateReleveField('litreTotal', event.target.value)}
                  className="mt-1 block w-full rounded-md border-0 bg-slate-900/80 px-3 py-2 text-slate-100 ring-1 ring-inset ring-slate-700 focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400">Consommation</label>
                <input
                  type="number"
                  step="0.01"
                  value={releveForm.consommation}
                  onChange={(event) => updateReleveField('consommation', event.target.value)}
                  className="mt-1 block w-full rounded-md border-0 bg-slate-900/80 px-3 py-2 text-slate-100 ring-1 ring-inset ring-slate-700 focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400">Inclinaison gauche</label>
                <input
                  type="number"
                  step="0.01"
                  value={releveForm.inclinaisonGauche}
                  onChange={(event) => updateReleveField('inclinaisonGauche', event.target.value)}
                  className="mt-1 block w-full rounded-md border-0 bg-slate-900/80 px-3 py-2 text-slate-100 ring-1 ring-inset ring-slate-700 focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400">Inclinaison droite</label>
                <input
                  type="number"
                  step="0.01"
                  value={releveForm.inclinaisonDroite}
                  onChange={(event) => updateReleveField('inclinaisonDroite', event.target.value)}
                  className="mt-1 block w-full rounded-md border-0 bg-slate-900/80 px-3 py-2 text-slate-100 ring-1 ring-inset ring-slate-700 focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeReleveEditor}
                className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-400"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSavingReleve}
                className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingReleve ? 'Validation...' : 'Valider le relevé'}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {showModal && (
        <ConfirmationModal
          title={isSold ? "Réhabiliter le véhicule" : "Marquer comme vendu"}
          message={isSold ? "Êtes-vous sûr de vouloir réhabiliter ce véhicule ?" : "Êtes-vous sûr de vouloir marquer ce véhicule comme vendu ?"}
          confirmLabel={isSold ? "Réhabiliter" : "Marquer vendu"}
          onConfirm={isSold ? handleReactivateVehicle : handleMarkAsSold}
          onCancel={() => setShowModal(false)}
        />
      )}

      {showDeleteConfirmModal && (
        <ConfirmationModal
          title="Suppression du véhicule"
          message={`Supprimer définitivement le véhicule "${vehicule.Nom}" et toutes ses données liées ?`}
          confirmLabel="Supprimer"
          onConfirm={openDeletePasswordModal}
          onCancel={() => setShowDeleteConfirmModal(false)}
          secondaryAction={{
            label: 'Télécharger avant suppression',
            onClick: () => openDownloadPasswordModal({ resumeDelete: true }),
          }}
        />
      )}

      {showDownloadPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
          <form onSubmit={handleDownloadVehicleFolder} className="w-full max-w-md rounded-lg border border-sky-500/30 bg-slate-950 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-50">Téléchargement du dossier</h3>
                <p className="mt-1 text-sm text-slate-400">Confirmez avec votre mot de passe.</p>
              </div>
              <IconTooltip label="Fermer le téléchargement" placement="bottom" align="end">
                <button
                  type="button"
                  onClick={closeDownloadPasswordModal}
                  disabled={isDownloadingFolder}
                  className="rounded-md p-2 text-slate-400 hover:bg-white/5 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Fermer le téléchargement"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </IconTooltip>
            </div>

            <div className="mt-5">
              <label className="block text-xs font-semibold uppercase text-slate-400">Mot de passe</label>
              <input
                type="password"
                value={downloadPassword}
                onChange={(event) => {
                  setDownloadPassword(event.target.value);
                  setDownloadPasswordFeedback('');
                }}
                className="mt-1 block w-full rounded-md border-0 bg-slate-900/80 px-3 py-2 text-slate-100 ring-1 ring-inset ring-slate-700 focus:ring-2 focus:ring-sky-500"
                autoComplete="current-password"
                aria-invalid={downloadPasswordFeedback ? 'true' : 'false'}
                required
              />
              {downloadPasswordFeedback && (
                <p className="mt-2 text-sm font-medium text-rose-300">{downloadPasswordFeedback}</p>
              )}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeDownloadPasswordModal}
                disabled={isDownloadingFolder}
                className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isDownloadingFolder}
                className="inline-flex items-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                {isDownloadingFolder ? 'Téléchargement...' : 'Télécharger'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showDeletePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
          <form onSubmit={handleDeleteVehicle} className="w-full max-w-md rounded-lg border border-rose-500/30 bg-slate-950 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-50">Validation de suppression</h3>
                <p className="mt-1 text-sm text-slate-400">Confirmez avec votre mot de passe.</p>
              </div>
              <IconTooltip label="Fermer la suppression" placement="bottom" align="end">
                <button
                  type="button"
                  onClick={closeDeletePasswordModal}
                  disabled={isDeletingVehicle}
                  className="rounded-md p-2 text-slate-400 hover:bg-white/5 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Fermer la suppression"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </IconTooltip>
            </div>

            <div className="mt-5">
              <label className="block text-xs font-semibold uppercase text-slate-400">Mot de passe</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(event) => {
                  setDeletePassword(event.target.value);
                  setDeletePasswordFeedback('');
                }}
                className="mt-1 block w-full rounded-md border-0 bg-slate-900/80 px-3 py-2 text-slate-100 ring-1 ring-inset ring-slate-700 focus:ring-2 focus:ring-rose-500"
                autoComplete="current-password"
                aria-invalid={deletePasswordFeedback ? 'true' : 'false'}
                required
              />
              {deletePasswordFeedback && (
                <p className="mt-2 text-sm font-medium text-rose-300">{deletePasswordFeedback}</p>
              )}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeDeletePasswordModal}
                disabled={isDeletingVehicle}
                className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isDeletingVehicle}
                className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeletingVehicle ? 'Suppression...' : 'Valider la suppression'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default VehicleDetails;

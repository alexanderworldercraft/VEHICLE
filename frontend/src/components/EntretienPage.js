import React, { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, Transition } from '@headlessui/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CurrencyEuroIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  FlagIcon,
  InformationCircleIcon,
  PaperClipIcon,
  PencilSquareIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrashIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { ChevronUpDownIcon } from '@heroicons/react/16/solid';
import api, { shieldFetch } from '../services/api';
import { maskSensitiveValue, usePrivacy } from '../privacy/PrivacyContext';
import { formatPrivacyYear, roundPrivacyNumber } from '../privacy/privacyDisplay';

const apiUrl = process.env.REACT_APP_URL_LOCAL || "https://192.168.0.17:1234";
const GENERIC_VEHICLE_IMAGE = '/imageDefault.png';
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const FILE_CATEGORY_OPTIONS = [
  { value: 'facture', label: 'Facture' },
  { value: 'devis', label: 'Devis' },
  { value: 'avant', label: 'Avant' },
  { value: 'apres', label: 'Après' },
  { value: 'transaction', label: 'Transaction' },
  { value: 'autre', label: 'Autre' },
];

const getTooltipViewportPadding = () => {
  if (typeof window === 'undefined') return 16;
  if (window.innerWidth >= 1024) return 32;
  if (window.innerWidth >= 640) return 24;
  return 16;
};

function IconTooltip({ label, children, placement = 'top', align = 'center' }) {
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
}

const getVehicleImage = (vehicule) => {
  const imagePath = vehicule?.Photo || vehicule?.CheminImage || vehicule?.Image || vehicule?.imageUrl;
  if (!imagePath) return GENERIC_VEHICLE_IMAGE;
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('/uploads/')) return `${apiUrl}${imagePath}`;
  if (imagePath.startsWith('/')) return imagePath;
  return `${apiUrl}/${imagePath}`;
};

const formatFileSize = (value) => {
  const size = Number(value);
  if (!Number.isFinite(size)) return '';
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
};

const formatDate = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('fr-FR').format(new Date(value));
};

const maskLevel2Value = (value, isShieldModeLevel2) => (
  isShieldModeLevel2 ? maskSensitiveValue(value) : value
);

const formatDisplayDate = (value, isPrivacyMode, isShieldModeLevel2) => (
  isShieldModeLevel2 ? maskSensitiveValue(formatDate(value)) : isPrivacyMode ? formatPrivacyYear(value) : formatDate(value)
);

const formatDisplayNumber = (value, digits = 0, isPrivacyMode = false, isShieldModeLevel2 = false, kind) => {
  if (!Number.isFinite(Number(value))) return '-';
  const displayValue = isPrivacyMode && !isShieldModeLevel2 ? roundPrivacyNumber(value, kind) : Number(value);
  const formattedValue = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: isPrivacyMode ? 0 : digits,
    maximumFractionDigits: isPrivacyMode ? 0 : digits,
  }).format(displayValue);

  return maskLevel2Value(formattedValue, isShieldModeLevel2);
};

const formatCurrency = (value, isPrivacyMode, isShieldModeLevel2) => {
  const displayValue = isPrivacyMode && !isShieldModeLevel2 ? roundPrivacyNumber(value, 'price') : Number(value || 0);
  const formattedValue = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: isPrivacyMode || Number.isInteger(displayValue) ? 0 : 2,
    maximumFractionDigits: isPrivacyMode ? 0 : 2,
  }).format(displayValue);

  return maskLevel2Value(formattedValue, isShieldModeLevel2);
};

const getDateInputValue = (date = new Date()) => date.toISOString().slice(0, 10);

const getMonthDays = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstGridOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - firstGridOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
};

const getPlannedTiming = (item, isPrivacyMode = false, isShieldModeLevel2 = false) => {
  const latestKilometer = Number(item.LatestKilometre);
  const dueKilometer = Number(item.KilometrePrevu);
  const hasKilometer = item.KilometrePrevu !== null && item.KilometrePrevu !== undefined && item.KilometrePrevu !== '' && Number.isFinite(dueKilometer);
  const hasDate = Boolean(item.DatePrevue);
  const date = hasDate ? new Date(item.DatePrevue) : null;
  const days = date ? Math.ceil((date - new Date()) / DAY_IN_MS) : null;
  const dueKilometerText = hasKilometer ? `${formatDisplayNumber(dueKilometer, 0, isPrivacyMode, isShieldModeLevel2, 'kilometers')} km` : null;
  const remainingKilometerText = Number.isFinite(latestKilometer) && hasKilometer && dueKilometer > latestKilometer
    ? `${formatDisplayNumber(dueKilometer - latestKilometer, 0, isPrivacyMode, isShieldModeLevel2, 'kilometers')} km`
    : dueKilometerText;
  const lateKilometerText = Number.isFinite(latestKilometer) && hasKilometer && latestKilometer > dueKilometer
    ? `${formatDisplayNumber(latestKilometer - dueKilometer, 0, isPrivacyMode, isShieldModeLevel2, 'kilometers')} km`
    : dueKilometerText;
  const displayDate = hasDate ? formatDisplayDate(item.DatePrevue, isPrivacyMode, isShieldModeLevel2) : null;
  const kilometerText = Number.isFinite(latestKilometer) && hasKilometer && dueKilometer > latestKilometer
    ? `Dans ${remainingKilometerText}`
    : dueKilometerText;
  const overdueKilometerText = Number.isFinite(latestKilometer) && hasKilometer && latestKilometer > dueKilometer
    ? `En retard de ${lateKilometerText}`
    : dueKilometerText;
  const dateText = hasDate && days >= 0 && !isPrivacyMode ? `Dans ${days} jour${days > 1 ? 's' : ''}` : displayDate;
  const overdueDateText = hasDate ? `En retard depuis ${displayDate}` : null;

  if (item.EstEnRetard) {
    if (hasKilometer && hasDate) {
      return { primary: overdueKilometerText, secondary: `ou ${displayDate}` };
    }
    return { primary: hasKilometer ? overdueKilometerText : overdueDateText, secondary: null };
  }

  if (hasKilometer && hasDate) {
    return { primary: kilometerText, secondary: `ou ${displayDate}` };
  }
  if (hasKilometer) return { primary: kilometerText, secondary: null };
  if (hasDate) return { primary: dateText, secondary: null };
  return { primary: 'À planifier', secondary: null };
};

const getTypeDescription = (type) => type?.Description || type?.Nom || 'Entretien';

const ITEMS_PER_PAGE = 5;

const clampPage = (page, totalPages) => Math.min(Math.max(page, 1), Math.max(totalPages, 1));

const getPaginationItems = (currentPage, totalPages) => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  if (currentPage <= 3) {
    pages.add(2);
    pages.add(3);
  }
  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 2);
    pages.add(totalPages - 1);
  }

  return [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)
    .reduce((items, page, index, sortedPages) => {
      if (index > 0 && page - sortedPages[index - 1] > 1) items.push('ellipsis');
      items.push(page);
      return items;
    }, []);
};

const categoryIcon = {
  'Entretien courant': WrenchScrewdriverIcon,
  Pneus: ShieldCheckIcon,
  Freinage: ShieldCheckIcon,
  Fluides: WrenchScrewdriverIcon,
  Transmission: WrenchScrewdriverIcon,
  Autres: WrenchScrewdriverIcon,
};

const getCalendarDayTone = (events, isToday, isCurrentMonth) => {
  if (events.some((event) => event.status === 'overdue')) {
    return 'bg-rose-500 text-white shadow-lg shadow-rose-950/40 ring-1 ring-rose-300/40 hover:bg-rose-400';
  }
  if (events.some((event) => event.status === 'realized')) {
    return 'bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-300/40 hover:bg-emerald-400';
  }
  if (events.some((event) => event.status === 'planned')) {
    return 'bg-sky-500 text-white shadow-lg shadow-sky-950/40 ring-1 ring-sky-300/40 hover:bg-sky-400';
  }
  if (isToday) return 'bg-sky-500 font-black text-white shadow-lg shadow-sky-950/40';
  return isCurrentMonth ? 'text-slate-200' : 'text-slate-600';
};

function Pagination({ currentPage, totalItems, onPageChange }) {
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  if (totalPages <= 1) return null;

  const safeCurrentPage = clampPage(currentPage, totalPages);
  const startItem = (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(safeCurrentPage * ITEMS_PER_PAGE, totalItems);
  const paginationItems = getPaginationItems(safeCurrentPage, totalPages);

  const goToPage = (page) => {
    onPageChange(clampPage(page, totalPages));
  };

  return (
    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          type="button"
          onClick={() => goToPage(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
          className="relative inline-flex items-center rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Précédent
        </button>
        <button
          type="button"
          onClick={() => goToPage(safeCurrentPage + 1)}
          disabled={safeCurrentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Suivant
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <p className="text-sm text-gray-300">
          Affichage <span className="font-medium">{startItem}</span> à <span className="font-medium">{endItem}</span> sur{' '}
          <span className="font-medium">{totalItems}</span> résultats
        </p>
        <nav aria-label="Pagination" className="isolate inline-flex -space-x-px rounded-md">
          <IconTooltip label="Page précédente">
            <button
              type="button"
              onClick={() => goToPage(safeCurrentPage - 1)}
              disabled={safeCurrentPage === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-700 hover:bg-white/5 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Page précédente"
            >
              <ChevronLeftIcon aria-hidden="true" className="size-5" />
            </button>
          </IconTooltip>
          {paginationItems.map((item, index) => (
            item === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-400 ring-1 ring-inset ring-gray-700 focus:outline-offset-0">
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => goToPage(item)}
                aria-current={item === safeCurrentPage ? 'page' : undefined}
                className={item === safeCurrentPage
                  ? 'relative z-10 inline-flex items-center bg-sky-500 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500'
                  : 'relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-200 ring-1 ring-inset ring-gray-700 hover:bg-white/5 focus:z-20 focus:outline-offset-0'}
              >
                {item}
              </button>
            )
          ))}
          <IconTooltip label="Page suivante">
            <button
              type="button"
              onClick={() => goToPage(safeCurrentPage + 1)}
              disabled={safeCurrentPage === totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-700 hover:bg-white/5 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Page suivante"
            >
              <ChevronRightIcon aria-hidden="true" className="size-5" />
            </button>
          </IconTooltip>
        </nav>
      </div>
    </div>
  );
}

function NoteModal({ open, title, note, onClose }) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-2 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-2 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg rounded-lg border border-sky-500/20 bg-slate-950 p-5 text-slate-100 shadow-2xl shadow-black/60">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <Dialog.Title className="text-base font-bold text-white">{title}</Dialog.Title>
                  <IconTooltip label="Fermer la note" placement="bottom" align="end">
                    <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Fermer la note">
                      <XMarkIcon className="size-5" aria-hidden="true" />
                    </button>
                  </IconTooltip>
                </div>
                <p className="whitespace-pre-wrap rounded-lg border border-sky-500/10 bg-slate-900/60 p-4 text-sm leading-6 text-slate-200">{note}</p>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function FilesModal({ open, title, files = [], isDeleting, onClose, onDelete, onOpenFile }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(files.length / ITEMS_PER_PAGE);
  const safePage = clampPage(page, totalPages);
  const paginatedFiles = files.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  useEffect(() => {
    if (!open) return;
    setPage(1);
  }, [open, files]);

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={isDeleting ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-2 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-2 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl rounded-lg border border-sky-500/20 bg-slate-950 p-5 text-slate-100 shadow-2xl shadow-black/60">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <Dialog.Title className="text-base font-bold text-white">{title}</Dialog.Title>
                    <p className="mt-1 text-sm text-slate-400">{files.length} fichier{files.length > 1 ? 's' : ''}</p>
                  </div>
                  <IconTooltip label="Fermer les fichiers" placement="bottom" align="end">
                    <button type="button" onClick={onClose} disabled={isDeleting} className="rounded-md p-1 text-slate-400 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50" aria-label="Fermer les fichiers">
                      <XMarkIcon className="size-5" aria-hidden="true" />
                    </button>
                  </IconTooltip>
                </div>

                <div className="space-y-2">
                  {paginatedFiles.map((file) => (
                    <div key={file.EntretienFichierID} className="grid gap-3 rounded-lg border border-sky-500/15 bg-slate-900/50 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <div className="flex min-w-0 items-center gap-3">
                        <PaperClipIcon className="size-5 shrink-0 text-sky-300" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-white">{file.NomOriginal}</p>
                          <p className="truncate text-xs text-slate-400">{file.Categorie || 'autre'} · {formatFileSize(file.TailleOctets)}</p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <IconTooltip label="Ouvrir le fichier">
                          <button
                            type="button"
                            onClick={() => onOpenFile(file)}
                            className="grid size-10 place-items-center rounded-md border border-sky-500/25 text-sky-200 hover:border-sky-300/50 hover:bg-sky-500/10"
                            aria-label="Ouvrir le fichier"
                          >
                            <ArrowTopRightOnSquareIcon className="size-5" />
                          </button>
                        </IconTooltip>
                        <IconTooltip label="Supprimer le fichier">
                          <button
                            type="button"
                            onClick={() => onDelete(file)}
                            disabled={isDeleting}
                            className="grid size-10 place-items-center rounded-md border border-rose-500/25 text-rose-200 hover:border-rose-300/50 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Supprimer le fichier"
                          >
                            <TrashIcon className="size-5" />
                          </button>
                        </IconTooltip>
                      </div>
                    </div>
                  ))}
                </div>

                <Pagination currentPage={safePage} totalItems={files.length} onPageChange={setPage} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function FilePreviewModal({ open, file, onClose, onUnauthorized }) {
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('document');
  const [mimeType, setMimeType] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const tokenRef = useRef(localStorage.getItem('token'));
  const objectUrlRef = useRef('');

  const revokeCurrentUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = '';
    }
    setFileUrl('');
  };

  useEffect(() => {
    if (!open || !file?.EntretienFichierID) {
      revokeCurrentUrl();
      return undefined;
    }

    let ignore = false;
    tokenRef.current = localStorage.getItem('token');

    const closeUnauthorized = () => {
      revokeCurrentUrl();
      onUnauthorized?.();
    };

    const loadFile = async () => {
      setIsLoading(true);
      setError('');
      setFileName(file.NomOriginal || `fichier-${file.EntretienFichierID}`);
      setMimeType(file.TypeMime || '');

      try {
        const userResponse = await api.get('/users/me');
        const userId = userResponse.data?.UtilisateurID;

        if (!userId) {
          closeUnauthorized();
          return;
        }

        const response = await api.get(`/entretien/${userId}/files/${file.EntretienFichierID}`, {
          responseType: 'blob',
        });

        if (ignore) return;

        const contentType = response.headers['content-type'] || response.data.type || file.TypeMime || 'application/octet-stream';
        const disposition = response.headers['content-disposition'] || '';
        const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
        const name = match ? decodeURIComponent(match[1].replace(/"$/, '')) : file.NomOriginal || `fichier-${file.EntretienFichierID}`;
        const objectUrl = URL.createObjectURL(new Blob([response.data], { type: contentType }));

        revokeCurrentUrl();
        objectUrlRef.current = objectUrl;
        setFileUrl(objectUrl);
        setFileName(name);
        setMimeType(contentType);
      } catch (loadError) {
        if (!ignore) {
          revokeCurrentUrl();
          setError("Impossible d'ouvrir ce fichier avec l'utilisateur connecté.");
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    loadFile();

    const verifyToken = () => {
      const currentToken = localStorage.getItem('token');
      if (!currentToken || currentToken !== tokenRef.current) {
        closeUnauthorized();
      }
    };

    const onStorage = (event) => {
      if (event.key === 'token' || event.key === 'vehicleLogoutAt') verifyToken();
    };

    window.addEventListener('storage', onStorage);
    const intervalId = window.setInterval(verifyToken, 2000);

    return () => {
      ignore = true;
      window.removeEventListener('storage', onStorage);
      window.clearInterval(intervalId);
      revokeCurrentUrl();
    };
    // revokeCurrentUrl is intentionally local to this component and only uses current refs/setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, onUnauthorized, open]);

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[110]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-[110] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-2 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-2 scale-95"
            >
              <Dialog.Panel className="flex h-[90vh] w-full max-w-6xl flex-col rounded-lg border border-sky-500/20 bg-slate-950 p-4 text-slate-100 shadow-2xl shadow-black/60">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <Dialog.Title className="truncate text-lg font-bold text-white">{fileName}</Dialog.Title>
                    <p className="mt-1 text-sm text-slate-400">Fichier chargé avec votre session active.</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {fileUrl && (
                      <a
                        href={fileUrl}
                        download={fileName}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-sky-500/25 px-4 text-sm font-bold text-sky-200 hover:border-sky-300/50 hover:bg-sky-500/10"
                      >
                        <ArrowDownTrayIcon className="size-5" />
                        Télécharger
                      </a>
                    )}
                    <IconTooltip label="Fermer le fichier" placement="bottom" align="end">
                      <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-lg border border-slate-700 text-slate-300 hover:bg-white/5 hover:text-white" aria-label="Fermer le fichier">
                        <XMarkIcon className="size-5" />
                      </button>
                    </IconTooltip>
                  </div>
                </div>

                <section className="min-h-0 flex-1 overflow-hidden rounded-lg border border-sky-500/20 bg-slate-900/50">
                  {isLoading ? (
                    <div className="grid h-full place-items-center">
                      <div className="inline-flex items-center gap-3 rounded-lg border border-sky-500/20 bg-slate-950/70 px-5 py-4">
                        <ArrowPathIcon className="size-5 animate-spin text-sky-300" />
                        Chargement du fichier...
                      </div>
                    </div>
                  ) : error ? (
                    <div className="grid h-full place-items-center p-4">
                      <div className="max-w-lg rounded-lg border border-rose-500/30 bg-rose-500/10 p-5 text-center">
                        <ExclamationTriangleIcon className="mx-auto size-8 text-rose-300" />
                        <p className="mt-3 font-bold text-white">Accès refusé</p>
                        <p className="mt-2 text-sm text-rose-100">{error}</p>
                      </div>
                    </div>
                  ) : mimeType.startsWith('image/') ? (
                    <img src={fileUrl} alt={fileName} className="mx-auto h-full max-h-full max-w-full object-contain" />
                  ) : (
                    <iframe title={fileName} src={fileUrl} className="h-full w-full bg-white" />
                  )}
                </section>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function DeleteConfirmationModal({ open, title, message, isDeleting, onCancel, onConfirm }) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={isDeleting ? () => {} : onCancel}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-2 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-2 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md rounded-lg border border-rose-500/25 bg-slate-950 p-5 text-slate-100 shadow-2xl shadow-black/60">
                <div className="mb-4 flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-rose-500/10 text-rose-300 ring-1 ring-rose-400/25">
                    <TrashIcon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <Dialog.Title className="text-base font-bold text-white">{title}</Dialog.Title>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{message}</p>
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
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function CalendarEventsModal({ open, date, events = [], isPrivacyMode, isShieldModeLevel2, onClose }) {
  const formattedDate = date && isPrivacyMode && !isShieldModeLevel2 ? formatPrivacyYear(date) : date ? maskLevel2Value(new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date)), isShieldModeLevel2) : '';

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-2 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-2 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl rounded-lg border border-sky-500/20 bg-slate-950 p-5 text-slate-100 shadow-2xl shadow-black/60">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <Dialog.Title className="text-base font-bold text-white">Entretiens du jour</Dialog.Title>
                    <p className="mt-1 text-sm capitalize text-slate-400">{formattedDate}</p>
                  </div>
                  <IconTooltip label="Fermer les entretiens du jour" placement="bottom" align="end">
                    <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Fermer les entretiens du jour">
                      <XMarkIcon className="size-5" aria-hidden="true" />
                    </button>
                  </IconTooltip>
                </div>

                <div className="space-y-3">
                  {events.map((event) => {
                    const item = event.item;
                    const category = item.EntretienType?.CategorieEntretien;
                    const Icon = categoryIcon[category?.Nom] || WrenchScrewdriverIcon;
                    const timing = event.kind === 'planned' ? getPlannedTiming(item, isPrivacyMode, isShieldModeLevel2) : null;
                    const badgeClass = event.status === 'overdue'
                      ? 'border-rose-400/30 bg-rose-500/10 text-rose-200'
                      : event.status === 'realized'
                        ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                        : 'border-sky-400/30 bg-sky-500/10 text-sky-200';
                    const badgeLabel = event.status === 'overdue' ? 'En retard' : event.status === 'realized' ? 'Réalisé' : 'À venir';

                    return (
                      <article key={`${event.kind}-${item.EntretienPlanifieID || item.EntretienRealiseID}`} className="rounded-lg border border-sky-500/10 bg-slate-900/50 p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="grid size-10 shrink-0 place-items-center rounded-lg ring-1" style={{ color: category?.Couleur || '#0ea5e9', backgroundColor: `${category?.Couleur || '#0ea5e9'}22`, borderColor: `${category?.Couleur || '#0ea5e9'}44` }}>
                              <Icon className="size-5" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                              <h3 className="font-bold text-white">{item.EntretienType?.Nom || 'Entretien'}</h3>
                              <p className="text-sm text-slate-400">{item.Vehicule?.Nom || '-'}</p>
                              {event.kind === 'planned' ? (
                                <p className="mt-2 text-sm text-slate-300">{timing.primary}{timing.secondary ? ` ${timing.secondary}` : ''}</p>
                              ) : (
                                <p className="mt-2 text-sm text-slate-300">
                                  {formatCurrency(item.Cout || 0, isPrivacyMode, isShieldModeLevel2)} €
                                  {item.Garage ? ` • ${maskLevel2Value(item.Garage, isShieldModeLevel2)}` : ''}
                                  {Number.isFinite(Number(item.Kilometre)) ? ` • ${formatDisplayNumber(item.Kilometre, 0, isPrivacyMode, isShieldModeLevel2, 'kilometers')} km` : ''}
                                </p>
                              )}
                              {item.Note && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-400">{maskLevel2Value(item.Note, isShieldModeLevel2)}</p>}
                            </div>
                          </div>
                          <span className={`w-fit rounded-md border px-2.5 py-1 text-xs font-bold ${badgeClass}`}>{badgeLabel}</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function DropdownSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder,
  searchPlaceholder,
  disabled = false,
  renderSelected,
  renderOption,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedOption = options.find((option) => String(option.value) === String(value));
  const filteredOptions = useMemo(() => {
    return options.filter((option) =>
      `${option.label || ''} ${option.description || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const handleSelect = (optionValue) => {
    onChange(String(optionValue));
    setDropdownOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-sm/6 font-bold text-slate-200">
          {label}
        </label>
      )}
      <div className={dropdownOpen ? 'relative z-[100]' : 'relative z-0'}>
        <button
          type="button"
          onClick={() => !disabled && setDropdownOpen((current) => !current)}
          disabled={disabled}
          className="flex w-full items-center justify-between rounded-xl border border-sky-500/20 bg-slate-950/65 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-sky-950/20 transition duration-200 hover:border-sky-400/60 hover:bg-sky-500/10 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-55"
        >
          <span className="min-w-0 flex-1 truncate text-left">
            {selectedOption ? (renderSelected ? renderSelected(selectedOption) : selectedOption.label) : placeholder}
          </span>
          <ChevronUpDownIcon className="size-5 shrink-0 text-sky-300" />
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
                  className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left font-semibold transition duration-150 hover:bg-sky-500/10"
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
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, tone }) {
  return (
    <section className="rounded-lg border border-sky-500/20 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.14),transparent_34%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.86))] p-5 shadow-[0_24px_70px_rgba(2,6,23,0.32)]">
      <div className="flex items-center gap-4">
        <span className={`grid size-12 shrink-0 place-items-center rounded-lg ring-1 ${tone}`}>
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-400">{title}</p>
          <p className="mt-1 text-2xl font-black text-white">{value}</p>
          <p className="mt-1 truncate text-sm text-slate-400">{subtitle}</p>
        </div>
      </div>
    </section>
  );
}

function AttachmentLinks({ files = [], onOpenAll, onOpenFile }) {
  if (!files.length) return <span className="text-sm text-slate-500">-</span>;

  return (
    <div className="flex flex-wrap gap-2">
      {files.slice(0, 2).map((file) => (
        <button
          type="button"
          key={file.EntretienFichierID}
          onClick={() => onOpenFile(file)}
          className="inline-flex max-w-36 items-center gap-1.5 rounded-md border border-sky-500/20 px-2.5 py-1.5 text-xs font-bold text-sky-200 hover:border-sky-300/50 hover:bg-sky-500/10"
        >
          <PaperClipIcon className="size-4 shrink-0" />
          <span className="truncate">{file.NomOriginal}</span>
        </button>
      ))}
      {files.length > 2 && (
        <button
          type="button"
          onClick={onOpenAll}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-600 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:border-slate-400 hover:bg-white/5"
        >
          <PaperClipIcon className="size-4" />
          Voir tout ({files.length})
        </button>
      )}
    </div>
  );
}

function AddEntretienModal({ open, onClose, overview, onCreated, editItem = null, editKind = null, initialValues = null, onDeleteFile, onOpenFile, isDeletingFile = false }) {
  const [mode, setMode] = useState('planned');
  const [vehiculeId, setVehiculeId] = useState('');
  const [categorieId, setCategorieId] = useState('');
  const [entretienTypeId, setEntretienTypeId] = useState('');
  const [datePrevue, setDatePrevue] = useState('');
  const [kilometrePrevu, setKilometrePrevu] = useState('');
  const [dateRealisee, setDateRealisee] = useState(getDateInputValue());
  const [kilometre, setKilometre] = useState('');
  const [cout, setCout] = useState('');
  const [garage, setGarage] = useState('');
  const [estArchive, setEstArchive] = useState(false);
  const [priorite, setPriorite] = useState('Priorité moyenne');
  const [note, setNote] = useState('');
  const [pendingFiles, setPendingFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const vehicles = useMemo(() => overview?.vehicles || [], [overview]);
  const categories = useMemo(() => overview?.categories || [], [overview]);
  const selectedCategory = categories.find((category) => String(category.CategorieEntretienID) === String(categorieId));
  const availableTypes = useMemo(() => selectedCategory?.EntretienTypes || [], [selectedCategory]);
  const vehicleOptions = useMemo(() => vehicles.map((vehicle) => ({
    value: vehicle.VehiculeID,
    label: vehicle.Nom,
    description: [vehicle.Marque?.Nom, vehicle.Modele, vehicle.Type?.Nom].filter(Boolean).join(' · '),
    image: getVehicleImage(vehicle),
  })), [vehicles]);
  const categoryOptions = useMemo(() => categories.map((category) => ({
    value: category.CategorieEntretienID,
    label: category.Nom,
    description: `${category.EntretienTypes?.length || 0} entretien${category.EntretienTypes?.length > 1 ? 's' : ''}`,
    color: category.Couleur,
  })), [categories]);
  const typeOptions = useMemo(() => availableTypes.map((type) => ({
    value: type.EntretienTypeID,
    label: type.Nom,
    description: type.Description,
  })), [availableTypes]);
  const priorityOptions = useMemo(() => [
    { value: 'Priorité basse', label: 'Priorité basse', color: '#22c55e' },
    { value: 'Priorité moyenne', label: 'Priorité moyenne', color: '#f59e0b' },
    { value: 'Priorité haute', label: 'Priorité haute', color: '#ef4444' },
  ], []);
  const isEditing = Boolean(editItem);
  const isCompleting = editKind === 'complete';
  const title = isCompleting ? 'Marquer réalisé' : isEditing ? "Modifier l'entretien" : 'Ajouter un entretien';
  const submitLabel = isCompleting ? 'Passer en historique' : isEditing ? 'Mettre à jour' : "Ajouter l'entretien";

  useEffect(() => {
    if (!open) return;

    if (editItem) {
      const nextMode = editKind === 'planned' ? 'planned' : 'realized';
      const type = editItem.EntretienType;
      const categoryId = type?.CategorieEntretienID || type?.CategorieEntretien?.CategorieEntretienID;

      setMode(nextMode);
      setVehiculeId(editItem.VehiculeID ? String(editItem.VehiculeID) : '');
      setCategorieId(categoryId ? String(categoryId) : '');
      setEntretienTypeId(editItem.EntretienTypeID ? String(editItem.EntretienTypeID) : '');
      setDatePrevue(editItem.DatePrevue ? getDateInputValue(new Date(editItem.DatePrevue)) : '');
      setKilometrePrevu(editItem.KilometrePrevu ?? '');
      setDateRealisee(getDateInputValue(editKind === 'realized' && editItem.Date ? new Date(editItem.Date) : new Date()));
      setKilometre(editKind === 'realized' ? editItem.Kilometre ?? '' : editItem.KilometrePrevu ?? '');
      setCout(editKind === 'realized' ? editItem.Cout ?? '' : '');
      setGarage(editKind === 'realized' ? editItem.Garage || '' : '');
      setEstArchive(editKind === 'realized' ? Boolean(editItem.EstArchive) : false);
      setPriorite(editItem.Priorite || 'Priorité moyenne');
      setNote(editItem.Note || '');
      setPendingFiles([]);
      setError('');
      return;
    }

    const initialVehicleId = initialValues?.vehicleId && vehicles.some((vehicle) => String(vehicle.VehiculeID) === String(initialValues.vehicleId))
      ? String(initialValues.vehicleId)
      : vehicles[0]?.VehiculeID ? String(vehicles[0].VehiculeID) : '';
    const initialDate = initialValues?.date || '';

    setMode('planned');
    setVehiculeId(initialVehicleId);
    setCategorieId(categories[0]?.CategorieEntretienID ? String(categories[0].CategorieEntretienID) : '');
    setDatePrevue(initialDate);
    setKilometrePrevu('');
    setDateRealisee(initialDate || getDateInputValue());
    setKilometre('');
    setCout('');
    setGarage('');
    setEstArchive(false);
    setPriorite('Priorité moyenne');
    setNote('');
    setPendingFiles([]);
    setError('');
  }, [open, vehicles, categories, editItem, editKind, initialValues]);

  useEffect(() => {
    if (editItem?.EntretienTypeID && availableTypes.some((type) => String(type.EntretienTypeID) === String(editItem.EntretienTypeID))) {
      setEntretienTypeId(String(editItem.EntretienTypeID));
      return;
    }
    const firstType = availableTypes[0]?.EntretienTypeID;
    setEntretienTypeId(firstType ? String(firstType) : '');
  }, [categorieId, availableTypes, editItem]);

  const handleFilesChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    const nextFiles = selectedFiles.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}-${Date.now()}`,
      file,
      name: file.name.replace(/\.[^/.]+$/, ''),
      category: file.type === 'application/pdf' ? (mode === 'planned' ? 'devis' : 'facture') : 'autre',
    }));

    setPendingFiles((currentFiles) => [...currentFiles, ...nextFiles]);
    event.target.value = '';
  };

  const updatePendingFile = (fileId, patch) => {
    setPendingFiles((currentFiles) => currentFiles.map((item) => (
      item.id === fileId ? { ...item, ...patch } : item
    )));
  };

  const removePendingFile = (fileId) => {
    setPendingFiles((currentFiles) => currentFiles.filter((item) => item.id !== fileId));
  };

  const buildSubmitPayload = () => {
    const fields = {
      mode,
      vehiculeId,
      entretienTypeId,
      datePrevue,
      kilometrePrevu,
      priorite,
      note,
      date: dateRealisee,
      kilometre,
      cout,
      garage,
      estArchive: mode === 'realized' ? estArchive : false,
    };

    if (!pendingFiles.length) return fields;

    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value ?? '');
    });
    formData.append('filesMeta', JSON.stringify(pendingFiles.map((item) => ({
      name: item.name,
      category: item.category,
    }))));
    pendingFiles.forEach((item) => {
      formData.append('files', item.file);
    });

    return formData;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!vehiculeId || !entretienTypeId) {
      setError('Sélectionnez un véhicule et un entretien.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = buildSubmitPayload();

      if (editKind === 'planned') {
        await api.put(`/entretien/${overview.userId}/planned/${editItem.EntretienPlanifieID}`, payload);
      } else if (editKind === 'realized') {
        await api.put(`/entretien/${overview.userId}/realized/${editItem.EntretienRealiseID}`, payload);
      } else if (editKind === 'complete') {
        await api.put(`/entretien/${overview.userId}/planned/${editItem.EntretienPlanifieID}/complete`, payload);
      } else {
        await api.post(`/entretien/${overview.userId}/add`, payload);
      }

      await onCreated();
      onClose();
    } catch (submitError) {
      setError(submitError.response?.data?.error || "Impossible d'ajouter l'entretien.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog className="relative z-50" onClose={() => !isSubmitting && onClose()}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto p-4">
          <div className="flex min-h-full items-center justify-center">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-5xl rounded-xl border border-sky-500/30 bg-[radial-gradient(circle_at_10%_0%,rgba(59,130,246,0.18),transparent_34%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.96))] p-6 text-slate-100 shadow-2xl shadow-sky-950/50 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="grid size-14 shrink-0 place-items-center rounded-full bg-violet-500/20 text-violet-300 ring-1 ring-violet-400/20">
                      <WrenchScrewdriverIcon className="size-7" aria-hidden="true" />
                    </span>
                    <div>
                      <Dialog.Title className="text-2xl font-black text-white">{title}</Dialog.Title>
                      <p className="mt-1 text-sm text-slate-400">Planifiez ou enregistrez un entretien réalisé pour ce véhicule.</p>
                    </div>
                  </div>
                  <IconTooltip label="Fermer le formulaire" placement="bottom" align="end">
                    <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Fermer le formulaire">
                      <XMarkIcon className="size-6" aria-hidden="true" />
                    </button>
                  </IconTooltip>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-7">
                  <div className="grid gap-4 rounded-lg border border-sky-500/20 bg-slate-950/40 p-1 sm:grid-cols-2">
                    <button type="button" onClick={() => !isEditing && setMode('planned')} disabled={isEditing} className={`flex items-center gap-4 rounded-md border px-5 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${mode === 'planned' ? 'border-sky-400 bg-sky-500/10 text-white' : 'border-transparent text-slate-300 hover:bg-white/5'}`}>
                      <CalendarDaysIcon className="size-7 shrink-0 text-sky-300" />
                      <span><span className="block font-bold">À venir (planifié)</span><span className="text-sm text-slate-400">Entretien à prévoir</span></span>
                    </button>
                    <button type="button" onClick={() => !isEditing && setMode('realized')} disabled={isEditing} className={`flex items-center gap-4 rounded-md border px-5 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${mode === 'realized' ? 'border-sky-400 bg-sky-500/10 text-white' : 'border-transparent text-slate-300 hover:bg-white/5'}`}>
                      <CheckCircleIcon className="size-7 shrink-0 text-slate-300" />
                      <span><span className="block font-bold">Réalisé</span><span className="text-sm text-slate-400">Entretien déjà effectué</span></span>
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase tracking-wide text-slate-400">Véhicule concerné</label>
                    <div className="mt-2">
                      <DropdownSelect
                        value={vehiculeId}
                        onChange={setVehiculeId}
                        options={vehicleOptions}
                        placeholder="Rechercher un véhicule..."
                        searchPlaceholder="Rechercher un véhicule..."
                        disabled={isCompleting}
                        renderSelected={(option) => (
                          <span className="flex min-w-0 items-center gap-4">
                            <img src={option.image} alt="" className="h-12 w-16 shrink-0 rounded-md object-cover ring-1 ring-sky-500/20" />
                            <span className="min-w-0">
                              <span className="block truncate text-base font-bold text-white">{option.label}</span>
                              <span className="block truncate text-sm font-medium text-slate-400">{option.description || 'Véhicule'}</span>
                            </span>
                          </span>
                        )}
                        renderOption={(option) => (
                          <>
                            <img src={option.image} alt="" className="h-11 w-14 shrink-0 rounded-md object-cover ring-1 ring-sky-500/20" />
                            <span className="min-w-0">
                              <span className="block truncate text-white">{option.label}</span>
                              <span className="block truncate text-xs text-slate-400">{option.description || 'Véhicule'}</span>
                            </span>
                          </>
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase tracking-wide text-slate-400">Type d'entretien</label>
                    <div className="mt-2 grid gap-4 md:grid-cols-2">
                      <DropdownSelect
                        label="Catégorie"
                        value={categorieId}
                        onChange={setCategorieId}
                        options={categoryOptions}
                        placeholder="Sélectionner une catégorie"
                        searchPlaceholder="Rechercher une catégorie..."
                        disabled={isCompleting}
                        renderSelected={(option) => (
                          <span className="flex items-center gap-3">
                            <span className="size-3 rounded-full" style={{ backgroundColor: option.color || '#0ea5e9' }} />
                            <span className="truncate">{option.label}</span>
                          </span>
                        )}
                        renderOption={(option) => (
                          <>
                            <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: option.color || '#0ea5e9' }} />
                            <span className="min-w-0">
                              <span className="block truncate text-white">{option.label}</span>
                              <span className="block truncate text-xs text-slate-400">{option.description}</span>
                            </span>
                          </>
                        )}
                      />
                      <DropdownSelect
                        label="Entretien"
                        value={entretienTypeId}
                        onChange={setEntretienTypeId}
                        options={typeOptions}
                        placeholder="Sélectionner un entretien"
                        searchPlaceholder="Rechercher un entretien..."
                        disabled={isCompleting}
                        renderOption={(option) => (
                          <span className="min-w-0">
                            <span className="block truncate text-white">{option.label}</span>
                            <span className="block truncate text-xs text-slate-400">{option.description}</span>
                          </span>
                        )}
                      />
                    </div>
                  </div>

                  {mode === 'planned' ? (
                    <div>
                      <label className="text-xs font-black uppercase tracking-wide text-slate-400">Échéance / Kilométrage</label>
                      <div className="mt-2 grid gap-4 md:grid-cols-2">
                        <label className="rounded-lg border border-sky-500/20 bg-slate-950/40 px-4 py-3">
                          <span className="text-sm text-slate-300">Date prévue (optionnel)</span>
                          <input type="date" value={datePrevue} onChange={(event) => setDatePrevue(event.target.value)} className="mt-3 w-full bg-transparent text-slate-100 outline-none" />
                        </label>
                        <label className="rounded-lg border border-sky-500/20 bg-slate-950/40 px-4 py-3">
                          <span className="text-sm text-slate-300">Kilométrage prévu (optionnel)</span>
                          <input type="number" min="0" value={kilometrePrevu} onChange={(event) => setKilometrePrevu(event.target.value)} placeholder="Ex. : 25000" className="mt-3 w-full bg-transparent text-slate-100 outline-none placeholder:text-slate-600" />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-black uppercase tracking-wide text-slate-400">Réalisation</label>
                      <div className="mt-2 grid gap-4 md:grid-cols-4">
                        <label className="rounded-lg border border-sky-500/20 bg-slate-950/40 px-4 py-3">
                          <span className="text-sm text-slate-300">Date réalisée</span>
                          <input type="date" value={dateRealisee} onChange={(event) => setDateRealisee(event.target.value)} className="mt-3 w-full bg-transparent text-slate-100 outline-none" required />
                        </label>
                        <label className="rounded-lg border border-sky-500/20 bg-slate-950/40 px-4 py-3">
                          <span className="text-sm text-slate-300">Kilométrage</span>
                          <input type="number" min="0" value={kilometre} onChange={(event) => setKilometre(event.target.value)} placeholder="Ex. : 25000" className="mt-3 w-full bg-transparent text-slate-100 outline-none placeholder:text-slate-600" />
                        </label>
                        <label className="rounded-lg border border-sky-500/20 bg-slate-950/40 px-4 py-3">
                          <span className="text-sm text-slate-300">Coût</span>
                          <input type="number" min="0" step="0.01" value={cout} onChange={(event) => setCout(event.target.value)} placeholder="Ex. : 89.60" className="mt-3 w-full bg-transparent text-slate-100 outline-none placeholder:text-slate-600" />
                        </label>
                        <label className="rounded-lg border border-sky-500/20 bg-slate-950/40 px-4 py-3">
                          <span className="text-sm text-slate-300">Garage</span>
                          <input type="text" maxLength={150} value={garage} onChange={(event) => setGarage(event.target.value)} placeholder="Optionnel" className="mt-3 w-full bg-transparent text-slate-100 outline-none placeholder:text-slate-600" />
                        </label>
                      </div>
                      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-sky-500/20 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={estArchive}
                          onChange={(event) => setEstArchive(event.target.checked)}
                          className="mt-1 size-4 rounded border-slate-600 bg-slate-900 text-sky-500"
                        />
                        <span>
                          <span className="block font-bold text-white">Archive ancien propriétaire</span>
                          <span className="block text-slate-400">Visible dans l'historique du véhicule, mais exclu des totaux et statistiques utilisateur.</span>
                        </span>
                      </label>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
                    <div>
                      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-400">Priorité</span>
                      <DropdownSelect
                        value={priorite}
                        onChange={setPriorite}
                        options={priorityOptions}
                        placeholder="Sélectionner une priorité"
                        searchPlaceholder="Rechercher une priorité..."
                        disabled={mode === 'realized'}
                        renderSelected={(option) => (
                          <span className="flex items-center gap-3">
                            <FlagIcon className="size-5 text-slate-400" />
                            <span className="size-3 rounded-full" style={{ backgroundColor: option.color }} />
                            <span className="truncate">{option.label}</span>
                          </span>
                        )}
                        renderOption={(option) => (
                          <>
                            <FlagIcon className="size-5 shrink-0 text-slate-400" />
                            <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: option.color }} />
                            <span className="truncate text-white">{option.label}</span>
                          </>
                        )}
                      />
                    </div>
                    <label>
                      <span className="text-xs font-black uppercase tracking-wide text-slate-400">Notes (optionnel)</span>
                      <textarea value={note} onChange={(event) => setNote(event.target.value.slice(0, mode === 'planned' ? 255 : 500))} rows={4} placeholder="Ajoutez une note, un rappel, ou des détails..." className="mt-2 w-full rounded-lg border border-sky-500/20 bg-slate-950/40 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-400/60" />
                      <span className="block text-right text-sm text-slate-400">{note.length} / {mode === 'planned' ? 255 : 500}</span>
                    </label>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs font-black uppercase tracking-wide text-slate-400">Pièces jointes</span>
                      <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-sky-500/25 px-4 text-sm font-bold text-sky-200 hover:border-sky-300/50 hover:bg-sky-500/10">
                        <PaperClipIcon className="size-5" />
                        Ajouter des fichiers
                        <input type="file" multiple accept="image/*,application/pdf,.pdf" onChange={handleFilesChange} className="sr-only" />
                      </label>
                    </div>

                    {editItem?.EntretienFichiers?.length ? (
                      <div className="grid gap-2 md:grid-cols-2">
                        {editItem.EntretienFichiers.map((file) => (
                          <div
                            key={file.EntretienFichierID}
                            className="grid gap-3 rounded-lg border border-sky-500/20 bg-slate-950/40 px-4 py-3 text-sm text-slate-200 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <PaperClipIcon className="size-5 shrink-0 text-sky-300" />
                              <span className="min-w-0">
                                <span className="block truncate font-bold text-white">{file.NomOriginal}</span>
                                <span className="block truncate text-xs text-slate-400">{file.Categorie || 'autre'} · {formatFileSize(file.TailleOctets)}</span>
                              </span>
                            </span>
                            <span className="flex justify-end gap-2">
                              <IconTooltip label="Ouvrir le fichier">
                                <button
                                  type="button"
                                  onClick={() => onOpenFile?.(file)}
                                  className="grid size-9 place-items-center rounded-md border border-sky-500/25 text-sky-200 hover:border-sky-300/50 hover:bg-sky-500/10"
                                  aria-label="Ouvrir le fichier"
                                >
                                  <ArrowTopRightOnSquareIcon className="size-4" />
                                </button>
                              </IconTooltip>
                              <IconTooltip label="Supprimer le fichier">
                                <button
                                  type="button"
                                  onClick={() => onDeleteFile?.(file)}
                                  disabled={isDeletingFile}
                                  className="grid size-9 place-items-center rounded-md border border-rose-500/25 text-rose-200 hover:border-rose-300/50 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                  aria-label="Supprimer le fichier"
                                >
                                  <TrashIcon className="size-4" />
                                </button>
                              </IconTooltip>
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {pendingFiles.length ? (
                      <div className="space-y-2">
                        {pendingFiles.map((item) => (
                          <div key={item.id} className="grid gap-3 rounded-lg border border-sky-500/20 bg-slate-950/40 p-3 md:grid-cols-[minmax(0,1fr)_160px_42px] md:items-end">
                            <label className="min-w-0">
                              <span className="text-xs font-bold text-slate-400">Nom du fichier</span>
                              <input
                                type="text"
                                maxLength={120}
                                value={item.name}
                                onChange={(event) => updatePendingFile(item.id, { name: event.target.value })}
                                className="mt-1 w-full rounded-md border border-sky-500/20 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-400/60"
                                placeholder="Nom affiché"
                              />
                              <span className="mt-1 block truncate text-xs text-slate-500">{item.file.name} · {formatFileSize(item.file.size)}</span>
                            </label>
                            <label>
                              <span className="text-xs font-bold text-slate-400">Catégorie</span>
                              <select
                                value={item.category}
                                onChange={(event) => updatePendingFile(item.id, { category: event.target.value })}
                                className="mt-1 w-full rounded-md border border-sky-500/20 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-400/60"
                              >
                                {FILE_CATEGORY_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                              </select>
                            </label>
                            <IconTooltip label="Retirer le fichier">
                              <button
                                type="button"
                                onClick={() => removePendingFile(item.id)}
                                className="grid size-10 place-items-center rounded-md border border-rose-500/25 text-rose-200 hover:border-rose-300/50 hover:bg-rose-500/10"
                                aria-label="Retirer le fichier"
                              >
                                <XMarkIcon className="size-5" />
                              </button>
                            </IconTooltip>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-lg border border-sky-500/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-500">Images et PDF acceptés.</p>
                    )}
                  </div>

                  <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-slate-300">
                    <p className="flex gap-3"><InformationCircleIcon className="size-6 shrink-0 text-sky-300" /><span><strong className="text-sky-300">Conseil :</strong> Vous pouvez définir une date, un kilométrage, ou les deux. Vous serez notifié lorsque l'échéance approchera.</span></p>
                  </div>

                  {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200">{error}</p>}

                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    <button type="button" onClick={onClose} disabled={isSubmitting} className="h-12 rounded-lg border border-slate-600 px-8 font-bold text-slate-200 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60">Annuler</button>
                    <button type="submit" disabled={isSubmitting || !vehicles.length || !availableTypes.length} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-sky-500 px-8 font-bold text-white shadow-lg shadow-sky-950/40 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60">
                      <PlusIcon className="size-5" />
                      {isSubmitting ? 'Enregistrement...' : submitLabel}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function EntretienInfoModal({ open, item, kind, isPrivacyMode, isShieldModeLevel2, onClose, onEdit, onComplete, onOpenFile }) {
  if (!item) return null;

  const isPlanned = kind === 'planned';
  const title = item.EntretienType?.Nom || 'Entretien';
  const category = item.EntretienType?.CategorieEntretien;
  const timing = isPlanned ? getPlannedTiming(item, isPrivacyMode, isShieldModeLevel2) : null;
  const files = item.EntretienFichiers || [];

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 z-[100] overflow-y-auto p-4">
          <div className="flex min-h-full items-center justify-center">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 translate-y-2 scale-95" enterTo="opacity-100 translate-y-0 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 translate-y-0 scale-100" leaveTo="opacity-0 translate-y-2 scale-95">
              <Dialog.Panel className="w-full max-w-3xl rounded-xl border border-sky-500/25 bg-slate-950 p-6 text-slate-100 shadow-2xl shadow-black/60">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-lg ring-1" style={{ color: category?.Couleur || '#0ea5e9', backgroundColor: `${category?.Couleur || '#0ea5e9'}22` }}>
                      <WrenchScrewdriverIcon className="size-6" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <Dialog.Title className="truncate text-xl font-black text-white">{title}</Dialog.Title>
                      <p className="mt-1 text-sm text-slate-400">{getTypeDescription(item.EntretienType)}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                        <span className="rounded-md border border-sky-500/20 px-2.5 py-1 text-sky-200">{item.Vehicule?.Nom || 'Véhicule'}</span>
                        {isPlanned && item.EstEnRetard && <span className="rounded-md border border-rose-400/30 bg-rose-500/10 px-2.5 py-1 text-rose-200">En retard</span>}
                        {!isPlanned && item.EstArchive && <span className="rounded-md border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-amber-200">Archive</span>}
                      </div>
                    </div>
                  </div>
                  <IconTooltip label="Fermer" placement="bottom" align="end">
                    <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Fermer">
                      <XMarkIcon className="size-6" />
                    </button>
                  </IconTooltip>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {isPlanned ? (
                    <>
                      <div className="rounded-lg border border-sky-500/15 bg-slate-900/50 p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-500">Échéance</p>
                        <p className="mt-2 font-bold text-white">{timing?.primary || '-'}</p>
                        {timing?.secondary && <p className="text-sm text-slate-400">{timing.secondary}</p>}
                      </div>
                      <div className="rounded-lg border border-sky-500/15 bg-slate-900/50 p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-500">Priorité</p>
                        <p className="mt-2 font-bold text-white">{item.Priorite || '-'}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-lg border border-sky-500/15 bg-slate-900/50 p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-500">Réalisation</p>
                        <p className="mt-2 font-bold text-white">{formatDisplayDate(item.Date, isPrivacyMode, isShieldModeLevel2)}</p>
                        <p className="text-sm text-slate-400">{formatDisplayNumber(item.Kilometre, 0, isPrivacyMode, isShieldModeLevel2, 'kilometers')} km</p>
                      </div>
                      <div className="rounded-lg border border-sky-500/15 bg-slate-900/50 p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-500">Coût / Garage</p>
                        <p className="mt-2 font-bold text-white">{formatCurrency(item.Cout || 0, isPrivacyMode, isShieldModeLevel2)} €</p>
                        <p className="text-sm text-slate-400">{item.Garage ? maskLevel2Value(item.Garage, isShieldModeLevel2) : '-'}</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-4 rounded-lg border border-sky-500/15 bg-slate-900/50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">Note</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">{item.Note ? maskLevel2Value(item.Note, isShieldModeLevel2) : 'Aucune note.'}</p>
                </div>

                {!isPrivacyMode && (
                  <div className="mt-4 rounded-lg border border-sky-500/15 bg-slate-900/50 p-4">
                    <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">Pièces jointes</p>
                    {files.length ? (
                      <div className="flex flex-wrap gap-2">
                        {files.map((file) => (
                          <button
                            type="button"
                            key={file.EntretienFichierID}
                            onClick={() => onOpenFile(file)}
                            className="inline-flex max-w-48 items-center gap-1.5 rounded-md border border-sky-500/20 px-2.5 py-1.5 text-xs font-bold text-sky-200 hover:border-sky-300/50 hover:bg-sky-500/10"
                          >
                            <PaperClipIcon className="size-4 shrink-0" />
                            <span className="truncate">{file.NomOriginal}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Aucun fichier.</p>
                    )}
                  </div>
                )}

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button type="button" onClick={onClose} className="h-11 rounded-lg border border-slate-700 px-5 text-sm font-bold text-slate-200 hover:border-slate-500 hover:bg-white/5">Fermer</button>
                  {!isPrivacyMode && isPlanned && (
                    <button type="button" onClick={onComplete} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-emerald-500/30 px-5 text-sm font-bold text-emerald-100 hover:bg-emerald-500/10">
                      <CheckCircleIcon className="size-5" />
                      Marquer réalisé
                    </button>
                  )}
                  {!isPrivacyMode && (
                    <button type="button" onClick={onEdit} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 text-sm font-bold text-white hover:bg-sky-400">
                      <PencilSquareIcon className="size-5" />
                      Modifier
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function EntretienPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isPrivacyMode, isShieldModeLevel2 } = usePrivacy();
  const [user, setUser] = useState(null);
  const [overview, setOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editKind, setEditKind] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [plannedPage, setPlannedPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTab, setHistoryTab] = useState('active');
  const [infoModal, setInfoModal] = useState(null);
  const [noteModal, setNoteModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [fileDeleteModal, setFileDeleteModal] = useState(null);
  const [filesModal, setFilesModal] = useState(null);
  const [filePreviewModal, setFilePreviewModal] = useState(null);
  const [calendarModal, setCalendarModal] = useState(null);
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [includeArchivedCosts, setIncludeArchivedCosts] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingFile, setIsDeletingFile] = useState(false);
  const initialCreateValues = useMemo(() => ({
    shouldOpen: searchParams.get('modal') === 'add',
    vehicleId: searchParams.get('vehicleId') || '',
    date: searchParams.get('date') || getDateInputValue(),
  }), [searchParams]);
  const infoParam = searchParams.get('info') || '';

  const fetchOverview = async (userId) => {
    const response = await shieldFetch(`${apiUrl}/api/entretien/${userId}/overview`);
    if (!response.ok) throw new Error('Failed to fetch entretien overview');
    const result = await response.json();
    setOverview({ ...result, userId });
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

  useEffect(() => {
    if (!user?.UtilisateurID) return;
    let ignore = false;

    const load = async () => {
      setIsLoading(true);
      try {
        await fetchOverview(user.UtilisateurID);
      } catch (error) {
        if (!ignore) {
          console.error('Failed to fetch entretien data:', error);
          setOverview(null);
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [user]);

  const planned = useMemo(() => overview?.planned || [], [overview]);
  const realized = useMemo(() => overview?.realized || [], [overview]);
  const vehicles = useMemo(() => overview?.vehicles || [], [overview]);
  const vehicleFilterOptions = useMemo(() => [
    { value: 'all', label: 'Tous les véhicules', description: 'Vue globale' },
    ...vehicles.map((vehicle) => ({
      value: vehicle.VehiculeID,
      label: vehicle.Nom,
      description: [vehicle.Marque?.Nom, vehicle.Modele, vehicle.Type?.Nom].filter(Boolean).join(' · '),
      image: getVehicleImage(vehicle),
    })),
  ], [vehicles]);
  const selectedVehicleFilter = vehicleFilterOptions.find((option) => String(option.value) === String(vehicleFilter));
  const maintenanceScopeLabel = selectedVehicleFilter?.label || 'Tous les véhicules';
  const filterBySelectedVehicle = useCallback((item) => (
    vehicleFilter === 'all' || String(item.VehiculeID) === String(vehicleFilter)
  ), [vehicleFilter]);
  const filteredPlanned = useMemo(() => planned.filter(filterBySelectedVehicle), [filterBySelectedVehicle, planned]);
  const filteredRealized = useMemo(() => realized.filter(filterBySelectedVehicle), [filterBySelectedVehicle, realized]);
  const activeRealized = useMemo(() => filteredRealized.filter((item) => !item.EstArchive), [filteredRealized]);
  const archivedRealized = useMemo(() => filteredRealized.filter((item) => item.EstArchive), [filteredRealized]);
  const historyRows = historyTab === 'archives' ? archivedRealized : activeRealized;
  const stats = useMemo(() => overview?.stats || {}, [overview]);
  const filteredStats = useMemo(() => {
    const now = new Date();
    const next90Days = new Date(now.getTime() + 90 * DAY_IN_MS);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return {
      upcomingCount: filteredPlanned.filter((item) => {
        if (item.EstEnRetard) return false;
        if (item.DatePrevue) return new Date(item.DatePrevue) <= next90Days;
        return item.KilometrePrevu !== null;
      }).length,
      overdueCount: filteredPlanned.filter((item) => item.EstEnRetard).length,
      realizedCount: activeRealized.length,
      realizedThisMonth: activeRealized.filter((item) => {
        const date = new Date(item.Date);
        return date >= monthStart && date < nextMonthStart;
      }).length,
      totalCostAllTime: activeRealized.reduce((sum, item) => sum + (Number(item.Cout) || 0), 0),
    };
  }, [activeRealized, filteredPlanned]);
  const totalCost = Number(filteredStats.totalCostAllTime ?? stats.totalCostAllTime ?? stats.totalCostLast12Months ?? 0);
  const filteredCostItems = useMemo(() => filteredRealized.filter((item) => {
    if (!includeArchivedCosts && item.EstArchive) return false;
    return true;
  }), [filteredRealized, includeArchivedCosts]);
  const costBreakdown = useMemo(() => {
    const costsByCategory = filteredCostItems.reduce((acc, item) => {
      const category = item.EntretienType?.CategorieEntretien;
      const categoryId = category?.CategorieEntretienID || item.EntretienType?.CategorieEntretienID || 'unknown';
      const existing = acc.get(categoryId) || {
        CategorieEntretienID: categoryId,
        Nom: category?.Nom || 'Sans catégorie',
        Couleur: category?.Couleur || '#0ea5e9',
        Icone: category?.Icone || '',
        Cout: 0,
      };
      existing.Cout += Number(item.Cout) || 0;
      acc.set(categoryId, existing);
      return acc;
    }, new Map());

    return Array.from(costsByCategory.values()).sort((a, b) => b.Cout - a.Cout);
  }, [filteredCostItems]);
  const costBreakdownTotal = useMemo(() => (
    filteredCostItems.reduce((sum, item) => sum + (Number(item.Cout) || 0), 0)
  ), [filteredCostItems]);
  const costBreakdownScopeLabel = [
    maintenanceScopeLabel,
    includeArchivedCosts ? 'archives incluses' : 'archives exclues',
  ].join(' · ');
  const sortedPlanned = useMemo(() => [...filteredPlanned].sort((a, b) => {
    if (a.EstEnRetard !== b.EstEnRetard) return a.EstEnRetard ? -1 : 1;
    return new Date(a.DatePrevue || '2999-12-31') - new Date(b.DatePrevue || '2999-12-31');
  }), [filteredPlanned]);
  const plannedPageCount = Math.ceil(sortedPlanned.length / ITEMS_PER_PAGE);
  const historyPageCount = Math.ceil(historyRows.length / ITEMS_PER_PAGE);
  const paginatedPlanned = useMemo(() => {
    const start = (clampPage(plannedPage, plannedPageCount) - 1) * ITEMS_PER_PAGE;
    return sortedPlanned.slice(start, start + ITEMS_PER_PAGE);
  }, [plannedPage, plannedPageCount, sortedPlanned]);
  const paginatedHistory = useMemo(() => {
    const start = (clampPage(historyPage, historyPageCount) - 1) * ITEMS_PER_PAGE;
    return historyRows.slice(start, start + ITEMS_PER_PAGE);
  }, [historyPage, historyPageCount, historyRows]);

  useEffect(() => {
    setPlannedPage((page) => clampPage(page, plannedPageCount));
  }, [plannedPageCount]);

  useEffect(() => {
    setPlannedPage(1);
  }, [vehicleFilter]);

  useEffect(() => {
    setHistoryPage((page) => clampPage(page, historyPageCount));
  }, [historyPageCount]);

  useEffect(() => {
    setHistoryPage(1);
  }, [historyTab, vehicleFilter]);

  useEffect(() => {
    if (!isPrivacyMode) return;
    setModalOpen(false);
    setEditItem(null);
    setEditKind(null);
    setDeleteModal(null);
    setFileDeleteModal(null);
    setFilesModal(null);
    setFilePreviewModal(null);
    setInfoModal(null);
  }, [isPrivacyMode]);

  useEffect(() => {
    if (!overview || !initialCreateValues.shouldOpen || isPrivacyMode) return;
    setEditItem(null);
    setEditKind(null);
    setModalOpen(true);
  }, [overview, initialCreateValues.shouldOpen, isPrivacyMode]);

  useEffect(() => {
    if (!overview) return;
    const match = infoParam?.match(/^(planned|realized)-(\d+)$/);
    if (!match) return;

    const [, kind, rawId] = match;
    const id = Number(rawId);
    const item = kind === 'planned'
      ? planned.find((entry) => entry.EntretienPlanifieID === id)
      : realized.find((entry) => entry.EntretienRealiseID === id);

    if (item) setInfoModal({ kind, item });
  }, [infoParam, overview, planned, realized]);

  const donutGradient = useMemo(() => {
    if (!costBreakdown.length || costBreakdownTotal <= 0) return 'conic-gradient(#1e293b 0% 100%)';
    let cursor = 0;
    const parts = costBreakdown.map((item) => {
      const start = cursor;
      cursor += (Number(item.Cout || 0) / costBreakdownTotal) * 100;
      return `${item.Couleur || '#0ea5e9'} ${start}% ${cursor}%`;
    });
    return `conic-gradient(${parts.join(', ')})`;
  }, [costBreakdown, costBreakdownTotal]);

  const calendarDays = useMemo(() => getMonthDays(calendarDate), [calendarDate]);
  const calendarEvents = useMemo(() => {
    const map = new Map();
    filteredPlanned.forEach((item) => {
      if (!item.DatePrevue) return;
      const key = getDateInputValue(new Date(item.DatePrevue));
      map.set(key, [...(map.get(key) || []), {
        kind: 'planned',
        status: item.EstEnRetard ? 'overdue' : 'planned',
        item,
      }]);
    });
    filteredRealized.forEach((item) => {
      const key = getDateInputValue(new Date(item.Date));
      map.set(key, [...(map.get(key) || []), {
        kind: 'realized',
        status: 'realized',
        item,
      }]);
    });
    return map;
  }, [filteredPlanned, filteredRealized]);

  const openCreateModal = () => {
    if (isPrivacyMode) return;
    setEditItem(null);
    setEditKind(null);
    setModalOpen(true);
  };

  const openEditModal = (kind, item) => {
    if (isPrivacyMode) return;
    setInfoModal(null);
    setEditItem(item);
    setEditKind(kind);
    setModalOpen(true);
    if (searchParams.get('info')) {
      navigate('/entretien', { replace: true });
    }
  };

  const openInfoModal = (kind, item) => {
    setInfoModal({ kind, item });
  };

  const closeInfoModal = () => {
    setInfoModal(null);
    if (infoParam) {
      navigate('/entretien', { replace: true });
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditItem(null);
    setEditKind(null);
    if (initialCreateValues.shouldOpen) {
      navigate('/entretien', { replace: true });
    }
  };

  const openDeleteModal = (kind, item) => {
    if (isPrivacyMode) return;
    setDeleteModal({ kind, item });
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteModal(null);
  };

  const confirmDelete = async () => {
    if (!deleteModal || !user?.UtilisateurID || isPrivacyMode) return;
    const { kind, item } = deleteModal;
    const endpoint = kind === 'planned'
      ? `/entretien/${user.UtilisateurID}/planned/${item.EntretienPlanifieID}`
      : `/entretien/${user.UtilisateurID}/realized/${item.EntretienRealiseID}`;

    setIsDeleting(true);
    try {
      await api.delete(endpoint);
      setDeleteModal(null);
      await fetchOverview(user.UtilisateurID);
    } catch (error) {
      console.error("Impossible de supprimer l'entretien :", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const openFilesModal = (title, files) => {
    if (isPrivacyMode || !files?.length) return;
    setFilesModal({ title, files });
  };

  const openProtectedFile = async (file) => {
    if (!file?.EntretienFichierID || !user?.UtilisateurID) return;

    setFilePreviewModal(file);
  };

  const closeFilePreviewModal = useCallback(() => {
    setFilePreviewModal(null);
  }, []);

  const handleFilePreviewUnauthorized = useCallback(() => {
    setFilePreviewModal(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const requestDeleteFile = (file) => {
    if (!file?.EntretienFichierID || isPrivacyMode) return;
    setFileDeleteModal(file);
  };

  const confirmDeleteFile = async () => {
    const file = fileDeleteModal;
    if (!file?.EntretienFichierID || !user?.UtilisateurID || isPrivacyMode) return;

    setIsDeletingFile(true);
    try {
      await api.delete(`/entretien/${user.UtilisateurID}/files/${file.EntretienFichierID}`);
      await fetchOverview(user.UtilisateurID);
      setFilesModal((current) => {
        if (!current) return current;
        const nextFiles = current.files.filter((item) => item.EntretienFichierID !== file.EntretienFichierID);
        return nextFiles.length ? { ...current, files: nextFiles } : null;
      });
      setEditItem((current) => {
        if (!current?.EntretienFichiers) return current;
        return {
          ...current,
          EntretienFichiers: current.EntretienFichiers.filter((item) => item.EntretienFichierID !== file.EntretienFichierID),
        };
      });
      setFileDeleteModal(null);
    } catch (error) {
      console.error("Impossible de supprimer le fichier :", error);
    } finally {
      setIsDeletingFile(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl grow">
        <div className="rounded-lg border border-sky-500/20 bg-slate-950/60 p-8 text-center text-slate-300">Chargement des entretiens...</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl grow">
      <div className="space-y-6 text-slate-100">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Entretien</h1>
            <p className="mt-1 text-sm text-slate-400">Planifiez, suivez et gérez tous les entretiens de vos véhicules.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-full sm:w-72">
              <DropdownSelect
                label="Périmètre"
                value={vehicleFilter}
                onChange={setVehicleFilter}
                options={vehicleFilterOptions}
                placeholder="Tous les véhicules"
                searchPlaceholder="Rechercher un véhicule..."
                renderSelected={(option) => option.label}
                renderOption={(option) => (
                  <>
                    {option.image ? <img src={option.image} alt="" className="size-8 rounded-md object-cover" /> : <span className="grid size-8 place-items-center rounded-md bg-slate-900 text-xs text-slate-500">Tous</span>}
                    <span className="min-w-0">
                      <span className="block truncate text-slate-100">{option.label}</span>
                      {option.description ? <span className="block truncate text-xs font-medium text-slate-500">{option.description}</span> : null}
                    </span>
                  </>
                )}
              />
            </div>
            <IconTooltip label="Ajouter un entretien">
              <button
                type="button"
                onClick={openCreateModal}
                disabled={isPrivacyMode}
                title={isPrivacyMode ? 'Verrouillé par Shield Mode' : undefined}
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-sky-300/40 bg-sky-500 text-white shadow-lg shadow-sky-950/30 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-55"
                aria-label="Ajouter un entretien"
              >
                <PlusIcon className="size-5" aria-hidden="true" />
              </button>
            </IconTooltip>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Entretiens à venir" value={filteredStats.upcomingCount || 0} subtitle={maintenanceScopeLabel} icon={CalendarDaysIcon} tone="bg-sky-500/15 text-sky-300 ring-sky-400/25" />
          <StatCard title="Entretiens en retard" value={filteredStats.overdueCount || 0} subtitle="À traiter rapidement" icon={ExclamationTriangleIcon} tone="bg-amber-500/15 text-amber-300 ring-amber-400/25" />
          <StatCard title="Entretiens réalisés" value={filteredStats.realizedCount || 0} subtitle={`${filteredStats.realizedThisMonth || 0} ce mois-ci`} icon={CheckCircleIcon} tone="bg-violet-500/15 text-violet-300 ring-violet-400/25" />
          <StatCard title="Coût total" value={`${formatCurrency(totalCost, isPrivacyMode, isShieldModeLevel2)} €`} subtitle="Archives exclues" icon={CurrencyEuroIcon} tone="bg-emerald-500/15 text-emerald-300 ring-emerald-400/25" />
        </div>

        <div className="space-y-5">
          <section className="rounded-lg border border-sky-500/20 bg-slate-950/70 p-5 shadow-[0_24px_70px_rgba(2,6,23,0.32)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">À venir prochainement</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">{maintenanceScopeLabel}</p>
              </div>
              <span className="rounded-lg border border-sky-500/20 px-3 py-2 text-xs font-bold text-sky-300">{filteredPlanned.length} planifié{filteredPlanned.length > 1 ? 's' : ''}</span>
            </div>
            {paginatedPlanned.length ? (
              <div className="-mx-5 overflow-x-auto px-5">
                <div className={`divide-y divide-sky-500/10 ${isPrivacyMode ? 'sm:min-w-[760px]' : 'sm:min-w-[1040px]'}`}>
                  {paginatedPlanned.map((item) => {
                    const category = item.EntretienType?.CategorieEntretien;
                    const Icon = categoryIcon[category?.Nom] || WrenchScrewdriverIcon;
                    const isOverdue = item.EstEnRetard;
                    const timing = getPlannedTiming(item, isPrivacyMode, isShieldModeLevel2);
                    return (
                      <article
                        key={item.EntretienPlanifieID}
                        className={`grid gap-3 py-3 sm:items-center ${isPrivacyMode ? 'sm:grid-cols-[minmax(260px,1fr)_150px_112px_120px]' : 'sm:grid-cols-[minmax(260px,1fr)_150px_112px_120px_170px_250px]'}`}
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <span className="grid size-10 shrink-0 place-items-center rounded-lg ring-1" style={{ color: category?.Couleur || '#0ea5e9', backgroundColor: `${category?.Couleur || '#0ea5e9'}22`, borderColor: `${category?.Couleur || '#0ea5e9'}44` }}>
                            <Icon className="size-5" aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-bold text-white">{item.EntretienType?.Nom}</h3>
                            <p className="truncate text-xs text-slate-400">{getTypeDescription(item.EntretienType)}</p>
                            <p className="mt-1 inline-flex max-w-full rounded border border-slate-700 px-2 py-0.5 text-[11px] text-slate-400">{item.Vehicule?.Nom}</p>
                          </div>
                        </div>
                        <div className="text-sm sm:text-right">
                          <p className={`font-bold ${isOverdue ? 'text-rose-300' : 'text-sky-300'}`}>{timing.primary}</p>
                          {timing.secondary && <p className={isOverdue ? 'text-rose-300' : 'text-slate-400'}>{timing.secondary}</p>}
                        </div>
                        <span className={`w-fit rounded-md border px-2.5 py-1 text-xs font-bold sm:justify-self-end ${isOverdue ? 'border-rose-400/30 bg-rose-500/10 text-rose-200' : 'border-sky-400/30 bg-sky-500/10 text-sky-200'}`}>{isOverdue ? 'En retard' : item.Priorite || 'À venir'}</span>
                        <div className="whitespace-nowrap">
                          {item.Note ? (
                            <button
                              type="button"
                              onClick={() => setNoteModal({ title: item.EntretienType?.Nom || 'Note', note: maskLevel2Value(item.Note, isShieldModeLevel2) })}
                              className="inline-flex items-center rounded-md border border-sky-500/20 px-2.5 py-1.5 text-xs font-bold text-sky-200 hover:border-sky-300/50 hover:bg-sky-500/10"
                            >
                              Voir la note
                            </button>
                          ) : <span className="text-sm text-slate-500">-</span>}
                        </div>
                        {!isPrivacyMode && (
                          <AttachmentLinks
                            files={item.EntretienFichiers || []}
                            onOpenAll={() => openFilesModal(item.EntretienType?.Nom || 'Fichiers', item.EntretienFichiers || [])}
                            onOpenFile={openProtectedFile}
                          />
                        )}
                        {!isPrivacyMode && (
                          <div className="flex flex-wrap justify-start gap-2 sm:justify-end pe-5">
                            <IconTooltip label="Voir le détail">
                              <button type="button" onClick={() => openInfoModal('planned', item)} className="inline-flex items-center gap-1.5 rounded-md border border-slate-500/25 px-2.5 py-1.5 text-xs font-bold text-slate-200 hover:border-slate-300/50 hover:bg-white/5" aria-label="Voir le détail">
                                <EyeIcon className="size-4" />
                              </button>
                            </IconTooltip>
                            <IconTooltip label="Modifier l’entretien planifié">
                              <button type="button" onClick={() => openEditModal('planned', item)} className="inline-flex items-center gap-1.5 rounded-md border border-sky-500/20 px-2.5 py-1.5 text-xs font-bold text-sky-200 hover:border-sky-300/50 hover:bg-sky-500/10" aria-label="Modifier l’entretien planifié">
                                <PencilSquareIcon className="size-4" />
                              </button>
                            </IconTooltip>
                            <IconTooltip label="Supprimer l’entretien planifié">
                              <button type="button" onClick={() => openDeleteModal('planned', item)} className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/25 px-2.5 py-1.5 text-xs font-bold text-rose-200 hover:border-rose-300/50 hover:bg-rose-500/10" aria-label="Supprimer l’entretien planifié">
                                <TrashIcon className="size-4" />
                              </button>
                            </IconTooltip>
                            <IconTooltip label="Réalisé">
                              <button type="button" onClick={() => openEditModal('complete', item)} className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/25 px-2.5 py-1.5 text-xs font-bold text-emerald-200 hover:border-emerald-300/50 hover:bg-emerald-500/10" aria-label="Réalisé">
                                <CheckCircleIcon className="size-4" />
                              </button>
                            </IconTooltip>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-sky-500/10 bg-slate-900/40 p-8 text-center text-sm text-slate-400">Aucun entretien planifié.</div>
            )}
            <Pagination currentPage={plannedPage} totalItems={sortedPlanned.length} onPageChange={setPlannedPage} />
          </section>

          <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
            <section className="rounded-lg border border-sky-500/20 bg-slate-950/70 p-5 shadow-[0_24px_70px_rgba(2,6,23,0.32)]">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white">Calendrier d'entretien</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{maintenanceScopeLabel}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="rounded-lg border border-sky-500/20 px-3 py-2 text-xs font-semibold text-slate-300">Mois</button>
                  <IconTooltip label="Mois précédent">
                    <button type="button" onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))} className="rounded-lg border border-sky-500/20 p-2 text-slate-300 hover:bg-sky-500/10" aria-label="Mois précédent"><ChevronLeftIcon className="size-4" /></button>
                  </IconTooltip>
                  <IconTooltip label="Mois suivant">
                    <button type="button" onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))} className="rounded-lg border border-sky-500/20 p-2 text-slate-300 hover:bg-sky-500/10" aria-label="Mois suivant"><ChevronRightIcon className="size-4" /></button>
                  </IconTooltip>
                </div>
              </div>
              <p className="mb-3 text-right text-sm font-semibold text-slate-200">{new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(calendarDate)}</p>
              <div className="grid grid-cols-7 border-b border-sky-500/10 pb-2 text-center text-xs font-semibold text-slate-500">{['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => <span key={day}>{day}</span>)}</div>
              <div className="grid grid-cols-7 gap-y-2 py-3 text-center text-sm">
                {calendarDays.map((day) => {
                  const key = getDateInputValue(day);
                  const events = calendarEvents.get(key) || [];
                  const isCurrentMonth = day.getMonth() === calendarDate.getMonth();
                  const isToday = key === getDateInputValue(new Date());
                  const dayTone = getCalendarDayTone(events, isToday, isCurrentMonth);
                  return (
                    <span key={key} className="relative grid h-8 place-items-center">
                      {events.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setCalendarModal({ date: key, events })}
                          className={`grid size-8 place-items-center rounded-full font-black transition ${dayTone}`}
                          aria-label={`Voir les entretiens du ${formatDate(key)}`}
                        >
                          {day.getDate()}
                        </button>
                      ) : (
                        <span className={`grid size-8 place-items-center rounded-full ${dayTone}`}>{day.getDate()}</span>
                      )}
                    </span>
                  );
                })}
              </div>
              <div className="mt-2 flex flex-wrap gap-5 text-xs font-medium text-slate-400">
                <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-sky-500" />À venir</span>
                <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-rose-500" />En retard</span>
                <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-500" />Réalisé</span>
              </div>
            </section>

            <section className="rounded-lg border border-sky-500/20 bg-slate-950/70 p-5 shadow-[0_24px_70px_rgba(2,6,23,0.32)]">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Répartition des coûts</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{costBreakdownScopeLabel}</p>
                </div>
                <div className="flex justify-start lg:justify-end">
                  <button
                    type="button"
                    onClick={() => setIncludeArchivedCosts((current) => !current)}
                    className={`inline-flex h-12 items-center justify-between gap-3 rounded-xl border px-3 text-left text-xs font-bold transition sm:min-w-44 ${includeArchivedCosts ? 'border-amber-400/45 bg-amber-500/10 text-amber-100' : 'border-sky-500/20 bg-slate-950/65 text-slate-300 hover:border-sky-400/60 hover:bg-sky-500/10'}`}
                    aria-pressed={includeArchivedCosts}
                  >
                    <span>Inclure archives</span>
                    <span className={`relative h-6 w-11 rounded-full transition ${includeArchivedCosts ? 'bg-amber-400' : 'bg-slate-700'}`}>
                      <span className={`absolute top-1 size-4 rounded-full bg-white transition ${includeArchivedCosts ? 'left-6' : 'left-1'}`} />
                    </span>
                  </button>
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
                <div className="relative mx-auto grid size-48 place-items-center rounded-full" style={{ background: donutGradient }}>
                  <div className="grid size-28 place-items-center rounded-full bg-slate-950 text-center shadow-inner shadow-black/40"><div><p className="text-xl font-black text-white">{formatCurrency(costBreakdownTotal, isPrivacyMode, isShieldModeLevel2)} €</p><p className="text-xs text-slate-500">Total</p></div></div>
                </div>
                <div className="space-y-3">
                  {costBreakdown.length ? costBreakdown.map((item) => {
                    const percent = costBreakdownTotal > 0 ? Math.round((Number(item.Cout || 0) / costBreakdownTotal) * 100) : 0;
                    return (
                      <div key={item.CategorieEntretienID} className="space-y-2 text-sm">
                        <div className="grid grid-cols-[minmax(0,1fr)_80px_42px] items-center gap-3">
                          <span className="flex min-w-0 items-center gap-3 text-slate-300"><span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: item.Couleur || '#0ea5e9' }} /><span className="truncate">{item.Nom}</span></span>
                          <span className="text-right font-semibold text-white">{formatCurrency(item.Cout, isPrivacyMode, isShieldModeLevel2)} €</span>
                          <span className="text-right text-slate-400">{percent}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-800" aria-hidden="true">
                          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${percent}%`, backgroundColor: item.Couleur || '#0ea5e9' }} />
                        </div>
                      </div>
                    );
                  }) : <p className="text-sm text-slate-500">Aucun coût enregistré.</p>}
                </div>
              </div>
            </section>
          </div>

          <section className="rounded-lg border border-sky-500/20 bg-slate-950/70 p-5 shadow-[0_24px_70px_rgba(2,6,23,0.32)]">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Historique</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">{maintenanceScopeLabel} · les archives restent séparées des réalisés.</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-sky-500/20 bg-slate-900/50 p-1">
                <button type="button" onClick={() => setHistoryTab('active')} className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${historyTab === 'active' ? 'bg-sky-500 text-white' : 'text-slate-300 hover:bg-white/5'}`}>
                  Réalisés ({activeRealized.length})
                </button>
                <button type="button" onClick={() => setHistoryTab('archives')} className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${historyTab === 'archives' ? 'bg-amber-500 text-white' : 'text-slate-300 hover:bg-white/5'}`}>
                  Archives ({archivedRealized.length})
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[1080px] text-left text-sm sm:min-w-full">
                <thead className="border-b border-sky-500/10 text-xs uppercase text-slate-500"><tr><th className="py-3 pr-4 font-bold">Date</th><th className="py-3 pr-4 font-bold">Véhicule</th><th className="py-3 pr-4 font-bold">Entretien</th><th className="py-3 pr-4 font-bold">Garage</th><th className="py-3 pr-4 font-bold">Note</th>{!isPrivacyMode && <th className="py-3 pr-4 font-bold">Fichiers</th>}<th className="py-3 pr-4 text-right font-bold">Coût</th>{!isPrivacyMode && <th className="py-3 pl-2"></th>}</tr></thead>
                <tbody className="divide-y divide-sky-500/10">
                  {paginatedHistory.length ? paginatedHistory.map((row) => (
                    <tr key={row.EntretienRealiseID} className="text-slate-300">
                      <td className="whitespace-nowrap py-3 pr-4">{formatDisplayDate(row.Date, isPrivacyMode, isShieldModeLevel2)}</td>
                      <td className="whitespace-nowrap py-3 pr-4 text-white">{row.Vehicule?.Nom}</td>
                      <td className="min-w-56 py-3 pr-4 text-white">
                        <span>{row.EntretienType?.Nom}</span>
                        {row.EstArchive && <span className="ml-2 rounded border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-200">Archive</span>}
                      </td>
                      <td className="min-w-40 py-3 pr-4 text-slate-300">{row.Garage ? maskLevel2Value(row.Garage, isShieldModeLevel2) : '-'}</td>
                      <td className="whitespace-nowrap py-3 pr-4">
                        {row.Note ? (
                          <button
                            type="button"
                            onClick={() => setNoteModal({ title: row.EntretienType?.Nom || 'Note', note: maskLevel2Value(row.Note, isShieldModeLevel2) })}
                            className="inline-flex items-center rounded-md border border-sky-500/20 px-2.5 py-1.5 text-xs font-bold text-sky-200 hover:border-sky-300/50 hover:bg-sky-500/10"
                          >
                            Voir la note
                          </button>
                        ) : '-'}
                      </td>
                      {!isPrivacyMode && (
                        <td className="min-w-44 py-3 pr-4">
                          <AttachmentLinks
                            files={row.EntretienFichiers || []}
                            onOpenAll={() => openFilesModal(row.EntretienType?.Nom || 'Fichiers', row.EntretienFichiers || [])}
                            onOpenFile={openProtectedFile}
                          />
                        </td>
                      )}
                      <td className="whitespace-nowrap py-3 pr-4 text-right font-semibold text-white">{formatCurrency(row.Cout || 0, isPrivacyMode, isShieldModeLevel2)} €</td>
                      {!isPrivacyMode && (
                        <td className="py-3 pl-2 text-right">
                          <div className="flex justify-end gap-2">
                            <IconTooltip label="Voir le détail">
                              <button type="button" onClick={() => openInfoModal('realized', row)} className="inline-flex items-center gap-1.5 rounded-md border border-slate-500/25 px-2.5 py-1.5 text-xs font-bold text-slate-200 hover:border-slate-300/50 hover:bg-white/5" aria-label="Voir le détail">
                                <EyeIcon className="size-4" />
                              </button>
                            </IconTooltip>
                            <IconTooltip label="Modifier l’entretien réalisé">
                              <button type="button" onClick={() => openEditModal('realized', row)} className="inline-flex items-center gap-1.5 rounded-md border border-sky-500/20 px-2.5 py-1.5 text-xs font-bold text-sky-200 hover:border-sky-300/50 hover:bg-sky-500/10" aria-label="Modifier l’entretien réalisé">
                                <PencilSquareIcon className="size-4" />
                              </button>
                            </IconTooltip>
                            <IconTooltip label="Supprimer l’entretien réalisé">
                              <button type="button" onClick={() => openDeleteModal('realized', row)} className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/25 px-2.5 py-1.5 text-xs font-bold text-rose-200 hover:border-rose-300/50 hover:bg-rose-500/10" aria-label="Supprimer l’entretien réalisé">
                                <TrashIcon className="size-4" />
                              </button>
                            </IconTooltip>
                          </div>
                        </td>
                      )}
                    </tr>
                  )) : (
                    <tr><td colSpan={isPrivacyMode ? 6 : 8} className="py-8 text-center text-slate-500">{historyTab === 'archives' ? 'Aucune archive.' : 'Aucun entretien réalisé.'}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={historyPage} totalItems={historyRows.length} onPageChange={setHistoryPage} />
          </section>
        </div>
      </div>

      <AddEntretienModal
        open={modalOpen}
        onClose={closeModal}
        overview={overview}
        onCreated={() => fetchOverview(user.UtilisateurID)}
        editItem={editItem}
        editKind={editKind}
        initialValues={initialCreateValues.shouldOpen ? initialCreateValues : null}
        onDeleteFile={requestDeleteFile}
        onOpenFile={openProtectedFile}
        isDeletingFile={isDeletingFile}
      />
      <EntretienInfoModal
        open={Boolean(infoModal)}
        item={infoModal?.item}
        kind={infoModal?.kind}
        isPrivacyMode={isPrivacyMode}
        isShieldModeLevel2={isShieldModeLevel2}
        onClose={closeInfoModal}
        onEdit={() => openEditModal(infoModal?.kind, infoModal?.item)}
        onComplete={() => openEditModal('complete', infoModal?.item)}
        onOpenFile={openProtectedFile}
      />
      <NoteModal
        open={Boolean(noteModal)}
        title={noteModal?.title || 'Note'}
        note={noteModal?.note || ''}
        onClose={() => setNoteModal(null)}
      />
      <FilesModal
        open={Boolean(filesModal)}
        title={filesModal?.title || 'Fichiers'}
        files={filesModal?.files || []}
        isDeleting={isDeletingFile}
        onClose={() => setFilesModal(null)}
        onDelete={requestDeleteFile}
        onOpenFile={openProtectedFile}
      />
      <FilePreviewModal
        open={Boolean(filePreviewModal)}
        file={filePreviewModal}
        onClose={closeFilePreviewModal}
        onUnauthorized={handleFilePreviewUnauthorized}
      />
      <DeleteConfirmationModal
        open={Boolean(fileDeleteModal)}
        title="Supprimer ce fichier ?"
        message={`Cette action supprimera définitivement le fichier "${fileDeleteModal?.NomOriginal || ''}".`}
        isDeleting={isDeletingFile}
        onCancel={() => !isDeletingFile && setFileDeleteModal(null)}
        onConfirm={confirmDeleteFile}
      />
      <DeleteConfirmationModal
        open={Boolean(deleteModal)}
        title="Supprimer cet entretien ?"
        message="Cette action supprimera définitivement l'entretien sélectionné. Elle est utile uniquement si l'entrée a été créée par erreur."
        isDeleting={isDeleting}
        onCancel={closeDeleteModal}
        onConfirm={confirmDelete}
      />
      <CalendarEventsModal
        open={Boolean(calendarModal)}
        date={calendarModal?.date}
        events={calendarModal?.events || []}
        isPrivacyMode={isPrivacyMode}
        isShieldModeLevel2={isShieldModeLevel2}
        onClose={() => setCalendarModal(null)}
      />
    </main>
  );
}

export default EntretienPage;

export const roundToNearest = (value, step = 1) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return value;
  return Math.round(number / step) * step;
};

export const roundPrivacyNumber = (value, kind) => {
  if (kind === 'kilometers') return roundToNearest(value, 100);
  if (kind === 'price') return roundToNearest(value, 1);
  if (kind === 'consumption') return roundToNearest(value, 1);
  return value;
};

export const formatPrivacyYear = (date) => {
  if (!date) return '-';
  const year = new Date(date).getFullYear();
  return Number.isFinite(year) ? String(year) : '-';
};

export const formatPrivacyMonthYear = (date) => {
  if (!date) return '-';
  const parsedDate = new Date(date);
  if (!Number.isFinite(parsedDate.getTime())) return '-';
  return parsedDate.toLocaleDateString('fr-FR', {
    month: 'short',
    year: 'numeric',
  });
};

export const smoothPrivacySeries = (values = [], radius = 1) => (
  values.map((value, index) => {
    if (value === null || value === undefined || value === '') return value;
    const windowValues = values
      .slice(Math.max(0, index - radius), index + radius + 1)
      .map(Number)
      .filter(Number.isFinite);

    if (windowValues.length === 0) return value;
    return windowValues.reduce((sum, current) => sum + current, 0) / windowValues.length;
  })
);

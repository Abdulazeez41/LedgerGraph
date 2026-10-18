import { APP_CONFIG } from '@/config/locale';

/**
 * Format monetary amount according to the current regional configuration.
 * Example with NGN/en-NG: ₦2,000,000
 */
export function formatMoney(amount: number | null | undefined, hideDecimals = false): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${APP_CONFIG.currencySymbol}0`;
  }

  const formatter = new Intl.NumberFormat(APP_CONFIG.locale, {
    style: 'currency',
    currency: APP_CONFIG.currencyCode,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: hideDecimals || Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
}

/**
 * Format compact money for dense statistics strips (e.g. ₦1.8M, ₦450K)
 */
export function formatCompactMoney(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${APP_CONFIG.currencySymbol}0`;
  }

  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    return `${sign}${APP_CONFIG.currencySymbol}${(abs / 1_000_000_000).toFixed(1)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${APP_CONFIG.currencySymbol}${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}${APP_CONFIG.currencySymbol}${(abs / 1_000).toFixed(0)}K`;
  }
  return formatMoney(amount, true);
}

/**
 * Format dates cleanly: e.g. "14 Oct 2026"
 */
export function formatDate(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);
    return new Intl.DateTimeFormat(APP_CONFIG.locale, APP_CONFIG.dateFormat).format(d);
  } catch {
    return String(dateInput);
  }
}

/**
 * Format relative time or timestamps
 */
export function formatTime(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat(APP_CONFIG.locale, APP_CONFIG.timeFormat).format(d);
  } catch {
    return '';
  }
}

/**
 * Format percentage: e.g. "92%"
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  const num = value > 1 ? value : value * 100;
  return `${Math.round(num)}%`;
}

/**
 * Categorize risk score into visual grade and semantic token
 */
export function getRiskTier(score: number): {
  label: 'LOW' | 'MODERATE' | 'ELEVATED' | 'CRITICAL';
  colorClass: string;
  badgeBg: string;
  badgeBorder: string;
} {
  if (score <= 35) {
    return {
      label: 'LOW',
      colorClass: 'text-naira-green',
      badgeBg: 'bg-naira-green-dim',
      badgeBorder: 'border-naira-green/30',
    };
  }
  if (score <= 55) {
    return {
      label: 'MODERATE',
      colorClass: 'text-brass',
      badgeBg: 'bg-brass-dim',
      badgeBorder: 'border-brass/30',
    };
  }
  if (score <= 75) {
    return {
      label: 'ELEVATED',
      colorClass: 'text-brass',
      badgeBg: 'bg-brass-dim',
      badgeBorder: 'border-brass/40',
    };
  }
  return {
    label: 'CRITICAL',
    colorClass: 'text-vermilion',
    badgeBg: 'bg-vermilion-dim',
    badgeBorder: 'border-vermilion/40',
  };
}

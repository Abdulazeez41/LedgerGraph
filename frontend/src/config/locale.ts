/**
 * Single source of truth for currency, date formats, and regional settings.
 * A trader in Accra (GHS, en-GH), Nairobi (KES, en-KE), or Dhaka (BDT, bn-BD)
 * can reconfigure the platform by altering this single file.
 */

export interface LocaleConfig {
  locale: string;
  currencyCode: string;
  currencySymbol: string;
  dateFormat: Intl.DateTimeFormatOptions;
  timeFormat: Intl.DateTimeFormatOptions;
}

export const APP_CONFIG: LocaleConfig = {
  locale: 'en-NG',
  currencyCode: 'NGN',
  currencySymbol: '₦',
  dateFormat: {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  },
  timeFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  },
};

export const API_BASE_URL = '';

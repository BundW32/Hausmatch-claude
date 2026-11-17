import { startAnalytics } from './firebase';

export type Consent = 'all' | 'necessary';
const KEY = 'hm_consent_v1';
const listeners = new Set<() => void>();

export const getConsent = (): Consent | null => {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'all' || v === 'necessary' ? v : null;
  } catch {
    return null;
  }
};

export const setConsent = (value: Consent) => {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    /* Speicher nicht verfügbar – Auswahl gilt dann nur für diese Sitzung */
  }
  if (value === 'all') void startAnalytics();
  listeners.forEach(l => l());
};

/** Öffnet den Banner erneut (Link „Cookie-Einstellungen“ im Footer). */
export const reopenConsent = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  listeners.forEach(l => l());
};

export const onConsentChange = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const initConsent = () => {
  if (getConsent() === 'all') void startAnalytics();
};

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const env = import.meta.env;
const useEmulators = env.VITE_USE_EMULATORS === 'true';

// Hinweis: Die Firebase-Web-Konfiguration ist kein Geheimnis – sie identifiziert nur das Projekt.
// Geschützt werden die Daten durch firestore.rules, App Check und die Domain-Beschränkung des Keys.
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyC1o_LoqOxhmK4J0lhIzf8qcHABS7XNoY8',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'hausmatch-1.firebaseapp.com',
  projectId: useEmulators ? 'demo-hausmatch' : env.VITE_FIREBASE_PROJECT_ID || 'hausmatch-1',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'hausmatch-1.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '540537424170',
  appId: env.VITE_FIREBASE_APP_ID || '1:540537424170:web:1e5c03694e6bf167523653',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || 'G-Z57VNN046G',
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

let analyticsStarted = false;
let logEventFn: ((name: string, params?: Record<string, unknown>) => void) | null = null;
/** Startet Google Analytics – wird ausschließlich nach Einwilligung aufgerufen (siehe services/consent.ts). */
export const startAnalytics = async () => {
  if (analyticsStarted || useEmulators) return;
  analyticsStarted = true;
  try {
    const { getAnalytics, isSupported } = await import('firebase/analytics');
    const { logEvent } = await import('firebase/analytics');
    if (await isSupported()) {
      const analytics = getAnalytics(app);
      logEventFn = (name, params) => logEvent(analytics, name, params);
    }
  } catch {
    // Analytics ist optional – Fehler hier dürfen die App nicht beeinträchtigen.
  }
};

/**
 * Zählt einen Schritt im Funnel (z. B. „wizard_step“). Wirkt nur, wenn der Besucher der Statistik zugestimmt hat –
 * sonst passiert nichts. Es werden keine Eingaben übertragen, nur der Name des Schritts.
 */
export const track = (name: string, params?: Record<string, string | number | boolean>) => {
  try {
    logEventFn?.(name, params);
  } catch {
    /* Statistik darf die App nie stören */
  }
};

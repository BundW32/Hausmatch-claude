import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Icon } from './Icon';

type ToastKind = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  kind: ToastKind;
  text: string;
}

const ToastContext = createContext<(text: string, kind?: ToastKind) => void>(() => undefined);

/** Kurze Rückmeldungen statt alert(): const toast = useToast(); toast('Gespeichert', 'success') */
export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setItems(list => list.filter(t => t.id !== id)), []);
  const push = useCallback(
    (text: string, kind: ToastKind = 'info') => {
      const id = nextId.current++;
      setItems(list => [...list.slice(-2), { id, kind, text }]);
      setTimeout(() => dismiss(id), kind === 'error' ? 7000 : 4000);
    },
    [dismiss],
  );

  const styles: Record<ToastKind, string> = {
    success: 'border-green-200 text-green-800',
    error: 'border-red-200 text-red-800',
    info: 'border-slate-200 text-slate-800',
  };

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed top-20 inset-x-0 z-[300] flex flex-col items-center gap-2 px-4 pointer-events-none" aria-live="polite">
        {items.map(t => (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-3 max-w-md w-full bg-white border rounded-xl shadow-lg px-4 py-3 text-sm font-medium animate-fade-in-up ${styles[t.kind]}`}
          >
            <Icon name={t.kind === 'success' ? 'check' : t.kind === 'error' ? 'alert' : 'info'} className="w-5 h-5 mt-0.5" />
            <span className="flex-1">{t.text}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Hinweis schließen" className="text-slate-400 hover:text-slate-700">
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/** Übersetzt Firebase-Fehler in verständliche Hinweise. */
export const errorText = (err: unknown, fallback = 'Das hat leider nicht geklappt. Bitte versuchen Sie es erneut.') => {
  const code = (err as { code?: string })?.code || '';
  if (code === 'permission-denied') return 'Dafür fehlt die Berechtigung. Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse und melden Sie sich ggf. neu an.';
  if (code === 'unavailable' || code === 'auth/network-request-failed') return 'Keine Verbindung zum Server. Bitte prüfen Sie Ihre Internetverbindung.';
  if (code === 'failed-precondition') return 'Die Datenbank ist noch nicht vollständig eingerichtet (Index fehlt). Bitte wenden Sie sich an den Betreiber.';
  if (code === 'auth/too-many-requests') return 'Zu viele Versuche. Bitte warten Sie einen Moment.';
  return fallback;
};

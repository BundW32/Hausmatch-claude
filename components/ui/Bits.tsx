import React from 'react';
import { Icon, IconName, Spinner } from './Icon';
import type { Timestamp } from 'firebase/firestore';

export const Avatar: React.FC<{ name: string; src?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ name, src, size = 'md' }) => {
  const sizes = { sm: 'w-9 h-9 text-sm', md: 'w-12 h-12 text-base', lg: 'w-16 h-16 text-xl', xl: 'w-28 h-28 text-4xl' };
  return (
    <div className={`${sizes[size]} rounded-full bg-brand-50 text-brand-700 font-bold flex items-center justify-center overflow-hidden shrink-0 border border-slate-200`}>
      {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : <span aria-hidden="true">{(name || '?').trim().charAt(0).toUpperCase()}</span>}
    </div>
  );
};

export const EmptyState: React.FC<{ icon: IconName; title: string; children?: React.ReactNode; action?: React.ReactNode }> = ({ icon, title, children, action }) => (
  <div className="text-center py-12 px-6">
    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
      <Icon name={icon} className="w-7 h-7" />
    </div>
    <h3 className="text-base font-bold text-slate-900">{title}</h3>
    {children && <p className="mt-1.5 text-sm text-slate-500 max-w-md mx-auto">{children}</p>}
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>
);

export const LoadingBlock: React.FC<{ label?: string }> = ({ label = 'Wird geladen …' }) => (
  <div className="flex items-center justify-center gap-3 py-16 text-slate-500 text-sm" role="status">
    <Spinner className="w-5 h-5 text-brand-600" />
    {label}
  </div>
);

export const Notice: React.FC<{ kind?: 'info' | 'warn' | 'error' | 'success'; children: React.ReactNode; className?: string }> = ({ kind = 'info', children, className = '' }) => {
  const styles = {
    info: 'bg-brand-50 border-brand-100 text-brand-900',
    warn: 'bg-amber-50 border-amber-200 text-amber-900',
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  };
  const icon: IconName = kind === 'info' ? 'info' : kind === 'success' ? 'check' : 'alert';
  return (
    <div role={kind === 'error' ? 'alert' : undefined} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${styles[kind]} ${className}`}>
      <Icon name={icon} className="w-5 h-5 mt-0.5" />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
};

/** Label + Feld + Fehlertext, korrekt miteinander verknüpft. */
export const Field: React.FC<{
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, htmlFor, error, hint, children, className = '' }) => (
  <div className={className}>
    <label htmlFor={htmlFor} className="label">{label}</label>
    {children}
    {error ? <p id={`${htmlFor}-error`} className="field-error">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
  </div>
);

export const toDate = (ts: Timestamp | null | undefined): Date | null => {
  if (!ts) return null;
  if (typeof (ts as Timestamp).toDate === 'function') return (ts as Timestamp).toDate();
  const seconds = (ts as { seconds?: number }).seconds;
  return typeof seconds === 'number' ? new Date(seconds * 1000) : null;
};

export const formatDate = (ts: Timestamp | null | undefined) => toDate(ts)?.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) ?? 'gerade eben';
export const formatTime = (ts: Timestamp | null | undefined) => toDate(ts)?.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) ?? '';
export const formatDayLong = (ts: Timestamp | null | undefined) => toDate(ts)?.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' }) ?? 'Heute';

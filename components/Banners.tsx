import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { resendVerification } from '../services/dataService';
import { getConsent, onConsentChange, setConsent } from '../services/consent';
import { errorText, useToast } from './ui/Toast';

/** Hinweis für angemeldete Nutzer ohne bestätigte E-Mail. */
export const VerifyEmailBanner: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  if (!user || user.emailVerified) return null;

  const resend = async () => {
    setBusy(true);
    try {
      await resendVerification();
      toast(`Bestätigungs-Mail an ${user.email} gesendet. Bitte auch den Spam-Ordner prüfen.`, 'success');
    } catch (err) {
      toast(errorText(err, 'Die E-Mail konnte nicht gesendet werden. Bitte später erneut versuchen.'), 'error');
    } finally {
      setBusy(false);
    }
  };
  const check = async () => {
    setBusy(true);
    const next = await refreshUser();
    setBusy(false);
    if (next?.emailVerified) toast('Vielen Dank – Ihre E-Mail-Adresse ist bestätigt.', 'success');
    else toast('Die Bestätigung liegt noch nicht vor. Bitte klicken Sie auf den Link in der E-Mail.', 'info');
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
        <p className="flex-1">
          <strong>Bitte bestätigen Sie Ihre E-Mail-Adresse.</strong> Erst danach können Sie Nachrichten senden, im Forum schreiben und sich vernetzen.
        </p>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={resend} disabled={busy}>E-Mail erneut senden</button>
          <button className="btn btn-dark btn-sm" onClick={check} disabled={busy}>Ich habe bestätigt</button>
        </div>
      </div>
    </div>
  );
};

/** Einwilligung für Statistik (Google Analytics). Notwendige Funktionen laufen ohne Einwilligung. */
export const ConsentBanner: React.FC = () => {
  const [consent, setLocal] = useState(getConsent());
  useEffect(() => onConsentChange(() => setLocal(getConsent())), []);
  if (consent) return null;

  return (
    <div role="region" aria-label="Cookie-Einstellungen" className="fixed bottom-0 inset-x-0 z-[150] p-3 sm:p-4 animate-fade-in-up">
      <div className="max-w-3xl mx-auto card shadow-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <p className="text-sm text-slate-600 flex-1">
          Wir nutzen notwendige Speicherung für Login und Einstellungen. Mit Ihrer Einwilligung messen wir zusätzlich die Nutzung mit Google Analytics.
          Details in der <Link to="/legal/privacy" className="text-brand-700 underline underline-offset-2">Datenschutzerklärung</Link>.
        </p>
        <div className="flex gap-2 shrink-0">
          <button className="btn btn-secondary flex-1 sm:flex-none" onClick={() => setConsent('necessary')}>Nur notwendige</button>
          <button className="btn btn-secondary flex-1 sm:flex-none" onClick={() => setConsent('all')}>Alle akzeptieren</button>
        </div>
      </div>
    </div>
  );
};

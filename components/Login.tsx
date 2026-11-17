import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginUser, registerUser, resetPassword } from '../services/dataService';
import { useAuth } from '../services/auth';
import { resizeImage } from '../services/image';
import { UserRole } from '../types';
import { Field, Notice } from './ui/Bits';
import { Icon, Spinner } from './ui/Icon';
import { useToast } from './ui/Toast';

type View = 'login' | 'role_select' | 'register_form' | 'reset';

const authErrorText = (code: string, view: View) => {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Diese E-Mail-Adresse wird bereits verwendet. Bitte melden Sie sich an.';
    case 'auth/weak-password':
      return 'Das Passwort ist zu schwach. Bitte wählen Sie mindestens 8 Zeichen.';
    case 'auth/invalid-email':
      return 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
    case 'auth/too-many-requests':
      return 'Zu viele Versuche. Bitte warten Sie einen Moment und versuchen Sie es erneut.';
    case 'auth/network-request-failed':
      return 'Keine Verbindung zum Server. Bitte prüfen Sie Ihre Internetverbindung.';
    default:
      return view === 'login' ? 'E-Mail oder Passwort ist nicht korrekt.' : 'Das hat leider nicht geklappt. Bitte versuchen Sie es erneut.';
  }
};

const Login: React.FC<{ initialView?: View }> = ({ initialView = 'login' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const from = (location.state as { from?: string } | null)?.from;

  const [view, setView] = useState<View>(initialView);
  const [role, setRole] = useState<UserRole>('seeker');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const destination = (r: UserRole) => {
    const fallback = r === 'manager' ? '/dashboard' : '/wizard';
    if (!from || !from.startsWith('/') || from.startsWith('//')) return fallback;
    // Seiten, die nur für die andere Rolle gedacht sind, nicht als Ziel übernehmen.
    if (r !== 'manager' && from.startsWith('/dashboard')) return fallback;
    if (r === 'manager' && (from.startsWith('/wizard') || from.startsWith('/anfragen'))) return fallback;
    return from;
  };

  // Bereits angemeldet? Dann direkt weiter.
  useEffect(() => {
    if (!authLoading && user && !busy) navigate(destination(user.role), { replace: true });
  }, [authLoading, user, busy]);

  const switchView = (v: View) => {
    setError('');
    setResetSent(false);
    setView(v);
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setAvatar(await resizeImage(file));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await loginUser(email.trim(), password);
      const next = await refreshUser();
      navigate(destination(next?.role || 'seeker'), { replace: true });
    } catch (err: any) {
      setError(authErrorText(err?.code || '', 'login'));
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) {
      setError('Bitte stimmen Sie den AGB und der Datenschutzerklärung zu.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await registerUser(email.trim(), password, name, role, avatar, bio);
      await refreshUser();
      toast('Konto erstellt. Wir haben Ihnen eine E-Mail zur Bestätigung geschickt.', 'success');
      navigate(destination(role), { replace: true });
    } catch (err: any) {
      setError(authErrorText(err?.code || '', 'register_form'));
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await resetPassword(email.trim());
    } catch (err: any) {
      // Aus Sicherheitsgründen verraten wir nicht, ob ein Konto existiert – nur echte Eingabe-/Netzfehler zeigen.
      if (['auth/invalid-email', 'auth/network-request-failed', 'auth/too-many-requests'].includes(err?.code)) {
        setError(authErrorText(err.code, 'reset'));
        setBusy(false);
        return;
      }
    }
    setResetSent(true);
    setBusy(false);
  };

  // ------------------------------------------------------------ Rollenwahl
  if (view === 'role_select') {
    const roles: { role: UserRole; icon: 'home' | 'briefcase'; title: string; text: string; cta: string }[] = [
      { role: 'seeker', icon: 'home', title: 'Ich bin Eigentümer:in', text: 'Sie suchen eine Hausverwaltung für Ihr Objekt oder Ihre WEG.', cta: 'Als Eigentümer registrieren' },
      { role: 'manager', icon: 'briefcase', title: 'Ich bin Hausverwaltung', text: 'Sie möchten neue Mandate gewinnen und Anfragen aus Ihrer Region erhalten.', cta: 'Als Verwaltung registrieren' },
    ];
    return (
      <div className="page max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="page-title">Konto erstellen</h1>
          <p className="mt-2 text-slate-600">Wie möchten Sie HausMatch nutzen?</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {roles.map(r => (
            <button
              key={r.role}
              onClick={() => {
                setRole(r.role);
                switchView('register_form');
              }}
              className="card card-hover p-6 text-left hover:border-brand-300 group"
            >
              <span className="w-12 h-12 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center mb-4">
                <Icon name={r.icon} className="w-6 h-6" />
              </span>
              <span className="block text-lg font-bold text-slate-900">{r.title}</span>
              <span className="block mt-1 text-sm text-slate-600">{r.text}</span>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                {r.cta} <Icon name="arrowRight" className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-slate-600">
          Bereits registriert?{' '}
          <button onClick={() => switchView('login')} className="font-semibold text-brand-700 underline underline-offset-2">Zum Login</button>
        </p>
      </div>
    );
  }

  // --------------------------------------------------------- Passwort-Reset
  if (view === 'reset') {
    return (
      <div className="page max-w-md">
        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Passwort zurücksetzen</h1>
          {resetSent ? (
            <>
              <Notice kind="success" className="mt-5">
                Falls ein Konto mit <strong>{email}</strong> existiert, haben wir einen Link zum Zurücksetzen gesendet. Bitte prüfen Sie auch den Spam-Ordner.
              </Notice>
              <button onClick={() => switchView('login')} className="btn btn-primary w-full mt-5">Zurück zum Login</button>
            </>
          ) : (
            <form onSubmit={handleReset} className="mt-5 space-y-4" noValidate>
              <p className="text-sm text-slate-600">Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link, über den Sie ein neues Passwort vergeben.</p>
              {error && <Notice kind="error">{error}</Notice>}
              <Field label="E-Mail-Adresse" htmlFor="reset-email">
                <input id="reset-email" type="email" required autoComplete="email" className="input" value={email} onChange={e => setEmail(e.target.value)} />
              </Field>
              <button type="submit" disabled={busy || !email.trim()} className="btn btn-primary w-full">
                {busy && <Spinner className="w-4 h-4" />} Link senden
              </button>
              <button type="button" onClick={() => switchView('login')} className="btn btn-ghost w-full">Abbrechen</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------- Login / Registrierung
  const isLogin = view === 'login';
  return (
    <div className={`page ${isLogin ? 'max-w-md' : 'max-w-xl'}`}>
      <div className="card p-6 sm:p-8 animate-fade-in-up">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          {isLogin ? 'Willkommen zurück' : role === 'manager' ? 'Konto für Ihre Hausverwaltung' : 'Konto als Eigentümer:in'}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {isLogin ? 'Melden Sie sich an, um fortzufahren.' : 'Kostenlos und in einer Minute erledigt.'}
        </p>
        {from === '/wizard' && (
          <Notice className="mt-4">Ihre Angaben aus dem Objekt-Formular sind gespeichert – nach der Anmeldung senden Sie die Anfrage ab.</Notice>
        )}
        {error && <Notice kind="error" className="mt-4 animate-shake">{error}</Notice>}

        <form onSubmit={isLogin ? handleLogin : handleRegister} className="mt-6 space-y-4">
          {!isLogin && (
            <>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-20 h-20 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center overflow-hidden text-slate-400 hover:border-brand-400 shrink-0"
                  aria-label="Profilbild auswählen"
                >
                  {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <Icon name="camera" className="w-7 h-7" />}
                </button>
                <div className="text-sm text-slate-600">
                  <p className="font-semibold text-slate-700">Profilbild oder Logo (optional)</p>
                  <p>Wird automatisch verkleinert.</p>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImage} className="hidden" accept="image/*" />
              </div>
              <Field label={role === 'manager' ? 'Name der Hausverwaltung' : 'Ihr Name'} htmlFor="reg-name">
                <input id="reg-name" required maxLength={80} autoComplete={role === 'manager' ? 'organization' : 'name'} className="input" value={name} onChange={e => setName(e.target.value)} />
              </Field>
              <Field label="Kurzbeschreibung (optional)" htmlFor="reg-bio" hint="Erscheint in Ihrem Profil.">
                <textarea
                  id="reg-bio"
                  maxLength={1500}
                  className="input min-h-24 resize-y"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder={role === 'manager' ? 'z. B. WEG- und Mietverwaltung im Ruhrgebiet seit 2005' : 'z. B. Eigentümer eines Mehrfamilienhauses in Essen'}
                />
              </Field>
            </>
          )}

          <Field label="E-Mail-Adresse" htmlFor="auth-email">
            <input id="auth-email" type="email" required autoComplete="email" className="input" value={email} onChange={e => setEmail(e.target.value)} />
          </Field>
          <Field label="Passwort" htmlFor="auth-password" hint={isLogin ? undefined : 'Mindestens 8 Zeichen.'}>
            <input
              id="auth-password"
              type="password"
              required
              minLength={isLogin ? undefined : 8}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </Field>

          {isLogin ? (
            <div className="text-right -mt-1">
              <button type="button" onClick={() => switchView('reset')} className="text-sm font-medium text-brand-700 underline underline-offset-2">Passwort vergessen?</button>
            </div>
          ) : (
            <label className="flex items-start gap-3 text-sm text-slate-600">
              <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="mt-0.5 w-5 h-5 rounded border-slate-300 accent-brand-600" />
              <span>
                Ich akzeptiere die <Link to="/legal/agb" target="_blank" className="text-brand-700 underline underline-offset-2">AGB</Link> und habe die{' '}
                <Link to="/legal/privacy" target="_blank" className="text-brand-700 underline underline-offset-2">Datenschutzerklärung</Link> gelesen.
              </span>
            </label>
          )}

          <button type="submit" disabled={busy} className="btn btn-primary btn-lg w-full">
            {busy && <Spinner className="w-4 h-4" />}
            {isLogin ? 'Anmelden' : 'Konto erstellen'}
          </button>
        </form>

        <p className="mt-6 pt-5 border-t border-slate-200 text-center text-sm text-slate-600">
          {isLogin ? (
            <>
              Noch kein Konto?{' '}
              <button onClick={() => switchView('role_select')} className="font-semibold text-brand-700 underline underline-offset-2">Kostenlos registrieren</button>
            </>
          ) : (
            <>
              <button onClick={() => switchView('role_select')} className="font-semibold text-brand-700 underline underline-offset-2">Rolle ändern</button>
              {' · '}
              <button onClick={() => switchView('login')} className="font-semibold text-brand-700 underline underline-offset-2">Zum Login</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default Login;

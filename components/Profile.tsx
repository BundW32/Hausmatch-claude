import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { deleteAccount, getProfile, resetPassword, updateOwnProfile } from '../services/dataService';
import { resizeImage } from '../services/image';
import { connectionLabel, useConnections } from '../services/useConnections';
import { OpeningHours, Profile as ProfileType, PROPERTY_TYPES, PropertyType } from '../types';
import { Avatar, Field, LoadingBlock, Notice, PageHeader } from './ui/Bits';
import { Icon, Spinner } from './ui/Icon';
import { Modal } from './ui/Modal';
import { errorText, useToast } from './ui/Toast';
import MessageModal from './MessageModal';
import { CityInput, cityErrorText } from './ui/CityInput';
import { findPlace, loadPlaces, suggestPlaces } from '../services/places';

const DAYS: { key: keyof OpeningHours; label: string }[] = [
  { key: 'mon', label: 'Montag' },
  { key: 'tue', label: 'Dienstag' },
  { key: 'wed', label: 'Mittwoch' },
  { key: 'thu', label: 'Donnerstag' },
  { key: 'fri', label: 'Freitag' },
  { key: 'sat', label: 'Samstag' },
  { key: 'sun', label: 'Sonntag' },
];

interface FormState {
  name: string;
  avatar: string;
  bio: string;
  location: string;
  phone: string;
  website: string;
  vatId: string;
  teamSize: string;
  foundedYear: string;
  minUnits: string;
  maxUnits: string;
  serviceCities: string;
  propertyTypes: PropertyType[];
  openingHours: OpeningHours;
}

const toForm = (p: ProfileType): FormState => ({
  name: p.name,
  avatar: p.avatar || '',
  bio: p.bio || '',
  location: p.location || '',
  phone: p.phone || '',
  website: p.website || '',
  vatId: p.vatId || '',
  teamSize: p.teamSize ? String(p.teamSize) : '',
  foundedYear: p.foundedYear ? String(p.foundedYear) : '',
  minUnits: p.minUnits ? String(p.minUnits) : '',
  maxUnits: p.maxUnits ? String(p.maxUnits) : '',
  serviceCities: (p.serviceCities || []).map(c => c.replace(/(^|[\s-])\S/g, m => m.toUpperCase())).join(', '),
  propertyTypes: p.propertyTypes || [],
  openingHours: p.openingHours || {},
});

const safeUrl = (raw: string) => {
  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : null;
  } catch {
    return null;
  }
};

const Profile = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, loading: authLoading, refreshUser, logout } = useAuth();
  const { stateOf, toggle } = useConnections(user?.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwn = !uid || uid === user?.id;
  const [other, setOther] = useState<ProfileType | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [connBusy, setConnBusy] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOwn || authLoading) return;
    let active = true;
    setOther(undefined);
    getProfile(uid!)
      .then(p => active && setOther(p))
      .catch(() => active && setOther(null));
    return () => {
      active = false;
    };
  }, [uid, isOwn, authLoading, user?.id]);

  const profile: ProfileType | null | undefined = isOwn ? user : other;

  if (authLoading || profile === undefined) return <LoadingBlock label="Profil wird geladen …" />;
  if (!profile) {
    return (
      <div className="page max-w-xl text-center">
        <h1 className="page-title">Profil nicht verfügbar</h1>
        <p className="mt-3 text-slate-600">
          {user ? 'Dieses Profil existiert nicht (mehr).' : 'Dieses Profil existiert nicht oder ist nur für angemeldete Mitglieder sichtbar.'}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/network" className="btn btn-secondary">Zum Netzwerk</Link>
          {!user && <Link to="/login" state={{ from: `/profile/${uid}` }} className="btn btn-primary">Anmelden</Link>}
        </div>
      </div>
    );
  }

  const isManager = profile.role === 'manager';
  const connState = stateOf(profile.id);
  const website = profile.website ? safeUrl(profile.website) : null;
  const hours = DAYS.filter(d => profile.openingHours?.[d.key]);

  const startEdit = () => {
    setForm(toForm(profile));
    setFormError('');
    setEditing(true);
    window.scrollTo(0, 0);
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => (f ? { ...f, [key]: value } : f));

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setField('avatar', await resizeImage(file));
    } catch (err) {
      setFormError((err as Error).message);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form) return;
    if (!form.name.trim()) {
      setFormError('Bitte geben Sie einen Namen an.');
      return;
    }
    const min = Number(form.minUnits) || 0;
    const max = Number(form.maxUnits) || 0;
    if (max > 0 && min > max) {
      setFormError('„Einheiten von“ darf nicht größer sein als „bis“.');
      return;
    }
    if (form.name.trim().length < 2) {
      setFormError('Der Name ist zu kurz.');
      return;
    }
    // Orte gegen das Ortsverzeichnis prüfen und in amtlicher Schreibweise speichern
    let location = form.location.trim();
    let cities = form.serviceCities.split(/[,;\n]/).map(c => c.trim()).filter(Boolean);
    const places = await loadPlaces().catch(() => null);
    if (places) {
      if (location) {
        const place = findPlace(places, location);
        if (!place) {
          setFormError(`${isManager ? 'Sitz' : 'Ort'}: ${cityErrorText(location, suggestPlaces(places, location))}`);
          return;
        }
        location = place.name;
      }
      if (isManager) {
        const unknown = cities.filter(c => !findPlace(places, c));
        if (unknown.length > 0) {
          setFormError(`Einsatzgebiete: ${unknown.map(c => `„${c}“`).join(', ')} ${unknown.length === 1 ? 'kennen' : 'kennen'} wir nicht. Bitte Schreibweise prüfen oder die Postleitzahl eingeben.`);
          return;
        }
        cities = [...new Set(cities.map(c => findPlace(places, c)!.name))];
      }
    }
    const vatId = form.vatId.replace(/\s/g, '').toUpperCase();
    const year = Number(form.foundedYear) || 0;
    if (isManager) {
      if (form.phone.trim() && !/^\+?[\d\s()/-]{6,25}$/.test(form.phone.trim())) {
        setFormError('Bitte prüfen Sie die Telefonnummer (nur Ziffern, Leerzeichen, +, /, -, Klammern).');
        return;
      }
      if (form.website.trim() && (!safeUrl(form.website.trim()) || !/\.[a-z]{2,}/i.test(form.website))) {
        setFormError('Bitte prüfen Sie die Website-Adresse, z. B. www.beispiel.de.');
        return;
      }
      if (vatId && !/^DE\d{9}$/.test(vatId)) {
        setFormError('Die USt-IdNr. hat das Format DE und neun Ziffern, z. B. DE123456789.');
        return;
      }
      if (year && (year < 1800 || year > new Date().getFullYear())) {
        setFormError('Bitte prüfen Sie das Gründungsjahr.');
        return;
      }
      if ((Number(form.teamSize) || 0) < 0 || min < 0 || max < 0) {
        setFormError('Zahlenangaben dürfen nicht negativ sein.');
        return;
      }
    }
    setSaving(true);
    setFormError('');
    try {
      await updateOwnProfile(user.id, {
        name: form.name,
        avatar: form.avatar,
        bio: form.bio,
        location,
        ...(isManager
          ? {
              phone: form.phone,
              website: form.website,
              vatId,
              teamSize: Number(form.teamSize) || 0,
              foundedYear: Number(form.foundedYear) || 0,
              minUnits: min,
              maxUnits: max,
              serviceCities: cities,
              propertyTypes: form.propertyTypes,
              openingHours: Object.fromEntries(Object.entries(form.openingHours).filter(([, v]) => v && v.trim()).map(([k, v]) => [k, v!.trim().slice(0, 40)])),
            }
          : {}),
      });
      await refreshUser();
      setEditing(false);
      window.scrollTo(0, 0);
      toast('Profil gespeichert.', 'success');
    } catch (err) {
      setFormError(errorText(err, 'Das Profil konnte nicht gespeichert werden.'));
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/profile/${profile.id}` } });
      return;
    }
    setConnBusy(true);
    try {
      await toggle(profile.id);
    } catch (err) {
      toast(errorText(err), 'error');
    } finally {
      setConnBusy(false);
    }
  };

  const sendReset = async () => {
    if (!user) return;
    try {
      await resetPassword(user.email);
      toast(`Link zum Ändern des Passworts an ${user.email} gesendet.`, 'success');
    } catch (err) {
      toast(errorText(err), 'error');
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteAccount(deletePassword);
      await logout().catch(() => undefined);
      toast('Ihr Konto wurde gelöscht.', 'success');
      navigate('/', { replace: true });
    } catch (err: any) {
      setDeleteError(
        ['auth/wrong-password', 'auth/invalid-credential'].includes(err?.code) ? 'Das Passwort ist nicht korrekt.' : errorText(err, 'Das Konto konnte nicht gelöscht werden.'),
      );
      setDeleting(false);
    }
  };

  // ------------------------------------------------------------ Bearbeiten
  if (editing && form && isOwn) {
    return (
      <>
      <PageHeader eyebrow="Profil" title="Profil bearbeiten" width="max-w-3xl">
        {isManager ? 'Diese Angaben sind öffentlich sichtbar und bestimmen, bei welchen Anfragen Sie vorgeschlagen werden.' : 'Diese Angaben sehen angemeldete Mitglieder.'}
      </PageHeader>
      <div className="page max-w-3xl">
        <form onSubmit={save} className="space-y-6">
          {formError && <Notice kind="error">{formError}</Notice>}

          <section className="card p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-4">
              <Avatar name={form.name} src={form.avatar} size="xl" />
              <div className="space-y-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>
                  <Icon name="camera" className="w-4 h-4" /> {isManager ? 'Logo ändern' : 'Bild ändern'}
                </button>
                {form.avatar && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setField('avatar', '')}>Entfernen</button>}
                <input type="file" ref={fileInputRef} onChange={handleImage} className="hidden" accept="image/*" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label={isManager ? 'Name der Hausverwaltung' : 'Name'} htmlFor="pf-name">
                <input id="pf-name" className="input" required maxLength={80} value={form.name} onChange={e => setField('name', e.target.value)} />
              </Field>
              <Field label={isManager ? 'Sitz (Ort)' : 'Ort (optional)'} htmlFor="pf-location">
                <CityInput id="pf-location" name="location" value={form.location} onChange={v => setField('location', v)} placeholder="Ort oder Postleitzahl" />
              </Field>
            </div>
            <Field label={isManager ? 'Über Ihre Verwaltung' : 'Über mich (optional)'} htmlFor="pf-bio" hint={`${form.bio.length} / 1500 Zeichen`}>
              <textarea id="pf-bio" className="input min-h-32 resize-y" maxLength={1500} value={form.bio} onChange={e => setField('bio', e.target.value)} />
            </Field>
          </section>

          {isManager && (
            <>
              <section className="card p-5 sm:p-6 space-y-5">
                <div>
                  <h2 className="section-title">Für welche Objekte sind Sie die richtige Verwaltung?</h2>
                  <p className="text-sm text-slate-500 mt-1">Aus diesen Angaben entsteht das Matching mit den Anfragen der Eigentümer.</p>
                </div>
                <Field label="Einsatzgebiete (Städte)" htmlFor="pf-cities" hint="Mehrere Orte mit Komma trennen, z. B. Essen, Gladbeck, Bottrop. Jeder Ort wird beim Speichern geprüft.">
                  <input id="pf-cities" className="input" value={form.serviceCities} onChange={e => setField('serviceCities', e.target.value)} />
                </Field>
                <fieldset>
                  <legend className="label">Objektarten</legend>
                  <div className="flex flex-wrap gap-2">
                    {PROPERTY_TYPES.map(t => {
                      const on = form.propertyTypes.includes(t.value);
                      return (
                        <label key={t.value} className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium cursor-pointer ${on ? 'border-brand-600 bg-brand-50 text-brand-900' : 'border-slate-300 text-slate-700'}`}>
                          <input type="checkbox" className="w-4 h-4 accent-brand-600" checked={on} onChange={() => setField('propertyTypes', on ? form.propertyTypes.filter(x => x !== t.value) : [...form.propertyTypes, t.value])} />
                          {t.label}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <div className="grid grid-cols-2 gap-5 max-w-sm">
                  <Field label="Einheiten von" htmlFor="pf-min">
                    <input id="pf-min" type="number" min={0} inputMode="numeric" className="input" value={form.minUnits} onChange={e => setField('minUnits', e.target.value)} placeholder="z. B. 5" />
                  </Field>
                  <Field label="bis" htmlFor="pf-max">
                    <input id="pf-max" type="number" min={0} inputMode="numeric" className="input" value={form.maxUnits} onChange={e => setField('maxUnits', e.target.value)} placeholder="offen" />
                  </Field>
                </div>
              </section>

              <section className="card p-5 sm:p-6 space-y-5">
                <h2 className="section-title">Kontakt & Firmendaten</h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Telefon" htmlFor="pf-phone">
                    <input id="pf-phone" type="tel" className="input" maxLength={40} autoComplete="tel" value={form.phone} onChange={e => setField('phone', e.target.value)} />
                  </Field>
                  <Field label="Website" htmlFor="pf-website">
                    <input id="pf-website" className="input" maxLength={200} value={form.website} onChange={e => setField('website', e.target.value)} placeholder="www.beispiel.de" />
                  </Field>
                  <Field label="Teamgröße" htmlFor="pf-team">
                    <input id="pf-team" type="number" min={0} inputMode="numeric" className="input" value={form.teamSize} onChange={e => setField('teamSize', e.target.value)} />
                  </Field>
                  <Field label="Gründungsjahr" htmlFor="pf-founded">
                    <input id="pf-founded" type="number" min={1800} max={2100} inputMode="numeric" className="input" value={form.foundedYear} onChange={e => setField('foundedYear', e.target.value)} />
                  </Field>
                  <Field label="USt-IdNr." htmlFor="pf-vat">
                    <input id="pf-vat" className="input" maxLength={30} value={form.vatId} onChange={e => setField('vatId', e.target.value)} placeholder="DE…" />
                  </Field>
                </div>
                <fieldset>
                  <legend className="label">Erreichbarkeit</legend>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {DAYS.map(d => (
                      <div key={d.key}>
                        <label htmlFor={`pf-h-${d.key}`} className="block text-xs font-medium text-slate-500 mb-1">{d.label}</label>
                        <input id={`pf-h-${d.key}`} className="input !text-sm" maxLength={40} value={form.openingHours[d.key] || ''} onChange={e => setField('openingHours', { ...form.openingHours, [d.key]: e.target.value })} placeholder="09–17 Uhr" />
                      </div>
                    ))}
                  </div>
                </fieldset>
              </section>
            </>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)} disabled={saving}>Abbrechen</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving && <Spinner className="w-4 h-4" />} Speichern</button>
          </div>
        </form>
      </div>
      </>
    );
  }

  // ---------------------------------------------------------------- Ansicht
  return (
    <>
    <div className="bg-navy-grid text-white">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <Avatar name={profile.name} src={profile.avatar} size="xl" />
          <div className="flex-1 min-w-0">
            <p className="font-mono text-xs uppercase tracking-[0.06em] text-[#93b4ff]">{isManager ? 'Hausverwaltung' : 'Eigentümer'}</p>
            <h1 className="mt-2 display text-3xl sm:text-5xl break-words">{profile.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {profile.verified && <span className="badge badge-green"><Icon name="badgeCheck" className="w-3.5 h-3.5" /> Von HausMatch geprüft</span>}
              {profile.location && <span className="text-[15px] text-[#d5e0ff] flex items-center gap-1"><Icon name="pin" className="w-4 h-4" /> {profile.location}</span>}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {isOwn ? (
              <button className="btn btn-white" onClick={startEdit}>Profil bearbeiten</button>
            ) : (
              <>
                <button className="btn btn-white" onClick={() => (user ? setShowMessage(true) : navigate('/login', { state: { from: `/profile/${profile.id}` } }))}>
                  <Icon name="mail" className="w-4 h-4" /> Nachricht
                </button>
                <button className="btn text-white border border-white/30 hover:bg-white/10" onClick={handleConnect} disabled={connBusy}>
                  {connState === 'accepted' && <Icon name="check" className="w-4 h-4 text-green-600" />}
                  {connectionLabel[connState]}
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
    <div className="page max-w-5xl">
      {isOwn && isManager && !(profile.serviceCities?.length) && (
        <Notice kind="warn" className="mb-4">
          Sie haben noch keine Einsatzgebiete hinterlegt – Eigentümer finden Sie deshalb nicht in der Suche.{' '}
          <button className="underline underline-offset-2 font-medium" onClick={startEdit}>Jetzt ergänzen</button>
        </Notice>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <section className="card p-5 sm:p-6">
            <h2 className="section-title">{isManager ? 'Über die Verwaltung' : 'Über mich'}</h2>
            <p className="mt-3 text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
              {profile.bio || (isOwn ? 'Sie haben noch keine Beschreibung hinterlegt.' : 'Noch keine Beschreibung hinterlegt.')}
            </p>
          </section>

          {isManager && ((profile.serviceCities?.length || 0) > 0 || (profile.propertyTypes?.length || 0) > 0 || profile.minUnits || profile.maxUnits) ? (
            <section className="card p-5 sm:p-6">
              <h2 className="section-title">Leistungsprofil</h2>
              <dl className="mt-3 space-y-3 text-sm">
                {(profile.serviceCities?.length || 0) > 0 && (
                  <div>
                    <dt className="text-slate-500 mb-1.5">Einsatzgebiete</dt>
                    <dd className="flex flex-wrap gap-1.5">{profile.serviceCities!.map(c => <span key={c} className="badge capitalize">{c}</span>)}</dd>
                  </div>
                )}
                {(profile.propertyTypes?.length || 0) > 0 && (
                  <div>
                    <dt className="text-slate-500 mb-1.5">Objektarten</dt>
                    <dd className="flex flex-wrap gap-1.5">{profile.propertyTypes!.map(t => <span key={t} className="badge badge-brand">{t}</span>)}</dd>
                  </div>
                )}
                {(profile.minUnits || profile.maxUnits) ? (
                  <div>
                    <dt className="text-slate-500 mb-1">Objektgröße</dt>
                    <dd className="font-medium text-slate-900">
                      {profile.maxUnits ? `${profile.minUnits || 1} bis ${profile.maxUnits} Einheiten` : `ab ${profile.minUnits} Einheiten`}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>
          ) : null}

          {isManager && hours.length > 0 && (
            <section className="card p-5 sm:p-6">
              <h2 className="section-title">Erreichbarkeit</h2>
              <dl className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                {hours.map(d => (
                  <div key={d.key}>
                    <dt className="text-slate-500">{d.label}</dt>
                    <dd className="font-medium text-slate-900">{profile.openingHours![d.key]}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          {isManager && (profile.phone || website || profile.teamSize || profile.foundedYear || profile.vatId) ? (
            <section className="card p-5 sm:p-6">
              <h2 className="section-title">Kontakt</h2>
              <ul className="mt-3 space-y-3 text-sm">
                {profile.phone && (
                  <li className="flex items-center gap-2.5"><Icon name="phone" className="w-4 h-4 text-slate-400" /><a href={`tel:${profile.phone.replace(/[^\d+]/g, '')}`} className="text-slate-900 font-medium hover:text-brand-700">{profile.phone}</a></li>
                )}
                {website && (
                  <li className="flex items-center gap-2.5 min-w-0"><Icon name="globe" className="w-4 h-4 text-slate-400" /><a href={website} target="_blank" rel="noopener noreferrer nofollow" className="text-brand-700 font-medium underline underline-offset-2 truncate">{website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a></li>
                )}
                {profile.teamSize ? <li className="flex items-center gap-2.5"><Icon name="users" className="w-4 h-4 text-slate-400" /> {profile.teamSize} Mitarbeitende</li> : null}
                {profile.foundedYear ? <li className="flex items-center gap-2.5"><Icon name="clock" className="w-4 h-4 text-slate-400" /> Gegründet {profile.foundedYear}</li> : null}
                {profile.vatId && <li className="text-slate-500">USt-IdNr.: {profile.vatId}</li>}
              </ul>
            </section>
          ) : null}

          {isOwn && user && (
            <section className="card p-5 sm:p-6">
              <h2 className="section-title">Konto</h2>
              <p className="mt-3 text-sm text-slate-700 break-all">{user.email}</p>
              <p className="mt-1">
                <span className={`badge ${user.emailVerified ? 'badge-green' : 'badge-amber'}`}>{user.emailVerified ? 'E-Mail bestätigt' : 'E-Mail noch nicht bestätigt'}</span>
              </p>
              <p className="mt-3 text-xs text-slate-500">Ihre E-Mail-Adresse ist für andere Mitglieder nicht sichtbar.</p>
              <div className="mt-4 flex flex-col gap-2">
                <button className="btn btn-secondary btn-sm" onClick={sendReset}>Passwort ändern</button>
                <button className="btn btn-danger btn-sm" onClick={() => { setDeletePassword(''); setDeleteError(''); setShowDelete(true); }}>Konto löschen</button>
              </div>
            </section>
          )}
        </aside>
      </div>

      {showMessage && <MessageModal recipient={{ id: profile.id, name: profile.name }} subject="Direktnachricht" onClose={() => setShowMessage(false)} />}

      {showDelete && (
        <Modal
          title="Konto endgültig löschen?"
          onClose={() => setShowDelete(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowDelete(false)} disabled={deleting}>Abbrechen</button>
              <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting || !deletePassword}>{deleting && <Spinner className="w-4 h-4" />} Konto löschen</button>
            </>
          }
        >
          <p className="text-slate-600">Ihr Profil, Ihre Anfragen und Vernetzungen werden gelöscht. Das kann nicht rückgängig gemacht werden. Bereits gesendete Nachrichten und Forenbeiträge bleiben für die Empfänger sichtbar.</p>
          {deleteError && <Notice kind="error" className="mt-4">{deleteError}</Notice>}
          <Field label="Zur Bestätigung: Ihr Passwort" htmlFor="del-pass" className="mt-4">
            <input id="del-pass" data-autofocus type="password" autoComplete="current-password" className="input" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} />
          </Field>
        </Modal>
      )}
    </div>
    </>
  );
};

export default Profile;

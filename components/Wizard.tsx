import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { analyzeInquiry } from '../services/api';
import { createInquiry, InquiryInput } from '../services/dataService';
import { PROPERTY_TYPES, PropertyType, SERVICES } from '../types';
import { Field, Notice, PageHeader } from './ui/Bits';
import { Icon, Spinner } from './ui/Icon';
import { errorText } from './ui/Toast';

const DRAFT_KEY = 'hm_wizard_draft_v1';
const CONDITIONS = ['Sehr gut / saniert', 'Gepflegt', 'Renovierungsbedürftig', 'Sanierungsstau'];
const STEPS = ['Objekt', 'Details', 'Ihr Anliegen', 'Prüfen & absenden'];

const emptyForm: InquiryInput = {
  city: '',
  units: 10,
  propertyType: 'WEG',
  servicesNeeded: [],
  buildingAge: '',
  condition: '',
  description: '',
};

const loadDraft = (): { form: InquiryInput; step: number } | null => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { form: { ...emptyForm, ...parsed.form }, step: Math.min(Math.max(Number(parsed.step) || 0, 0), 3) };
  } catch {
    return null;
  }
};

type Errors = Partial<Record<keyof InquiryInput, string>>;

const validateStep = (step: number, f: InquiryInput): Errors => {
  const e: Errors = {};
  if (step === 0) {
    if (f.city.trim().length < 2) e.city = 'Bitte geben Sie die Stadt an, in der das Objekt liegt.';
    if (!Number.isInteger(f.units) || f.units < 1) e.units = 'Bitte geben Sie mindestens 1 Einheit an.';
    else if (f.units > 100000) e.units = 'Bitte prüfen Sie die Anzahl der Einheiten.';
  }
  if (step === 1) {
    if (f.buildingAge && !/^\d{4}$/.test(f.buildingAge.trim())) e.buildingAge = 'Bitte vierstellig angeben, z. B. 1985 – oder leer lassen.';
  }
  if (step === 2) {
    if (f.description.trim().length < 20) e.description = 'Bitte beschreiben Sie Ihr Anliegen in mindestens 20 Zeichen.';
  }
  return e;
};

const Wizard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draft = React.useMemo(loadDraft, []);
  const [form, setForm] = useState<InquiryInput>(() => {
    const city = searchParams.get('city');
    return draft ? { ...draft.form, city: city || draft.form.city } : { ...emptyForm, city: city || '' };
  });
  const [step, setStep] = useState(draft?.step ?? 0);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step }));
    } catch {
      /* Entwurf ist nur Komfort */
    }
  }, [form, step]);

  const set = <K extends keyof InquiryInput>(key: K, value: InquiryInput[K]) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: undefined }));
  };

  const next = () => {
    const e = validateStep(step, form);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep(s => s + 1);
  };

  const toggleService = (s: string) =>
    set('servicesNeeded', form.servicesNeeded.includes(s) ? form.servicesNeeded.filter(x => x !== s) : [...form.servicesNeeded, s]);

  const submit = async () => {
    if (!user) return;
    for (const s of [0, 1, 2]) {
      const e = validateStep(s, form);
      if (Object.keys(e).length > 0) {
        setErrors(e);
        setStep(s);
        return;
      }
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      // Die KI-Einschätzung ist ein Zusatz für Verwalter – die Anfrage wird auch ohne sie gespeichert.
      const analysis = await analyzeInquiry(form);
      const id = await createInquiry(user.id, form, analysis);
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      navigate(`/search-results?inquiry=${id}&neu=1`, { replace: true });
    } catch (err) {
      setSubmitError(errorText(err, 'Die Anfrage konnte nicht gespeichert werden. Ihre Eingaben bleiben erhalten – bitte versuchen Sie es erneut.'));
      setSubmitting(false);
    }
  };

  const invalid = (k: keyof InquiryInput) => (errors[k] ? { 'aria-invalid': true as const, 'aria-describedby': `wz-${k}-error` } : {});
  const typeLabel = PROPERTY_TYPES.find(t => t.value === form.propertyType)?.label;

  return (
    <>
    <PageHeader eyebrow="Verwaltung finden" title="Beschreiben Sie Ihr Objekt" width="max-w-2xl">
      In vier kurzen Schritten. Verwalter sehen Ihre Anfrage ohne Namen und Kontaktdaten.
    </PageHeader>
    <div className="page max-w-2xl">

      <ol className="flex items-center gap-2 mb-6" aria-label="Fortschritt">
        {STEPS.map((label, i) => (
          <li key={label} className="flex-1" aria-current={i === step ? 'step' : undefined}>
            <div className={`h-1.5 rounded-full transition-colors ${i <= step ? 'bg-brand-600' : 'bg-slate-200'}`} />
            <span className={`mt-1.5 hidden sm:block text-xs font-medium ${i === step ? 'text-brand-700' : 'text-slate-500'}`}>{label}</span>
          </li>
        ))}
      </ol>
      <p className="sm:hidden text-sm font-medium text-slate-600 mb-4">Schritt {step + 1} von {STEPS.length}: {STEPS[step]}</p>

      <div className="card p-5 sm:p-8">
        {step === 0 && (
          <div className="space-y-5 animate-fade-in">
            <Field label="Stadt des Objekts" htmlFor="wz-city" error={errors.city}>
              <input id="wz-city" className="input" autoComplete="address-level2" maxLength={80} value={form.city} onChange={e => set('city', e.target.value)} placeholder="z. B. Essen" {...invalid('city')} />
            </Field>
            <Field label="Anzahl der Einheiten" htmlFor="wz-units" error={errors.units} hint="Wohnungen und Gewerbeeinheiten zusammen.">
              <input id="wz-units" type="number" inputMode="numeric" min={1} className="input" value={Number.isFinite(form.units) ? form.units : ''} onChange={e => set('units', e.target.value === '' ? NaN : Math.round(Number(e.target.value)))} {...invalid('units')} />
            </Field>
            <fieldset>
              <legend className="label">Art des Objekts</legend>
              <div className="grid sm:grid-cols-3 gap-2">
                {PROPERTY_TYPES.map(t => (
                  <label key={t.value} className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium cursor-pointer transition-colors ${form.propertyType === t.value ? 'border-brand-600 bg-brand-50 text-brand-900' : 'border-slate-300 text-slate-700 hover:border-slate-400'}`}>
                    <input type="radio" name="propertyType" className="accent-brand-600 w-4 h-4 shrink-0" checked={form.propertyType === t.value} onChange={() => set('propertyType', t.value as PropertyType)} />
                    <span className="min-w-0 hyphens-auto [overflow-wrap:anywhere] leading-tight">{t.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Baujahr (optional)" htmlFor="wz-buildingAge" error={errors.buildingAge}>
                <input id="wz-buildingAge" inputMode="numeric" maxLength={4} className="input" value={form.buildingAge} onChange={e => set('buildingAge', e.target.value)} placeholder="z. B. 1985" {...invalid('buildingAge')} />
              </Field>
              <Field label="Zustand (optional)" htmlFor="wz-condition">
                <select id="wz-condition" className="input" value={form.condition} onChange={e => set('condition', e.target.value)}>
                  <option value="">Bitte wählen …</option>
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>
            <fieldset>
              <legend className="label">Welche Leistungen suchen Sie? (optional)</legend>
              <div className="flex flex-wrap gap-2">
                {SERVICES.map(s => {
                  const on = form.servicesNeeded.includes(s);
                  return (
                    <button key={s} type="button" aria-pressed={on} onClick={() => toggleService(s)} className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${on ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 text-slate-700 hover:border-slate-400'}`}>
                      {on && <Icon name="check" className="w-4 h-4" />}
                      {s}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <Field label="Was ist Ihnen bei der neuen Verwaltung wichtig?" htmlFor="wz-description" error={errors.description} hint={`${form.description.trim().length} / 4000 Zeichen. Bitte keine Namen oder Kontaktdaten eintragen – die Anfrage ist für alle Verwalter sichtbar.`}>
              <textarea id="wz-description" className="input min-h-44 resize-y" maxLength={4000} value={form.description} onChange={e => set('description', e.target.value)} placeholder="z. B. Aktuelle Verwaltung reagiert langsam, Abrechnung 2024 steht noch aus, Dachsanierung geplant …" {...invalid('description')} />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="section-title mb-4">Ihre Angaben</h2>
            <dl className="divide-y divide-slate-200 text-sm">
              {[
                ['Stadt', form.city],
                ['Einheiten', String(form.units)],
                ['Objektart', typeLabel],
                ['Baujahr', form.buildingAge || '–'],
                ['Zustand', form.condition || '–'],
                ['Leistungen', form.servicesNeeded.join(', ') || '–'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="font-medium text-slate-900 text-right">{v}</dd>
                </div>
              ))}
              <div className="py-2.5">
                <dt className="text-slate-500 mb-1">Ihr Anliegen</dt>
                <dd className="text-slate-900 whitespace-pre-wrap break-words">{form.description}</dd>
              </div>
            </dl>

            {submitError && <Notice kind="error" className="mt-5">{submitError}</Notice>}

            {!user ? (
              <Notice className="mt-5">
                <p className="font-semibold">Fast geschafft – bitte melden Sie sich an.</p>
                <p className="mt-1">Damit Verwalter Ihnen antworten können, brauchen Sie ein kostenloses Konto. Ihre Angaben bleiben gespeichert.</p>
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <Link to="/register" state={{ from: '/wizard' }} className="btn btn-primary">Kostenlos registrieren</Link>
                  <Link to="/login" state={{ from: '/wizard' }} className="btn btn-secondary">Ich habe schon ein Konto</Link>
                </div>
              </Notice>
            ) : user.role === 'manager' ? (
              <Notice kind="warn" className="mt-5">Sie sind als Hausverwaltung angemeldet. Anfragen können nur Eigentümer-Konten stellen.</Notice>
            ) : (
              <p className="mt-5 text-sm text-slate-500">
                Mit dem Absenden wird Ihre Anfrage für registrierte Hausverwaltungen sichtbar – ohne Ihren Namen und ohne Kontaktdaten. Die Beschreibung wird zur automatischen Einschätzung an einen KI-Dienst (Google Gemini) übermittelt.
              </p>
            )}
          </div>
        )}

        <div className="mt-8 pt-5 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
          {step > 0 ? (
            <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)} disabled={submitting}>
              <Icon name="arrowLeft" className="w-4 h-4" /> Zurück
            </button>
          ) : <span />}
          {step < 3 ? (
            <button className="btn btn-primary" onClick={next}>
              Weiter <Icon name="arrowRight" className="w-4 h-4" />
            </button>
          ) : (
            user && user.role !== 'manager' && (
              <button className="btn btn-primary" onClick={submit} disabled={submitting}>
                {submitting ? <><Spinner className="w-4 h-4" /> Anfrage wird gesendet …</> : 'Anfrage absenden'}
              </button>
            )
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default Wizard;

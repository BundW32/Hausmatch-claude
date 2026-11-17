import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { getInquiry, listProfiles } from '../services/dataService';
import { MatchCriteria, MatchResult, rankManagers } from '../services/matching';
import { Profile, PROPERTY_TYPES, PropertyType } from '../types';
import { Avatar, EmptyState, LoadingBlock, Notice, PageHeader } from './ui/Bits';
import { Icon } from './ui/Icon';
import { errorText } from './ui/Toast';
import MessageModal from './MessageModal';

const MatchCard: React.FC<{ match: MatchResult; onMessage: () => void; canMessage: boolean }> = ({ match, onMessage, canMessage }) => {
  const m = match.manager;
  return (
    <li className="card p-5 sm:p-6">
      <div className="flex flex-wrap sm:flex-nowrap items-start gap-x-4 gap-y-3">
        <Avatar name={m.name} src={m.avatar} size="lg" />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-900 break-words">{m.name}</h3>
          {m.verified && <span className="badge badge-green mt-1"><Icon name="badgeCheck" className="w-3.5 h-3.5" /> Von HausMatch geprüft</span>}
          {m.location && <p className="mt-0.5 text-sm text-slate-500 flex items-center gap-1"><Icon name="pin" className="w-4 h-4" /> {m.location}</p>}
          {m.bio && <p className="mt-2 text-sm text-slate-600 line-clamp-2 break-words">{m.bio}</p>}
        </div>
        <div className="w-full sm:w-auto shrink-0 flex sm:block items-baseline gap-2 sm:text-right">
          <div className="font-display text-[34px] font-bold text-brand-600 leading-none tracking-tight">{match.score}&nbsp;%</div>
          <div className="text-xs text-slate-500 sm:mt-1">Übereinstimmung</div>
        </div>
      </div>

      <ul className="mt-4 space-y-1.5 text-sm">
        {match.reasons.map(r => (
          <li key={r} className="flex items-start gap-2 text-slate-700"><Icon name="check" className="w-4 h-4 mt-0.5 text-green-600" /> {r}</li>
        ))}
        {match.cautions.map(c => (
          <li key={c} className="flex items-start gap-2 text-slate-500"><Icon name="info" className="w-4 h-4 mt-0.5 text-amber-600" /> {c}</li>
        ))}
      </ul>

      <div className="mt-5 flex flex-col sm:flex-row gap-2">
        {canMessage && <button className="btn btn-primary" onClick={onMessage}><Icon name="mail" className="w-4 h-4" /> Nachricht schreiben</button>}
        <Link to={`/profile/${m.id}`} className="btn btn-secondary">Profil ansehen</Link>
      </div>
    </li>
  );
};

const SearchResults = () => {
  const { user, loading: authLoading } = useAuth();
  const [params, setParams] = useSearchParams();
  const inquiryId = params.get('inquiry');
  const isNew = params.get('neu') === '1';

  const [criteria, setCriteria] = useState<MatchCriteria | null>(null);
  const [managers, setManagers] = useState<Profile[] | null>(null);
  const [error, setError] = useState('');
  const [messageTo, setMessageTo] = useState<Profile | null>(null);
  const [cityInput, setCityInput] = useState(params.get('city') || '');
  const [typeInput, setTypeInput] = useState(params.get('type') || '');
  const [unitsInput, setUnitsInput] = useState(params.get('units') || '');

  // Suchkriterien: aus der gespeicherten Anfrage oder aus der Adresszeile
  useEffect(() => {
    if (authLoading) return;
    let active = true;
    setError('');
    const fromParams = (): MatchCriteria | null => {
      const city = params.get('city')?.trim();
      if (!city) return null;
      const type = params.get('type');
      const units = Number(params.get('units'));
      return {
        city,
        propertyType: PROPERTY_TYPES.some(t => t.value === type) ? (type as PropertyType) : undefined,
        units: units > 0 ? units : undefined,
      };
    };
    if (inquiryId && user) {
      getInquiry(inquiryId)
        .then(inq => {
          if (!active) return;
          setCriteria(inq ? { city: inq.city, propertyType: inq.propertyType, units: inq.units } : fromParams());
        })
        .catch(() => active && setCriteria(fromParams()));
    } else {
      setCriteria(fromParams());
    }
    return () => {
      active = false;
    };
  }, [inquiryId, params, user?.id, authLoading]);

  useEffect(() => {
    let active = true;
    listProfiles({ managersOnly: true })
      .then(list => active && setManagers(list))
      .catch(err => active && setError(errorText(err, 'Die Verwalter konnten nicht geladen werden. Bitte laden Sie die Seite neu.')));
    return () => {
      active = false;
    };
  }, []);

  const matches = useMemo(() => (criteria && managers ? rankManagers(managers, criteria) : []), [criteria, managers]);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityInput.trim()) return;
    const next: Record<string, string> = { city: cityInput.trim() };
    if (typeInput) next.type = typeInput;
    if (Number(unitsInput) > 0) next.units = String(Math.round(Number(unitsInput)));
    setParams(next);
  };

  const template = criteria
    ? `Guten Tag,\n\nich suche eine Hausverwaltung für mein Objekt in ${criteria.city}${criteria.units ? ` (${criteria.units} Einheiten${criteria.propertyType ? `, ${criteria.propertyType}` : ''})` : ''}. Haben Sie Kapazität und Interesse an einem Gespräch?\n\nFreundliche Grüße`
    : undefined;

  const loading = !error && (managers === null || authLoading);

  return (
    <>
    <PageHeader eyebrow="Passende Hausverwaltungen" title={criteria ? `Verwaltungen für ${criteria.city}` : 'Hausverwaltung suchen'} width="max-w-4xl">
      {criteria
        ? `Sortiert nach Übereinstimmung mit Ihren Angaben${criteria.propertyType ? ` · ${criteria.propertyType}` : ''}${criteria.units ? ` · ${criteria.units} Einheiten` : ''}.`
        : 'Geben Sie eine Stadt ein oder beschreiben Sie Ihr Objekt.'}
    </PageHeader>
    <div className="page max-w-4xl">

      {isNew && (
        <Notice kind="success" className="mb-6">
          <p className="font-semibold">Ihre Anfrage ist gespeichert.</p>
          <p className="mt-1">
            Registrierte Hausverwaltungen können sie jetzt sehen und Ihnen über das Postfach schreiben. Sie finden sie jederzeit unter{' '}
            <Link to="/anfragen" className="underline underline-offset-2 font-medium">Meine Anfragen</Link>.
          </p>
        </Notice>
      )}

      {!inquiryId && (
        <form onSubmit={search} className="card p-4 mb-6 grid sm:grid-cols-[1fr_auto_auto_auto] gap-3 items-end" role="search">
          <div>
            <label htmlFor="sr-city" className="label">Stadt</label>
            <input id="sr-city" className="input" value={cityInput} onChange={e => setCityInput(e.target.value)} placeholder="z. B. Essen" />
          </div>
          <div>
            <label htmlFor="sr-type" className="label">Objektart</label>
            <select id="sr-type" className="input" value={typeInput} onChange={e => setTypeInput(e.target.value)}>
              <option value="">Alle</option>
              {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.value}</option>)}
            </select>
          </div>
          <div className="sm:w-28">
            <label htmlFor="sr-units" className="label">Einheiten</label>
            <input id="sr-units" type="number" min={1} inputMode="numeric" className="input" value={unitsInput} onChange={e => setUnitsInput(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary"><Icon name="search" className="w-4 h-4" /> Suchen</button>
        </form>
      )}

      {error && <Notice kind="error">{error}</Notice>}
      {loading && <LoadingBlock label="Verwaltungen werden geladen …" />}

      {!loading && !error && criteria && matches.length > 0 && (
        <>
          <p className="text-sm text-slate-500 mb-3">{matches.length} Treffer</p>
          <ul className="space-y-4">
            {matches.map(m => (
              <MatchCard key={m.manager.id} match={m} canMessage={user?.id !== m.manager.id} onMessage={() => setMessageTo(m.manager)} />
            ))}
          </ul>
          <p className="mt-6 text-sm text-slate-500">
            So entsteht die Reihenfolge: Einsatzgebiet, Objektart und Objektgröße laut Profil der Verwaltung. Die Angaben stammen von den Verwaltungen selbst.
          </p>
        </>
      )}

      {!loading && !error && criteria && matches.length === 0 && (
        <div className="card">
          <EmptyState
            icon="building"
            title={`Noch keine Verwaltung für ${criteria.city} registriert`}
            action={<Link to="/network" className="btn btn-secondary">Alle Verwaltungen ansehen</Link>}
          >
            {inquiryId
              ? 'Ihre Anfrage bleibt aktiv: Sobald sich eine passende Verwaltung meldet, finden Sie die Nachricht in Ihrem Postfach.'
              : 'Stellen Sie eine Anfrage – dann können sich Verwaltungen aus der Region bei Ihnen melden.'}
          </EmptyState>
        </div>
      )}

      {!loading && !error && !criteria && (
        <div className="card">
          <EmptyState icon="search" title="Wo liegt Ihr Objekt?" action={<Link to="/wizard" className="btn btn-primary">Objekt beschreiben</Link>}>
            Geben Sie oben eine Stadt ein oder beschreiben Sie Ihr Objekt – dann zeigen wir passende Verwaltungen.
          </EmptyState>
        </div>
      )}

      {messageTo && (
        <MessageModal
          recipient={{ id: messageTo.id, name: messageTo.name }}
          subject={criteria ? `Anfrage: Objekt in ${criteria.city}` : 'Anfrage'}
          inquiryId={inquiryId || undefined}
          template={template}
          onClose={() => setMessageTo(null)}
        />
      )}
    </div>
    </>
  );
};

export default SearchResults;

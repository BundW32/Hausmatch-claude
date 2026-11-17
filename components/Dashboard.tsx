import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { getLeads, getLeadStates, setLeadState } from '../services/dataService';
import { matchManager } from '../services/matching';
import { Inquiry, LeadStatus } from '../types';
import { EmptyState, formatDate, LoadingBlock, Notice } from './ui/Bits';
import { Icon } from './ui/Icon';
import { errorText, useToast } from './ui/Toast';
import MessageModal from './MessageModal';

const TABS: { id: LeadStatus; label: string }[] = [
  { id: 'neu', label: 'Neu' },
  { id: 'kontaktiert', label: 'Kontaktiert' },
  { id: 'archiviert', label: 'Archiv' },
];

const EFFORT = {
  Niedrig: { cls: 'badge-green', label: 'Aufwand: niedrig' },
  Mittel: { cls: 'badge-amber', label: 'Aufwand: mittel' },
  Hoch: { cls: 'badge-red', label: 'Aufwand: hoch' },
} as const;

const Dashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [leads, setLeads] = useState<Inquiry[] | null>(null);
  const [states, setStates] = useState<Record<string, LeadStatus>>({});
  const [error, setError] = useState('');
  const [tab, setTab] = useState<LeadStatus>('neu');
  const [onlyMatching, setOnlyMatching] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showReply, setShowReply] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([getLeads(), getLeadStates(user.id)])
      .then(([l, s]) => {
        setLeads(l.filter(i => i.ownerId !== user.id));
        setStates(s);
      })
      .catch(err => setError(errorText(err, 'Die Anfragen konnten nicht geladen werden.')));
  }, [user?.id]);

  const statusOf = (id: string): LeadStatus => states[id] || 'neu';
  const fits = useMemo(() => {
    const out: Record<string, boolean> = {};
    if (user) (leads || []).forEach(l => (out[l.id] = !!matchManager(user, { city: l.city, propertyType: l.propertyType, units: l.units })));
    return out;
  }, [leads, user]);

  const counts = useMemo(() => {
    const c: Record<LeadStatus, number> = { neu: 0, kontaktiert: 0, archiviert: 0 };
    (leads || []).forEach(l => c[statusOf(l.id)]++);
    return c;
  }, [leads, states]);

  const visible = (leads || [])
    .filter(l => statusOf(l.id) === tab && (!onlyMatching || fits[l.id]))
    .sort((a, b) => Number(fits[b.id]) - Number(fits[a.id]));
  const selected = (leads || []).find(l => l.id === selectedId) || null;
  const hasMatchingProfile = !!user && ((user.serviceCities?.length || 0) > 0 || !!user.location);

  const updateStatus = async (id: string, status: LeadStatus) => {
    if (!user) return;
    const previous = states;
    setStates(s => ({ ...s, [id]: status }));
    try {
      await setLeadState(user.id, id, status);
    } catch (err) {
      setStates(previous);
      toast(errorText(err), 'error');
    }
  };

  if (!user) return null;

  return (
    <div className="flex-1 min-h-0 flex bg-slate-50">
      {/* Liste */}
      <aside className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-[400px] lg:shrink-0 bg-white border-r border-slate-200 min-h-0`}>
        <div className="p-4 sm:p-5 border-b border-slate-200">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Lead-Center</h1>
          <p className="text-sm text-slate-500 mt-0.5">Aktuelle Anfragen von Eigentümern</p>
          <div className="mt-4 flex gap-1 bg-slate-100 rounded-xl p-1" role="tablist" aria-label="Bearbeitungsstand">
            {TABS.map(t => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`flex-1 rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors ${tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                {t.label} <span className="text-slate-400 font-medium">{counts[t.id]}</span>
              </button>
            ))}
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" className="w-4 h-4 accent-brand-600" checked={onlyMatching} onChange={e => setOnlyMatching(e.target.checked)} />
            Nur Anfragen, die zu meinem Profil passen
          </label>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {error && <Notice kind="error">{error}</Notice>}
          {!error && leads === null && <LoadingBlock />}
          {leads && !hasMatchingProfile && (
            <Notice kind="warn">
              Tragen Sie in Ihrem <Link to="/profile" className="underline underline-offset-2 font-medium">Profil</Link> Einsatzgebiete ein – dann erscheinen Sie in den Suchergebnissen der Eigentümer.
            </Notice>
          )}
          {leads && visible.length === 0 && (
            <EmptyState icon="inbox" title={tab === 'neu' ? 'Keine neuen Anfragen' : tab === 'kontaktiert' ? 'Noch niemanden kontaktiert' : 'Archiv ist leer'}>
              {onlyMatching ? 'Mit dem Filter „passt zu meinem Profil“ gibt es hier nichts.' : 'Neue Anfragen erscheinen automatisch hier.'}
            </EmptyState>
          )}
          {visible.map(l => (
            <button
              key={l.id}
              onClick={() => setSelectedId(l.id)}
              aria-current={selectedId === l.id}
              className={`w-full text-left rounded-xl border p-4 transition-colors ${selectedId === l.id ? 'border-brand-600 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-bold text-slate-900 truncate">{l.propertyType} in {l.city}</span>
                <span className="text-xs text-slate-500 shrink-0">{formatDate(l.createdAt)}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="badge">{l.units} Einheiten</span>
                {fits[l.id] && <span className="badge badge-brand"><Icon name="check" className="w-3.5 h-3.5" /> Passt zu Ihrem Profil</span>}
              </div>
              <p className="mt-2 text-sm text-slate-600 line-clamp-2">{l.description}</p>
            </button>
          ))}
        </div>
      </aside>

      {/* Detail */}
      <section className={`${selected ? 'flex' : 'hidden lg:flex'} flex-1 flex-col min-w-0 min-h-0`}>
        {selected ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-3xl mx-auto p-4 sm:p-8">
              <button className="lg:hidden btn btn-ghost btn-sm mb-3 -ml-2" onClick={() => setSelectedId(null)}>
                <Icon name="arrowLeft" className="w-4 h-4" /> Alle Anfragen
              </button>

              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <span className="badge">{TABS.find(t => t.id === statusOf(selected.id))?.label}</span>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{selected.propertyType} in {selected.city}</h2>
                  <p className="text-sm text-slate-500 mt-1">Eingegangen am {formatDate(selected.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  {statusOf(selected.id) === 'archiviert' ? (
                    <button className="btn btn-secondary" onClick={() => updateStatus(selected.id, 'neu')}>Wiederherstellen</button>
                  ) : (
                    <button className="btn btn-secondary" onClick={() => updateStatus(selected.id, 'archiviert')}><Icon name="archive" className="w-4 h-4" /> Archivieren</button>
                  )}
                  <button className="btn btn-primary" onClick={() => setShowReply(true)}><Icon name="mail" className="w-4 h-4" /> Nachricht senden</button>
                </div>
              </div>

              <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  ['Stadt', selected.city],
                  ['Einheiten', String(selected.units)],
                  ['Baujahr', selected.buildingAge || '–'],
                  ['Zustand', selected.condition || '–'],
                ].map(([k, v]) => (
                  <div key={k} className="card p-4">
                    <dt className="text-xs font-medium text-slate-500">{k}</dt>
                    <dd className="mt-1 font-bold text-slate-900 break-words">{v}</dd>
                  </div>
                ))}
              </dl>

              {selected.servicesNeeded.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Gewünschte Leistungen</h3>
                  <div className="flex flex-wrap gap-1.5">{selected.servicesNeeded.map(s => <span key={s} className="badge badge-brand">{s}</span>)}</div>
                </div>
              )}

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Beschreibung des Eigentümers</h3>
                <p className="card p-4 sm:p-5 text-slate-700 leading-relaxed whitespace-pre-wrap break-words">{selected.description || 'Keine Beschreibung vorhanden.'}</p>
              </div>

              {selected.aiAnalysis && (
                <div className="mt-6 card p-4 sm:p-5 border-brand-100 bg-brand-50/50">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5"><Icon name="sparkles" className="w-4 h-4 text-brand-700" /> Automatische Einschätzung (KI)</h3>
                    {EFFORT[selected.aiAnalysis.estimatedEffort] && <span className={`badge ${EFFORT[selected.aiAnalysis.estimatedEffort].cls}`}>{EFFORT[selected.aiAnalysis.estimatedEffort].label}</span>}
                  </div>
                  <p className="text-sm text-slate-700">{selected.aiAnalysis.summary}</p>
                  {Array.isArray(selected.aiAnalysis.keyRequirements) && selected.aiAnalysis.keyRequirements.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm text-slate-700">
                      {selected.aiAnalysis.keyRequirements.map(r => <li key={r} className="flex gap-2"><Icon name="check" className="w-4 h-4 mt-0.5 text-brand-700" />{r}</li>)}
                    </ul>
                  )}
                  {selected.aiAnalysis.legalAdviceSnippet && <p className="mt-3 text-sm text-slate-600">{selected.aiAnalysis.legalAdviceSnippet}</p>}
                  <p className="mt-3 text-xs text-slate-500">Automatisch erzeugt, kann Fehler enthalten und ersetzt keine eigene Prüfung.</p>
                </div>
              )}

              <Notice className="mt-6">
                Name und Kontaktdaten sehen Sie erst, wenn der Eigentümer sie Ihnen im Postfach freigibt. Schreiben Sie ihm über „Nachricht senden“.
              </Notice>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState icon="inbox" title="Anfrage auswählen">Wählen Sie links eine Anfrage, um die Details zu sehen.</EmptyState>
          </div>
        )}
      </section>

      {showReply && selected && (
        <MessageModal
          recipient={{ id: selected.ownerId, name: `Eigentümer · ${selected.city}`.slice(0, 80) }}
          subject={`Ihre Anfrage: ${selected.propertyType} in ${selected.city}`}
          inquiryId={selected.id}
          template={`Guten Tag,\n\nvielen Dank für Ihre Anfrage zu Ihrem Objekt in ${selected.city} (${selected.units} Einheiten). Gern stellen wir uns vor und besprechen, wie wir die Verwaltung übernehmen können.\n\nWann passt Ihnen ein kurzes Telefonat?\n\nFreundliche Grüße\n${user.name}`}
          onClose={() => setShowReply(false)}
          onSent={() => updateStatus(selected.id, 'kontaktiert')}
        />
      )}
    </div>
  );
};

export default Dashboard;

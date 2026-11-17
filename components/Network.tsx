import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { listProfiles } from '../services/dataService';
import { connectionLabel, useConnections } from '../services/useConnections';
import { Profile } from '../types';
import { Avatar, EmptyState, LoadingBlock, Notice, PageHeader } from './ui/Bits';
import { Icon } from './ui/Icon';
import { errorText, useToast } from './ui/Toast';
import MessageModal from './MessageModal';

type RoleFilter = 'all' | 'manager' | 'seeker';

const Network = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { stateOf, toggle, incoming } = useConnections(user?.id);
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<RoleFilter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [messageTo, setMessageTo] = useState<Profile | null>(null);

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    setProfiles(null);
    setError('');
    listProfiles({ managersOnly: !user })
      .then(list => active && setProfiles(list.filter(p => p.id !== user?.id)))
      .catch(err => active && setError(errorText(err, 'Das Netzwerk konnte nicht geladen werden. Bitte laden Sie die Seite neu.')));
    return () => {
      active = false;
    };
  }, [user?.id, authLoading]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (profiles || []).filter(p => {
      if (role !== 'all' && p.role !== role) return false;
      if (!q) return true;
      return [p.name, p.location, p.bio, ...(p.serviceCities || [])].some(v => (v || '').toLowerCase().includes(q));
    });
  }, [profiles, search, role]);

  const handleConnect = async (p: Profile) => {
    if (!user) {
      navigate('/login', { state: { from: '/network' } });
      return;
    }
    setBusyId(p.id);
    try {
      const before = stateOf(p.id);
      await toggle(p.id);
      toast(
        before === 'none' ? `Anfrage an ${p.name} gesendet.` : before === 'incoming' ? `Sie sind jetzt mit ${p.name} vernetzt.` : 'Vernetzung entfernt.',
        'success',
      );
    } catch (err) {
      toast(errorText(err), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const incomingProfiles = (profiles || []).filter(p => incoming.includes(p.id));

  return (
    <>
    <PageHeader eyebrow="Netzwerk" title={user ? 'Verwaltungen und Eigentümer' : 'Hausverwaltungen auf HausMatch'}>
      {user ? 'Profile ansehen, Nachrichten schreiben und sich vernetzen.' : 'Melden Sie sich an, um Nachrichten zu schreiben und sich zu vernetzen.'}
    </PageHeader>
    <div className="page">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-2 md:max-w-[34rem]">
          <div className="relative flex-1">
            <label htmlFor="net-search" className="sr-only">Name, Ort oder Stichwort suchen</label>
            <Icon name="search" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input id="net-search" className="input !pl-10" placeholder="Name, Ort oder Stichwort …" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {user && (
            <>
              <label htmlFor="net-role" className="sr-only">Nach Rolle filtern</label>
              <select id="net-role" className="input sm:!w-44" value={role} onChange={e => setRole(e.target.value as RoleFilter)}>
                <option value="all">Alle Mitglieder</option>
                <option value="manager">Hausverwaltungen</option>
                <option value="seeker">Eigentümer</option>
              </select>
            </>
          )}
        </div>
      </div>

      {incomingProfiles.length > 0 && (
        <Notice className="mb-6">
          <p className="font-semibold">{incomingProfiles.length === 1 ? 'Eine neue Vernetzungsanfrage' : `${incomingProfiles.length} neue Vernetzungsanfragen`}</p>
          <ul className="mt-2 space-y-2">
            {incomingProfiles.map(p => (
              <li key={p.id} className="flex flex-wrap items-center gap-2">
                <Link to={`/profile/${p.id}`} className="font-medium underline underline-offset-2">{p.name}</Link>
                <button className="btn btn-primary btn-sm" disabled={busyId === p.id} onClick={() => handleConnect(p)}>Annehmen</button>
              </li>
            ))}
          </ul>
        </Notice>
      )}

      {error && <Notice kind="error">{error}</Notice>}
      {!error && profiles === null && <LoadingBlock />}

      {profiles && visible.length === 0 && (
        <div className="card">
          <EmptyState icon="users" title={profiles.length === 0 ? 'Noch keine Mitglieder' : 'Keine Treffer'}>
            {profiles.length === 0 ? 'Sobald sich Hausverwaltungen registrieren, erscheinen sie hier.' : 'Bitte prüfen Sie die Schreibweise oder suchen Sie nach einem anderen Ort.'}
          </EmptyState>
        </div>
      )}

      {visible.length > 0 && (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map(p => {
            const state = stateOf(p.id);
            return (
              <li key={p.id} className="card card-hover p-5 flex flex-col">
                <Link to={`/profile/${p.id}`} className="flex items-center gap-4 group">
                  <Avatar name={p.name} src={p.avatar} size="lg" />
                  <span className="min-w-0">
                    <span className="block font-bold text-slate-900 truncate group-hover:text-brand-700">{p.name}</span>
                    <span className="mt-1 flex flex-wrap gap-1.5">
                      <span className="badge">{p.role === 'manager' ? 'Hausverwaltung' : 'Eigentümer'}</span>
                      {p.verified && <span className="badge badge-green"><Icon name="badgeCheck" className="w-3.5 h-3.5" /> Geprüft</span>}
                    </span>
                  </span>
                </Link>
                {p.location && <p className="mt-3 text-sm text-slate-500 flex items-center gap-1"><Icon name="pin" className="w-4 h-4" /> {p.location}</p>}
                <p className="mt-2 text-sm text-slate-600 line-clamp-3 flex-1">{p.bio || 'Noch keine Beschreibung hinterlegt.'}</p>
                <div className="mt-4 flex flex-col gap-2">
                  {user ? (
                    <>
                      <button className="btn btn-primary btn-sm" onClick={() => setMessageTo(p)}><Icon name="mail" className="w-4 h-4" /> Nachricht schreiben</button>
                      <button className={`btn btn-sm ${state === 'incoming' ? 'btn-soft' : 'btn-secondary'}`} disabled={busyId === p.id} onClick={() => handleConnect(p)}>
                        {state === 'accepted' && <Icon name="check" className="w-4 h-4 text-green-600" />}
                        {connectionLabel[state]}
                      </button>
                    </>
                  ) : (
                    <Link to={`/profile/${p.id}`} className="btn btn-secondary btn-sm">Profil ansehen</Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {messageTo && <MessageModal recipient={{ id: messageTo.id, name: messageTo.name }} subject="Direktnachricht" onClose={() => setMessageTo(null)} />}
    </div>
    </>
  );
};

export default Network;

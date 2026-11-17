import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { createReply, createThread, deleteReply, deleteThread, subscribeReplies, subscribeThread, subscribeThreads } from '../services/dataService';
import { ForumReply, ForumThread } from '../types';
import { Avatar, EmptyState, Field, formatDate, LoadingBlock, Notice } from './ui/Bits';
import { Icon, Spinner } from './ui/Icon';
import { Modal } from './ui/Modal';
import { errorText, useToast } from './ui/Toast';

const CATEGORIES = ['Recht & Urteile', 'Software & Tech', 'Best Practice', 'Handwerker & Services', 'Feedback', 'Off-Topic'];
const PAGE = 20;

/** Hinweis, warum (noch) nicht geschrieben werden kann. */
const WriteGate: React.FC<{ from: string }> = ({ from }) => {
  const { user } = useAuth();
  if (!user) {
    return (
      <Notice>
        Zum Mitdiskutieren bitte <Link to="/login" state={{ from }} className="underline underline-offset-2 font-medium">anmelden</Link> oder{' '}
        <Link to="/register" state={{ from }} className="underline underline-offset-2 font-medium">kostenlos registrieren</Link>.
      </Notice>
    );
  }
  if (!user.emailVerified) return <Notice kind="warn">Bitte bestätigen Sie Ihre E-Mail-Adresse, um im Forum zu schreiben.</Notice>;
  return null;
};

// --------------------------------------------------------------- Themenliste
const ThreadList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<ForumThread[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [max, setMax] = useState(PAGE);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('Alle');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState({ title: '', category: CATEGORIES[0], content: '' });
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(
    () =>
      subscribeThreads(
        max,
        (list, more) => {
          setThreads(list);
          setHasMore(more);
        },
        err => setError(errorText(err, 'Das Forum konnte nicht geladen werden.')),
      ),
    [max],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (threads || []).filter(t => (category === 'Alle' || t.category === category) && (!q || t.title.toLowerCase().includes(q) || t.content.toLowerCase().includes(q)));
  }, [threads, category, search]);

  const canWrite = !!user?.emailVerified;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (draft.title.trim().length < 3 || !draft.content.trim()) {
      setCreateError('Bitte geben Sie einen Titel (mind. 3 Zeichen) und einen Text ein.');
      return;
    }
    setSaving(true);
    setCreateError('');
    try {
      const id = await createThread({ id: user.id, name: user.name }, draft);
      setCreateOpen(false);
      setDraft({ title: '', category: CATEGORIES[0], content: '' });
      navigate(`/forum/${id}`);
    } catch (err) {
      setCreateError(errorText(err, 'Das Thema konnte nicht erstellt werden.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page max-w-4xl">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Forum</h1>
          <p className="mt-2 text-slate-600">Fragen und Erfahrungen rund um Verwaltung, Recht und Technik.</p>
        </div>
        {canWrite && <button className="btn btn-primary" onClick={() => setCreateOpen(true)}><Icon name="plus" className="w-4 h-4" /> Neues Thema</button>}
      </header>

      {!canWrite && <div className="mb-5"><WriteGate from="/forum" /></div>}

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <label htmlFor="forum-search" className="sr-only">Themen durchsuchen</label>
          <Icon name="search" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input id="forum-search" className="input !pl-10" placeholder="Themen durchsuchen …" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <label htmlFor="forum-cat" className="sr-only">Kategorie</label>
        <select id="forum-cat" className="input sm:!w-56" value={category} onChange={e => setCategory(e.target.value)}>
          <option>Alle</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {error && <Notice kind="error">{error}</Notice>}
      {!error && threads === null && <LoadingBlock />}

      {threads && visible.length === 0 && (
        <div className="card">
          <EmptyState icon="chat" title={threads.length === 0 ? 'Noch keine Themen' : 'Keine passenden Themen'}>
            {threads.length === 0 ? 'Starten Sie die erste Diskussion.' : 'Ändern Sie Suche oder Kategorie.'}
          </EmptyState>
        </div>
      )}

      {visible.length > 0 && (
        <ul className="card divide-y divide-slate-200 overflow-hidden">
          {visible.map(t => (
            <li key={t.id}>
              <Link to={`/forum/${t.id}`} className="flex items-start gap-4 p-4 sm:p-5 hover:bg-slate-50 transition-colors">
                <Avatar name={t.author} size="sm" />
                <span className="flex-1 min-w-0">
                  <span className="block font-bold text-slate-900 break-words">{t.title}</span>
                  <span className="mt-1 block text-sm text-slate-600 line-clamp-2 break-words">{t.content}</span>
                  <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="badge">{t.category}</span>
                    <span>{t.author}</span>
                    <span>{formatDate(t.createdAt)}</span>
                  </span>
                </span>
                <span className="shrink-0 text-center text-sm text-slate-500">
                  <span className="block text-lg font-bold text-slate-900">{t.replies}</span>
                  {t.replies === 1 ? 'Antwort' : 'Antworten'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <div className="mt-5 text-center">
          <button className="btn btn-secondary" onClick={() => setMax(m => m + PAGE)}>Weitere Themen laden</button>
        </div>
      )}

      {createOpen && (
        <Modal title="Neues Thema" size="lg" onClose={() => setCreateOpen(false)}>
          <form onSubmit={submit} className="space-y-4">
            {createError && <Notice kind="error">{createError}</Notice>}
            <Field label="Titel" htmlFor="th-title">
              <input id="th-title" data-autofocus className="input" maxLength={150} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <Field label="Kategorie" htmlFor="th-cat">
              <select id="th-cat" className="input" value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Ihr Beitrag" htmlFor="th-content" hint="Bitte keine personenbezogenen Daten Dritter veröffentlichen. Das Forum ist öffentlich lesbar.">
              <textarea id="th-content" className="input min-h-40 resize-y" maxLength={8000} value={draft.content} onChange={e => setDraft({ ...draft, content: e.target.value })} />
            </Field>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <button type="button" className="btn btn-secondary" onClick={() => setCreateOpen(false)}>Abbrechen</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving && <Spinner className="w-4 h-4" />} Thema veröffentlichen</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// -------------------------------------------------------------- Themenansicht
const ThreadView: React.FC<{ threadId: string }> = ({ threadId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [thread, setThread] = useState<ForumThread | null | undefined>(undefined);
  const [replies, setReplies] = useState<ForumReply[] | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [confirm, setConfirm] = useState<{ kind: 'thread' } | { kind: 'reply'; id: string } | null>(null);

  useEffect(() => {
    setThread(undefined);
    setReplies(null);
    const unsubThread = subscribeThread(threadId, setThread, () => setThread(null));
    const unsubReplies = subscribeReplies(threadId, setReplies, () => setReplies([]));
    return () => {
      unsubThread();
      unsubReplies();
    };
  }, [threadId]);

  const canWrite = !!user?.emailVerified;

  const reply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    setSending(true);
    try {
      await createReply({ id: user.id, name: user.name }, threadId, text);
      setText('');
    } catch (err) {
      toast(errorText(err, 'Die Antwort konnte nicht gespeichert werden.'), 'error');
    } finally {
      setSending(false);
    }
  };

  const doDelete = async () => {
    if (!confirm) return;
    try {
      if (confirm.kind === 'thread') {
        await deleteThread(threadId);
        toast('Thema gelöscht.', 'success');
        navigate('/forum', { replace: true });
      } else {
        await deleteReply(confirm.id);
        toast('Antwort gelöscht.', 'success');
      }
    } catch (err) {
      toast(errorText(err), 'error');
    } finally {
      setConfirm(null);
    }
  };

  if (thread === undefined) return <LoadingBlock />;
  if (thread === null) {
    return (
      <div className="page max-w-xl text-center">
        <h1 className="page-title">Thema nicht gefunden</h1>
        <p className="mt-3 text-slate-600">Das Thema wurde möglicherweise gelöscht.</p>
        <Link to="/forum" className="btn btn-primary mt-6">Zum Forum</Link>
      </div>
    );
  }

  return (
    <div className="page max-w-3xl">
      <Link to="/forum" className="btn btn-ghost btn-sm -ml-2 mb-4"><Icon name="arrowLeft" className="w-4 h-4" /> Alle Themen</Link>

      <article className="card p-5 sm:p-7">
        <span className="badge">{thread.category}</span>
        <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 break-words">{thread.title}</h1>
        <div className="mt-3 flex items-center gap-3 text-sm text-slate-500">
          <Avatar name={thread.author} size="sm" />
          <span>
            <Link to={`/profile/${thread.authorId}`} className="font-semibold text-slate-800 hover:text-brand-700">{thread.author}</Link> · {formatDate(thread.createdAt)}
          </span>
          {user?.id === thread.authorId && (
            <button className="btn btn-ghost btn-sm ml-auto text-red-600" onClick={() => setConfirm({ kind: 'thread' })}><Icon name="trash" className="w-4 h-4" /> Löschen</button>
          )}
        </div>
        <p className="mt-5 text-slate-800 leading-relaxed whitespace-pre-wrap break-words">{thread.content}</p>
      </article>

      <h2 className="section-title mt-8 mb-3">{replies ? `${replies.length} ${replies.length === 1 ? 'Antwort' : 'Antworten'}` : 'Antworten'}</h2>
      {replies === null && <LoadingBlock />}
      {replies && replies.length === 0 && <p className="text-sm text-slate-500 mb-4">Noch keine Antworten – schreiben Sie die erste.</p>}
      <ul className="space-y-3">
        {(replies || []).map(r => (
          <li key={r.id} className="card p-4 sm:p-5">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Avatar name={r.author} size="sm" />
              <span>
                <Link to={`/profile/${r.authorId}`} className="font-semibold text-slate-800 hover:text-brand-700">{r.author}</Link> · {formatDate(r.createdAt)}
              </span>
              {user?.id === r.authorId && (
                <button className="btn btn-ghost btn-sm !px-2 ml-auto text-red-600" aria-label="Antwort löschen" onClick={() => setConfirm({ kind: 'reply', id: r.id })}><Icon name="trash" className="w-4 h-4" /></button>
              )}
            </div>
            <p className="mt-3 text-slate-800 leading-relaxed whitespace-pre-wrap break-words">{r.content}</p>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {canWrite ? (
          <form onSubmit={reply} className="card p-4 sm:p-5">
            <label htmlFor="reply-text" className="label">Ihre Antwort</label>
            <textarea id="reply-text" className="input min-h-28 resize-y" maxLength={8000} value={text} onChange={e => setText(e.target.value)} />
            <div className="mt-3 flex justify-end">
              <button type="submit" className="btn btn-primary" disabled={sending || !text.trim()}>{sending && <Spinner className="w-4 h-4" />} Antwort senden</button>
            </div>
          </form>
        ) : (
          <WriteGate from={`/forum/${threadId}`} />
        )}
      </div>

      {confirm && (
        <Modal
          title={confirm.kind === 'thread' ? 'Thema löschen?' : 'Antwort löschen?'}
          onClose={() => setConfirm(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setConfirm(null)}>Abbrechen</button>
              <button className="btn btn-danger" onClick={doDelete}>Löschen</button>
            </>
          }
        >
          <p className="text-slate-600">Der Beitrag wird dauerhaft entfernt.</p>
        </Modal>
      )}
    </div>
  );
};

const Forum = () => {
  const { threadId } = useParams();
  return threadId ? <ThreadView threadId={threadId} /> : <ThreadList />;
};

export default Forum;

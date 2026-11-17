import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { markMessagesRead, sendMessage, subscribeMessages } from '../services/dataService';
import { Message } from '../types';
import { Avatar, EmptyState, formatDate, formatDayLong, formatTime, LoadingBlock, Notice, toDate } from './ui/Bits';
import { Icon } from './ui/Icon';
import { Modal } from './ui/Modal';
import { errorText, useToast } from './ui/Toast';

interface Conversation {
  partnerId: string;
  partnerName: string;
  messages: Message[];
  last: Message;
  unread: number;
}

const Messaging = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    return subscribeMessages(user.id, setMessages, err => setError(errorText(err, 'Das Postfach konnte nicht geladen werden.')));
  }, [user?.id]);

  const conversations = useMemo<Conversation[]>(() => {
    if (!user || !messages) return [];
    const groups = new Map<string, Message[]>();
    messages.forEach(m => {
      const partner = m.senderId === user.id ? m.receiverId : m.senderId;
      groups.set(partner, [...(groups.get(partner) || []), m]);
    });
    return [...groups.entries()]
      .map(([partnerId, msgs]) => {
        // Bevorzugt den Namen, den der Partner selbst führt (aus seinen eigenen Nachrichten).
        const fromPartner = [...msgs].reverse().find(m => m.senderId === partnerId);
        const last = msgs[msgs.length - 1];
        return {
          partnerId,
          partnerName: fromPartner?.senderName || last.receiverName || 'Nutzer',
          messages: msgs,
          last,
          unread: msgs.filter(m => !m.read && m.receiverId === user.id).length,
        };
      })
      .sort((a, b) => (toDate(b.last.timestamp)?.getTime() ?? Infinity) - (toDate(a.last.timestamp)?.getTime() ?? Infinity));
  }, [messages, user?.id]);

  const active = conversations.find(c => c.partnerId === selectedId) || null;
  const filtered = conversations.filter(c => c.partnerName.toLowerCase().includes(search.trim().toLowerCase()));

  // Geöffnete Unterhaltung: nach unten scrollen und als gelesen markieren
  useEffect(() => {
    if (!active || !user) return;
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    const unreadIds = active.messages.filter(m => !m.read && m.receiverId === user.id).map(m => m.id);
    if (unreadIds.length > 0) markMessagesRead(unreadIds).catch(() => undefined);
  }, [active?.partnerId, active?.messages.length]);

  const send = async (content: string) => {
    if (!user || !active || !content.trim()) return false;
    setSending(true);
    try {
      await sendMessage({
        senderId: user.id,
        senderName: user.name,
        receiverId: active.partnerId,
        receiverName: active.partnerName,
        subject: active.last.subject || 'Nachricht',
        content,
        inquiryId: active.last.inquiryId,
      });
      return true;
    } catch (err) {
      toast(errorText(err, 'Die Nachricht konnte nicht gesendet werden.'), 'error');
      return false;
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = text;
    if (!content.trim() || sending) return;
    setText('');
    if (!(await send(content))) setText(content);
  };

  const shareContact = async () => {
    if (!user) return;
    const lines = [`Meine Kontaktdaten:`, `Name: ${user.name}`, `E-Mail: ${user.email}`];
    if (user.phone) lines.push(`Telefon: ${user.phone}`);
    setShareOpen(false);
    if (await send(lines.join('\n'))) toast('Kontaktdaten gesendet.', 'success');
  };

  if (!user) return null;

  return (
    <div className="flex-1 min-h-0 flex bg-white">
      {/* Unterhaltungen */}
      <aside className={`${active ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[340px] md:shrink-0 border-r border-slate-200 min-h-0`}>
        <div className="p-4 border-b border-slate-200">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Postfach</h1>
          <label htmlFor="chat-search" className="sr-only">Unterhaltungen durchsuchen</label>
          <div className="relative mt-3">
            <Icon name="search" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input id="chat-search" className="input !pl-10" placeholder="Name suchen …" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {error && <div className="p-3"><Notice kind="error">{error}</Notice></div>}
          {!error && messages === null && <LoadingBlock />}
          {messages && conversations.length === 0 && (
            <EmptyState icon="chat" title="Noch keine Nachrichten">
              {user.role === 'manager' ? 'Schreiben Sie Eigentümern über das Lead-Center.' : 'Schreiben Sie einer Verwaltung über die Suche oder das Netzwerk.'}
            </EmptyState>
          )}
          {messages && conversations.length > 0 && filtered.length === 0 && <p className="p-6 text-sm text-slate-500 text-center">Keine Unterhaltung mit „{search}“.</p>}
          <ul>
            {filtered.map(c => (
              <li key={c.partnerId}>
                <button
                  onClick={() => setSelectedId(c.partnerId)}
                  aria-current={selectedId === c.partnerId}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-100 transition-colors ${selectedId === c.partnerId ? 'bg-brand-50' : 'hover:bg-slate-50'}`}
                >
                  <Avatar name={c.partnerName} />
                  <span className="flex-1 min-w-0">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={`truncate text-sm ${c.unread ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>{c.partnerName}</span>
                      <span className="text-xs text-slate-500 shrink-0">{formatDate(c.last.timestamp)}</span>
                    </span>
                    <span className="flex items-center justify-between gap-2 mt-0.5">
                      <span className={`truncate text-sm ${c.unread ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                        {c.last.senderId === user.id ? 'Sie: ' : ''}{c.last.content}
                      </span>
                      {c.unread > 0 && <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-brand-600 text-white text-xs font-semibold flex items-center justify-center">{c.unread}</span>}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Verlauf */}
      <section className={`${active ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0 min-h-0 bg-slate-50`}>
        {active ? (
          <>
            <header className="flex items-center gap-3 px-3 sm:px-5 py-3 bg-white border-b border-slate-200">
              <button className="md:hidden btn btn-ghost btn-sm !px-2" onClick={() => setSelectedId(null)} aria-label="Zurück zur Übersicht">
                <Icon name="arrowLeft" />
              </button>
              <Avatar name={active.partnerName} size="sm" />
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-slate-900 truncate">{active.partnerName}</h2>
                {active.last.subject && <p className="text-xs text-slate-500 truncate">{active.last.subject}</p>}
              </div>
              {user.role === 'seeker' && (
                <button className="btn btn-secondary btn-sm" onClick={() => setShareOpen(true)}>
                  <Icon name="mail" className="w-4 h-4" /> <span className="hidden sm:inline">Kontaktdaten senden</span>
                </button>
              )}
              <Link to={`/profile/${active.partnerId}`} className="btn btn-ghost btn-sm">Profil</Link>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar px-3 sm:px-6 py-4 space-y-3">
              {active.messages.map((m, i) => {
                const mine = m.senderId === user.id;
                const day = toDate(m.timestamp)?.toDateString();
                const showDay = i === 0 || day !== toDate(active.messages[i - 1].timestamp)?.toDateString();
                return (
                  <React.Fragment key={m.id}>
                    {showDay && <div className="text-center text-xs font-medium text-slate-500 py-2">{formatDayLong(m.timestamp)}</div>}
                    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${mine ? 'bg-brand-600 text-white rounded-br-md' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md'}`}>
                        <p className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
                        <p className={`mt-1 text-xs flex items-center justify-end gap-1 ${mine ? 'text-brand-100' : 'text-slate-400'}`}>
                          {formatTime(m.timestamp)}
                          {mine && <span>· {m.read ? 'gelesen' : 'gesendet'}</span>}
                        </p>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="p-3 sm:p-4 bg-white border-t border-slate-200">
              {!user.emailVerified && <Notice kind="warn" className="mb-3">Bitte bestätigen Sie Ihre E-Mail-Adresse, um antworten zu können.</Notice>}
              <div className="flex items-end gap-2">
                <label htmlFor="chat-input" className="sr-only">Nachricht schreiben</label>
                <textarea
                  id="chat-input"
                  rows={1}
                  maxLength={4000}
                  value={text}
                  disabled={!user.emailVerified}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleSubmit();
                    }
                  }}
                  placeholder="Nachricht schreiben …"
                  className="input resize-none max-h-40 [field-sizing:content]"
                />
                <button type="submit" disabled={!text.trim() || sending || !user.emailVerified} className="btn btn-primary !px-3.5" aria-label="Senden">
                  <Icon name="send" className="w-5 h-5 rotate-90" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState icon="chat" title="Unterhaltung auswählen">Wählen Sie links eine Unterhaltung aus.</EmptyState>
          </div>
        )}
      </section>

      {shareOpen && active && (
        <Modal
          title="Kontaktdaten senden?"
          onClose={() => setShareOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShareOpen(false)}>Abbrechen</button>
              <button className="btn btn-primary" onClick={shareContact}>Jetzt senden</button>
            </>
          }
        >
          <p className="text-slate-600">
            <strong>{active.partnerName}</strong> erhält diese Angaben als Nachricht:
          </p>
          <ul className="mt-3 text-sm text-slate-800 space-y-1">
            <li>Name: {user.name}</li>
            <li>E-Mail: {user.email}</li>
            {user.phone && <li>Telefon: {user.phone}</li>}
          </ul>
        </Modal>
      )}
    </div>
  );
};

export default Messaging;

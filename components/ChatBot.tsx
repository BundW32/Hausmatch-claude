import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { askAssistant, ChatTurn } from '../services/api';
import { Icon } from './ui/Icon';

const DISCLAIMER = 'Allgemeine Information, keine Rechts- oder Steuerberatung.';
const GREETING: ChatTurn = {
  role: 'assistant',
  text: 'Hallo! Ich bin der HausMatch-Assistent. Ich beantworte allgemeine Fragen zu Hausverwaltung, Mietrecht, WEG und Finanzierung. Was möchten Sie wissen?',
};
const SUGGESTIONS = ['Was kostet eine Hausverwaltung?', 'Wie berechne ich die Rendite?', 'Was muss ich bei einer Mieterhöhung beachten?'];

/** Schwebender KI-Assistent. Der API-Schlüssel liegt ausschließlich auf dem Server (/api/chat). */
const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [open, turns, loading]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || loading) return;
    const history = turns.slice(1); // Begrüßung nicht mitsenden
    setTurns(t => [...t, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const reply = await askAssistant(history, text);
      setTurns(t => [...t, { role: 'assistant', text: reply }]);
    } catch (err: any) {
      const msg =
        err?.status === 429
          ? 'Es wurden gerade sehr viele Fragen gestellt. Bitte versuchen Sie es in ein paar Minuten erneut.'
          : 'Der Assistent ist im Moment nicht erreichbar. Bitte versuchen Sie es später erneut oder stellen Sie Ihre Frage im Forum.';
      setTurns(t => [...t, { role: 'assistant', text: msg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 w-12 h-12 sm:w-14 sm:h-14 bg-brand-600 text-white rounded-full shadow-lg hover:bg-brand-700 transition-colors flex items-center justify-center"
        aria-label={open ? 'Assistent schließen' : 'KI-Assistent öffnen'}
        aria-expanded={open}
      >
        <Icon name={open ? 'x' : 'chat'} className="w-6 h-6" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="HausMatch-Assistent"
          className="fixed z-40 inset-x-3 bottom-20 sm:inset-x-auto sm:right-6 sm:bottom-24 sm:w-96 max-h-[min(70dvh,34rem)] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in-up"
        >
          <div className="bg-brand-600 text-white px-4 py-3 flex items-center gap-3">
            <span className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"><Icon name="sparkles" /></span>
            <div className="flex-1">
              <div className="font-bold text-sm">HausMatch-Assistent</div>
              <div className="text-xs text-brand-100">KI-gestützt · {DISCLAIMER}</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Assistent schließen" className="p-1 rounded-lg hover:bg-white/15"><Icon name="x" /></button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 min-h-0" aria-live="polite">
            {turns.map((t, i) => (
              <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${t.role === 'user' ? 'bg-brand-600 text-white rounded-br-md' : 'bg-slate-100 text-slate-800 rounded-bl-md'}`}>
                  {t.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start" role="status" aria-label="Antwort wird geschrieben">
                <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-bl-md flex gap-1.5">
                  {[0, 150, 300].map(d => <span key={d} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                </div>
              </div>
            )}
            {turns.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)} className="text-sm text-left bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-full hover:border-brand-400 hover:text-brand-700">{s}</button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={e => {
              e.preventDefault();
              void send(input);
            }}
            className="border-t border-slate-200 p-3"
          >
            <div className="flex gap-2">
              <label htmlFor="assistant-input" className="sr-only">Ihre Frage</label>
              <input id="assistant-input" ref={inputRef} className="input" maxLength={1500} value={input} onChange={e => setInput(e.target.value)} placeholder="Frage stellen …" disabled={loading} />
              <button type="submit" disabled={!input.trim() || loading} className="btn btn-primary !px-3.5" aria-label="Frage senden"><Icon name="send" className="w-5 h-5 rotate-90" /></button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Ihre Eingaben werden zur Beantwortung an Google Gemini übermittelt. Bitte keine personenbezogenen Daten eingeben.{' '}
              <Link to="/legal/privacy" className="underline underline-offset-2">Datenschutz</Link>
            </p>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatBot;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchBlog } from '../services/api';
import { sendContactMessage } from '../services/dataService';
import { useAuth } from '../services/auth';
import { BlogArticle } from '../types';
import { EmptyState, Field, LoadingBlock, Notice, PageHeader } from './ui/Bits';
import { Icon, Spinner } from './ui/Icon';
import { errorText } from './ui/Toast';

const httpsUrl = (raw: string) => {
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null;
  } catch {
    return null;
  }
};

export const AboutPage: React.FC = () => (
  <>
  <PageHeader eyebrow="Über uns" title="Eigentümer und Verwaltungen zusammenbringen" width="max-w-3xl" />
  <div className="page max-w-3xl">
    <div className="prose-hm">
      <p>
        Die passende Hausverwaltung zu finden, ist für viele Eigentümer und Eigentümergemeinschaften mühsam: Der Markt ist unübersichtlich,
        Angebote sind schwer vergleichbar, und gute Verwaltungen haben oft keine freien Kapazitäten. HausMatch macht diese Suche einfacher.
      </p>
      <p>
        Eigentümer beschreiben ihr Objekt in wenigen Schritten. Hausverwaltungen hinterlegen, in welchen Städten sie arbeiten und welche
        Objekte sie übernehmen. Daraus entsteht eine nachvollziehbare Trefferliste – und der erste Kontakt läuft über das Postfach, ohne dass
        Kontaktdaten ungefragt weitergegeben werden.
      </p>
      <h2>Wer hinter HausMatch steht</h2>
      <p>
        HausMatch ist ein Angebot der B&amp;W Immobilien Management UG (haftungsbeschränkt) aus Gladbeck. Wir kennen den Verwaltungsalltag aus
        eigener Praxis.
      </p>
    </div>
    <div className="mt-8 flex flex-col sm:flex-row gap-2">
      <Link to="/wizard" className="btn btn-primary">Verwaltung finden <Icon name="arrowRight" className="w-4 h-4" /></Link>
      <Link to="/managers" className="btn btn-secondary">Für Hausverwaltungen</Link>
      <Link to="/contact" className="btn btn-ghost">Kontakt</Link>
    </div>
  </div>
  </>
);

export const BlogPage: React.FC = () => {
  const [articles, setArticles] = useState<BlogArticle[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchBlog()
      .then(setArticles)
      .catch(() => setFailed(true));
  }, []);

  return (
    <>
    <PageHeader eyebrow="Branchen-News" title="Aktuelles für Eigentümer und Verwaltungen" width="max-w-3xl">
      Automatisch erstellte Zusammenfassungen aktueller Meldungen (KI, mit Websuche). Bitte prüfen Sie wichtige Angaben in den verlinkten Quellen.
    </PageHeader>
    <div className="page max-w-3xl">
      <div>
        {!failed && articles === null && <LoadingBlock label="Meldungen werden geladen …" />}
        {(failed || (articles && articles.length === 0)) && (
          <div className="card">
            <EmptyState icon="book" title="Im Moment sind keine Meldungen verfügbar" action={<Link to="/ratgeber" className="btn btn-primary">Zum Ratgeber</Link>}>
              Schauen Sie später noch einmal vorbei – oder lesen Sie in unserem Ratgeber weiter.
            </EmptyState>
          </div>
        )}
        <ul className="space-y-4">
          {(articles || []).map(a => {
            const isOpen = open === a.id;
            const sources = (a.sources || []).map(s => ({ ...s, href: httpsUrl(s.url) })).filter(s => s.href);
            return (
              <li key={a.id} className="card p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="badge badge-brand">{a.category}</span>
                  <span>{a.date}</span>
                </div>
                <h2 className="mt-2 text-lg font-bold text-slate-900">{a.title}</h2>
                <p className="mt-2 text-slate-700">{a.summary}</p>
                {isOpen && <p className="mt-3 text-slate-700 whitespace-pre-wrap leading-relaxed">{a.fullContent}</p>}
                {a.fullContent && (
                  <button className="mt-3 text-sm font-semibold text-brand-700 underline underline-offset-2" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : a.id)}>
                    {isOpen ? 'Weniger anzeigen' : 'Weiterlesen'}
                  </button>
                )}
                {sources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Quellen</h3>
                    <ul className="space-y-1 text-sm">
                      {sources.map(s => (
                        <li key={s.href}>
                          <a href={s.href!} target="_blank" rel="noopener noreferrer nofollow" className="text-brand-700 underline underline-offset-2 inline-flex items-center gap-1 break-all">
                            {s.title || s.href} <Icon name="external" className="w-3.5 h-3.5" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
    </>
  );
};

export const ContactPage: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user) {
      setName(n => n || user.name);
      setEmail(e => e || user.email);
    }
  }, [user?.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email.trim()) || message.trim().length < 10) {
      setError('Bitte füllen Sie alle Felder aus (gültige E-Mail-Adresse, Nachricht mit mindestens 10 Zeichen).');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await sendContactMessage({ name, email, message });
      setSent(true);
    } catch (err) {
      setError(errorText(err, 'Die Nachricht konnte nicht gesendet werden. Bitte schreiben Sie uns direkt per E-Mail.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
    <PageHeader eyebrow="Kontakt" title="Wir sind für Sie da" width="max-w-4xl" />
    <div className="page max-w-4xl">
      <div className="grid md:grid-cols-5 gap-6">
        <div className="md:col-span-3 card p-5 sm:p-6">
          {sent ? (
            <Notice kind="success">
              <p className="font-semibold">Vielen Dank – Ihre Nachricht ist bei uns eingegangen.</p>
              <p className="mt-1">Wir melden uns so bald wie möglich bei Ihnen.</p>
            </Notice>
          ) : (
            <form onSubmit={submit} className="space-y-4" noValidate>
              {error && <Notice kind="error">{error}</Notice>}
              <Field label="Ihr Name" htmlFor="ct-name">
                <input id="ct-name" className="input" maxLength={120} autoComplete="name" value={name} onChange={e => setName(e.target.value)} />
              </Field>
              <Field label="E-Mail-Adresse" htmlFor="ct-email">
                <input id="ct-email" type="email" className="input" maxLength={200} autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
              </Field>
              <Field label="Ihre Nachricht" htmlFor="ct-message">
                <textarea id="ct-message" className="input min-h-36 resize-y" maxLength={4000} value={message} onChange={e => setMessage(e.target.value)} />
              </Field>
              <p className="text-sm text-slate-500">
                Wir verwenden Ihre Angaben ausschließlich zur Bearbeitung Ihrer Anfrage. Mehr in der <Link to="/legal/privacy" className="text-brand-700 underline underline-offset-2">Datenschutzerklärung</Link>.
              </p>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy && <Spinner className="w-4 h-4" />} Nachricht senden</button>
            </form>
          )}
        </div>
        <aside className="md:col-span-2 card p-5 sm:p-6 h-fit">
          <h2 className="section-title">Direkter Kontakt</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            <li className="flex items-start gap-2.5"><Icon name="building" className="w-4 h-4 mt-0.5 text-slate-400" /><span>B&amp;W Immobilien Management UG (haftungsbeschränkt)<br />Goethestraße 42<br />45964 Gladbeck</span></li>
            <li className="flex items-center gap-2.5"><Icon name="phone" className="w-4 h-4 text-slate-400" /><a href="tel:+4915129468127" className="hover:text-brand-700">+49 151 29468127</a></li>
            <li className="flex items-center gap-2.5"><Icon name="mail" className="w-4 h-4 text-slate-400" /><a href="mailto:info@bundwimmobilien.de" className="text-brand-700 underline underline-offset-2">info@bundwimmobilien.de</a></li>
          </ul>
        </aside>
      </div>
    </div>
    </>
  );
};

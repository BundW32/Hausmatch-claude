import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon, IconName } from './ui/Icon';

// Aufbau nach dem 11-Elemente-Raster für Landingpages:
// Logo (Kopfzeile) · Titel + Untertitel · Haupt-CTA · Vertrauensbelege · Produktbild ·
// Vorteile · Kundenstimmen · FAQ · Abschluss-CTA · Kontakt/Rechtliches (Fußzeile).

const TRUST: { icon: IconName; text: string }[] = [
  { icon: 'building', text: 'Ein Angebot der B&W Immobilien Management aus Gladbeck' },
  { icon: 'badgeCheck', text: 'Erlaubnis nach § 34c GewO' },
  { icon: 'users', text: 'Mitglied im VDIV Deutschland' },
];

const BENEFITS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'badgeCheck', title: 'Kostenlos für Eigentümer', text: 'Anfrage, Trefferliste und Postfach kosten Sie nichts – ohne Abo und ohne versteckte Gebühren.' },
  { icon: 'shield', title: 'Anonym anfragen', text: 'Verwaltungen sehen Stadt, Objektart und Ihre Beschreibung, aber weder Namen noch E-Mail oder Telefon.' },
  { icon: 'search', title: 'Nachvollziehbare Treffer', text: 'Jeder Treffer zeigt, warum er passt: Einsatzgebiet, Objektart und Objektgröße laut Profil der Verwaltung.' },
  { icon: 'clock', title: 'In zwei Minuten gestellt', text: 'Vier kurze Schritte, kein Fachwissen nötig. Ihre Eingaben bleiben erhalten, auch wenn Sie sich erst registrieren.' },
  { icon: 'inbox', title: 'Alles an einem Ort', text: 'Antworten der Verwaltungen landen in Ihrem Postfach. Kontaktdaten senden Sie erst, wenn Sie es möchten.' },
  { icon: 'check', title: 'Jederzeit beenden', text: 'Anfrage schließen oder löschen, Konto entfernen – das erledigen Sie selbst mit einem Klick.' },
];

const STEPS: { title: string; text: string }[] = [
  { title: 'Objekt beschreiben', text: 'Stadt, Größe und Art des Objekts sowie Ihr Anliegen.' },
  { title: 'Passende Verwaltungen sehen', text: 'Sortiert nach Übereinstimmung, mit Begründung zu jedem Treffer.' },
  { title: 'Direkt Kontakt aufnehmen', text: 'Sie schreiben über das Postfach – oder die Verwaltung meldet sich bei Ihnen.' },
];

/**
 * Kundenstimmen: bewusst leer, bis echte, freigegebene Stimmen vorliegen.
 * Eintrag ergänzen – der Abschnitt erscheint dann automatisch. Bitte keine erfundenen Zitate.
 */
const TESTIMONIALS: { quote: string; name: string; role: string }[] = [];

const FAQ: { q: string; a: string }[] = [
  { q: 'Was kostet HausMatch für Eigentümer?', a: 'Nichts. Anfrage, Trefferliste und Postfach sind für Eigentümer und Eigentümergemeinschaften kostenlos.' },
  { q: 'Wer sieht meine Anfrage?', a: 'Registrierte Hausverwaltungen sehen Stadt, Objektart, Größe und Ihre Beschreibung – aber weder Ihren Namen noch Ihre Kontaktdaten. Diese senden Sie im Postfach nur an Verwaltungen, die Sie interessieren.' },
  { q: 'Wie entsteht die Reihenfolge der Treffer?', a: 'Aus den Angaben der Verwaltungen: Arbeiten sie in Ihrer Stadt, verwalten sie Ihre Objektart und übernehmen sie Objekte Ihrer Größe? Jeder Treffer nennt die Gründe. Es gibt keine bezahlten Platzierungen.' },
  { q: 'Sind die Hausverwaltungen geprüft?', a: 'Die Profilangaben stammen von den Verwaltungen selbst. Profile, die wir zusätzlich geprüft haben, tragen das Kennzeichen „Von HausMatch geprüft“.' },
  { q: 'Was, wenn es in meiner Stadt noch keine Verwaltung gibt?', a: 'Ihre Anfrage bleibt aktiv. Verwaltungen, die sich später registrieren oder überregional arbeiten, können sich bei Ihnen melden.' },
  { q: 'Kann ich meine Daten wieder löschen?', a: 'Ja. Anfragen löschen Sie unter „Meine Anfragen“, Ihr gesamtes Konto im Profil unter „Konto löschen“.' },
  { q: 'Ich bin Hausverwaltung – was kostet die Teilnahme?', a: 'Die Nutzung ist derzeit kostenlos. Sie registrieren sich, hinterlegen Einsatzgebiete und Objektarten und sehen passende Anfragen im Lead-Center.' },
];

/** Beispielhafte Trefferkarte – zeigt, was Eigentümer nach der Anfrage sehen. */
const ProductPreview = () => (
  <figure className="w-full max-w-md mx-auto lg:mx-0">
    <div className="card p-5 sm:p-6 shadow-xl">
      <div className="flex items-start gap-4">
        <span className="w-14 h-14 rounded-full bg-brand-50 border border-slate-200 text-brand-700 font-bold text-xl flex items-center justify-center shrink-0" aria-hidden="true">B</span>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-slate-900">Beispiel-Verwaltung GmbH</p>
          <p className="text-sm text-slate-500 flex items-center gap-1"><Icon name="pin" className="w-4 h-4" /> Gladbeck</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-extrabold text-brand-700 leading-none">100 %</p>
          <p className="text-xs text-slate-500 mt-1">Übereinstimmung</p>
        </div>
      </div>
      <ul className="mt-4 space-y-1.5 text-sm text-slate-700">
        {['Betreut Objekte in Essen', 'Verwaltet WEGs', 'Übernimmt Objekte mit 12 Einheiten'].map(r => (
          <li key={r} className="flex items-start gap-2"><Icon name="check" className="w-4 h-4 mt-0.5 text-green-600" /> {r}</li>
        ))}
      </ul>
      <div className="mt-5 flex gap-2" aria-hidden="true">
        <span className="btn btn-primary btn-sm">Nachricht schreiben</span>
        <span className="btn btn-secondary btn-sm">Profil ansehen</span>
      </div>
    </div>
    <figcaption className="mt-3 text-sm text-slate-500 text-center lg:text-left">Beispiel: So sieht ein Treffer für eine WEG mit 12 Einheiten in Essen aus.</figcaption>
  </figure>
);

const LandingHome = () => {
  const [city, setCity] = useState('');
  const navigate = useNavigate();

  // Strukturierte Daten für Suchmaschinen (FAQ)
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    });
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  const start = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(city.trim() ? `/wizard?city=${encodeURIComponent(city.trim())}` : '/wizard');
  };

  return (
    <article className="bg-white">
      {/* Hero: Titel, Untertitel, Haupt-CTA, Vertrauensbelege, Produktbild */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50 to-white" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-14 md:pt-20 md:pb-20 grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-14 items-center">
          <div className="text-center lg:text-left">
            <p className="eyebrow">Für Eigentümer und Eigentümergemeinschaften</p>
            <h1 className="mt-3 text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight text-slate-900 leading-[1.08]">
              Hausverwaltung finden, <span className="text-brand-600">die zu Ihrem Objekt passt</span>
            </h1>
            <p className="mt-5 text-lg text-slate-600 max-w-xl mx-auto lg:mx-0">
              Beschreiben Sie Ihre WEG, Ihr Mietshaus oder Ihre Gewerbeimmobilie und sehen Sie, welche Verwaltungen in Ihrer Stadt dazu passen. Kostenlos und ohne dass Ihre Kontaktdaten weitergegeben werden.
            </p>

            <form onSubmit={start} className="mt-7 max-w-xl mx-auto lg:mx-0 flex flex-col sm:flex-row gap-2 p-2 bg-white rounded-2xl shadow-lg border border-slate-200">
              <div className="relative flex-1">
                <label htmlFor="city-input" className="sr-only">Stadt des Objekts</label>
                <Icon name="pin" className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="city-input"
                  name="city"
                  autoComplete="address-level2"
                  className="w-full h-13 rounded-xl pl-12 pr-4 text-base text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none focus:ring-2 focus:ring-brand-100"
                  placeholder="In welcher Stadt liegt Ihr Objekt?"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-lg">
                Verwaltung finden <Icon name="arrowRight" className="w-4 h-4" />
              </button>
            </form>
            <p className="mt-3 text-sm text-slate-500">Dauert etwa zwei Minuten. Keine Kreditkarte, kein Abo.</p>

            <ul className="mt-7 flex flex-col sm:flex-row sm:flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-slate-600" aria-label="Über den Anbieter">
              {TRUST.map(t => (
                <li key={t.text} className="flex items-center justify-center lg:justify-start gap-2"><Icon name={t.icon} className="w-4 h-4 text-brand-600" /> {t.text}</li>
              ))}
            </ul>
          </div>

          <ProductPreview />
        </div>
      </section>

      {/* Vorteile */}
      <section className="border-y border-slate-200 bg-slate-50" aria-labelledby="vorteile">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="max-w-2xl">
            <p className="eyebrow">Ihre Vorteile</p>
            <h2 id="vorteile" className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">Die Verwaltersuche, wie sie sein sollte</h2>
          </div>
          <ul className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENEFITS.map(b => (
              <li key={b.title} className="card p-6">
                <span className="w-11 h-11 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center"><Icon name={b.icon} className="w-5 h-5" /></span>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{b.title}</h3>
                <p className="mt-1.5 text-slate-600">{b.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Ablauf */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20" aria-labelledby="ablauf">
        <h2 id="ablauf" className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 text-center">In drei Schritten zur passenden Verwaltung</h2>
        <ol className="mt-10 grid md:grid-cols-3 gap-8">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex md:flex-col items-start md:items-center md:text-center gap-4">
              <span className="w-11 h-11 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="mt-1 text-slate-600">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Kundenstimmen – erscheinen erst, wenn echte Stimmen hinterlegt sind */}
      {TESTIMONIALS.length > 0 && (
        <section className="border-t border-slate-200 bg-slate-50" aria-labelledby="stimmen">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
            <h2 id="stimmen" className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 text-center">Das sagen Eigentümer und Verwaltungen</h2>
            <ul className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TESTIMONIALS.map(t => (
                <li key={t.name} className="card p-6 flex flex-col">
                  <blockquote className="text-slate-700 flex-1">„{t.quote}“</blockquote>
                  <p className="mt-4 text-sm"><span className="font-semibold text-slate-900">{t.name}</span><span className="text-slate-500"> · {t.role}</span></p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Für Verwaltungen */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 md:pb-20">
        <div className="rounded-3xl bg-slate-900 text-white p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">Für Hausverwaltungen</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight">Anfragen aus Ihrer Region statt Kaltakquise</h2>
            <p className="mt-3 text-slate-300">
              Hinterlegen Sie, wo Sie arbeiten und welche Objekte Sie übernehmen. Passende Anfragen von Eigentümern erscheinen in Ihrem Lead-Center.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row md:justify-end gap-3">
            <Link to="/managers" className="btn btn-lg bg-white text-slate-900 hover:bg-slate-100">Mehr erfahren</Link>
            <Link to="/register" className="btn btn-lg btn-primary">Kostenlos registrieren</Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-200 bg-slate-50" aria-labelledby="faq">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 md:py-20">
          <h2 id="faq" className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 text-center">Häufige Fragen</h2>
          <div className="mt-8 card divide-y divide-slate-200">
            {FAQ.map(f => (
              <details key={f.q} className="group p-5">
                <summary className="flex items-center justify-between gap-4 font-semibold text-slate-900 list-none [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <Icon name="plus" className="w-5 h-5 text-slate-400 transition-transform group-open:rotate-45" />
                </summary>
                <p className="mt-3 text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-slate-600">
            Weitere Fragen? <Link to="/contact" className="text-brand-700 underline underline-offset-2 font-medium">Schreiben Sie uns</Link> oder lesen Sie im{' '}
            <Link to="/ratgeber" className="text-brand-700 underline underline-offset-2 font-medium">Ratgeber</Link> weiter.
          </p>
        </div>
      </section>

      {/* Abschluss-CTA */}
      <section className="bg-brand-600 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 md:py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Finden Sie jetzt die passende Hausverwaltung</h2>
          <p className="mt-3 text-brand-50">Kostenlos, anonym und in etwa zwei Minuten erledigt.</p>
          <div className="mt-7 flex flex-col sm:flex-row justify-center gap-3">
            <Link to="/wizard" className="btn btn-lg bg-white text-brand-700 hover:bg-brand-50">Objekt beschreiben <Icon name="arrowRight" className="w-4 h-4" /></Link>
            <Link to="/network" className="btn btn-lg bg-brand-700 text-white hover:bg-brand-800">Verwaltungen ansehen</Link>
          </div>
        </div>
      </section>
    </article>
  );
};

export default LandingHome;

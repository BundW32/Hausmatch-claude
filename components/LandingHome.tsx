import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon, IconName } from './ui/Icon';

const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'building', title: 'Objekt beschreiben', text: 'Stadt, Größe und Art des Objekts – in etwa zwei Minuten, ohne Fachwissen.' },
  { icon: 'search', title: 'Passende Verwaltungen sehen', text: 'Sie sehen, welche Verwaltungen in Ihrer Stadt arbeiten und Objekte wie Ihres übernehmen – mit Begründung.' },
  { icon: 'mail', title: 'Direkt Kontakt aufnehmen', text: 'Sie schreiben über das Postfach. Ihre Kontaktdaten geben Sie erst frei, wenn Sie es möchten.' },
];

const TOOLS: { icon: IconName; title: string; text: string; to: string; cta: string }[] = [
  { icon: 'users', title: 'Netzwerk', text: 'Profile von Hausverwaltungen ansehen und sich vernetzen.', to: '/network', cta: 'Zum Netzwerk' },
  { icon: 'chat', title: 'Forum', text: 'Fragen stellen und Erfahrungen mit anderen teilen.', to: '/forum', cta: 'Zum Forum' },
  { icon: 'calculator', title: 'Kreditrechner', text: 'Rate, Kaufnebenkosten und Rendite durchrechnen.', to: '/kreditrechner', cta: 'Zum Rechner' },
  { icon: 'book', title: 'Ratgeber', text: 'Kompaktes Wissen zu WEG, Mietrecht und Finanzierung.', to: '/ratgeber', cta: 'Zum Ratgeber' },
];

const LandingHome = () => {
  const [city, setCity] = useState('');
  const navigate = useNavigate();

  const start = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(city.trim() ? `/wizard?city=${encodeURIComponent(city.trim())}` : '/wizard');
  };

  return (
    <article className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50 to-white" aria-hidden="true" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-14 pb-16 md:pt-24 md:pb-24 text-center">
          <p className="eyebrow">Für Eigentümer und Eigentümergemeinschaften</p>
          <h1 className="mt-3 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.08]">
            Die passende Hausverwaltung <span className="text-brand-600">für Ihr Objekt</span>
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto">
            Beschreiben Sie Ihr Objekt und sehen Sie, welche Verwaltungen in Ihrer Stadt dazu passen. Kostenlos und ohne dass Ihre Kontaktdaten weitergegeben werden.
          </p>

          <form onSubmit={start} className="mt-8 max-w-xl mx-auto flex flex-col sm:flex-row gap-2 p-2 bg-white rounded-2xl shadow-lg border border-slate-200">
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

          <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-600">
            {['Kostenlos für Eigentümer', 'Anfrage ohne Namen sichtbar', 'Kontakt nur, wenn Sie es wollen'].map(t => (
              <li key={t} className="flex items-center gap-1.5"><Icon name="check" className="w-4 h-4 text-brand-600" /> {t}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* So funktioniert es */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 text-center">So funktioniert HausMatch</h2>
          <ol className="mt-10 grid md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <li key={s.title} className="card p-6">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-xl bg-brand-600 text-white flex items-center justify-center"><Icon name={s.icon} className="w-5 h-5" /></span>
                  <span className="text-sm font-semibold text-brand-700">Schritt {i + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="mt-1.5 text-slate-600">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Für Verwaltungen */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
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

      {/* Werkzeuge */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">Außerdem auf HausMatch</h2>
        <ul className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TOOLS.map(t => (
            <li key={t.to}>
              <Link to={t.to} className="card card-hover p-5 h-full flex flex-col group">
                <span className="w-11 h-11 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center"><Icon name={t.icon} className="w-5 h-5" /></span>
                <span className="mt-4 text-base font-bold text-slate-900">{t.title}</span>
                <span className="mt-1 text-sm text-slate-600 flex-1">{t.text}</span>
                <span className="mt-4 text-sm font-semibold text-brand-700 inline-flex items-center gap-1">
                  {t.cta} <Icon name="arrowRight" className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
};

export default LandingHome;

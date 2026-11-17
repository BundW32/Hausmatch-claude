import { Link } from 'react-router-dom';
import { Icon, IconName } from './ui/Icon';

const POINTS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'shield', title: 'Ihre Daten bleiben bei Ihnen', text: 'Verwaltungen sehen Ihre Anfrage ohne Namen, E-Mail oder Telefonnummer. Sie entscheiden, wem Sie Ihre Kontaktdaten senden.' },
  { icon: 'search', title: 'Nachvollziehbare Treffer', text: 'Die Reihenfolge ergibt sich aus Einsatzgebiet, Objektart und Objektgröße der Verwaltungen – und wird bei jedem Treffer begründet.' },
  { icon: 'mail', title: 'Alles an einem Ort', text: 'Antworten der Verwaltungen landen in Ihrem Postfach. Ihre Anfrage können Sie jederzeit schließen oder löschen.' },
];

const FAQ = [
  { q: 'Was kostet HausMatch für Eigentümer?', a: 'Nichts. Anfrage, Suche und Postfach sind für Eigentümer kostenlos.' },
  { q: 'Wer sieht meine Anfrage?', a: 'Registrierte Hausverwaltungen sehen Stadt, Objektart, Größe und Ihre Beschreibung – aber weder Ihren Namen noch Ihre Kontaktdaten.' },
  { q: 'Sind die Verwaltungen geprüft?', a: 'Die Angaben in den Profilen stammen von den Verwaltungen selbst. Profile, die wir zusätzlich geprüft haben, sind als „Von HausMatch geprüft“ gekennzeichnet.' },
  { q: 'Was passiert, wenn es in meiner Stadt noch keine Verwaltung gibt?', a: 'Ihre Anfrage bleibt aktiv. Verwaltungen, die sich später registrieren oder überregional arbeiten, können sich bei Ihnen melden.' },
];

const ForSeekers = () => (
  <div className="page max-w-5xl">
    <header className="max-w-3xl">
      <p className="eyebrow">Für Eigentümer</p>
      <h1 className="page-title mt-1">In wenigen Minuten zur passenden Hausverwaltung</h1>
      <p className="mt-3 text-lg text-slate-600">
        Ob WEG, Mietshaus oder Gewerbe: Beschreiben Sie Ihr Objekt einmal und sehen Sie, welche Verwaltungen dafür infrage kommen.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-2">
        <Link to="/wizard" className="btn btn-primary btn-lg">Objekt beschreiben <Icon name="arrowRight" className="w-4 h-4" /></Link>
        <Link to="/network" className="btn btn-secondary btn-lg">Verwaltungen ansehen</Link>
      </div>
    </header>

    <ul className="mt-12 grid md:grid-cols-3 gap-4">
      {POINTS.map(p => (
        <li key={p.title} className="card p-6">
          <span className="w-11 h-11 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center"><Icon name={p.icon} className="w-5 h-5" /></span>
          <h2 className="mt-4 text-lg font-bold text-slate-900">{p.title}</h2>
          <p className="mt-1.5 text-slate-600">{p.text}</p>
        </li>
      ))}
    </ul>

    <section className="mt-14 max-w-3xl">
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Häufige Fragen</h2>
      <div className="mt-5 card divide-y divide-slate-200">
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
    </section>
  </div>
);

export default ForSeekers;

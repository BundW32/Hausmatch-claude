import { Link } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { Icon, IconName } from './ui/Icon';

const POINTS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'pin', title: 'Anfragen aus Ihrem Einsatzgebiet', text: 'Sie legen fest, in welchen Städten Sie arbeiten, welche Objektarten Sie verwalten und ab welcher Größe. Passende Anfragen werden im Lead-Center markiert.' },
  { icon: 'inbox', title: 'Übersichtliches Lead-Center', text: 'Neu, kontaktiert, archiviert: Ihr Bearbeitungsstand gehört nur Ihnen. Zu jeder Anfrage gibt es eine automatische Kurzeinschätzung.' },
  { icon: 'mail', title: 'Erstkontakt über das Postfach', text: 'Sie schreiben den Eigentümer direkt an. Namen und Kontaktdaten gibt der Eigentümer frei, sobald er Interesse hat.' },
];

const STEPS = [
  'Kostenlos registrieren und E-Mail-Adresse bestätigen',
  'Profil ausfüllen: Einsatzgebiete, Objektarten, Objektgröße',
  'Anfragen im Lead-Center ansehen und Eigentümer anschreiben',
];

const ForManagers = () => {
  const { user } = useAuth();
  const cta = user?.role === 'manager' ? { to: '/dashboard', label: 'Zum Lead-Center' } : { to: '/register', label: 'Kostenlos registrieren' };
  return (
    <div>
      <section className="bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">Für Hausverwaltungen</p>
          <h1 className="mt-2 text-3xl md:text-5xl font-extrabold tracking-tight max-w-3xl">Neue Mandate von Eigentümern, die aktiv suchen</h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl">
            Auf HausMatch beschreiben Eigentümer ihr Objekt und suchen eine Verwaltung. Sie sehen die Anfragen aus Ihrer Region und melden sich, wenn es passt.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Link to={cta.to} className="btn btn-primary btn-lg">{cta.label} <Icon name="arrowRight" className="w-4 h-4" /></Link>
            <Link to="/contact" className="btn btn-lg bg-white/10 text-white hover:bg-white/20">Fragen? Kontakt</Link>
          </div>
          <p className="mt-4 text-sm text-slate-400">Die Nutzung ist derzeit kostenlos.</p>
        </div>
      </section>

      <div className="page max-w-5xl">
        <ul className="grid md:grid-cols-3 gap-4">
          {POINTS.map(p => (
            <li key={p.title} className="card p-6">
              <span className="w-11 h-11 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center"><Icon name={p.icon} className="w-5 h-5" /></span>
              <h2 className="mt-4 text-lg font-bold text-slate-900">{p.title}</h2>
              <p className="mt-1.5 text-slate-600">{p.text}</p>
            </li>
          ))}
        </ul>

        <section className="mt-14 grid md:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">In drei Schritten startklar</h2>
            <ol className="mt-5 space-y-4">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-full bg-brand-600 text-white text-sm font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <span className="pt-1 text-slate-700">{s}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="card p-6 bg-brand-50/60 border-brand-100">
            <h2 className="text-lg font-bold text-slate-900">Gut zu wissen</h2>
            <ul className="mt-3 space-y-2 text-slate-700">
              {[
                'Ihr Profil ist öffentlich sichtbar und erscheint in den Suchergebnissen der Eigentümer.',
                'Anfragen sehen Sie ohne Namen und Kontaktdaten – der Eigentümer gibt sie selbst frei.',
                'Das Kennzeichen „Von HausMatch geprüft“ vergeben wir nach einer gesonderten Prüfung.',
              ].map(t => (
                <li key={t} className="flex items-start gap-2"><Icon name="check" className="w-5 h-5 mt-0.5 text-brand-700" /> {t}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ForManagers;

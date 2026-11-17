import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from './ui/Icon';

// Startseite. Aufbau nach dem 11-Elemente-Raster für Landingpages:
// Logo (Kopfzeile) · Titel + Untertitel · Haupt-CTA · Vertrauensbelege · Produktbild (Match-Motiv) ·
// Vorteile · Kundenstimmen · FAQ · Abschluss-CTA · Kontakt/Rechtliches (Fußzeile).

const TRUST = [
  { label: 'Anbieter', value: 'B&W Immobilien Management, Gladbeck' },
  { label: 'Zulassung', value: 'Erlaubnis nach § 34c GewO' },
  { label: 'Verband', value: 'Mitglied im VDIV Deutschland' },
];

const STEPS = [
  { title: 'Objekt beschreiben', text: 'Stadt, Größe, Art des Objekts und was Ihnen an der neuen Verwaltung wichtig ist.' },
  { title: 'Treffer ansehen', text: 'Passende Verwaltungen, sortiert nach Übereinstimmung, jeweils mit den Gründen.' },
  { title: 'Ins Gespräch kommen', text: 'Sie schreiben über das Postfach. Namen und Kontaktdaten geben Sie frei, wenn es passt.' },
];

/**
 * Kundenstimmen: bewusst leer, bis echte, freigegebene Stimmen vorliegen.
 * Eintrag ergänzen – der Abschnitt erscheint dann automatisch. Bitte keine erfundenen Zitate.
 */
const TESTIMONIALS: { quote: string; name: string; role: string }[] = [];

const FAQ = [
  { q: 'Was kostet HausMatch für Eigentümer?', a: 'Nichts. Anfrage, Trefferliste und Postfach sind für Eigentümer und Eigentümergemeinschaften kostenlos.' },
  { q: 'Wer sieht meine Anfrage?', a: 'Registrierte Hausverwaltungen sehen Stadt, Objektart, Größe und Ihre Beschreibung, aber weder Ihren Namen noch Ihre Kontaktdaten. Diese senden Sie im Postfach nur an Verwaltungen, die Sie interessieren.' },
  { q: 'Wie entsteht die Reihenfolge der Treffer?', a: 'Aus den Angaben der Verwaltungen: Arbeiten sie in Ihrer Stadt, verwalten sie Ihre Objektart und übernehmen sie Objekte Ihrer Größe? Jeder Treffer nennt die Gründe. Es gibt keine bezahlten Platzierungen.' },
  { q: 'Sind die Hausverwaltungen geprüft?', a: 'Die Profilangaben stammen von den Verwaltungen selbst. Profile, die wir zusätzlich geprüft haben, tragen das Kennzeichen „Von HausMatch geprüft“.' },
  { q: 'Und wenn es in meiner Stadt noch keine Verwaltung gibt?', a: 'Ihre Anfrage bleibt aktiv. Verwaltungen, die sich später registrieren oder überregional arbeiten, können sich bei Ihnen melden.' },
  { q: 'Kann ich meine Daten wieder löschen?', a: 'Ja. Anfragen löschen Sie unter „Meine Anfragen“, Ihr gesamtes Konto im Profil unter „Konto löschen“.' },
  { q: 'Ich bin Hausverwaltung – was kostet die Teilnahme?', a: 'Die Nutzung ist derzeit kostenlos. Sie registrieren sich, hinterlegen Einsatzgebiete und Objektarten und sehen passende Anfragen im Lead-Center.' },
];

const Label: React.FC<{ children: React.ReactNode; light?: boolean }> = ({ children, light }) => (
  <p className={`font-mono text-xs uppercase tracking-[0.06em] ${light ? 'text-[#93b4ff]' : 'text-brand-700'}`}>{children}</p>
);

/** Stadtsuche – führt mit der eingegebenen Stadt ins Objekt-Formular. */
const CitySearch: React.FC<{ id: string; placeholder: string; dark?: boolean }> = ({ id, placeholder, dark }) => {
  const [city, setCity] = useState('');
  const navigate = useNavigate();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(city.trim() ? `/wizard?city=${encodeURIComponent(city.trim())}` : '/wizard');
  };
  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 p-2 bg-white rounded-2xl shadow-[0_24px_60px_-18px_rgba(0,8,40,0.7)]">
      <label htmlFor={id} className="sr-only">Stadt des Objekts</label>
      <input
        id={id}
        name="city"
        autoComplete="address-level2"
        className="flex-1 min-w-0 h-[54px] rounded-[10px] px-4 text-[17px] text-ink placeholder-slate-400 bg-transparent focus:outline-none focus:ring-2 focus:ring-brand-100"
        placeholder={placeholder}
        value={city}
        onChange={e => setCity(e.target.value)}
      />
      <button type="submit" className={`btn h-[54px] px-6 text-base rounded-[10px] ${dark ? 'btn-dark' : 'btn-primary'}`}>
        Verwaltung finden <Icon name="arrowRight" className="w-[18px] h-[18px]" />
      </button>
    </form>
  );
};

/** Das Bildmotiv der Seite: Anfrage und Treffer greifen ineinander. */
const MatchMotif = () => (
  <div role="img" aria-label="Beispiel: Eine Anfrage für eine WEG in Essen und die dazu passende Verwaltung mit 100 Prozent Übereinstimmung" className="relative w-full max-w-[540px] mx-auto flex flex-col sm:block sm:h-[580px]">
    <div className="sm:absolute sm:top-1 sm:left-0 sm:w-[66%] bg-white text-ink rounded-[18px] p-6 pb-10 sm:pb-6 sm:-rotate-[4deg] shadow-[0_30px_70px_-24px_rgba(0,8,40,0.75)]">
      <Label>Ihre Anfrage</Label>
      <p className="mt-2.5 font-display font-bold text-[30px] leading-[1.05] tracking-tight">WEG in Essen</p>
      <div className="mt-3.5 flex flex-wrap gap-1.5">
        {['12 Einheiten', 'Baujahr 1985', 'WEG-Verwaltung'].map(c => (
          <span key={c} className="px-2.5 py-1 rounded-full bg-tint text-[13px] font-medium text-brand-900">{c}</span>
        ))}
      </div>
      <p className="mt-3.5 sm:pr-24 text-sm leading-normal text-slate-600">„Unsere bisherige Verwaltung reagiert kaum noch, die Abrechnung steht aus.“</p>
    </div>

    <div className="relative z-10 -my-8 mx-auto sm:m-0 sm:absolute sm:top-1/2 sm:left-1/2 sm:-mt-[84px] sm:-ml-[62px] w-[148px] h-[148px] rounded-full bg-brand-600 border-[7px] border-navy flex flex-col items-center justify-center text-white shadow-[0_0_0_1px_rgba(255,255,255,0.28),0_22px_44px_-12px_rgba(0,8,40,0.8)]">
      <span className="font-display font-extrabold text-[44px] leading-none tracking-tight">100&nbsp;%</span>
      <span className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-brand-100">Match</span>
    </div>

    <div className="sm:absolute sm:bottom-1.5 sm:right-0 sm:w-[70%] bg-white text-ink rounded-[18px] p-6 pt-12 sm:pt-16 sm:rotate-[3deg] shadow-[0_30px_70px_-24px_rgba(0,8,40,0.75)]">
      <Label>Ihr Treffer</Label>
      <div className="mt-3 flex items-center gap-3">
        <span className="w-[46px] h-[46px] shrink-0 rounded-xl bg-navy text-white font-display font-bold text-xl flex items-center justify-center">B</span>
        <div className="min-w-0">
          <p className="font-semibold text-[17px] leading-tight">Beispiel-Verwaltung GmbH</p>
          <p className="text-sm text-slate-600">Gladbeck</p>
        </div>
      </div>
      <ul className="mt-4 pt-3.5 border-t border-slate-200 space-y-1.5 text-sm text-slate-700">
        {['Betreut Objekte in Essen', 'Verwaltet WEGs', 'Übernimmt 5 bis 60 Einheiten'].map(r => (
          <li key={r} className="flex items-center gap-2"><Icon name="check" className="w-4 h-4 text-brand-600" strokeWidth={3} /> {r}</li>
        ))}
      </ul>
    </div>
  </div>
);

const MatchRow: React.FC<{ name: string; reasons: string; score: number; strong?: boolean }> = ({ name, reasons, score, strong }) => (
  <div className="px-5 sm:px-6 py-5 flex items-center gap-4">
    <div className="flex-1 min-w-0">
      <p className="font-semibold">{name}</p>
      <p className="mt-0.5 text-sm text-slate-600">{reasons}</p>
    </div>
    <div className="w-24 sm:w-[120px] shrink-0">
      <div className={`font-display font-bold text-[30px] leading-none tracking-tight ${strong ? 'text-brand-600' : 'text-ink'}`}>{score}&nbsp;%</div>
      <div className="mt-2 h-1.5 rounded-full bg-slate-200"><div className={`h-full rounded-full ${strong ? 'bg-brand-600' : 'bg-ink'}`} style={{ width: `${score}%` }} /></div>
    </div>
  </div>
);

const LandingHome = () => {
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

  const wrap = 'max-w-[1216px] mx-auto px-4 sm:px-8';

  return (
    <article className="bg-white overflow-x-clip">
      {/* ------------------------------------------------------------ Startbereich */}
      <div className="bg-navy-grid text-white">
        <section className={`${wrap} pt-12 md:pt-16 grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-12 items-center`}>
          <div>
            <Label light>Für Eigentümer &amp; Eigentümergemeinschaften</Label>
            <h1 className="mt-5 display text-[clamp(2.75rem,7.1vw,5.75rem)] leading-[0.98]">
              Die Verwaltung, die zu Ihrem Haus <span className="text-[#8fb2ff] shadow-[inset_0_-0.12em_0_var(--color-brand-600)]">passt.</span>
            </h1>
            <p className="mt-7 text-lg sm:text-xl leading-relaxed text-[#d5e0ff] max-w-[500px]">
              Beschreiben Sie Ihr Objekt. HausMatch zeigt, welche Hausverwaltungen in Ihrer Stadt dafür infrage kommen – mit Begründung zu jedem Treffer.
            </p>
            <div className="mt-9 max-w-[520px]">
              <CitySearch id="city-input" placeholder="Stadt, z. B. Essen" />
            </div>
            <p className="mt-4 text-[15px] text-[#b3c5f5]">Kostenlos · etwa zwei Minuten · Ihre Kontaktdaten bleiben bei Ihnen</p>
          </div>
          <MatchMotif />
        </section>

        <div className={`${wrap} pt-14 md:pt-16`}>
          <dl className="border-t border-white/20 grid sm:grid-cols-3 gap-x-12" aria-label="Über den Anbieter">
            {TRUST.map(t => (
              <div key={t.label} className="pt-5 pb-5 sm:pb-8">
                <dt className="font-mono text-xs uppercase tracking-[0.06em] text-[#93b4ff]">{t.label}</dt>
                <dd className="mt-1.5 font-medium">{t.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* ------------------------------------------------------------------ Ablauf */}
      <section className={`${wrap} pt-24 md:pt-32`} aria-labelledby="ablauf">
        <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-4">
          <h2 id="ablauf" className="display-md max-w-[620px]">Drei Schritte. Keine Anrufe von Fremden.</h2>
          <p className="max-w-[360px] text-slate-600">Sie behalten die Kontrolle: Verwaltungen sehen Ihr Objekt, nicht Ihre Person.</p>
        </div>
        <ol className="mt-12 md:mt-14 grid md:grid-cols-3 gap-y-10">
          {STEPS.map((s, i) => (
            <li key={s.title} className="pr-10 border-t-2 border-ink">
              <span aria-hidden="true" className={`block mt-4 font-display font-extrabold text-[96px] md:text-[132px] leading-[0.9] tracking-[-0.05em] ${i === STEPS.length - 1 ? 'text-brand-600' : 'text-outline'}`}>0{i + 1}</span>
              <h3 className="mt-5 font-display text-[26px] font-bold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-slate-600 max-w-[300px]">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------------------------------------------------------------- Vorteile */}
      <section className={`${wrap} pt-24 md:pt-32`} aria-labelledby="vorteile">
        <Label>Was Sie davon haben</Label>
        <h2 id="vorteile" className="mt-3.5 display-md max-w-[760px]">Eine Verwaltersuche, bei der Sie sehen, was passiert.</h2>

        <div className="mt-10 md:mt-12 grid lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-tint rounded-[28px] px-6 pt-8 sm:px-10 sm:pt-10 flex flex-col gap-7 overflow-hidden">
            <div>
              <h3 className="font-display text-[28px] sm:text-[32px] leading-[1.08] font-bold tracking-tight">Treffer mit Begründung</h3>
              <p className="mt-2.5 text-slate-700 max-w-[460px]">Zu jeder Verwaltung steht, warum sie passt – und wo nicht. Es gibt keine bezahlten Plätze.</p>
            </div>
            <div className="mt-auto bg-white rounded-t-[18px] shadow-[0_30px_60px_-30px_rgba(10,31,99,0.5)] divide-y divide-slate-200" aria-hidden="true">
              <MatchRow name="Beispiel-Verwaltung GmbH" reasons="Betreut Essen · verwaltet WEGs · 5 bis 60 Einheiten" score={100} strong />
              <MatchRow name="Muster Hausverwaltung" reasons="Sitz in Essen · Schwerpunkt laut Profil: Mietshäuser" score={48} />
            </div>
          </div>

          <div className="lg:col-span-5 bg-navy text-white rounded-[28px] p-6 sm:p-10 flex flex-col gap-7">
            <div>
              <h3 className="font-display text-[28px] sm:text-[32px] leading-[1.08] font-bold tracking-tight">Anonym anfragen</h3>
              <p className="mt-2.5 text-[#d5e0ff]">Verwaltungen sehen Stadt, Objektart und Ihre Beschreibung. Alles andere bleibt verdeckt.</p>
            </div>
            <dl className="mt-auto space-y-3.5 font-mono text-[13px]" aria-hidden="true">
              <div className="flex items-center gap-3.5"><dt className="w-[74px] shrink-0 text-[#93b4ff]">Objekt</dt><dd>WEG · 12 Einheiten · Essen</dd></div>
              {[['Name', 'w-[62%]'], ['E-Mail', 'w-[84%]'], ['Telefon', 'w-[48%]']].map(([k, w]) => (
                <div key={k} className="flex items-center gap-3.5"><dt className="w-[74px] shrink-0 text-[#93b4ff]">{k}</dt><dd className="flex-1"><span className={`block ${w} h-3.5 rounded bg-white/20`} /></dd></div>
              ))}
            </dl>
          </div>

          <div className="lg:col-span-5 bg-brand-600 text-white rounded-[28px] p-6 sm:p-10 flex flex-col justify-between gap-5">
            <p aria-hidden="true" className="font-display font-extrabold text-[120px] sm:text-[168px] leading-[0.82] tracking-[-0.06em]">0&nbsp;€</p>
            <div>
              <h3 className="font-display text-[28px] sm:text-[32px] leading-[1.08] font-bold tracking-tight">Kostenlos für Eigentümer</h3>
              <p className="mt-2.5 text-brand-50">Kein Abo, keine Vermittlungsgebühr, keine versteckten Kosten.</p>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-100 rounded-[28px] p-6 sm:p-10 grid sm:grid-cols-[1fr_1.2fr] gap-7 sm:gap-10 items-center">
            <div>
              <h3 className="font-display text-[28px] sm:text-[32px] leading-[1.08] font-bold tracking-tight">Alles in einem Postfach</h3>
              <p className="mt-2.5 text-slate-700">Antworten landen an einem Ort. Ihre Kontaktdaten senden Sie mit einem Klick – oder gar nicht.</p>
            </div>
            <div className="flex flex-col gap-2.5 text-[15px] leading-snug" aria-hidden="true">
              <p className="self-start max-w-[86%] bg-white border border-slate-200 rounded-[18px] rounded-bl-md px-4 py-3 text-slate-700">Guten Tag, gern stellen wir uns vor. Wann passt Ihnen ein kurzes Telefonat?</p>
              <p className="self-end max-w-[86%] bg-brand-600 rounded-[18px] rounded-br-md px-4 py-3 text-white">Morgen ab 16 Uhr. Ich sende Ihnen meine Nummer.</p>
              <p className="self-end font-mono text-xs text-slate-600">Kontaktdaten gesendet · gelesen</p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Kundenstimmen */}
      {TESTIMONIALS.length > 0 && (
        <section className={`${wrap} pt-24 md:pt-32`} aria-labelledby="stimmen">
          <h2 id="stimmen" className="display-md max-w-[760px]">Das sagen Eigentümer und Verwaltungen.</h2>
          <ul className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TESTIMONIALS.map(t => (
              <li key={t.name} className="bg-tint rounded-[28px] p-8 flex flex-col">
                <blockquote className="font-display text-xl leading-snug flex-1">„{t.quote}“</blockquote>
                <p className="mt-5 text-sm"><span className="font-semibold">{t.name}</span><span className="text-slate-600"> · {t.role}</span></p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* -------------------------------------------------------- Wer dahinter steht */}
      <section className="mt-24 md:mt-32 bg-navy-grid text-white">
        <div className={`${wrap} py-20 md:py-28 grid lg:grid-cols-[1.3fr_1fr] gap-x-16 gap-y-8 items-end`}>
          <div>
            <Label light>Wer dahinter steht</Label>
            <p className="mt-4 display text-[clamp(2.6rem,6.2vw,5rem)] leading-[0.98]">Von Eigentümern für Eigentümer.</p>
          </div>
          <div>
            <p className="text-lg text-[#d5e0ff] max-w-[500px]">
              HausMatch ist ein Angebot der B&amp;W Immobilien Management aus Gladbeck. Wir verwalten selbst Häuser im Ruhrgebiet und kennen die Suche nach einer guten Verwaltung von beiden Seiten.
            </p>
            <Link to="/about" className="mt-6 inline-flex items-center gap-2 font-semibold text-white underline underline-offset-4 decoration-brand-400">
              Mehr über uns <Icon name="arrowRight" className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- Für Verwaltungen */}
      <section className={`${wrap} pt-24 md:pt-32 grid lg:grid-cols-[1fr_1.1fr] gap-x-16 gap-y-12 items-center`} aria-labelledby="fuer-verwaltungen">
        <div>
          <Label>Für Hausverwaltungen</Label>
          <h2 id="fuer-verwaltungen" className="mt-3.5 display-md">Anfragen aus Ihrer Region statt Kaltakquise.</h2>
          <p className="mt-5 text-slate-600 max-w-[460px]">Sie hinterlegen, wo Sie arbeiten und welche Objekte Sie übernehmen. Was passt, ist im Lead-Center markiert.</p>
          <dl className="mt-6 max-w-[460px] border-b border-slate-200">
            {[
              ['Einsatzgebiete, Objektarten, Größe', 'legen Sie fest'],
              ['Bearbeitungsstand', 'gehört nur Ihnen'],
              ['Kosten', 'derzeit keine'],
            ].map(([k, v]) => (
              <div key={k} className="py-3.5 border-t border-slate-200 flex justify-between gap-4">
                <dt className="font-medium">{k}</dt>
                <dd className="text-slate-600 text-right">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link to="/register" className="btn btn-dark btn-lg">Als Verwaltung registrieren</Link>
            <Link to="/managers" className="btn btn-secondary btn-lg">Mehr erfahren</Link>
          </div>
        </div>

        <div className="bg-tint rounded-[28px] pt-6 pl-6 sm:pt-9 sm:pl-9 overflow-hidden" aria-hidden="true">
          <div className="bg-white rounded-tl-[18px] p-5 sm:p-7 shadow-[0_30px_60px_-30px_rgba(10,31,99,0.5)]">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <p className="font-display font-bold text-2xl tracking-tight">Lead-Center</p>
              <div className="flex gap-4 text-sm font-semibold">
                <span className="pb-1 border-b-2 border-brand-600">Neu 3</span>
                <span className="text-slate-600">Kontaktiert 1</span>
                <span className="text-slate-600">Archiv</span>
              </div>
            </div>
            <div className="mt-5 border-[1.5px] border-brand-600 bg-[#f5f8ff] rounded-[14px] px-5 py-4">
              <div className="flex items-baseline justify-between gap-3">
                <strong className="text-lg font-semibold">WEG in Essen</strong>
                <span className="font-mono text-xs text-slate-600">17.11.</span>
              </div>
              <p className="mt-1.5 text-[15px] text-slate-700">12 Einheiten · Baujahr 1985 · WEG-Verwaltung</p>
              <span className="inline-block mt-3 px-3 py-1 rounded-full bg-brand-600 text-[13px] font-semibold text-white">Passt zu Ihrem Profil</span>
            </div>
            {[
              ['Mietshaus in Bottrop', '8 Einheiten · Mietverwaltung', '16.11.'],
              ['Gewerbe in Gladbeck', '4 Einheiten · Technische Betreuung', '14.11.'],
            ].map(([t, d, date]) => (
              <div key={t} className="mt-2.5 border border-slate-200 rounded-[14px] px-5 py-4 flex items-baseline justify-between gap-3">
                <div>
                  <strong className="text-lg font-semibold">{t}</strong>
                  <p className="mt-1.5 text-[15px] text-slate-600">{d}</p>
                </div>
                <span className="font-mono text-xs text-slate-600">{date}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- FAQ */}
      <section className={`${wrap} pt-24 md:pt-32 grid lg:grid-cols-[1fr_2fr] gap-x-16 gap-y-8`} aria-labelledby="faq">
        <div>
          <h2 id="faq" className="display-md">Häufige Fragen</h2>
          <p className="mt-5 text-slate-600">
            Etwas fehlt? <Link to="/contact" className="text-brand-700 underline underline-offset-4">Schreiben Sie uns.</Link>
          </p>
        </div>
        <div className="border-t-2 border-ink border-b border-b-slate-200 divide-y divide-slate-200">
          {FAQ.map(f => (
            <details key={f.q} className="group py-6">
              <summary className="flex items-center justify-between gap-4 list-none [&::-webkit-details-marker]:hidden">
                <span className="font-display text-xl sm:text-[23px] font-semibold tracking-tight">{f.q}</span>
                <span className="w-[34px] h-[34px] shrink-0 rounded-full border-[1.5px] border-ink flex items-center justify-center transition-transform group-open:rotate-45" aria-hidden="true">
                  <Icon name="plus" className="w-4 h-4" />
                </span>
              </summary>
              <p className="mt-3 text-slate-600 max-w-[620px]">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------- Abschluss-CTA */}
      <section className={`${wrap} py-24 md:py-32`}>
        <div className="bg-brand-600 text-white rounded-[32px] px-6 py-12 sm:px-14 sm:pt-[72px] sm:pb-16 flex flex-wrap items-end justify-between gap-x-12 gap-y-9">
          <h2 className="flex-1 basis-[420px] min-w-0 display text-[clamp(2.75rem,7.1vw,5.75rem)] leading-[0.96]">Wo liegt Ihr Objekt?</h2>
          <div className="flex-none w-full sm:w-[400px]">
            <CitySearch id="city-input-bottom" placeholder="z. B. Essen" dark />
            <p className="mt-3.5 ml-2 text-[15px] text-brand-50">Kostenlos, anonym, etwa zwei Minuten.</p>
          </div>
        </div>
      </section>
    </article>
  );
};

export default LandingHome;

import { useState, useMemo } from 'react';
import { Icon } from './ui/Icon';
import { Link } from 'react-router-dom';

const formatZahl = (v: number, stellen: number) =>
  v.toLocaleString('de-DE', { minimumFractionDigits: stellen, maximumFractionDigits: stellen });

const formatEuro = (v: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

// Grunderwerbsteuersätze – Stand November 2026. Bei Gesetzesänderungen hier anpassen.
const GREST_STAND = 'November 2026';
const BUNDESLAENDER: { name: string; gew: number }[] = [
  { name: 'Bayern', gew: 3.5 },
  { name: 'Baden-Württemberg', gew: 5.0 },
  { name: 'Berlin', gew: 6.0 },
  { name: 'Brandenburg', gew: 6.5 },
  { name: 'Bremen', gew: 5.5 },
  { name: 'Hamburg', gew: 5.5 },
  { name: 'Hessen', gew: 6.0 },
  { name: 'Mecklenburg-Vorpommern', gew: 6.0 },
  { name: 'Niedersachsen', gew: 5.0 },
  { name: 'Nordrhein-Westfalen', gew: 6.5 },
  { name: 'Rheinland-Pfalz', gew: 5.0 },
  { name: 'Saarland', gew: 6.5 },
  { name: 'Sachsen', gew: 5.5 },
  { name: 'Sachsen-Anhalt', gew: 5.0 },
  { name: 'Schleswig-Holstein', gew: 6.5 },
  { name: 'Thüringen', gew: 5.0 },
];

type Tab = 'kredit' | 'rendite' | 'tilgung';

const Kreditrechner = () => {
  const [tab, setTab] = useState<Tab>('kredit');

  // --- Kredit inputs ---
  const [kaufpreis, setKaufpreis] = useState(400000);
  const [eigenkapital, setEigenkapital] = useState(100000);
  const [zins, setZins] = useState(3.8);
  const [tilgung, setTilgung] = useState(2.0);
  const [laufzeit, setLaufzeit] = useState(30);
  const [bundesland, setBundesland] = useState('Bayern');
  const [mitMakler, setMitMakler] = useState(true);
  const [jahresmiete, setJahresmiete] = useState(14400);
  const [verwaltungKosten, setVerwaltungKosten] = useState(1200);
  const [instandhaltung, setInstandhaltung] = useState(2400);

  const bl = BUNDESLAENDER.find(b => b.name === bundesland) || BUNDESLAENDER[0];

  const ergebnis = useMemo(() => {
    const grunderwerbsteuer = (kaufpreis * bl.gew) / 100;
    const notarkosten = kaufpreis * 0.015;
    const grundbuch = kaufpreis * 0.005;
    const maklerkosten = mitMakler ? kaufpreis * 0.0357 : 0;
    const gesamtNebenkosten = grunderwerbsteuer + notarkosten + grundbuch + maklerkosten;
    const gesamtKaufpreis = kaufpreis + gesamtNebenkosten;
    const darlehen = Math.max(0, gesamtKaufpreis - eigenkapital);
    const monatszins = zins / 100 / 12;
    const annuitat = (zins + tilgung) / 100;
    const monatsrate = darlehen * annuitat / 12;
    const monatsZinsanteil = darlehen * monatszins;
    const monatsTilgungsanteil = monatsrate - monatsZinsanteil;

    // Tilgungsplan (vereinfacht)
    let restschuld = darlehen;
    let gezahlteZinsen = 0;
    let plan: { jahr: number; restschuld: number; zinsen: number; tilgung: number }[] = [];
    for (let j = 1; j <= Math.min(laufzeit, 40); j++) {
      let jahresZinsen = 0;
      let jahresTilgung = 0;
      for (let m = 0; m < 12; m++) {
        if (restschuld <= 0) break;
        const mZins = restschuld * monatszins;
        const mTilg = Math.min(monatsrate - mZins, restschuld);
        restschuld -= mTilg;
        jahresZinsen += mZins;
        jahresTilgung += mTilg;
        gezahlteZinsen += mZins;
      }
      plan.push({ jahr: j, restschuld: Math.max(0, restschuld), zinsen: jahresZinsen, tilgung: jahresTilgung });
      if (restschuld <= 0) break;
    }

    // Rendite
    const nettoMiete = jahresmiete - verwaltungKosten - instandhaltung;
    const bruttorendite = kaufpreis > 0 ? (jahresmiete / kaufpreis) * 100 : 0;
    const nettorendite = gesamtKaufpreis > 0 ? (nettoMiete / gesamtKaufpreis) * 100 : 0;
    const cashflowMonatlich = (nettoMiete / 12) - monatsrate;
    const eigenkapitalrendite = eigenkapital > 0 ? ((nettoMiete - (darlehen * zins / 100)) / eigenkapital) * 100 : 0;
    const ltvRatio = gesamtKaufpreis > 0 ? (darlehen / gesamtKaufpreis) * 100 : 0;

    return {
      grunderwerbsteuer, notarkosten, grundbuch, maklerkosten, gesamtNebenkosten,
      gesamtKaufpreis, darlehen, monatsrate, gezahlteZinsen,
      bruttorendite, nettorendite, cashflowMonatlich, eigenkapitalrendite, ltvRatio,
      tilgungsplan: plan,
      monatsZinsanteil, monatsTilgungsanteil
    };
  }, [kaufpreis, eigenkapital, zins, tilgung, laufzeit, bl, mitMakler, jahresmiete, verwaltungKosten, instandhaltung]);

  const inputClass = "w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all";
  const labelClass = "block text-xs font-bold text-slate-500 mb-1.5";

  return (
    <div className="bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="inline-flex items-center gap-2 mb-4 bg-brand-50 px-4 py-2 rounded-full border border-brand-100">
            <span className="text-xs font-bold text-brand-700">Finanzplanung</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">Immobilien-Kalkulator</h1>
          <p className="text-slate-500 font-medium text-sm md:text-base max-w-2xl">
            Kredit, Rendite und Tilgungsplan — alles in einem Rechner. Vollständige Kostenanalyse inkl. Nebenkosten.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Tab Nav */}
        <div className="flex gap-2 mb-6 bg-white rounded-2xl p-1.5 border border-slate-200 shadow-sm w-fit">
          {([
            { id: 'kredit', label: 'Kredit & Kosten' },
            { id: 'rendite', label: 'Rendite' },
            { id: 'tilgung', label: 'Tilgungsplan' }
          ] as { id: Tab; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                tab === t.id ? 'bg-brand-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-sm font-bold text-slate-900 mb-5">Objektdaten</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="kr-1" className={labelClass}>Kaufpreis</label>
                  <div className="relative">
                    <input id="kr-1" type="number" className={inputClass} value={kaufpreis} onChange={e => setKaufpreis(+e.target.value)} step={10000} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">€</span>
                  </div>
                </div>
                <div>
                  <label htmlFor="kr-2" className={labelClass}>Eigenkapital</label>
                  <div className="relative">
                    <input id="kr-2" type="number" className={inputClass} value={eigenkapital} onChange={e => setEigenkapital(+e.target.value)} step={5000} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">€</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500 font-medium">
                    EK-Quote: {kaufpreis > 0 ? Math.round((eigenkapital / kaufpreis) * 100) : 0} %
                  </div>
                </div>
                <div>
                  <label htmlFor="kr-3" className={labelClass}>Bundesland</label>
                  <select id="kr-3" className={inputClass} value={bundesland} onChange={e => setBundesland(e.target.value)}>
                    {BUNDESLAENDER.map(b => (
                      <option key={b.name} value={b.name}>{b.name} ({b.gew.toLocaleString('de-DE')} % GrESt)</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={mitMakler}
                    aria-label="Mit Makler rechnen"
                    onClick={() => setMitMakler(!mitMakler)}
                    className={`w-10 h-6 rounded-full transition-colors relative ${mitMakler ? 'bg-brand-600' : 'bg-slate-200'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${mitMakler ? 'right-1' : 'left-1'}`} />
                  </button>
                  <span className="text-sm font-bold text-slate-700">Mit Makler (3,57 %)</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-sm font-bold text-slate-900 mb-5">Finanzierung</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="kr-4" className={labelClass}>Zinssatz p.a.</label>
                  <div className="relative">
                    <input id="kr-4" type="number" className={inputClass} value={zins} onChange={e => setZins(+e.target.value)} step={0.1} min={0.1} max={15} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">%</span>
                  </div>
                </div>
                <div>
                  <label htmlFor="kr-5" className={labelClass}>Anfangstilgung p.a.</label>
                  <div className="relative">
                    <input id="kr-5" type="number" className={inputClass} value={tilgung} onChange={e => setTilgung(+e.target.value)} step={0.1} min={0.5} max={10} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">%</span>
                  </div>
                </div>
                <div>
                  <label htmlFor="kr-6" className={labelClass}>Laufzeit (Jahre)</label>
                  <input id="kr-6" type="number" className={inputClass} value={laufzeit} onChange={e => setLaufzeit(+e.target.value)} step={1} min={5} max={40} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-sm font-bold text-slate-900 mb-5">Miet-Einnahmen</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="kr-7" className={labelClass}>Jahresmiete (kalt)</label>
                  <div className="relative">
                    <input id="kr-7" type="number" className={inputClass} value={jahresmiete} onChange={e => setJahresmiete(+e.target.value)} step={600} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">€</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500 font-medium">= {formatEuro(jahresmiete / 12)} / Monat</div>
                </div>
                <div>
                  <label htmlFor="kr-8" className={labelClass}>Verwaltungskosten / Jahr</label>
                  <div className="relative">
                    <input id="kr-8" type="number" className={inputClass} value={verwaltungKosten} onChange={e => setVerwaltungKosten(+e.target.value)} step={100} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">€</span>
                  </div>
                </div>
                <div>
                  <label htmlFor="kr-9" className={labelClass}>Instandhaltung / Jahr</label>
                  <div className="relative">
                    <input id="kr-9" type="number" className={inputClass} value={instandhaltung} onChange={e => setInstandhaltung(+e.target.value)} step={100} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">€</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-3 space-y-4">
            {tab === 'kredit' && (
              <>
                {/* Monatsrate highlight */}
                <div className="bg-brand-600 text-white rounded-2xl p-6 shadow-sm">
                  <div className="text-xs font-bold text-brand-200 mb-1">Monatliche Rate</div>
                  <div className="text-5xl font-bold tracking-tight">{formatEuro(ergebnis.monatsrate)}</div>
                  <div className="mt-2 text-brand-200 text-sm font-medium">
                    Davon Zinsen: {formatEuro(ergebnis.monatsZinsanteil)} · Tilgung: {formatEuro(ergebnis.monatsTilgungsanteil)}
                  </div>
                </div>

                {/* Darlehen */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-xs font-bold text-slate-500 mb-4">Darlehensbedarf</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-500 font-medium mb-0.5">Kaufpreis</div>
                      <div className="text-xl font-bold text-slate-900">{formatEuro(kaufpreis)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium mb-0.5">Nebenkosten gesamt</div>
                      <div className="text-xl font-bold text-slate-900">{formatEuro(ergebnis.gesamtNebenkosten)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium mb-0.5">Eigenkapital</div>
                      <div className="text-xl font-bold text-green-600">− {formatEuro(eigenkapital)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium mb-0.5">Darlehensbetrag</div>
                      <div className="text-xl font-bold text-brand-600">{formatEuro(ergebnis.darlehen)}</div>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-slate-500 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Beleihungsquote (LTV): {formatZahl(ergebnis.ltvRatio, 1)} %
                    {ergebnis.ltvRatio > 80 && <span className="text-amber-500 ml-1">· Ggf. Risikoaufschlag der Bank möglich</span>}
                  </div>
                </div>

                {/* Nebenkosten Aufschlüsselung */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-xs font-bold text-slate-500 mb-4">Nebenkosten im Detail</h3>
                  <div className="space-y-3">
                    {[
                      { label: `Grunderwerbsteuer (${bl.gew.toLocaleString('de-DE')} %)`, value: ergebnis.grunderwerbsteuer },
                      { label: 'Notarkosten (ca. 1,5 %)', value: ergebnis.notarkosten },
                      { label: 'Grundbucheintrag (ca. 0,5 %)', value: ergebnis.grundbuch },
                      ...(mitMakler ? [{ label: 'Maklercourtage (3,57 %)', value: ergebnis.maklerkosten }] : [])
                    ].map(item => (
                      <div key={item.label} className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 font-medium">{item.label}</span>
                        <span className="text-sm font-bold text-slate-900">{formatEuro(item.value)}</span>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-900 uppercase tracking-wide">Gesamt</span>
                      <span className="text-lg font-bold text-red-500">{formatEuro(ergebnis.gesamtNebenkosten)}</span>
                    </div>
                  </div>
                </div>

                {/* Gesamtkosten */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 text-center">
                  <div className="text-xs font-bold text-slate-500 mb-1">Gesamtzinsen über {laufzeit} Jahre</div>
                  <div className="text-3xl font-bold text-slate-900">{formatEuro(ergebnis.gezahlteZinsen)}</div>
                </div>
              </>
            )}

            {tab === 'rendite' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`bg-white rounded-2xl border p-5 shadow-sm ${ergebnis.bruttorendite >= 5 ? 'border-green-200' : ergebnis.bruttorendite >= 3 ? 'border-amber-200' : 'border-red-200'}`}>
                    <div className="text-xs font-bold text-slate-500 mb-1">Bruttorendite</div>
                    <div className={`text-4xl font-bold ${ergebnis.bruttorendite >= 5 ? 'text-green-600' : ergebnis.bruttorendite >= 3 ? 'text-amber-600' : 'text-red-500'}`}>
                      {formatZahl(ergebnis.bruttorendite, 2)} %
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Miete ÷ Kaufpreis</div>
                  </div>
                  <div className={`bg-white rounded-2xl border p-5 shadow-sm ${ergebnis.nettorendite >= 3.5 ? 'border-green-200' : ergebnis.nettorendite >= 2 ? 'border-amber-200' : 'border-red-200'}`}>
                    <div className="text-xs font-bold text-slate-500 mb-1">Nettorendite</div>
                    <div className={`text-4xl font-bold ${ergebnis.nettorendite >= 3.5 ? 'text-green-600' : ergebnis.nettorendite >= 2 ? 'text-amber-600' : 'text-red-500'}`}>
                      {formatZahl(ergebnis.nettorendite, 2)} %
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Nach Kosten & Nebenkosten</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="text-xs font-bold text-slate-500 mb-1">Monatl. Cashflow</div>
                    <div className={`text-3xl font-bold ${ergebnis.cashflowMonatlich >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {ergebnis.cashflowMonatlich >= 0 ? '+' : ''}{formatEuro(ergebnis.cashflowMonatlich)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Nettomiete − Rate</div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="text-xs font-bold text-slate-500 mb-1">EK-Rendite</div>
                    <div className={`text-3xl font-bold ${ergebnis.eigenkapitalrendite >= 5 ? 'text-green-600' : ergebnis.eigenkapitalrendite >= 0 ? 'text-amber-600' : 'text-red-500'}`}>
                      {formatZahl(ergebnis.eigenkapitalrendite, 2)} %
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Leverage-Effekt</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-xs font-bold text-slate-500 mb-4">Einnahmen & Ausgaben / Jahr</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-sm text-slate-600 font-medium">Mieteinnahmen (kalt)</span><span className="text-sm font-bold text-green-600">+ {formatEuro(jahresmiete)}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-slate-600 font-medium">Verwaltungskosten</span><span className="text-sm font-bold text-red-500">− {formatEuro(verwaltungKosten)}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-slate-600 font-medium">Instandhaltung</span><span className="text-sm font-bold text-red-500">− {formatEuro(instandhaltung)}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-slate-600 font-medium">Zinsen (Jahr 1)</span><span className="text-sm font-bold text-red-500">− {formatEuro(ergebnis.monatsZinsanteil * 12)}</span></div>
                    <div className="pt-3 border-t border-slate-200 flex justify-between">
                      <span className="text-sm font-bold text-slate-900">Netto-Cashflow / Jahr</span>
                      <span className={`text-lg font-bold ${ergebnis.cashflowMonatlich * 12 >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {ergebnis.cashflowMonatlich * 12 >= 0 ? '+' : ''}{formatEuro(ergebnis.cashflowMonatlich * 12)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bewertung */}
                <div className={`rounded-2xl p-5 border ${ergebnis.bruttorendite >= 5 ? 'bg-green-50 border-green-200' : ergebnis.bruttorendite >= 3 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-start gap-3">
                    <Icon name={ergebnis.bruttorendite >= 5 ? 'check' : ergebnis.bruttorendite >= 3 ? 'info' : 'alert'} className={`w-6 h-6 mt-0.5 ${ergebnis.bruttorendite >= 5 ? 'text-green-600' : ergebnis.bruttorendite >= 3 ? 'text-amber-600' : 'text-red-600'}`} />
                    <div>
                      <div className="font-bold text-slate-900 text-sm mb-1">
                        {ergebnis.bruttorendite >= 5 ? 'Attraktives Investment' : ergebnis.bruttorendite >= 3 ? 'Solides Investment' : 'Rendite kritisch prüfen'}
                      </div>
                      <div className="text-xs text-slate-600 font-medium">
                        {ergebnis.bruttorendite >= 5
                          ? 'Bruttorendite über 5 % — das Objekt hat gutes Renditepotenzial. Prüfen Sie Lage und Substanz sorgfältig.'
                          : ergebnis.bruttorendite >= 3
                          ? 'Typisch für gute Lagen in Ballungszentren. Wertsteigerungspotenzial oft relevant.'
                          : 'Bruttorendite unter 3 %. Prüfen Sie ob Mietpotenzial oder Kaufpreis angepasst werden kann.'}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {tab === 'tilgung' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex flex-wrap gap-4">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Startschuld</div>
                    <div className="font-bold text-slate-900">{formatEuro(ergebnis.darlehen)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Annuität p.a.</div>
                    <div className="font-bold text-slate-900">{formatEuro(ergebnis.monatsrate * 12)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Gesamtzinsen</div>
                    <div className="font-bold text-red-500">{formatEuro(ergebnis.gezahlteZinsen)}</div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">Jahr</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500">Zinsen</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500">Tilgung</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500">Restschuld</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ergebnis.tilgungsplan.map((row, i) => (
                        <tr key={row.jahr} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="px-4 py-2.5 font-bold text-slate-900">{row.jahr}</td>
                          <td className="px-4 py-2.5 text-right font-medium text-red-500">{formatEuro(row.zinsen)}</td>
                          <td className="px-4 py-2.5 text-right font-medium text-green-600">{formatEuro(row.tilgung)}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-slate-900">{formatEuro(row.restschuld)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 font-medium">
                  * Vereinfachte Berechnung mit konstanter Annuität. Zinsbindung und Anschlussfinanzierung nicht berücksichtigt.
                </div>
              </div>
            )}

            <div className="text-xs text-slate-500 font-medium text-center px-4">
              Unverbindliche Richtwerte ohne Steuern und Sondertilgungen. Grunderwerbsteuersätze Stand {GREST_STAND}; Notar-, Grundbuch- und Maklerkosten sind Schätzwerte. Verbindliche Zahlen erhalten Sie von Ihrer Bank oder einem Finanzierungsberater.
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/ratgeber" className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                Zum Ratgeber
              </Link>
              <span className="text-slate-200">|</span>
              <Link to="/network" className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Zum Netzwerk
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Kreditrechner;

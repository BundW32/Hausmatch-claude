import { useState } from 'react';
import { Icon, IconName } from './ui/Icon';
import { Link } from 'react-router-dom';

const articles = [
  {
    id: 1,
    category: 'Kauf & Finanzierung',
    title: 'Wie viel Eigenkapital brauche ich beim Immobilienkauf?',
    summary: 'Faustregel: mindestens 20–30 % des Kaufpreises als Eigenkapital. Was dazu zählt und wie Sie sich optimal aufstellen.',
    content: `
**Die Faustregel:** Banken empfehlen mindestens 20–30 % des Kaufpreises als Eigenkapital. Dabei gilt: Je mehr Eigenkapital, desto bessere Zinsen.

**Was zählt als Eigenkapital?**
- Sparguthaben und Tagesgeldkonten
- Wertpapierdepots (zu ~60–80% anrechenbar)
- Bausparverträge
- Eigenleistungen beim Bau (Muskelhypothek)
- Schenkungen und Erbschaften

**Nebenkosten einkalkulieren:**
Die Nebenkosten (Grunderwerbsteuer 3,5–6,5 %, Notar ~1,5 %, Makler 0–3,57 %) sollten komplett aus Eigenkapital bezahlt werden.

**Beispielrechnung:**
Kaufpreis 400.000 € → Nebenkosten ca. 40.000–50.000 € → Empfohlenes EK: 130.000–170.000 €

**Tipp:** Nutzen Sie unseren Kreditrechner für Ihre persönliche Situation.
    `,
    readTime: '4 min',
    icon: 'home' as IconName
  },
  {
    id: 2,
    category: 'WEG & Recht',
    title: 'WEG-Reform 2020: Was Eigentümer wissen müssen',
    summary: 'Die WEG-Reform brachte wichtige Änderungen für Wohnungseigentümergemeinschaften. Die wichtigsten Neuerungen im Überblick.',
    content: `
**Beschlussfähigkeit:** Eigentümerversammlungen sind nun immer beschlussfähig, unabhängig von der Anzahl der erschienenen Eigentümer.

**Umlaufbeschlüsse:** Textform genügt – eine Zustimmung per E-Mail ist also möglich.

**Bauliche Veränderungen:** Einzelne Eigentümer können nun leichter Modernisierungen (z.B. Ladestation für E-Auto, Barrierereduzierung) beantragen und durchsetzen.

**Verwalter:** Die Gemeinschaft kann den Verwalter jederzeit abberufen. Seit dem 1. Dezember 2023 haben Eigentümer grundsätzlich Anspruch auf einen zertifizierten Verwalter (§ 26a WEG).

**Erhaltungsrücklage:** Die frühere Instandhaltungsrücklage heißt jetzt Erhaltungsrücklage; über ihre Höhe beschließt die Gemeinschaft.

**Wichtig für Sie:** Prüfen Sie Ihre Teilungserklärung und Gemeinschaftsordnung auf Aktualisierungsbedarf.
    `,
    readTime: '5 min',
    icon: 'shield' as IconName
  },
  {
    id: 3,
    category: 'Verwaltung',
    title: 'Den richtigen Hausverwalter finden: 7 Kriterien',
    summary: 'Nicht jeder Verwalter passt zu jedem Objekt. Diese 7 Kriterien helfen Ihnen bei der Auswahl.',
    content: `
**1. Lokale Expertise:** Kennt der Verwalter den regionalen Markt, Handwerker und Behörden?

**2. Qualifikation:** Liegt die Erlaubnis nach § 34c GewO vor, und ist er zertifizierter Verwalter (IHK-Prüfung nach § 26a WEG)? Eine Mitgliedschaft im VDIV ist ein Pluspunkt.

**3. Referenzen & Größe:** Wie viele Einheiten verwaltet er? Passt die Unternehmensgröße zu Ihrem Objekt?

**4. Digitales Management:** Nutzt er moderne Software (Mieterportal, digitale Abrechnung)?

**5. Erreichbarkeit:** Wie sind Reaktionszeiten und Notfallbereitschaft organisiert?

**6. Vertrag & Kündigung:** Mindestlaufzeit, Kündigungsfristen und Leistungsumfang prüfen.

**7. Transparenz:** Klare Abrechnung, regelmäßige Berichte und Zugang zu Unterlagen.

**Unser Tipp:** Holen Sie mindestens 3 Angebote ein und vergleichen Sie nicht nur den Preis, sondern den Leistungsumfang.
    `,
    readTime: '6 min',
    icon: 'search' as IconName
  },
  {
    id: 4,
    category: 'Investment',
    title: 'Rendite berechnen: Brutto vs. Netto erklärt',
    summary: 'Bruttorendite und Nettorendite — der Unterschied ist entscheidend für Ihre Investitionsentscheidung.',
    content: `
**Bruttorendite:**
Jahresmiete ÷ Kaufpreis × 100
Beispiel: 18.000 € Jahresmiete ÷ 300.000 € Kaufpreis = 6 % Bruttorendite

**Nettorendite:**
(Jahresmiete − nicht umlegbare Kosten) ÷ (Kaufpreis + Nebenkosten) × 100
Typische nicht umlegbare Kosten: Verwaltung, Instandhaltungsrücklage, Leerstand

**Faustformel:** Nettorendite ist meist 1,5–2 % niedriger als Bruttorendite.

**Eigenkapitalrendite (Leverage-Effekt):**
Mit Fremdkapital kann die Eigenkapitalrendite deutlich steigen — aber auch das Risiko.

**Wann lohnt es sich?**
- Bruttorendite > 5 % = interessant
- Bruttorendite > 7 % = sehr attraktiv
- Bruttorendite < 3 % = kritisch prüfen

**Nutzen Sie unseren Kreditrechner** für eine vollständige Renditeanalyse Ihres Projekts.
    `,
    readTime: '5 min',
    icon: 'calculator' as IconName
  },
  {
    id: 5,
    category: 'Mietrecht',
    title: 'Mieterhöhung rechtssicher durchführen',
    summary: 'Mieterhöhungen sind möglich, aber an strenge Voraussetzungen geknüpft. So gehen Sie rechtssicher vor.',
    content: `
**Voraussetzungen für eine Mieterhöhung:**
1. Das Erhöhungsverlangen ist frühestens 12 Monate nach der letzten Erhöhung möglich; beim Wirksamwerden muss die Miete 15 Monate unverändert sein
2. Der Mieter hat bis zum Ende des übernächsten Monats Zeit zuzustimmen; die neue Miete gilt ab dem dritten Monat nach Zugang
3. Begründung erforderlich (Mietspiegel, Gutachten oder 3 Vergleichswohnungen)
4. Kappungsgrenze: max. 20 % in 3 Jahren (in angespannten Märkten: 15 %)
5. Zustimmung des Mieters erforderlich

**Mietspiegel nutzen:**
Prüfen Sie den aktuellen Mietspiegel Ihrer Gemeinde. In vielen Städten online verfügbar.

**Bei Modernisierungen:**
Maximal 8 % der Modernisierungskosten jährlich auf die Miete umlegbar. Ankündigungspflicht 3 Monate vorher.

**Wichtig:** Bei Fehlern im Verfahren kann die Mieterhöhung unwirksam sein. Im Zweifel anwaltlichen Rat einholen.
    `,
    readTime: '7 min',
    icon: 'book' as IconName
  },
  {
    id: 6,
    category: 'Energie & Sanierung',
    title: 'Energetische Sanierung: Förderungen im Überblick',
    summary: 'KfW, BAFA und steuerliche Absetzbarkeit — so holen Sie das Maximum aus Ihrer Sanierung heraus.',
    content: `
**Sanierung zum Effizienzhaus (KfW):**
- Förderkredit mit Tilgungszuschuss – je nach erreichter Effizienzhaus-Stufe
- Höhere Zuschüsse für besonders ineffiziente Gebäude und serielles Sanieren

**Einzelmaßnahmen an der Gebäudehülle (BAFA):**
- Zuschuss für Dämmung, Fenster und Türen
- Bonus bei individuellem Sanierungsfahrplan (iSFP)

**Heizungstausch (KfW):**
- Grundförderung plus Boni (z. B. Klimageschwindigkeits- und Einkommensbonus)
- Für Vermieter gelten eigene Bedingungen

**Wichtig:** Fördersätze und Programme ändern sich häufig. Prüfen Sie die aktuellen Konditionen vor der Antragstellung direkt bei KfW und BAFA.

**Steuerliche Absetzbarkeit:**
- Selbst genutzte Immobilien: 20 % der Kosten, verteilt über 3 Jahre (§ 35c EStG) – nicht zusätzlich zur Förderung
- Vermietete Immobilien: Sofortabzug oder Abschreibung

**Reihenfolge beachten:** Förderung in der Regel vor Beginn der Maßnahme beantragen.

**Tipp:** Holen Sie einen Energieberater (zugelassen für Bundesförderung) für die Antragstellung hinzu.
    `,
    readTime: '6 min',
    icon: 'sparkles' as IconName
  }
];

const categories = ['Alle', 'Kauf & Finanzierung', 'WEG & Recht', 'Verwaltung', 'Investment', 'Mietrecht', 'Energie & Sanierung'];

const Ratgeber = () => {
  const [activeCategory, setActiveCategory] = useState('Alle');
  const [openArticle, setOpenArticle] = useState<number | null>(null);

  const filtered = activeCategory === 'Alle' ? articles : articles.filter(a => a.category === activeCategory);

  return (
    <div className="bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          <div className="inline-flex items-center gap-2 mb-4 bg-brand-50 px-4 py-2 rounded-full border border-brand-100">
            <span className="text-xs font-bold text-brand-700">Expertenwissen</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-4">Immobilien-Ratgeber</h1>
          <p className="text-slate-500 text-lg font-medium max-w-2xl">
            Praxisnahe Guides zu Recht, Verwaltung, Investment und Förderungen — kompakt und verständlich erklärt.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeCategory === cat
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300 hover:text-brand-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {filtered.map(article => (
            <div key={article.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="w-11 h-11 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center"><Icon name={article.icon} className="w-6 h-6" /></span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                    {article.category}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 leading-snug">{article.title}</h2>
                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-4">{article.summary}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {article.readTime} Lesezeit
                  </span>
                  <button
                    aria-expanded={openArticle === article.id}
                    onClick={() => setOpenArticle(openArticle === article.id ? null : article.id)}
                    className="text-brand-600 text-xs font-bold hover:text-brand-700 flex items-center gap-1"
                  >
                    {openArticle === article.id ? 'Schließen' : 'Lesen'}
                    <svg className={`w-3 h-3 transition-transform ${openArticle === article.id ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>

              {openArticle === article.id && (
                <div className="border-t border-slate-200 px-6 py-5 bg-slate-50">
                  <div className="prose prose-sm max-w-none text-slate-700">
                    {article.content.trim().split('\n').map((line, i) => {
                      if (line.trim() === '') return null;
                      const isBullet = line.startsWith('- ');
                      const parts = (isBullet ? line.slice(2) : line).split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
                      const rich = parts.map((part, j) =>
                        part.startsWith('**') ? <strong key={j} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong> : <span key={j}>{part}</span>,
                      );
                      const isHeading = parts.length === 1 && parts[0].startsWith('**');
                      if (isHeading) return <p key={i} className="mt-4 mb-1 first:mt-0">{rich}</p>;
                      if (isBullet) return <p key={i} className="pl-4 text-slate-700 text-sm leading-relaxed flex gap-2"><span className="text-brand-600" aria-hidden="true">•</span><span>{rich}</span></p>;
                      return <p key={i} className="text-slate-700 text-sm leading-relaxed">{rich}</p>;
                    })}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200 flex gap-3">
                    <Link to="/kreditrechner" className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      Zum Kreditrechner
                    </Link>
                    <span className="text-slate-200">|</span>
                    <Link to="/network" className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Experten finden
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-slate-500">Alle Beiträge sind allgemeine Informationen (Stand: November 2026) und ersetzen keine Rechts-, Steuer- oder Finanzierungsberatung im Einzelfall.</p>

        {/* CTA Box */}
        <div className="mt-12 bg-brand-600 rounded-2xl p-8 md:p-10 text-white text-center">
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">Haben Sie konkrete Fragen?</h3>
          <p className="text-brand-100 font-medium mb-6 max-w-lg mx-auto text-sm md:text-base">
            Der HausMatch-Assistent unten rechts beantwortet allgemeine Fragen. Für Ihr konkretes Objekt finden Sie im Netzwerk die passende Verwaltung.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/network" className="px-6 py-3 bg-white text-brand-600 rounded-xl font-bold text-xs hover:bg-brand-50 transition-all shadow-lg">
              Experten im Netzwerk
            </Link>
            <Link to="/kreditrechner" className="px-6 py-3 bg-brand-700 text-white rounded-xl font-bold text-xs hover:bg-brand-800 transition-all border border-brand-500">
              Kreditrechner öffnen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ratgeber;

// Ortsverzeichnis für Deutschland (Ortsname, Bundesland, Postleitzahlen).
// Datenquelle: GeoNames, Lizenz CC BY 4.0 – erzeugt mit scripts/build-places.mjs.
// Die Liste (~220 kB komprimiert) wird erst geladen, wenn ein Stadtfeld benutzt wird.

export interface Place {
  name: string;
  state: string;
  plz: string[];
  /** Vergleichsform ohne Groß-/Kleinschreibung und Umlaute */
  key: string;
}

const STATES: Record<string, string> = {
  BW: 'Baden-Württemberg', BY: 'Bayern', BE: 'Berlin', BB: 'Brandenburg', HB: 'Bremen', HH: 'Hamburg', HE: 'Hessen',
  MV: 'Mecklenburg-Vorpommern', NI: 'Niedersachsen', NW: 'Nordrhein-Westfalen', RP: 'Rheinland-Pfalz', SL: 'Saarland',
  SN: 'Sachsen', ST: 'Sachsen-Anhalt', SH: 'Schleswig-Holstein', TH: 'Thüringen',
};
export const stateName = (code: string) => STATES[code] || code;

/** „Köln“, „koeln“ und „KÖLN “ ergeben dieselbe Vergleichsform. */
export const foldPlace = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ');

let cache: Promise<Place[]> | null = null;

export const loadPlaces = (): Promise<Place[]> => {
  if (!cache) {
    cache = import('../data/places.json')
      .then(mod => (mod.default as unknown as [string, string, string][]).map(([name, state, plz]) => ({ name, state, plz: plz.split(' '), key: foldPlace(name) })))
      .catch(err => {
        cache = null;
        throw err;
      });
  }
  return cache;
};

/** Genauer Treffer über Ortsname oder fünfstellige Postleitzahl. Bei gleichnamigen Orten gewinnt der größte. */
export const findPlace = (places: Place[], input: string): Place | null => {
  const raw = input.trim();
  if (!raw) return null;
  if (/^\d{5}$/.test(raw)) return places.find(p => p.plz.includes(raw)) || null;
  // „45964 Gladbeck“ oder „Gladbeck 45964“
  const withPlz = raw.match(/^(\d{5})\s+(.+)$/) || raw.match(/^(.+?)\s+(\d{5})$/);
  if (withPlz) {
    const plz = /^\d{5}$/.test(withPlz[1]) ? withPlz[1] : withPlz[2];
    const byPlz = places.find(p => p.plz.includes(plz));
    if (byPlz) return byPlz;
  }
  const key = foldPlace(raw);
  return places.find(p => p.key === key) || null;
};

const distance = (a: string, b: string, max: number): number => {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
};

/** Vorschläge: Postleitzahl-Anfang, dann Namensanfang, dann Tippfehler-Toleranz. Die Liste ist nach Ortsgröße sortiert. */
export const suggestPlaces = (places: Place[], input: string, limit = 6): Place[] => {
  const raw = input.trim();
  if (raw.length < 2) return [];
  if (/^\d+$/.test(raw)) return places.filter(p => p.plz.some(z => z.startsWith(raw))).slice(0, limit);
  const key = foldPlace(raw);
  // Namensanfang zählt am meisten, Tippfehler-Nähe etwas weniger, „enthält“ am wenigsten –
  // jeweils gewichtet mit der Ortsgröße (Zahl der Postleitzahlen), damit „Esen“ zuerst Essen vorschlägt.
  const max = key.length >= 8 ? 2 : 1;
  const scored: { place: Place; score: number }[] = [];
  for (const p of places) {
    let weight = 0;
    if (p.key.startsWith(key)) weight = 3;
    else if (key.length >= 4 && distance(key, p.key, max) <= max) weight = 2;
    else if (key.length >= 4 && p.key.includes(key)) weight = 1;
    if (weight) scored.push({ place: p, score: weight * p.plz.length });
  }
  // Orte, die mit der Eingabe beginnen, stehen immer vor den übrigen Vorschlägen.
  const starts = (x: { place: Place }) => (x.place.key.startsWith(key) ? 1 : 0);
  return scored.sort((x, y) => starts(y) - starts(x) || y.score - x.score).slice(0, limit).map(x => x.place);
};

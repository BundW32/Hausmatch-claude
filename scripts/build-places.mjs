// Erzeugt data/places.json aus dem offenen Postleitzahlen-Datensatz von GeoNames (CC BY 4.0).
//
//   1) https://download.geonames.org/export/zip/DE.zip laden und entpacken
//   2) node scripts/build-places.mjs pfad/zu/DE.txt
//
// Ergebnis: eine kompakte Liste [Ortsname, Bundesland-Kürzel, "plz plz …"], nach Größe sortiert.
import { readFileSync, writeFileSync } from 'node:fs';

const src = process.argv[2];
if (!src) {
  console.error('Aufruf: node scripts/build-places.mjs pfad/zu/DE.txt');
  process.exit(1);
}

const places = new Map();
for (const line of readFileSync(src, 'utf8').split('\n')) {
  const [, plz, name, , state] = line.split('\t');
  if (!plz || !name || !/^\d{5}$/.test(plz)) continue;
  const key = `${name}|${state || ''}`;
  if (!places.has(key)) places.set(key, { name, state: state || '', plz: new Set() });
  places.get(key).plz.add(plz);
}

const rows = [...places.values()]
  .sort((a, b) => b.plz.size - a.plz.size || a.name.localeCompare(b.name, 'de'))
  .map(p => [p.name, p.state, [...p.plz].sort().join(' ')]);

writeFileSync(new URL('../data/places.json', import.meta.url), JSON.stringify(rows));
console.log(`${rows.length} Orte, ${rows.reduce((n, r) => n + r[2].split(' ').length, 0)} Postleitzahlen`);

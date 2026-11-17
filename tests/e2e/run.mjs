// End-to-End-Durchlauf gegen die Firebase-Emulatoren.
//
// Voraussetzungen (drei Terminals):
//   1) npm run emulators
//   2) VITE_USE_EMULATORS=true npx vite build && npx vite preview --port 4173
//   3) npm run test:e2e            (benötigt Playwright: npm i -D playwright && npx playwright install chromium)
//
// Der Test spielt die wichtigsten Abläufe als Eigentümer und als Verwaltung durch und legt Screenshots in tests/e2e/shots ab.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = process.env.E2E_BASE || 'http://localhost:4173';
const AUTH = 'http://127.0.0.1:9099';
const PROJECT = 'demo-hausmatch';
const SHOTS = new URL('./shots/', import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });

const stamp = Date.now();
const owner = { email: `owner${stamp}@example.org`, password: 'geheim-1234', name: 'Olga Eigentümerin' };
const manager = { email: `verwaltung${stamp}@example.org`, password: 'geheim-1234', name: 'Ruhr Verwaltung GmbH' };

let passed = 0;
const failures = [];
const check = (label, ok, detail = '') => {
  if (ok) {
    passed++;
    console.log(`  ok   ${label}`);
  } else {
    failures.push(label);
    console.log(`  FAIL ${label} ${detail}`);
  }
};

const verifyEmail = async email => {
  const res = await fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/oobCodes`);
  const { oobCodes = [] } = await res.json();
  const code = [...oobCodes].reverse().find(c => c.email === email && c.requestType === 'VERIFY_EMAIL');
  if (!code) throw new Error(`Kein Bestätigungscode für ${email}`);
  await fetch(code.oobLink.replace('localhost', '127.0.0.1'));
};

// Sauberer Start: Emulator-Daten aus früheren Läufen entfernen.
await fetch(`http://127.0.0.1:8080/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: 'DELETE' });
await fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/accounts`, { method: 'DELETE' });

const browser = await chromium.launch();
const consoleErrors = [];

const newPage = async (viewport = { width: 1366, height: 850 }) => {
  const ctx = await browser.newContext({ viewport, locale: 'de-DE' });
  const page = await ctx.newPage();
  page.on('pageerror', e => consoleErrors.push(`pageerror: ${e.message}`));
  page.on('console', m => {
    const t = m.text();
    // /api/* gibt es im statischen Preview nicht – das ist erwartet und wird in der App abgefangen.
    if (m.type() === 'error' && !t.includes('/api/') && !t.includes('404') && !t.includes('405')) consoleErrors.push(`console: ${t.slice(0, 200)}`);
  });
  return page;
};
const shot = (page, name) => page.screenshot({ path: `${SHOTS}${name}.png` });
const text = page => page.locator('body').innerText();

const register = async (page, who, role) => {
  await page.getByRole('button', { name: role === 'manager' ? /Ich bin Hausverwaltung/ : /Ich bin Eigentümer/ }).click();
  await page.getByLabel(role === 'manager' ? 'Name der Hausverwaltung' : 'Ihr Name').fill(who.name);
  await page.getByLabel('E-Mail-Adresse').fill(who.email);
  await page.getByLabel('Passwort').fill(who.password);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Konto erstellen' }).click();
};
const login = async (page, who) => {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('E-Mail-Adresse').fill(who.email);
  await page.getByLabel('Passwort').fill(who.password);
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
};
const logout = async page => {
  await page.getByRole('button', { name: 'Abmelden' }).first().click();
  await page.getByRole('link', { name: 'Anmelden' }).first().waitFor();
};
const confirmEmail = async (page, who) => {
  await verifyEmail(who.email);
  await page.getByRole('button', { name: 'Ich habe bestätigt' }).click();
  await page.getByText('Bitte bestätigen Sie Ihre E-Mail-Adresse.').waitFor({ state: 'detached' });
};

try {
  // ------------------------------------------------------------ 1. Gast
  console.log('\n1. Gast: Startseite und Wizard');
  const page = await newPage();
  await page.goto(BASE);
  await page.getByRole('button', { name: 'Nur notwendige' }).click();
  check('Einwilligungsbanner lässt sich schließen', (await page.getByRole('region', { name: 'Cookie-Einstellungen' }).count()) === 0);
  await shot(page, '01-start');
  await page.getByLabel('Stadt des Objekts').fill('Essen');
  await page.getByRole('button', { name: /Verwaltung finden/ }).click();
  await page.getByRole('heading', { name: 'Beschreiben Sie Ihr Objekt' }).waitFor();
  check('Stadt wird in den Wizard übernommen', (await page.getByLabel('Stadt des Objekts').inputValue()) === 'Essen');

  await page.getByLabel('Stadt des Objekts').fill('');
  await page.getByRole('button', { name: 'Weiter' }).click();
  check('Pflichtfeld wird direkt im Schritt geprüft', (await text(page)).includes('Bitte geben Sie die Stadt an'));
  await page.getByLabel('Stadt des Objekts').fill('Essen');
  await page.getByLabel('Anzahl der Einheiten').fill('12');
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByLabel('Baujahr (optional)').fill('1985');
  await page.getByLabel('Zustand (optional)').selectOption('Gepflegt');
  await page.getByRole('button', { name: 'WEG-Verwaltung' }).click();
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByLabel(/Was ist Ihnen bei der neuen Verwaltung wichtig/).fill('Unsere bisherige Verwaltung reagiert kaum noch, die Abrechnung 2025 steht aus.');
  await page.getByRole('button', { name: 'Weiter' }).click();
  check('Gast wird vor dem Absenden zur Anmeldung geführt', (await text(page)).includes('Fast geschafft'));
  await shot(page, '02-wizard-gast');

  // ----------------------------------------------- 2. Eigentümer registrieren
  console.log('\n2. Eigentümer: Registrierung, Anfrage, Bestätigung');
  await page.getByRole('link', { name: 'Kostenlos registrieren' }).click();
  await register(page, owner, 'seeker');
  await page.getByRole('button', { name: 'Anfrage absenden' }).waitFor();
  check('Nach der Registrierung zurück im Wizard, Entwurf erhalten', (await text(page)).includes('Unsere bisherige Verwaltung reagiert kaum noch'));
  await page.getByRole('button', { name: 'Anfrage absenden' }).click();
  await page.waitForURL(/\/search-results\?inquiry=/, { timeout: 30000 });
  await page.getByText('Ihre Anfrage ist gespeichert.').waitFor();
  check('Anfrage gespeichert (auch ohne KI-Dienst)', true);
  await page.getByText('Noch keine Verwaltung für Essen registriert').waitFor();
  check('Leere Trefferliste wird ehrlich angezeigt', true);
  check('Hinweis auf unbestätigte E-Mail', (await text(page)).includes('Bitte bestätigen Sie Ihre E-Mail-Adresse.'));
  await confirmEmail(page, owner);
  check('E-Mail-Bestätigung wird erkannt', true);
  await page.goto(`${BASE}/anfragen`);
  await page.getByRole('heading', { name: 'WEG in Essen' }).waitFor();
  check('„Meine Anfragen“ zeigt die Anfrage', true);
  await shot(page, '03-meine-anfragen');
  await logout(page);

  // ------------------------------------------------- 3. Verwaltung registrieren
  console.log('\n3. Verwaltung: Registrierung, Profil, Lead-Center');
  await page.goto(`${BASE}/register`);
  await register(page, manager, 'manager');
  await page.waitForURL(/\/dashboard/);
  check('Verwaltung landet nach der Registrierung im Lead-Center', true);
  await page.getByRole('button', { name: /WEG in Essen/ }).first().waitFor();
  check('Lead ist sichtbar', true);
  const leadText = await text(page);
  check('Lead enthält keine Kontaktdaten', !leadText.includes(owner.email) && !leadText.includes(owner.name));
  await confirmEmail(page, manager);

  await page.goto(`${BASE}/profile`);
  await page.getByRole('button', { name: 'Profil bearbeiten' }).click();
  await page.getByLabel('Sitz (Ort)').fill('Gladbeck');
  await page.getByLabel('Einsatzgebiete (Städte)').fill('Essen, Gladbeck, Bottrop');
  await page.getByLabel('WEG (Wohnungseigentum)').check();
  await page.getByLabel('Einheiten von').fill('5');
  await page.getByLabel('bis', { exact: true }).fill('60');
  await page.getByLabel('Telefon').fill('02043 123456');
  await page.getByLabel('Website').fill('www.ruhr-verwaltung.example');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await page.getByText('Profil gespeichert.').waitFor();
  check('Profil mit Matching-Angaben gespeichert', (await text(page)).includes('Leistungsprofil'));
  await shot(page, '04-profil-verwaltung');

  await page.goto(`${BASE}/dashboard`);
  await page.getByText('Passt zu Ihrem Profil').first().waitFor();
  check('Lead wird als passend markiert', true);
  await page.getByRole('button', { name: /WEG in Essen/ }).first().click();
  await shot(page, '05-lead-center');
  await page.getByRole('button', { name: 'Nachricht senden' }).click();
  await page.getByRole('button', { name: 'Vorlage einfügen' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Nachricht senden' }).click();
  await page.getByText('Nachricht gesendet.').waitFor();
  await page.getByRole('tab', { name: /Kontaktiert 1/ }).waitFor();
  check('Nachricht gesendet, Lead steht unter „Kontaktiert“', true);
  await logout(page);

  // ------------------------------------------------------ 4. Eigentümer antwortet
  console.log('\n4. Eigentümer: Postfach, Treffer, Vernetzen');
  await login(page, owner);
  await page.waitForURL(/\/wizard/);
  await page.getByRole('link', { name: /Postfach/ }).first().waitFor();
  await page.getByLabel('1 ungelesen').first().waitFor();
  check('Ungelesen-Zähler in der Navigation', true);
  await page.goto(`${BASE}/messages`);
  await page.getByRole('button', { name: /Ruhr Verwaltung GmbH/ }).click();
  await page.getByText('vielen Dank für Ihre Anfrage zu Ihrem Objekt in Essen').last().waitFor();
  check('Nachricht der Verwaltung kommt an', true);
  await page.getByLabel('Nachricht schreiben').fill('Gern, rufen Sie mich morgen an.');
  await page.getByRole('button', { name: 'Senden', exact: true }).click();
  await page.getByText('Gern, rufen Sie mich morgen an.').first().waitFor();
  await page.getByRole('button', { name: /Kontaktdaten senden/ }).click();
  await page.getByRole('button', { name: 'Jetzt senden' }).click();
  await page.getByText('Kontaktdaten gesendet.').waitFor();
  check('Antwort und freiwillige Kontaktfreigabe', true);
  await shot(page, '06-postfach');
  await page.goto(`${BASE}/`);
  await page.waitForTimeout(800);
  check('Ungelesen-Zähler ist nach dem Lesen weg', (await page.getByLabel(/ungelesen/).count()) === 0);

  await page.goto(`${BASE}/anfragen`);
  await page.getByRole('link', { name: 'Passende Verwaltungen' }).click();
  await page.getByRole('heading', { name: 'Ruhr Verwaltung GmbH' }).waitFor();
  const matchText = await text(page);
  check('Treffer mit Begründung', matchText.includes('Betreut Objekte in Essen') && matchText.includes('Verwaltet WEGs') && matchText.includes('Übernimmt Objekte mit 12 Einheiten'));
  check('Treffer zeigt 100 % Übereinstimmung', /100\s*%/.test(matchText));
  await shot(page, '07-treffer');

  await page.goto(`${BASE}/network`);
  await page.getByRole('button', { name: 'Vernetzen', exact: true }).first().click();
  await page.getByRole('button', { name: /Angefragt/ }).waitFor();
  check('Vernetzungsanfrage gesendet', true);

  // --------------------------------------------------------------- 5. Forum
  console.log('\n5. Forum');
  await page.goto(`${BASE}/forum`);
  await page.getByRole('button', { name: 'Neues Thema' }).click();
  await page.getByLabel('Titel').fill('Wie wechselt man die Verwaltung?');
  await page.getByLabel('Ihr Beitrag').fill('Hat jemand Erfahrung mit dem Ablauf?\n<img src=x onerror=alert(1)>');
  await page.getByRole('button', { name: 'Thema veröffentlichen' }).click();
  await page.waitForURL(/\/forum\/.+/);
  await page.getByRole('heading', { name: 'Wie wechselt man die Verwaltung?' }).waitFor();
  check('Thema erstellt; HTML wird als Text gezeigt', (await text(page)).includes('<img src=x onerror=alert(1)>') && (await page.locator('article img').count()) === 0);
  const threadUrl = page.url();
  await page.getByLabel('Ihre Antwort').fill('Nachtrag: Es geht um eine WEG.');
  await page.getByRole('button', { name: 'Antwort senden' }).click();
  await page.getByText('1 Antwort', { exact: true }).waitFor();
  check('Antwort erscheint', true);
  await logout(page);

  // ------------------------------------------------------ 6. Verwaltung nimmt an
  console.log('\n6. Verwaltung: Vernetzung annehmen, Gelesen-Status');
  await login(page, manager);
  await page.waitForURL(/\/dashboard/);
  await page.goto(`${BASE}/network`);
  await page.getByText('Eine neue Vernetzungsanfrage').waitFor();
  await page.getByRole('button', { name: 'Annehmen' }).first().click();
  await page.getByRole('button', { name: /Vernetzt/ }).waitFor();
  check('Vernetzung angenommen', true);
  await page.goto(`${BASE}/messages`);
  await page.getByRole('button', { name: /Olga Eigentümerin/ }).click();
  await page.getByText(`E-Mail: ${owner.email}`).last().waitFor();
  check('Verwaltung sieht Namen und Kontaktdaten erst nach Freigabe', true);
  check('Eigene Nachricht ist als gelesen markiert', (await text(page)).includes('gelesen'));
  await logout(page);

  // ------------------------------------------------------------ 7. Gast-Sicht
  console.log('\n7. Gast: öffentliche Bereiche');
  await page.goto(threadUrl);
  await page.getByRole('heading', { name: 'Wie wechselt man die Verwaltung?' }).waitFor();
  check('Forum ist ohne Login lesbar', (await text(page)).includes('Zum Mitdiskutieren bitte'));
  await page.goto(`${BASE}/network`);
  await page.getByText('Ruhr Verwaltung GmbH').first().waitFor();
  check('Gast sieht Verwaltungen, aber keine Eigentümer', !(await text(page)).includes(owner.name));
  await page.goto(`${BASE}/search-results?city=Essen&type=WEG&units=12`);
  await page.getByRole('heading', { name: 'Ruhr Verwaltung GmbH' }).waitFor();
  check('Gast kann nach Stadt suchen', true);
  await page.goto(`${BASE}/dashboard`);
  await page.waitForURL(/\/login/);
  check('Geschützte Seiten leiten zum Login', true);
  await page.goto(`${BASE}/#/ratgeber`);
  await page.waitForURL(/\/ratgeber$/);
  check('Alte Hash-Links werden umgeleitet', true);
  await page.goto(`${BASE}/contact`);
  await page.getByLabel('Ihr Name').fill('Gast');
  await page.getByLabel('E-Mail-Adresse').fill('gast@example.org');
  await page.getByLabel('Ihre Nachricht').fill('Eine Frage zum Angebot für Verwaltungen.');
  await page.getByRole('button', { name: 'Nachricht senden' }).click();
  await page.getByText('Ihre Nachricht ist bei uns eingegangen').waitFor();
  check('Kontaktformular speichert die Nachricht', true);

  // ---------------------------------------------------------------- 8. Mobil
  console.log('\n8. Mobil (390 px): Layout');
  const mobile = await newPage({ width: 390, height: 844 });
  for (const path of ['/', '/wizard', '/network', '/forum', '/kreditrechner', '/ratgeber', '/managers', '/seekers', '/login', '/register', '/legal/privacy', '/search-results?city=Essen']) {
    await mobile.goto(BASE + path);
    await mobile.waitForTimeout(700);
    const { sw, cw } = await mobile.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    check(`kein horizontales Scrollen auf ${path}`, sw <= cw, `(${sw} > ${cw})`);
    await shot(mobile, `m${path.replace(/[\/?=&]/g, '_')}`);
  }
  await login(mobile, manager);
  await mobile.waitForURL(/\/dashboard/);
  await mobile.getByRole('button', { name: /WEG in Essen/ }).first().waitFor({ timeout: 10000 }).catch(() => undefined);
  await mobile.getByRole('tab', { name: /Kontaktiert/ }).click();
  await mobile.getByRole('button', { name: /WEG in Essen/ }).first().click();
  await mobile.getByRole('button', { name: 'Alle Anfragen' }).waitFor();
  check('Lead-Center mobil: Detailansicht mit Zurück', true);
  await shot(mobile, 'm_dashboard_detail');
  await mobile.goto(`${BASE}/messages`);
  await mobile.getByRole('button', { name: /Olga Eigentümerin/ }).click();
  await mobile.getByRole('button', { name: 'Zurück zur Übersicht' }).waitFor();
  check('Postfach mobil: Verlauf mit Zurück', true);
  await shot(mobile, 'm_messages_detail');
} catch (err) {
  failures.push(`Abbruch: ${err.message.split('\n')[0]}`);
  console.log(`\nABBRUCH: ${err.message.split('\n').slice(0, 6).join('\n')}`);
  const pages = browser.contexts().flatMap(c => c.pages());
  if (pages.length) await pages[pages.length - 1].screenshot({ path: `${SHOTS}zz-abbruch.png` }).catch(() => undefined);
} finally {
  await browser.close();
}

const uniqueErrors = [...new Set(consoleErrors)];
console.log(`\n${passed} bestanden, ${failures.length} fehlgeschlagen, ${uniqueErrors.length} Konsolenfehler`);
failures.forEach(f => console.log(`  - ${f}`));
uniqueErrors.slice(0, 15).forEach(e => console.log(`  ! ${e}`));
process.exit(failures.length || uniqueErrors.length ? 1 : 0);

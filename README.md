# HausMatch

Plattform, auf der Immobilieneigentümer und Hausverwaltungen zueinander finden.
React + Vite + Tailwind im Browser, Firebase (Auth, Firestore) als Datenbank, Vercel als Hosting inklusive kleiner Serverfunktionen für die KI.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `App.tsx`, `components/` | Oberfläche. Gemeinsame Bausteine in `components/ui/`, Designregeln in `index.css` |
| `services/` | Firebase-Anbindung (`dataService.ts`), Anmeldung (`auth.tsx`), Matching (`matching.ts`), Einwilligung (`consent.ts`) |
| `api/` | Vercel-Serverfunktionen: `chat` (Assistent), `analyze` (Einschätzung einer Anfrage), `blog` (Branchen-News) |
| `firestore.rules`, `firestore.indexes.json` | Zugriffsregeln und Indizes der Datenbank |
| `tests/` | Regeltests, Tests der Serverfunktionen, End-to-End-Durchlauf |

## Einmalige Einrichtung für den Livebetrieb

1. **Gemini-Schlüssel tauschen.** Der frühere Schlüssel stand im Quellcode und in der Git-Historie – er muss in Google AI Studio bzw. der Google Cloud Console widerrufen werden. Den neuen Schlüssel in Vercel unter *Settings → Environment Variables* als `GEMINI_API_KEY` eintragen (ohne `VITE_`-Präfix, damit er nie im Browser landet). In der Google Cloud Console zusätzlich ein Tageskontingent setzen.
2. **Vercel mit diesem Repository verbinden** (Framework: Vite, Build: `npm run build`, Ausgabe: `dist`). `vercel.json` sorgt für saubere URLs und Sicherheits-Header.
3. **Datenbankregeln und Indizes veröffentlichen:**
   ```bash
   npx firebase-tools login
   ```
   ```bash
   npx firebase-tools deploy --only firestore --project hausmatch-1
   ```
4. **Firebase-Konsole:**
   - *Authentication → Templates*: Texte der Bestätigungs- und Passwort-Mail auf Deutsch stellen, Absendername „HausMatch“.
   - *Authentication → Settings → Authorized domains*: die Vercel-Domain eintragen.
   - *App Check* mit reCAPTCHA v3 aktivieren (empfohlen), danach für Firestore erzwingen.
   - In der Google Cloud Console den Browser-Schlüssel der Web-App auf die eigene Domain beschränken (HTTP-Referrer).
5. **Alt-Daten aufräumen:** In der Sammlung `inquiries` können alte Anfragen noch die Felder `ownerName` und `ownerEmail` enthalten. Diese Dokumente in der Konsole löschen oder die beiden Felder entfernen. Profile stellen sich beim nächsten Login des Nutzers automatisch um.
6. **Rechtstexte prüfen lassen:** Datenschutzerklärung und AGB in `components/LegalPages.tsx` sind auf die App zugeschnittene Entwürfe, keine Rechtsberatung.

Nachrichten aus dem Kontaktformular liegen in der Firestore-Sammlung `contact_messages` (Firebase-Konsole).
Ein Profil als „Von HausMatch geprüft“ kennzeichnen: im Dokument `users/{uid}` das Feld `verified` auf `true` setzen – das geht nur über die Konsole, nicht aus der App.

## Lokal entwickeln

```bash
npm install
```

Gegen die lokalen Firebase-Emulatoren (empfohlen, berührt keine echten Daten):

```bash
npm run emulators
```

```bash
VITE_USE_EMULATORS=true npm run dev
```

Die Serverfunktionen unter `/api` laufen lokal nur mit `npx vercel dev`. Ohne sie funktioniert die App weiter; Assistent, Einschätzung und News melden dann, dass sie gerade nicht verfügbar sind.

## Tests

```bash
npm run lint
```

```bash
npm run test:rules
```

```bash
npm run test:api
```

End-to-End (Emulatoren und ein Emulator-Build müssen laufen, siehe Kopf von `tests/e2e/run.mjs`):

```bash
npm run test:e2e
```

## Datenmodell (Firestore)

| Sammlung | Inhalt | Wer liest |
|---|---|---|
| `users/{uid}` | Öffentliches Profil. Keine E-Mail-Adresse. | Verwalter-Profile: alle. Eigentümer-Profile: angemeldete Nutzer |
| `users/{uid}/leadStates/{anfrage}` | Bearbeitungsstand eines Leads (neu/kontaktiert/archiviert) | nur der Verwalter selbst |
| `inquiries` | Anfragen ohne Namen und Kontaktdaten | Besitzer und Verwalter |
| `messages` | Postfach | Absender und Empfänger |
| `connections` | Vernetzungen (Anfrage → Annahme) | die beiden Beteiligten |
| `forum_threads`, `forum_replies` | Forum | öffentlich |
| `contact_messages` | Kontaktformular | niemand über die App |

Schreiben in Postfach, Forum und Netzwerk setzt eine bestätigte E-Mail-Adresse voraus. Rolle und Prüf-Kennzeichen kann ein Nutzer nicht selbst ändern.

## Bekannte Grenzen

- Die Ratenbegrenzung der Serverfunktionen zählt pro Funktionsinstanz und ist ein Bremsklotz, kein harter Schutz – deshalb das Kontingent am Schlüssel.
- Netzwerk und Trefferliste laden bis zu 300 Profile und filtern im Browser. Das reicht für den Start; bei deutlich mehr Verwaltungen braucht es eine serverseitige Suche.
- Es gibt keine Moderationsoberfläche. Beiträge und Konten lassen sich in der Firebase-Konsole entfernen.
- Benachrichtigungen per E-Mail (neue Nachricht, neuer Lead) gibt es noch nicht.

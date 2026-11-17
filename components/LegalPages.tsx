import React from 'react';
import { Link } from 'react-router-dom';
import { reopenConsent } from '../services/consent';
import { PageHeader } from './ui/Bits';

// HINWEIS FÜR DEN BETREIBER:
// Datenschutzerklärung und AGB sind sorgfältig auf diese App zugeschnittene ENTWÜRFE, aber keine Rechtsberatung.
// Bitte vor dem Livegang anwaltlich prüfen lassen (insbesondere Haftung, Auftragsverarbeiter, Speicherfristen).
const STAND = 'November 2026';

const Impressum = () => (
  <>
    <h2>Angaben gemäß § 5 DDG</h2>
    <p>
      B&amp;W Immobilien Management UG (haftungsbeschränkt)<br />
      Goethestraße 42<br />
      45964 Gladbeck<br />
      Deutschland
    </p>

    <h2>Vertreten durch</h2>
    <p>
      Franz-Josef Barth (Geschäftsführer)<br />
      Alexander Wachtel (stellvertretender Geschäftsführer)
    </p>

    <h2>Kontakt</h2>
    <p>
      Telefon: <a href="tel:+4915129468127">+49 151 29468127</a><br />
      E-Mail: <a href="mailto:info@bundwimmobilien.de">info@bundwimmobilien.de</a><br />
      Web: www.bundwimmobilien.de
    </p>

    <h2>Registereintrag</h2>
    <p>
      Eingetragen im Handelsregister beim Amtsgericht Gelsenkirchen<br />
      Handelsregisternummer: HRB 19149
    </p>

    <h2>Umsatzsteuer-ID</h2>
    <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz: DE456949310</p>

    <h2>Erlaubnis nach § 34c GewO</h2>
    <p>
      Zuständige Aufsichtsbehörde: Ordnungsamt Recklinghausen<br />
      Kurt-Schumacher-Allee 1<br />
      45657 Recklinghausen
    </p>

    <h2>Berufshaftpflichtversicherung</h2>
    <p>
      Provinzial<br />
      Asselner Hellweg 131<br />
      44319 Dortmund<br />
      Geltungsraum der Versicherung: Deutschland
    </p>

    <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
    <p>
      Franz-Josef Barth<br />
      Goethestraße 42<br />
      45964 Gladbeck
    </p>

    <h2>Verbraucherstreitbeilegung</h2>
    <p>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>

    <h2>Haftung für Inhalte der Nutzer</h2>
    <p>
      Profile, Forenbeiträge und Nachrichten stammen von den jeweiligen Nutzern. Wir machen uns diese Inhalte nicht zu eigen. Hinweise auf
      rechtswidrige Inhalte nehmen wir unter der oben genannten E-Mail-Adresse entgegen und prüfen sie unverzüglich.
    </p>
  </>
);

const Privacy = () => (
  <>
    <p>Stand: {STAND}</p>

    <h2>1. Verantwortlicher</h2>
    <p>
      B&amp;W Immobilien Management UG (haftungsbeschränkt), Goethestraße 42, 45964 Gladbeck, E-Mail:{' '}
      <a href="mailto:info@bundwimmobilien.de">info@bundwimmobilien.de</a>. Weitere Angaben im <Link to="/legal/impressum">Impressum</Link>.
    </p>

    <h2>2. Überblick: Welche Daten wir verarbeiten</h2>
    <ul>
      <li><strong>Beim Aufruf der Website:</strong> technische Zugriffsdaten (IP-Adresse, Zeitpunkt, aufgerufene Seite, Browser), die unser Hosting-Anbieter zur Auslieferung und Absicherung der Seite verarbeitet.</li>
      <li><strong>Konto:</strong> E-Mail-Adresse, Passwort (nur als Prüfwert gespeichert), gewählte Rolle (Eigentümer oder Hausverwaltung).</li>
      <li><strong>Profil:</strong> Name bzw. Firmenname, optional Bild/Logo, Beschreibung, Ort; bei Hausverwaltungen zusätzlich Einsatzgebiete, Objektarten, Telefon, Website, Firmendaten und Erreichbarkeit.</li>
      <li><strong>Anfragen:</strong> Angaben zum Objekt (Stadt, Einheiten, Objektart, Baujahr, Zustand, gewünschte Leistungen, Beschreibung).</li>
      <li><strong>Kommunikation:</strong> Nachrichten im Postfach, Forenbeiträge, Vernetzungen, Nachrichten über das Kontaktformular.</li>
    </ul>

    <h2>3. Zwecke und Rechtsgrundlagen</h2>
    <ul>
      <li>Bereitstellung der Plattform, des Kontos und der Funktionen (Matching, Postfach, Forum, Netzwerk): Art. 6 Abs. 1 lit. b DSGVO (Nutzungsvertrag).</li>
      <li>Sicherer und stabiler Betrieb, Missbrauchsabwehr: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).</li>
      <li>Beantwortung von Kontaktanfragen: Art. 6 Abs. 1 lit. b bzw. f DSGVO.</li>
      <li>Reichweitenmessung mit Google Analytics: nur mit Ihrer Einwilligung, Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG.</li>
    </ul>

    <h2>4. Wer was sehen kann</h2>
    <ul>
      <li><strong>Profile von Hausverwaltungen</strong> sind öffentlich abrufbar. <strong>Profile von Eigentümern</strong> sehen nur angemeldete Mitglieder.</li>
      <li><strong>Ihre E-Mail-Adresse</strong> ist für andere Mitglieder nicht sichtbar. Sie wird nur weitergegeben, wenn Sie im Postfach selbst „Kontaktdaten senden“ wählen.</li>
      <li><strong>Anfragen</strong> sind für registrierte Hausverwaltungen sichtbar – ohne Ihren Namen und ohne Kontaktdaten.</li>
      <li><strong>Forenbeiträge</strong> sind öffentlich lesbar und erscheinen mit Ihrem Profilnamen.</li>
      <li><strong>Nachrichten</strong> sehen nur Absender und Empfänger.</li>
    </ul>

    <h2>5. Eingesetzte Dienstleister</h2>
    <h3>Hosting: Vercel</h3>
    <p>
      Die Website wird bei Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA gehostet. Vercel verarbeitet dabei Zugriffsdaten in
      unserem Auftrag (Auftragsverarbeitung nach Art. 28 DSGVO). Vercel ist nach dem EU-US Data Privacy Framework zertifiziert.
    </p>
    <h3>Datenbank und Anmeldung: Google Firebase</h3>
    <p>
      Für Anmeldung (Firebase Authentication) und Datenspeicherung (Cloud Firestore) nutzen wir Dienste der Google Ireland Limited, Gordon
      House, Barrow Street, Dublin 4, Irland. Dort werden Kontodaten, Profile, Anfragen, Nachrichten und Forenbeiträge gespeichert. Eine
      Übermittlung an Google LLC in den USA ist möglich; Google ist nach dem EU-US Data Privacy Framework zertifiziert. Mit Google besteht
      ein Vertrag über die Auftragsverarbeitung.
    </p>
    <h3>KI-Funktionen: Google Gemini</h3>
    <p>
      Der KI-Assistent, die automatische Einschätzung von Anfragen und die Branchen-News nutzen die Gemini-API von Google. Dabei werden
      übermittelt: Ihre Eingaben im Assistenten bzw. die Objektangaben und die Beschreibung Ihrer Anfrage – nicht aber Ihr Name, Ihre
      E-Mail-Adresse oder Ihr Konto. Bitte geben Sie im Assistenten und in der Objektbeschreibung keine personenbezogenen Daten ein. Die
      Ergebnisse werden automatisch erzeugt und können Fehler enthalten; sie sind keine Rechts- oder Steuerberatung.
    </p>
    <h3>Reichweitenmessung: Google Analytics (nur mit Einwilligung)</h3>
    <p>
      Wenn Sie einwilligen, messen wir die Nutzung der Website mit Google Analytics (Google Ireland Limited). Dabei werden Cookies bzw.
      Kennungen gesetzt und Nutzungsdaten verarbeitet. Ohne Einwilligung wird Google Analytics nicht geladen. Sie können Ihre Auswahl
      jederzeit ändern:{' '}
      <button type="button" onClick={reopenConsent} className="text-brand-700 underline underline-offset-2">Cookie-Einstellungen öffnen</button>.
    </p>

    <h2>6. Speicherung auf Ihrem Gerät</h2>
    <p>
      Technisch notwendig und ohne Einwilligung zulässig (§ 25 Abs. 2 TDDDG) speichern wir in Ihrem Browser: Ihren Anmeldestatus, Ihre
      Cookie-Auswahl und – solange Sie eine Anfrage ausfüllen – den Entwurf Ihrer Objektangaben. Schriftarten werden von unserem eigenen
      Server geladen, nicht von Dritten.
    </p>

    <h2>7. Speicherdauer</h2>
    <p>
      Wir speichern Ihre Daten, solange Ihr Konto besteht. Sie können Anfragen jederzeit selbst löschen und Ihr Konto im Profil unter „Konto
      löschen“ entfernen; dabei werden Profil, Anfragen und Vernetzungen gelöscht. Bereits gesendete Nachrichten bleiben für die Empfänger
      erhalten, Forenbeiträge bleiben bestehen, sofern Sie sie nicht vorher löschen. Kontaktanfragen löschen wir, sobald sie erledigt sind
      und keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
    </p>

    <h2>8. Ihre Rechte</h2>
    <p>
      Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18),
      Datenübertragbarkeit (Art. 20) und Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21). Eine erteilte
      Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen. Wenden Sie sich dazu an die oben genannte Adresse.
    </p>
    <p>
      Außerdem können Sie sich bei einer Datenschutz-Aufsichtsbehörde beschweren, zum Beispiel bei der Landesbeauftragten für Datenschutz und
      Informationsfreiheit Nordrhein-Westfalen.
    </p>

    <h2>9. Pflicht zur Bereitstellung</h2>
    <p>Für die Nutzung von Konto, Postfach und Forum benötigen wir eine gültige E-Mail-Adresse. Ohne sie ist eine Registrierung nicht möglich.</p>
  </>
);

const Agb = () => (
  <>
    <p>Stand: {STAND}</p>

    <h2>1. Geltungsbereich und Anbieter</h2>
    <p>
      Diese Bedingungen gelten für die Nutzung der Plattform HausMatch der B&amp;W Immobilien Management UG (haftungsbeschränkt), Goethestraße
      42, 45964 Gladbeck („wir“). Abweichende Bedingungen der Nutzer gelten nicht.
    </p>

    <h2>2. Leistung der Plattform</h2>
    <p>
      HausMatch ermöglicht es Immobilieneigentümern, ihr Objekt zu beschreiben und passende Hausverwaltungen zu finden, sowie
      Hausverwaltungen, sich zu präsentieren und auf Anfragen zu antworten. Dazu kommen ein Postfach, ein Forum, ein Netzwerk, ein Ratgeber
      und Rechner.
    </p>
    <p>
      Wir stellen ausschließlich die technische Plattform bereit. Verträge über Verwaltungsleistungen kommen allein zwischen Eigentümern und
      Hausverwaltungen zustande. Wir werden nicht Vertragspartei, schulden keinen Vermittlungserfolg und prüfen die Angaben der Nutzer nicht
      im Einzelnen – es sei denn, ein Profil ist ausdrücklich als „Von HausMatch geprüft“ gekennzeichnet.
    </p>

    <h2>3. Registrierung und Konto</h2>
    <ul>
      <li>Die Registrierung ist kostenlos und steht volljährigen Personen sowie Unternehmen offen.</li>
      <li>Die Angaben bei der Registrierung müssen wahr und aktuell sein. Als Hausverwaltung darf sich nur registrieren, wer diese Tätigkeit tatsächlich ausübt und über erforderliche Erlaubnisse (insbesondere § 34c GewO) verfügt.</li>
      <li>Zugangsdaten sind geheim zu halten. Für Schreibfunktionen ist eine bestätigte E-Mail-Adresse erforderlich.</li>
    </ul>

    <h2>4. Kosten</h2>
    <p>
      Die Nutzung ist derzeit für alle Nutzer kostenlos. Sollten wir künftig kostenpflichtige Leistungen anbieten, geschieht das nur nach
      ausdrücklicher Vereinbarung.
    </p>

    <h2>5. Pflichten der Nutzer</h2>
    <ul>
      <li>Keine rechtswidrigen, beleidigenden, irreführenden oder werblichen Massen-Inhalte (Spam).</li>
      <li>Keine personenbezogenen Daten Dritter ohne deren Einverständnis veröffentlichen – insbesondere nicht im öffentlich lesbaren Forum.</li>
      <li>Kontaktdaten, die ein Eigentümer freigibt, dürfen nur zur Bearbeitung der jeweiligen Anfrage verwendet werden.</li>
      <li>Kein automatisiertes Auslesen der Plattform und keine Eingriffe in deren Technik.</li>
    </ul>

    <h2>6. Inhalte der Nutzer</h2>
    <p>
      Nutzer bleiben Inhaber ihrer Inhalte. Sie räumen uns das einfache, auf die Dauer der Veröffentlichung beschränkte Recht ein, die
      Inhalte auf der Plattform anzuzeigen. Wir dürfen Inhalte entfernen und Konten sperren, wenn konkrete Anhaltspunkte für einen Verstoß
      gegen diese Bedingungen oder gegen geltendes Recht vorliegen.
    </p>

    <h2>7. KI-Funktionen, Ratgeber und Rechner</h2>
    <p>
      Antworten des KI-Assistenten, automatische Einschätzungen, Ratgeber-Inhalte und Rechenergebnisse sind allgemeine Informationen. Sie
      können Fehler enthalten und ersetzen keine Rechts-, Steuer- oder Finanzierungsberatung im Einzelfall.
    </p>

    <h2>8. Verfügbarkeit</h2>
    <p>Wir bemühen uns um einen störungsfreien Betrieb, schulden aber keine bestimmte Verfügbarkeit. Wartungsarbeiten können zu Unterbrechungen führen.</p>

    <h2>9. Haftung</h2>
    <p>
      Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei Verletzung von Leben, Körper oder Gesundheit sowie nach dem
      Produkthaftungsgesetz. Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten ist die Haftung auf den vertragstypischen,
      vorhersehbaren Schaden begrenzt. Im Übrigen ist die Haftung ausgeschlossen. Für Inhalte und das Verhalten anderer Nutzer sowie für das
      Zustandekommen oder die Erfüllung von Verträgen zwischen Nutzern haften wir nicht.
    </p>

    <h2>10. Laufzeit und Beendigung</h2>
    <p>
      Nutzer können ihr Konto jederzeit im Profil löschen. Wir können das Nutzungsverhältnis mit einer Frist von zwei Wochen in Textform
      kündigen; das Recht zur fristlosen Kündigung aus wichtigem Grund bleibt unberührt.
    </p>

    <h2>11. Änderungen dieser Bedingungen</h2>
    <p>
      Über Änderungen informieren wir registrierte Nutzer per E-Mail mindestens vier Wochen vor Inkrafttreten. Widerspricht ein Nutzer nicht
      innerhalb dieser Frist, gelten die Änderungen als angenommen; darauf weisen wir in der Mitteilung gesondert hin.
    </p>

    <h2>12. Schlussbestimmungen</h2>
    <p>
      Es gilt deutsches Recht. Gegenüber Verbrauchern gilt dies nur, soweit ihnen dadurch nicht der Schutz zwingender Vorschriften ihres
      gewöhnlichen Aufenthaltsstaates entzogen wird. Ist der Nutzer Kaufmann, ist Gerichtsstand unser Sitz. Sollte eine Bestimmung unwirksam
      sein, bleibt der Vertrag im Übrigen wirksam.
    </p>
  </>
);

const TITLES = { impressum: 'Impressum', privacy: 'Datenschutzerklärung', agb: 'Allgemeine Geschäftsbedingungen' };

const LegalPage: React.FC<{ type: keyof typeof TITLES }> = ({ type }) => (
  <>
  <PageHeader eyebrow="Rechtliches" title={TITLES[type]} width="max-w-3xl" />
  <div className="page max-w-3xl">
    <div className="prose-hm">
      {type === 'impressum' && <Impressum />}
      {type === 'privacy' && <Privacy />}
      {type === 'agb' && <Agb />}
    </div>
  </div>
  </>
);

export default LegalPage;

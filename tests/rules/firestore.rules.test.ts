import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, deleteField, doc, getDoc, getDocs, collection, query, where, serverTimestamp, setDoc, updateDoc, addDoc, increment, orderBy, limit } from 'firebase/firestore';

// Start: npm run test:rules  (startet den Firestore-Emulator und führt diese Datei aus)
let env: RulesTestEnvironment;

const owner = () => env.authenticatedContext('owner', { email_verified: true }).firestore();
const owner2 = () => env.authenticatedContext('owner2', { email_verified: true }).firestore();
const manager = () => env.authenticatedContext('manager', { email_verified: true }).firestore();
const unverified = () => env.authenticatedContext('newbie', { email_verified: false }).firestore();
const guest = () => env.unauthenticatedContext().firestore();

const inquiry = (ownerId: string, extra: Record<string, unknown> = {}) => ({
  ownerId,
  city: 'Essen',
  cityLower: 'essen',
  units: 12,
  propertyType: 'WEG',
  servicesNeeded: ['WEG-Verwaltung'],
  buildingAge: '1985',
  condition: 'Gepflegt',
  description: 'Wir suchen eine neue Verwaltung für unsere WEG.',
  status: 'offen',
  createdAt: serverTimestamp(),
  ...extra,
});

const message = (senderId: string, senderName: string, receiverId: string, extra: Record<string, unknown> = {}) => ({
  senderId,
  senderName,
  receiverId,
  receiverName: 'Empfänger',
  subject: 'Hallo',
  content: 'Guten Tag',
  timestamp: serverTimestamp(),
  read: false,
  ...extra,
});

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-hausmatch',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});
afterAll(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users/owner'), { name: 'Olga Owner', nameLower: 'olga owner', role: 'seeker' });
    await setDoc(doc(db, 'users/owner2'), { name: 'Otto Owner', nameLower: 'otto owner', role: 'seeker' });
    await setDoc(doc(db, 'users/newbie'), { name: 'Nina Neu', nameLower: 'nina neu', role: 'seeker' });
    await setDoc(doc(db, 'users/manager'), { name: 'Muster Verwaltung', nameLower: 'muster verwaltung', role: 'manager', serviceCities: ['essen'] });
    await setDoc(doc(db, 'inquiries/inq1'), { ...inquiry('owner'), createdAt: new Date() });
    await setDoc(doc(db, 'messages/m1'), { ...message('manager', 'Muster Verwaltung', 'owner'), timestamp: new Date() });
    await setDoc(doc(db, 'forum_threads/t1'), { title: 'Frage', content: 'Text', author: 'Olga Owner', authorId: 'owner', category: 'Feedback', replies: 0, createdAt: new Date() });
    await setDoc(doc(db, 'connections/manager_owner'), { users: ['manager', 'owner'], requesterId: 'owner', status: 'pending', createdAt: new Date() });
  });
});

describe('Profile', () => {
  it('Gäste sehen Verwalter-Profile, aber keine Eigentümer-Profile', async () => {
    await assertSucceeds(getDoc(doc(guest(), 'users/manager')));
    await assertFails(getDoc(doc(guest(), 'users/owner')));
    await assertSucceeds(getDocs(query(collection(guest(), 'users'), where('role', '==', 'manager'))));
    await assertFails(getDocs(collection(guest(), 'users')));
  });
  it('Angemeldete sehen alle Profile', async () => {
    await assertSucceeds(getDoc(doc(owner(), 'users/owner2')));
    await assertSucceeds(getDocs(collection(owner(), 'users')));
  });
  it('Nutzer können die eigene Rolle nicht ändern', async () => {
    await assertFails(updateDoc(doc(owner(), 'users/owner'), { role: 'manager' }));
  });
  it('Nutzer können sich nicht selbst als geprüft markieren', async () => {
    await assertFails(updateDoc(doc(manager(), 'users/manager'), { verified: true }));
    await assertFails(setDoc(doc(env.authenticatedContext('x').firestore(), 'users/x'), { name: 'X', role: 'manager', verified: true }));
  });
  it('Eigene Profilfelder dürfen geändert werden – fremde Profile nicht', async () => {
    await assertSucceeds(updateDoc(doc(manager(), 'users/manager'), { bio: 'Neu', minUnits: 5, propertyTypes: ['WEG'] }));
    await assertFails(updateDoc(doc(owner(), 'users/manager'), { bio: 'gekapert' }));
  });
  it('Unbekannte Felder (z. B. E-Mail) und zu große Bilder werden abgelehnt', async () => {
    await assertFails(updateDoc(doc(owner(), 'users/owner'), { email: 'olga@example.org' }));
    await assertFails(updateDoc(doc(owner(), 'users/owner'), { avatar: 'x'.repeat(200001) }));
    await assertSucceeds(updateDoc(doc(owner(), 'users/owner'), { avatar: 'x'.repeat(50000) }));
  });
  it('Alt-Profile lassen sich umstellen (Alt-Felder entfernen)', async () => {
    await env.withSecurityRulesDisabled(ctx =>
      setDoc(doc(ctx.firestore(), 'users/legacy'), { id: 'legacy', name: 'Alt', role: 'seeker', email: 'alt@example.org', friends: ['a'], pendingFriends: [], avatar: 'x'.repeat(900000) }),
    );
    const legacy = env.authenticatedContext('legacy').firestore();
    await assertSucceeds(updateDoc(doc(legacy, 'users/legacy'), { nameLower: 'alt', id: deleteField(), email: deleteField(), friends: deleteField(), pendingFriends: deleteField() }));
  });
  it('Neues Profil nur unter der eigenen ID', async () => {
    const fresh = env.authenticatedContext('fresh').firestore();
    await assertSucceeds(setDoc(doc(fresh, 'users/fresh'), { name: 'Frisch', nameLower: 'frisch', role: 'manager', createdAt: serverTimestamp() }));
    await assertFails(setDoc(doc(fresh, 'users/other'), { name: 'Frisch', role: 'seeker' }));
  });
});

describe('Anfragen', () => {
  it('Eigentümer legt eine Anfrage an – auch ohne bestätigte E-Mail', async () => {
    await assertSucceeds(addDoc(collection(owner(), 'inquiries'), inquiry('owner')));
    await assertSucceeds(addDoc(collection(unverified(), 'inquiries'), inquiry('newbie')));
  });
  it('Gäste und fremde Besitzer-IDs werden abgelehnt', async () => {
    await assertFails(addDoc(collection(guest(), 'inquiries'), inquiry('gast')));
    await assertFails(addDoc(collection(owner(), 'inquiries'), inquiry('owner2')));
  });
  it('Kontaktdaten und ungültige Werte werden abgelehnt', async () => {
    await assertFails(addDoc(collection(owner(), 'inquiries'), inquiry('owner', { ownerEmail: 'olga@example.org' })));
    await assertFails(addDoc(collection(owner(), 'inquiries'), inquiry('owner', { units: 0 })));
    await assertFails(addDoc(collection(owner(), 'inquiries'), inquiry('owner', { status: 'geschlossen' })));
    await assertFails(addDoc(collection(owner(), 'inquiries'), inquiry('owner', { description: 'kurz' })));
  });
  it('Verwalter lesen Anfragen, andere Eigentümer nicht', async () => {
    await assertSucceeds(getDoc(doc(manager(), 'inquiries/inq1')));
    await assertSucceeds(getDocs(query(collection(manager(), 'inquiries'), orderBy('createdAt', 'desc'), limit(10))));
    await assertSucceeds(getDocs(query(collection(owner(), 'inquiries'), where('ownerId', '==', 'owner'))));
    await assertFails(getDoc(doc(owner2(), 'inquiries/inq1')));
    await assertFails(getDocs(collection(owner2(), 'inquiries')));
  });
  it('Verwalter können Anfragen nicht verändern; Eigentümer nur den Status', async () => {
    await assertFails(updateDoc(doc(manager(), 'inquiries/inq1'), { status: 'geschlossen' }));
    await assertSucceeds(updateDoc(doc(owner(), 'inquiries/inq1'), { status: 'geschlossen' }));
    await assertFails(updateDoc(doc(owner(), 'inquiries/inq1'), { city: 'Köln' }));
    await assertFails(deleteDoc(doc(manager(), 'inquiries/inq1')));
    await assertSucceeds(deleteDoc(doc(owner(), 'inquiries/inq1')));
  });
  it('Lead-Status ist privat pro Verwalter', async () => {
    await assertSucceeds(setDoc(doc(manager(), 'users/manager/leadStates/inq1'), { status: 'kontaktiert', updatedAt: serverTimestamp() }));
    await assertFails(setDoc(doc(manager(), 'users/manager/leadStates/inq1'), { status: 'irgendwas' }));
    await assertFails(getDoc(doc(owner(), 'users/manager/leadStates/inq1')));
  });
});

describe('Postfach', () => {
  it('Senden nur mit bestätigter E-Mail, eigener ID und eigenem Namen', async () => {
    await assertSucceeds(addDoc(collection(owner(), 'messages'), message('owner', 'Olga Owner', 'manager')));
    await assertFails(addDoc(collection(unverified(), 'messages'), message('newbie', 'Nina Neu', 'manager')));
    await assertFails(addDoc(collection(owner(), 'messages'), message('manager', 'Muster Verwaltung', 'owner2')));
    await assertFails(addDoc(collection(owner(), 'messages'), message('owner', 'Muster Verwaltung', 'manager')));
    await assertFails(addDoc(collection(owner(), 'messages'), message('owner', 'Olga Owner', 'gibt-es-nicht')));
    await assertFails(addDoc(collection(owner(), 'messages'), message('owner', 'Olga Owner', 'manager', { read: true })));
  });
  it('Nur Beteiligte lesen; Empfänger darf nur „gelesen“ setzen', async () => {
    await assertSucceeds(getDoc(doc(owner(), 'messages/m1')));
    await assertFails(getDoc(doc(owner2(), 'messages/m1')));
    await assertSucceeds(getDocs(query(collection(owner(), 'messages'), where('receiverId', '==', 'owner'))));
    await assertFails(getDocs(collection(owner(), 'messages')));
    await assertFails(updateDoc(doc(owner(), 'messages/m1'), { content: 'verfälscht' }));
    await assertFails(updateDoc(doc(manager(), 'messages/m1'), { read: true }));
    await assertSucceeds(updateDoc(doc(owner(), 'messages/m1'), { read: true }));
  });
});

describe('Forum', () => {
  it('Öffentlich lesbar; Schreiben nur mit bestätigter E-Mail und eigenem Namen', async () => {
    await assertSucceeds(getDocs(collection(guest(), 'forum_threads')));
    const thread = { title: 'Neues Thema', content: 'Inhalt', author: 'Olga Owner', authorId: 'owner', category: 'Feedback', replies: 0, createdAt: serverTimestamp() };
    await assertSucceeds(addDoc(collection(owner(), 'forum_threads'), thread));
    await assertFails(addDoc(collection(guest(), 'forum_threads'), thread));
    await assertFails(addDoc(collection(unverified(), 'forum_threads'), { ...thread, author: 'Nina Neu', authorId: 'newbie' }));
    await assertFails(addDoc(collection(owner(), 'forum_threads'), { ...thread, author: 'Jemand Anderes' }));
  });
  it('Antworten und Zähler', async () => {
    await assertSucceeds(addDoc(collection(manager(), 'forum_replies'), { threadId: 't1', content: 'Antwort', author: 'Muster Verwaltung', authorId: 'manager', createdAt: serverTimestamp() }));
    await assertFails(addDoc(collection(manager(), 'forum_replies'), { threadId: 'fehlt', content: 'Antwort', author: 'Muster Verwaltung', authorId: 'manager', createdAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(doc(manager(), 'forum_threads/t1'), { replies: increment(1), lastActivity: serverTimestamp() }));
    await assertFails(updateDoc(doc(manager(), 'forum_threads/t1'), { replies: increment(5), lastActivity: serverTimestamp() }));
    await assertFails(updateDoc(doc(manager(), 'forum_threads/t1'), { content: 'überschrieben' }));
  });
  it('Nur der Autor löscht sein Thema', async () => {
    await assertFails(deleteDoc(doc(manager(), 'forum_threads/t1')));
    await assertSucceeds(deleteDoc(doc(owner(), 'forum_threads/t1')));
  });
});

describe('Netzwerk', () => {
  it('Anfrage senden, nur die Gegenseite kann annehmen', async () => {
    await assertSucceeds(setDoc(doc(owner2(), 'connections/manager_owner2'), { users: ['manager', 'owner2'], requesterId: 'owner2', status: 'pending', createdAt: serverTimestamp() }));
    await assertFails(setDoc(doc(owner2(), 'connections/owner_owner2'), { users: ['owner', 'owner2'], requesterId: 'owner2', status: 'accepted', createdAt: serverTimestamp() }));
    await assertFails(setDoc(doc(owner2(), 'connections/manager_owner'), { users: ['manager', 'owner'], requesterId: 'owner2', status: 'pending', createdAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(owner(), 'connections/manager_owner'), { status: 'accepted' }));
    await assertSucceeds(updateDoc(doc(manager(), 'connections/manager_owner'), { status: 'accepted' }));
    await assertFails(getDoc(doc(owner2(), 'connections/manager_owner')));
    await assertSucceeds(getDocs(query(collection(owner(), 'connections'), where('users', 'array-contains', 'owner'))));
    await assertSucceeds(deleteDoc(doc(owner(), 'connections/manager_owner')));
  });
});

describe('Kontaktformular', () => {
  it('Jeder darf schreiben, niemand lesen', async () => {
    const ref = await assertSucceeds(addDoc(collection(guest(), 'contact_messages'), { name: 'Gast', email: 'gast@example.org', message: 'Eine Frage an das Team.', createdAt: serverTimestamp() }));
    await assertFails(getDoc(ref as any));
    await assertFails(addDoc(collection(guest(), 'contact_messages'), { name: 'Gast', email: 'gast@example.org', message: 'kurz', createdAt: serverTimestamp() }));
  });
});

describe('Alles andere ist gesperrt', () => {
  it('Unbekannte Sammlungen', async () => {
    await assertFails(setDoc(doc(owner(), 'irgendwas/x'), { a: 1 }));
    await assertFails(getDoc(doc(owner(), 'irgendwas/x')));
  });
});

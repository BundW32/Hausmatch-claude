import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { normalizeCity } from './matching';
import {
  Connection,
  ForumReply,
  ForumThread,
  Inquiry,
  InquiryAnalysis,
  InquiryStatus,
  LeadStatus,
  Message,
  Profile,
  PropertyType,
  UserRole,
} from '../types';

const USERS = 'users';
const INQUIRIES = 'inquiries';
const THREADS = 'forum_threads';
const REPLIES = 'forum_replies';
const MESSAGES = 'messages';
const CONNECTIONS = 'connections';
const CONTACT = 'contact_messages';

// ------------------------------------------------------------------ Helfer

const clampInt = (v: unknown, min: number, max: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : 0;
};
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

const toProfile = (id: string, d: DocumentData): Profile => ({
  id,
  name: typeof d.name === 'string' && d.name ? d.name : 'Nutzer',
  role: d.role === 'manager' ? 'manager' : 'seeker',
  avatar: d.avatar || '',
  bio: d.bio || '',
  location: d.location || '',
  phone: d.phone || '',
  website: d.website || '',
  openingHours: d.openingHours || {},
  teamSize: d.teamSize || 0,
  foundedYear: d.foundedYear || 0,
  vatId: d.vatId || '',
  serviceCities: Array.isArray(d.serviceCities) ? d.serviceCities : [],
  propertyTypes: Array.isArray(d.propertyTypes) ? d.propertyTypes : [],
  minUnits: d.minUnits || 0,
  maxUnits: d.maxUnits || 0,
  verified: d.verified === true,
});

/** Nur Felder, die ein Nutzer selbst pflegen darf – passend zu firestore.rules. */
const profileWriteData = (data: Partial<Profile>) => {
  const out: Record<string, unknown> = {};
  if (data.name !== undefined) {
    out.name = str(data.name, 80) || 'Nutzer';
    out.nameLower = (out.name as string).toLowerCase();
  }
  if (data.avatar !== undefined) out.avatar = data.avatar;
  if (data.bio !== undefined) out.bio = str(data.bio, 1500);
  if (data.location !== undefined) out.location = str(data.location, 120);
  if (data.phone !== undefined) out.phone = str(data.phone, 40);
  if (data.website !== undefined) out.website = str(data.website, 200);
  if (data.vatId !== undefined) out.vatId = str(data.vatId, 30);
  if (data.teamSize !== undefined) out.teamSize = clampInt(data.teamSize, 0, 100000);
  if (data.foundedYear !== undefined) out.foundedYear = clampInt(data.foundedYear, 0, 2100);
  if (data.minUnits !== undefined) out.minUnits = clampInt(data.minUnits, 0, 100000);
  if (data.maxUnits !== undefined) out.maxUnits = clampInt(data.maxUnits, 0, 100000);
  if (data.openingHours !== undefined) out.openingHours = data.openingHours;
  if (data.serviceCities !== undefined) {
    out.serviceCities = [...new Set(data.serviceCities.map(normalizeCity).filter(Boolean))].slice(0, 30);
  }
  if (data.propertyTypes !== undefined) out.propertyTypes = data.propertyTypes.slice(0, 3);
  return out;
};

// --------------------------------------------------------------------- Auth

let registration: Promise<unknown> | null = null;

export const registerUser = (email: string, password: string, name: string, role: UserRole, avatar: string, bio: string) => {
  const run = (async () => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, USERS, cred.user.uid), {
      ...profileWriteData({ name, avatar, bio }),
      role,
      createdAt: serverTimestamp(),
    });
    // Bestätigungs-Mail: ein Fehler hier darf die Registrierung nicht abbrechen.
    await sendEmailVerification(cred.user).catch(() => undefined);
    return cred.user;
  })();
  registration = run.catch(() => undefined);
  return run;
};

export const loginUser = (email: string, password: string) => signInWithEmailAndPassword(auth, email, password);
export const logoutUser = () => signOut(auth);
export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

export const resendVerification = async () => {
  if (auth.currentUser) await sendEmailVerification(auth.currentUser);
};

/** Liest den Bestätigungsstatus neu ein und erneuert das Token, damit die Firestore-Regeln ihn sehen. */
export const refreshVerification = async (): Promise<boolean> => {
  if (!auth.currentUser) return false;
  await auth.currentUser.reload();
  if (auth.currentUser.emailVerified) await auth.currentUser.getIdToken(true);
  return auth.currentUser.emailVerified;
};

/**
 * Lädt das Profil des angemeldeten Nutzers. Legt es an, falls es fehlt (verwaistes Konto),
 * und stellt Alt-Profile auf den aktuellen Aufbau um (E-Mail und Freundeslisten raus aus dem öffentlichen Profil).
 */
export const loadOwnProfile = async (fbUser: FirebaseUser): Promise<Profile> => {
  if (registration) await registration;
  const ref = doc(db, USERS, fbUser.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const name = (fbUser.email || 'Nutzer').split('@')[0].slice(0, 80) || 'Nutzer';
    const data = { name, nameLower: name.toLowerCase(), role: 'seeker' as UserRole, createdAt: serverTimestamp() };
    await setDoc(ref, data);
    return toProfile(fbUser.uid, data);
  }

  const d = snap.data();
  const legacy = ['email', 'friends', 'pendingFriends', 'id'].filter(k => k in d);
  const needsName = typeof d.name !== 'string' || !d.name;
  if (legacy.length > 0 || needsName || !d.nameLower) {
    const name = needsName ? 'Nutzer' : (d.name as string).slice(0, 80);
    const patch: Record<string, unknown> = { name, nameLower: name.toLowerCase() };
    legacy.forEach(k => (patch[k] = deleteField()));
    await updateDoc(ref, patch).catch(err => console.warn('Profil-Umstellung übersprungen:', err?.code || err));
  }
  return toProfile(fbUser.uid, d);
};

export const deleteAccount = async (password: string) => {
  const fbUser = auth.currentUser;
  if (!fbUser || !fbUser.email) throw new Error('Nicht angemeldet');
  await reauthenticateWithCredential(fbUser, EmailAuthProvider.credential(fbUser.email, password));
  const uid = fbUser.uid;
  const [inq, conns, leads] = await Promise.all([
    getDocs(query(collection(db, INQUIRIES), where('ownerId', '==', uid))),
    getDocs(query(collection(db, CONNECTIONS), where('users', 'array-contains', uid))),
    getDocs(collection(db, USERS, uid, 'leadStates')),
  ]);
  const batch = writeBatch(db);
  [...inq.docs, ...conns.docs, ...leads.docs].slice(0, 450).forEach(d => batch.delete(d.ref));
  batch.delete(doc(db, USERS, uid));
  await batch.commit();
  await deleteUser(fbUser);
};

// ------------------------------------------------------------------ Profile

export const getProfile = async (uid: string): Promise<Profile | null> => {
  try {
    const snap = await getDoc(doc(db, USERS, uid));
    return snap.exists() ? toProfile(snap.id, snap.data()) : null;
  } catch (err: any) {
    // Gäste dürfen nur Verwalter-Profile lesen – alles andere gilt für sie als „nicht gefunden“.
    if (err?.code === 'permission-denied') return null;
    throw err;
  }
};

export const updateOwnProfile = (uid: string, data: Partial<Profile>) =>
  updateDoc(doc(db, USERS, uid), { ...profileWriteData(data), updatedAt: serverTimestamp() });

/** Verzeichnis: Gäste sehen nur Verwalter, angemeldete Nutzer alle Mitglieder. */
export const listProfiles = async (opts: { managersOnly: boolean }): Promise<Profile[]> => {
  const base = collection(db, USERS);
  const q = opts.managersOnly ? query(base, where('role', '==', 'manager'), limit(300)) : query(base, limit(300));
  const snap = await getDocs(q);
  return snap.docs.map(d => toProfile(d.id, d.data())).sort((a, b) => a.name.localeCompare(b.name, 'de'));
};

// ----------------------------------------------------------------- Anfragen

const toInquiry = (d: QueryDocumentSnapshot<DocumentData> | { id: string; data: () => DocumentData }): Inquiry => {
  const x = d.data();
  return {
    id: d.id,
    ownerId: x.ownerId,
    city: x.city || '',
    cityLower: x.cityLower || normalizeCity(x.city || ''),
    units: Number(x.units) || 0,
    propertyType: x.propertyType,
    servicesNeeded: Array.isArray(x.servicesNeeded) ? x.servicesNeeded : [],
    buildingAge: x.buildingAge || '',
    condition: x.condition || '',
    description: x.description || '',
    // Alt-Daten kannten weitere Status – alles außer „geschlossen“ gilt als offen.
    status: x.status === 'geschlossen' || x.status === 'closed' ? 'geschlossen' : 'offen',
    createdAt: x.createdAt ?? null,
    aiAnalysis: x.aiAnalysis,
  };
};
const byNewest = (a: Inquiry, b: Inquiry) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);

export interface InquiryInput {
  city: string;
  units: number;
  propertyType: PropertyType;
  servicesNeeded: string[];
  buildingAge: string;
  condition: string;
  description: string;
}

export const createInquiry = async (ownerId: string, input: InquiryInput, aiAnalysis: InquiryAnalysis | null) => {
  const ref = await addDoc(collection(db, INQUIRIES), {
    ownerId,
    city: str(input.city, 80),
    cityLower: normalizeCity(input.city).slice(0, 80),
    units: clampInt(input.units, 1, 100000),
    propertyType: input.propertyType,
    servicesNeeded: input.servicesNeeded.slice(0, 12),
    buildingAge: str(input.buildingAge, 20),
    condition: str(input.condition, 40),
    description: str(input.description, 4000),
    status: 'offen',
    createdAt: serverTimestamp(),
    ...(aiAnalysis ? { aiAnalysis } : {}),
  });
  return ref.id;
};

export const getInquiry = async (id: string): Promise<Inquiry | null> => {
  const snap = await getDoc(doc(db, INQUIRIES, id));
  return snap.exists() ? toInquiry(snap) : null;
};

export const getMyInquiries = async (uid: string): Promise<Inquiry[]> => {
  const snap = await getDocs(query(collection(db, INQUIRIES), where('ownerId', '==', uid)));
  return snap.docs.map(toInquiry).sort(byNewest);
};

/** Für Verwalter: die neuesten Anfragen (ohne Kontaktdaten). */
export const getLeads = async (): Promise<Inquiry[]> => {
  const snap = await getDocs(query(collection(db, INQUIRIES), orderBy('createdAt', 'desc'), limit(200)));
  return snap.docs.map(toInquiry).filter(i => i.status === 'offen');
};

export const setInquiryStatus = (id: string, status: InquiryStatus) =>
  updateDoc(doc(db, INQUIRIES, id), { status, ownerName: deleteField(), ownerEmail: deleteField() });

export const deleteInquiry = (id: string) => deleteDoc(doc(db, INQUIRIES, id));

export const getLeadStates = async (uid: string): Promise<Record<string, LeadStatus>> => {
  const snap = await getDocs(collection(db, USERS, uid, 'leadStates'));
  const out: Record<string, LeadStatus> = {};
  snap.docs.forEach(d => (out[d.id] = d.data().status));
  return out;
};

export const setLeadState = (uid: string, inquiryId: string, status: LeadStatus) =>
  setDoc(doc(db, USERS, uid, 'leadStates', inquiryId), { status, updatedAt: serverTimestamp() });

// ----------------------------------------------------------------- Postfach

export interface OutgoingMessage {
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  subject: string;
  content: string;
  inquiryId?: string;
}

export const sendMessage = (m: OutgoingMessage) =>
  addDoc(collection(db, MESSAGES), {
    senderId: m.senderId,
    senderName: m.senderName,
    receiverId: m.receiverId,
    receiverName: str(m.receiverName, 80) || 'Nutzer',
    subject: str(m.subject, 150),
    content: m.content.trim().slice(0, 4000),
    ...(m.inquiryId ? { inquiryId: m.inquiryId } : {}),
    timestamp: serverTimestamp(),
    read: false,
  });

/** Live-Abo aller Nachrichten eines Nutzers (gesendet + empfangen), älteste zuerst. */
export const subscribeMessages = (uid: string, onData: (messages: Message[]) => void, onError: (err: Error) => void) => {
  let sent: Message[] = [];
  let received: Message[] = [];
  let ready = 0;
  const emit = () => {
    if (ready < 2) return;
    const all = [...sent, ...received].sort((a, b) => (a.timestamp?.seconds ?? Infinity) - (b.timestamp?.seconds ?? Infinity));
    onData(all);
  };
  const map = (d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }) as Message;
  let sentReady = false;
  let receivedReady = false;
  const unsubSent = onSnapshot(
    query(collection(db, MESSAGES), where('senderId', '==', uid), orderBy('timestamp', 'desc'), limit(300)),
    snap => {
      sent = snap.docs.map(map);
      if (!sentReady) { sentReady = true; ready++; }
      emit();
    },
    onError,
  );
  const unsubReceived = onSnapshot(
    query(collection(db, MESSAGES), where('receiverId', '==', uid), orderBy('timestamp', 'desc'), limit(300)),
    snap => {
      received = snap.docs.map(map);
      if (!receivedReady) { receivedReady = true; ready++; }
      emit();
    },
    onError,
  );
  return () => {
    unsubSent();
    unsubReceived();
  };
};

export const subscribeUnreadCount = (uid: string, onData: (count: number) => void) =>
  onSnapshot(
    query(collection(db, MESSAGES), where('receiverId', '==', uid), where('read', '==', false), limit(100)),
    snap => onData(snap.size),
    () => onData(0),
  );

export const markMessagesRead = async (ids: string[]) => {
  if (ids.length === 0) return;
  const batch = writeBatch(db);
  ids.slice(0, 400).forEach(id => batch.update(doc(db, MESSAGES, id), { read: true }));
  await batch.commit();
};

// ----------------------------------------------------------------- Netzwerk

export const connectionId = (a: string, b: string) => (a < b ? `${a}_${b}` : `${b}_${a}`);

export const subscribeConnections = (uid: string, onData: (connections: Connection[]) => void) =>
  onSnapshot(
    query(collection(db, CONNECTIONS), where('users', 'array-contains', uid)),
    snap => onData(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Connection)),
    () => onData([]),
  );

export const requestConnection = (myUid: string, otherUid: string) =>
  setDoc(doc(db, CONNECTIONS, connectionId(myUid, otherUid)), {
    users: [myUid, otherUid].sort(),
    requesterId: myUid,
    status: 'pending',
    createdAt: serverTimestamp(),
  });

export const acceptConnection = (myUid: string, otherUid: string) =>
  updateDoc(doc(db, CONNECTIONS, connectionId(myUid, otherUid)), { status: 'accepted' });

export const removeConnection = (myUid: string, otherUid: string) =>
  deleteDoc(doc(db, CONNECTIONS, connectionId(myUid, otherUid)));

// -------------------------------------------------------------------- Forum

const toThread = (d: QueryDocumentSnapshot<DocumentData> | { id: string; data: (o?: any) => DocumentData }): ForumThread => {
  const x = d.data({ serverTimestamps: 'estimate' });
  return {
    id: d.id,
    title: x.title || '',
    content: x.content || '',
    author: x.author || 'Nutzer',
    authorId: x.authorId || '',
    category: x.category || '',
    replies: Number(x.replies) || 0,
    createdAt: x.createdAt ?? null,
    lastActivity: x.lastActivity ?? null,
  };
};

export const subscribeThreads = (max: number, onData: (threads: ForumThread[], hasMore: boolean) => void, onError: (e: Error) => void) =>
  onSnapshot(
    query(collection(db, THREADS), orderBy('createdAt', 'desc'), limit(max + 1)),
    snap => onData(snap.docs.slice(0, max).map(toThread), snap.docs.length > max),
    onError,
  );

export const subscribeThread = (id: string, onData: (thread: ForumThread | null) => void, onError: (e: Error) => void) =>
  onSnapshot(doc(db, THREADS, id), snap => onData(snap.exists() ? toThread(snap) : null), onError);

export const subscribeReplies = (threadId: string, onData: (replies: ForumReply[]) => void, onError: (e: Error) => void) =>
  onSnapshot(
    query(collection(db, REPLIES), where('threadId', '==', threadId)),
    snap =>
      onData(
        snap.docs
          .map(d => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }) as ForumReply)
          .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)),
      ),
    onError,
  );

export const createThread = async (author: { id: string; name: string }, t: { title: string; category: string; content: string }) => {
  const ref = await addDoc(collection(db, THREADS), {
    title: str(t.title, 150),
    content: t.content.trim().slice(0, 8000),
    category: t.category,
    author: author.name,
    authorId: author.id,
    replies: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const createReply = async (author: { id: string; name: string }, threadId: string, content: string) => {
  await addDoc(collection(db, REPLIES), {
    threadId,
    content: content.trim().slice(0, 8000),
    author: author.name,
    authorId: author.id,
    createdAt: serverTimestamp(),
  });
  // Zähler ist nur Komfort – scheitert er, bleibt die Antwort trotzdem bestehen.
  await updateDoc(doc(db, THREADS, threadId), { replies: increment(1), lastActivity: serverTimestamp() }).catch(() => undefined);
};

export const deleteThread = (id: string) => deleteDoc(doc(db, THREADS, id));
export const deleteReply = (id: string) => deleteDoc(doc(db, REPLIES, id));

// ----------------------------------------------------------- Kontaktformular

export const sendContactMessage = (m: { name: string; email: string; message: string }) =>
  addDoc(collection(db, CONTACT), {
    name: str(m.name, 120),
    email: str(m.email, 200),
    message: m.message.trim().slice(0, 4000),
    createdAt: serverTimestamp(),
  });

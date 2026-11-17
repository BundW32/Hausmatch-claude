import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'seeker' | 'manager';
export type PropertyType = 'WEG' | 'Mietshaus' | 'Gewerbe';

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'WEG', label: 'WEG (Wohnungseigentum)' },
  { value: 'Mietshaus', label: 'Mietshaus' },
  { value: 'Gewerbe', label: 'Gewerbeimmobilie' },
];

export const SERVICES = [
  'WEG-Verwaltung',
  'Mietverwaltung',
  'Sondereigentumsverwaltung',
  'Nebenkostenabrechnung',
  'Technische Betreuung',
  'Sanierungsbegleitung',
  'Vermietung',
  'Buchhaltung',
] as const;

export type OpeningHours = Partial<Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', string>>;

/** Öffentliches Profil (Firestore: users/{uid}). Die E-Mail liegt NICHT im Profil, sondern nur in Firebase Auth. */
export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
  openingHours?: OpeningHours;
  teamSize?: number;
  foundedYear?: number;
  vatId?: string;
  /** Matching-Angaben für Verwalter */
  serviceCities?: string[];
  propertyTypes?: PropertyType[];
  minUnits?: number;
  maxUnits?: number;
  /** Wird ausschließlich von HausMatch (Admin) gesetzt. */
  verified?: boolean;
}

/** Eingeloggter Nutzer = Profil + Angaben aus Firebase Auth. */
export interface User extends Profile {
  email: string;
  emailVerified: boolean;
}

export interface InquiryAnalysis {
  summary: string;
  keyRequirements: string[];
  estimatedEffort: 'Niedrig' | 'Mittel' | 'Hoch';
  recommendedTags: string[];
  legalAdviceSnippet: string;
}

export type InquiryStatus = 'offen' | 'geschlossen';

export interface Inquiry {
  id: string;
  ownerId: string;
  city: string;
  cityLower: string;
  units: number;
  propertyType: PropertyType;
  servicesNeeded: string[];
  buildingAge: string;
  condition: string;
  description: string;
  status: InquiryStatus;
  createdAt: Timestamp | null;
  aiAnalysis?: InquiryAnalysis;
}

/** Bearbeitungsstand eines Leads – pro Verwalter (users/{uid}/leadStates/{inquiryId}). */
export type LeadStatus = 'neu' | 'kontaktiert' | 'archiviert';

export interface ForumThread {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  category: string;
  replies: number;
  createdAt: Timestamp | null;
  lastActivity?: Timestamp | null;
}

export interface ForumReply {
  id: string;
  threadId: string;
  author: string;
  authorId: string;
  content: string;
  createdAt: Timestamp | null;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  subject: string;
  content: string;
  timestamp: Timestamp | null;
  read: boolean;
  inquiryId?: string;
}

export interface Connection {
  id: string;
  users: [string, string];
  requesterId: string;
  status: 'pending' | 'accepted';
}

export interface BlogArticle {
  id: string;
  title: string;
  summary: string;
  fullContent: string;
  category: string;
  date: string;
  sources?: { title: string; url: string }[];
}

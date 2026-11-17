import { auth } from './firebase';
import { BlogArticle, InquiryAnalysis } from '../types';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const post = async <T>(path: string, body: unknown, opts: { withAuth?: boolean; timeoutMs?: number } = {}): Promise<T> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.withAuth && auth.currentUser) {
    headers.Authorization = `Bearer ${await auth.currentUser.getIdToken()}`;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 30000);
  try {
    const res = await fetch(path, { method: 'POST', headers, body: JSON.stringify(body), signal: controller.signal });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(data?.error || 'Der Dienst ist gerade nicht erreichbar.', res.status);
    return data as T;
  } finally {
    clearTimeout(timer);
  }
};

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

export const askAssistant = (history: ChatTurn[], message: string) =>
  post<{ reply: string }>('/api/chat', { history, message }).then(r => r.reply);

/** KI-Einschätzung einer Anfrage. Optional: liefert null, wenn der Dienst nicht verfügbar ist. */
export const analyzeInquiry = async (input: {
  city: string;
  units: number;
  propertyType: string;
  buildingAge: string;
  condition: string;
  servicesNeeded: string[];
  description: string;
}): Promise<InquiryAnalysis | null> => {
  try {
    return await post<InquiryAnalysis>('/api/analyze', input, { withAuth: true, timeoutMs: 20000 });
  } catch {
    return null;
  }
};

export const fetchBlog = async (): Promise<BlogArticle[]> => {
  const res = await fetch('/api/blog');
  if (!res.ok) throw new ApiError('Die Meldungen konnten nicht geladen werden.', res.status);
  const data = await res.json();
  return Array.isArray(data?.articles) ? data.articles : [];
};

// Gemeinsame Helfer für die Vercel-Serverfunktionen (/api/*).
// Dateien in _lib werden von Vercel nicht als eigene Endpunkte veröffentlicht.

export interface Req {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}
export interface Res {
  status: (code: number) => Res;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

const header = (req: Req, name: string) => {
  const v = req.headers[name];
  return Array.isArray(v) ? v[0] : v;
};

export const clientIp = (req: Req) => (header(req, 'x-forwarded-for') || '').split(',')[0].trim() || 'unknown';

/** Nur Aufrufe von der eigenen Seite zulassen (Browser senden bei POST immer einen Origin-Header). */
export const sameOrigin = (req: Req) => {
  const origin = header(req, 'origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === header(req, 'host');
  } catch {
    return false;
  }
};

// Einfache Begrenzung pro IP im Arbeitsspeicher der Funktion. Sie bremst Missbrauch, ist aber kein harter Schutz
// (jede Funktionsinstanz zählt für sich). Zusätzlich sollte im Google-Cloud-Projekt ein Kontingent gesetzt sein.
const buckets = new Map<string, { count: number; resetAt: number }>();
export const rateLimited = (key: string, max: number, windowMs: number) => {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count++;
  return bucket.count > max;
};

export const readJson = (req: Req): Record<string, unknown> | null => {
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return null;
    }
  }
  return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
};

export const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Prüft die Standardbedingungen eines POST-Endpunkts. Liefert false, wenn bereits geantwortet wurde. */
export const guardPost = (req: Req, res: Res, limit: { key: string; max: number; windowMs: number }) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Methode nicht erlaubt.' });
    return false;
  }
  if (!sameOrigin(req)) {
    res.status(403).json({ error: 'Aufruf nicht erlaubt.' });
    return false;
  }
  if (rateLimited(`${limit.key}:${clientIp(req)}`, limit.max, limit.windowMs)) {
    res.status(429).json({ error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' });
    return false;
  }
  return true;
};

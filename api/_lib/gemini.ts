// Schlanker Aufruf der Gemini-REST-API. Der Schlüssel kommt ausschließlich aus der Server-Umgebung.

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export interface GeminiContent {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export class GeminiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const geminiConfigured = () => !!process.env.GEMINI_API_KEY;

export const generate = async (opts: {
  contents: GeminiContent[];
  system?: string;
  json?: { schema: unknown };
  webSearch?: boolean;
  maxOutputTokens?: number;
  temperature?: number;
}): Promise<string> => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError('GEMINI_API_KEY ist nicht gesetzt.', 503);

  const body: Record<string, unknown> = {
    contents: opts.contents,
    generationConfig: {
      temperature: opts.temperature ?? 0.4,
      maxOutputTokens: opts.maxOutputTokens ?? 1024,
      ...(opts.json ? { responseMimeType: 'application/json', responseSchema: opts.json.schema } : {}),
    },
  };
  if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };
  if (opts.webSearch) body.tools = [{ google_search: {} }];

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) {
    // Fehlertext bewusst nicht an den Client durchreichen (kann Projektdetails enthalten).
    console.error('Gemini-Fehler', res.status, (await res.text()).slice(0, 500));
    throw new GeminiError('KI-Dienst nicht verfügbar.', res.status === 429 ? 429 : 502);
  }
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const out = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
  if (!out) throw new GeminiError('Leere Antwort des KI-Dienstes.', 502);
  return out;
};

/** Holt das erste JSON-Objekt/-Array aus einem Text (Modelle umschließen JSON gern mit ```json … ```). */
export const extractJson = (raw: string): unknown => {
  const cleaned = raw.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.search(/[[{]/);
  if (start === -1) throw new Error('Kein JSON gefunden');
  const open = cleaned[start];
  const end = cleaned.lastIndexOf(open === '[' ? ']' : '}');
  return JSON.parse(cleaned.slice(start, end + 1));
};

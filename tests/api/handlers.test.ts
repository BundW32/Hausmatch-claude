import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Req, Res } from '../../api/_lib/http';

// Prüft die Serverfunktionen ohne echten KI-Dienst: fetch wird ersetzt.
const makeRes = () => {
  const out = { statusCode: 0, body: undefined as any, headers: {} as Record<string, string> };
  const res: Res = {
    status(code) {
      out.statusCode = code;
      return res;
    },
    json(body) {
      out.body = body;
    },
    setHeader(name, value) {
      out.headers[name] = value;
    },
  };
  return { res, out };
};
let ipCounter = 0;
const req = (over: Partial<Req> = {}, ip = `10.0.0.${++ipCounter}`): Req => ({
  method: 'POST',
  headers: { host: 'hausmatch.example', origin: 'https://hausmatch.example', 'x-forwarded-for': ip, ...(over.headers || {}) },
  body: over.body,
  ...(over.method ? { method: over.method } : {}),
});
const geminiReply = (text: string) => ({ ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }), text: async () => '' });

beforeEach(() => {
  process.env.GEMINI_API_KEY = 'test-key';
  vi.resetModules();
});
afterEach(() => vi.unstubAllGlobals());

describe('/api/chat', () => {
  it('antwortet und sendet den Schlüssel nur an Google', async () => {
    const fetchMock = vi.fn(async () => geminiReply('Eine Hausverwaltung kostet …'));
    vi.stubGlobal('fetch', fetchMock);
    const { default: handler } = await import('../../api/chat');
    const { res, out } = makeRes();
    await handler(req({ body: { message: 'Was kostet eine Verwaltung?', history: [{ role: 'assistant', text: 'Hallo' }, { role: 'user', text: 'Hi' }] } }), res);
    expect(out.statusCode).toBe(200);
    expect(out.body.reply).toContain('Hausverwaltung');
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('generativelanguage.googleapis.com');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('test-key');
    const sent = JSON.parse(init.body as string);
    expect(sent.contents[0].role).toBe('user'); // Verlauf beginnt mit einem Nutzerbeitrag
    expect(JSON.stringify(out)).not.toContain('test-key');
  });
  it('lehnt falsche Methode, fremde Herkunft und leere Fragen ab', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const { default: handler } = await import('../../api/chat');
    let r = makeRes();
    await handler(req({ method: 'GET' }), r.res);
    expect(r.out.statusCode).toBe(405);
    r = makeRes();
    await handler(req({ headers: { origin: 'https://boese.example' }, body: { message: 'x' } }), r.res);
    expect(r.out.statusCode).toBe(403);
    r = makeRes();
    await handler(req({ body: { message: '   ' } }), r.res);
    expect(r.out.statusCode).toBe(400);
  });
  it('begrenzt die Zahl der Anfragen pro IP', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => geminiReply('ok')));
    const { default: handler } = await import('../../api/chat');
    let last = 0;
    for (let i = 0; i < 22; i++) {
      const { res, out } = makeRes();
      await handler(req({ body: { message: 'Frage' } }, '10.9.9.9'), res);
      last = out.statusCode;
    }
    expect(last).toBe(429);
  });
  it('gibt bei Ausfall des KI-Dienstes keine Details weiter', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500, text: async () => 'interner Fehler projects/geheim', json: async () => ({}) })));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { default: handler } = await import('../../api/chat');
    const { res, out } = makeRes();
    await handler(req({ body: { message: 'Frage' } }), res);
    expect(out.statusCode).toBe(503);
    expect(JSON.stringify(out.body)).not.toContain('geheim');
  });
});

describe('/api/analyze', () => {
  it('verlangt eine Anmeldung', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const { default: handler } = await import('../../api/analyze');
    const { res, out } = makeRes();
    await handler(req({ body: { city: 'Essen', description: 'Beschreibung des Objekts' } }), res);
    expect(out.statusCode).toBe(401);
    const r2 = makeRes();
    await handler(req({ headers: { authorization: 'Bearer gefälscht' }, body: { city: 'Essen', description: 'Beschreibung des Objekts' } }), r2.res);
    expect(r2.out.statusCode).toBe(401);
  });
});

describe('/api/blog', () => {
  it('liest JSON auch aus umschlossenem Text und verwirft unsichere Links', async () => {
    const raw = '```json\n[{"title":"Neue Regel","summary":"Kurz.","fullContent":"Lang.","category":"Recht","date":"01.11.2026","sources":[{"title":"Quelle","url":"https://example.org/a"},{"title":"Böse","url":"javascript:alert(1)"}]},{"title":"","summary":"ohne Titel"}]\n```';
    vi.stubGlobal('fetch', vi.fn(async () => geminiReply(raw)));
    const { default: handler } = await import('../../api/blog');
    const { res, out } = makeRes();
    await handler(req({ method: 'GET' }), res);
    expect(out.statusCode).toBe(200);
    expect(out.body.articles).toHaveLength(1);
    expect(out.body.articles[0].sources).toEqual([{ title: 'Quelle', url: 'https://example.org/a' }]);
    expect(out.headers['Cache-Control']).toContain('s-maxage');
  });
  it('liefert ohne Schlüssel eine leere Liste statt erfundener Artikel', async () => {
    delete process.env.GEMINI_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { default: handler } = await import('../../api/blog');
    const { res, out } = makeRes();
    await handler(req({ method: 'GET' }), res);
    expect(out.body.articles).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

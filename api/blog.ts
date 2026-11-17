import { clientIp, rateLimited, text, type Req, type Res } from './_lib/http.js';
import { extractJson, generate, geminiConfigured } from './_lib/gemini.js';

interface Article {
  id: string;
  title: string;
  summary: string;
  fullContent: string;
  category: string;
  date: string;
  sources: { title: string; url: string }[];
}

const CATEGORIES = ['Recht', 'Technik', 'Management', 'Markt'];
let cache: { at: number; articles: Article[] } | null = null;
const SIX_HOURS = 6 * 60 * 60 * 1000;

const httpsUrl = (raw: unknown) => {
  try {
    const u = new URL(String(raw));
    return u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
};

const load = async (): Promise<Article[]> => {
  const today = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
  const raw = await generate({
    webSearch: true,
    maxOutputTokens: 2500,
    temperature: 0.3,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Heute ist der ${today}. Suche im Web nach den drei wichtigsten Meldungen der letzten vier Wochen für Hausverwaltungen und Immobilieneigentümer in Deutschland (Recht, Technik/Energie, Verwaltungspraxis, Markt).
Gib ausschließlich ein JSON-Array zurück, ohne weiteren Text. Jedes Element:
{"title": string, "summary": string (2 Sätze), "fullContent": string (120–200 Wörter, sachlich, nur belegte Aussagen), "category": "Recht"|"Technik"|"Management"|"Markt", "date": string (TT.MM.JJJJ der Meldung), "sources": [{"title": string, "url": string}]}
Verwende nur Informationen aus den gefundenen Quellen und gib deren echte URLs an. Erfinde nichts.`,
          },
        ],
      },
    ],
  });
  const parsed = extractJson(raw);
  return (Array.isArray(parsed) ? parsed : [])
    .slice(0, 5)
    .map((a: any, i): Article => ({
      id: String(i + 1),
      title: text(a?.title, 200),
      summary: text(a?.summary, 600),
      fullContent: text(a?.fullContent, 3000),
      category: CATEGORIES.includes(a?.category) ? a.category : 'Markt',
      date: text(a?.date, 20),
      sources: (Array.isArray(a?.sources) ? a.sources : [])
        .map((s: any) => ({ title: text(s?.title, 150), url: httpsUrl(s?.url) }))
        .filter((s: { url: string | null }) => s.url)
        .slice(0, 5),
    }))
    .filter(a => a.title && a.summary);
};

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Methode nicht erlaubt.' });
    return;
  }
  // Vercel-CDN hält die Antwort 6 Stunden vor – die KI wird also höchstens wenige Male am Tag aufgerufen.
  res.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=86400');

  if (cache && Date.now() - cache.at < SIX_HOURS) {
    res.status(200).json({ articles: cache.articles });
    return;
  }
  if (!geminiConfigured() || rateLimited(`blog:${clientIp(req)}`, 5, 60 * 60 * 1000)) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ articles: cache?.articles || [] });
    return;
  }
  try {
    const articles = await load();
    cache = { at: Date.now(), articles };
    res.status(200).json({ articles });
  } catch (err) {
    console.error('Blog-Fehler', err);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ articles: cache?.articles || [] });
  }
}

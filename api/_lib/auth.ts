import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { Req } from './http.js';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'hausmatch-1';
const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

/** Prüft das Firebase-ID-Token aus dem Authorization-Header und liefert die Nutzer-ID – oder null. */
export const verifyUser = async (req: Req): Promise<string | null> => {
  const raw = req.headers.authorization;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value?.startsWith('Bearer ')) return null;
  try {
    const { payload } = await jwtVerify(value.slice(7), JWKS, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
      algorithms: ['RS256'],
    });
    return typeof payload.sub === 'string' && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
};

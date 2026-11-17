import { Profile, PropertyType } from '../types';

export const normalizeCity = (city: string) => city.trim().toLowerCase().replace(/\s+/g, ' ');

export interface MatchCriteria {
  city: string;
  propertyType?: PropertyType;
  units?: number;
}

export interface MatchResult {
  manager: Profile;
  score: number;
  reasons: string[];
  cautions: string[];
}

/**
 * Nachvollziehbares Matching ohne KI:
 *  - Stadt muss passen (Einsatzgebiet oder Standort des Verwalters) – sonst kein Treffer.
 *  - Objektart und Einheitenzahl erhöhen die Punktzahl, wenn der Verwalter sie abdeckt.
 */
export const matchManager = (manager: Profile, c: MatchCriteria): MatchResult | null => {
  const city = normalizeCity(c.city);
  if (!city) return null;

  const reasons: string[] = [];
  const cautions: string[] = [];
  let score = 0;

  const inServiceArea = (manager.serviceCities || []).includes(city);
  const location = normalizeCity(manager.location || '');
  const basedThere = !!location && (location.includes(city) || city.includes(location));
  if (inServiceArea) {
    score += 50;
    reasons.push(`Betreut Objekte in ${c.city.trim()}`);
  } else if (basedThere) {
    score += 40;
    reasons.push(`Sitz in ${manager.location}`);
  } else {
    return null;
  }

  if (c.propertyType) {
    const types = manager.propertyTypes || [];
    if (types.includes(c.propertyType)) {
      score += 25;
      reasons.push(`Verwaltet ${c.propertyType === 'Gewerbe' ? 'Gewerbeimmobilien' : c.propertyType === 'WEG' ? 'WEGs' : 'Mietshäuser'}`);
    } else if (types.length === 0) {
      score += 8;
    } else {
      cautions.push(`Schwerpunkt laut Profil: ${types.join(', ')}`);
    }
  }

  if (c.units && c.units > 0) {
    const min = manager.minUnits || 0;
    const max = manager.maxUnits || 0;
    if (min === 0 && max === 0) {
      score += 8;
    } else if (c.units >= min && (max === 0 || c.units <= max)) {
      score += 25;
      reasons.push(`Übernimmt Objekte mit ${c.units} Einheiten`);
    } else {
      cautions.push(max > 0 ? `Übernimmt laut Profil ${min}–${max} Einheiten` : `Übernimmt laut Profil ab ${min} Einheiten`);
    }
  }

  if (manager.verified) score += 5;
  return { manager, score: Math.min(score, 100), reasons, cautions };
};

export const rankManagers = (managers: Profile[], criteria: MatchCriteria): MatchResult[] =>
  managers
    .map(m => matchManager(m, criteria))
    .filter((m): m is MatchResult => m !== null)
    .sort((a, b) => b.score - a.score || a.manager.name.localeCompare(b.manager.name, 'de'));

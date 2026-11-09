import { paceAtPercent } from "./vma";

// Façons de viser (D-153, 09/11/2026) : règles PURES, testées par Vitest. Elles PROPOSENT des valeurs
// depuis les repères du sportif ; le coach les garde ou les corrige. Sans repère : saisie libre.

// ---------------------------------------------------------------------------
// Running : allure depuis un % de VMA (« Calculée depuis la VMA d'Inès : 16 km/h »).
// ---------------------------------------------------------------------------
// Plage d'allure pour une plage de % : le % le plus haut donne l'allure la plus rapide.
export function paceRangeFromVma(
  vmaKmh: number,
  percentFrom: number,
  percentTo: number,
): { fromSecPerKm: number; toSecPerKm: number } {
  const high = Math.max(percentFrom, percentTo);
  const low = Math.min(percentFrom, percentTo);
  return { fromSecPerKm: paceAtPercent(vmaKmh, high), toSecPerKm: paceAtPercent(vmaKmh, low) };
}

// ---------------------------------------------------------------------------
// Running : zones de FC en % de la FC max (OPEN-21). Table PAR DÉFAUT, à faire valider par Gianluca
// (autre méthode possible : Karvonen, avec la FC de repos). Elle retombe sur les exemples des
// maquettes à 1 bpm près (FC max 192 : Z2 = 129-142, Z4 = 161-175).
// ---------------------------------------------------------------------------
export const DEFAULT_HR_ZONES = [
  { zone: 1, fromPercent: 57, toPercent: 66 },
  { zone: 2, fromPercent: 67, toPercent: 74 },
  { zone: 3, fromPercent: 75, toPercent: 83 },
  { zone: 4, fromPercent: 84, toPercent: 91 },
  { zone: 5, fromPercent: 92, toPercent: 100 },
] as const;

export function hrZoneRange(
  hrMax: number,
  zone: number,
): { bpmFrom: number; bpmTo: number } | null {
  const row = DEFAULT_HR_ZONES.find((candidate) => candidate.zone === zone);
  if (!row || !Number.isFinite(hrMax) || hrMax <= 0) return null;
  return {
    bpmFrom: Math.round((hrMax * row.fromPercent) / 100),
    bpmTo: Math.round((hrMax * row.toPercent) / 100),
  };
}

// ---------------------------------------------------------------------------
// Musculation : le max d'un exercice et les kg d'un % (BR-14, OPEN-22).
// ---------------------------------------------------------------------------
export type OneRepMax = { kg: number; estimated: boolean; fromKg: number; fromReps: number };

// Décision d'Antonino du 09/11/2026 (OPEN-22, à faire valider par Gianluca) : un repère à plusieurs
// répétitions donne un max ESTIMÉ par la formule d'Epley (charge × (1 + répétitions / 30)), affiché
// « max estimé depuis 80 kg × 5 ». Un repère sans nombre de répétitions, ou à 1, est le max lui-même.
export function oneRepMax(loadKg: number, reps: number | null): OneRepMax | null {
  if (!Number.isFinite(loadKg) || loadKg <= 0) return null;
  const count = reps ?? 1;
  if (!Number.isInteger(count) || count < 1) return null;
  if (count === 1) return { kg: loadKg, estimated: false, fromKg: loadKg, fromReps: 1 };
  return {
    kg: Math.round(loadKg * (1 + count / 30) * 10) / 10,
    estimated: true,
    fromKg: loadKg,
    fromReps: count,
  };
}

// Arrondi au 0,5 kg ([P] accepté le 09/11/2026) : ce qu'on peut charger sur une barre.
export function roundToHalfKg(kg: number): number {
  return Math.round(kg * 2) / 2;
}

export function kgFromPercent(maxKg: number, percent: number): number {
  return roundToHalfKg((maxKg * percent) / 100);
}

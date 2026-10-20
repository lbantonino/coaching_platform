// VMA et allures dérivées : règles PURES, testées par Vitest (OPEN-13 tranché le 20/10/2026).
// Le calcul PROPOSE des allures ; le coach les valide avant tout enregistrement.

export type PaceZoneKind =
  "pace_easy" | "pace_marathon" | "pace_half" | "pace_threshold" | "pace_10k" | "pace_5k";

export type PaceZone = {
  kind: PaceZoneKind;
  // Pourcentage de VMA : une valeur, ou une plage (min = le plus lent, max = le plus rapide).
  minPercent: number;
  maxPercent: number;
};

// Table par défaut, à faire relire par Gianluca ; réglage par coach prévu dans une story suivante.
// Tempo et race pace Hyrox restent saisis à la main.
export const DEFAULT_PACE_ZONES: readonly PaceZone[] = [
  { kind: "pace_easy", minPercent: 65, maxPercent: 75 },
  { kind: "pace_marathon", minPercent: 80, maxPercent: 80 },
  { kind: "pace_half", minPercent: 85, maxPercent: 85 },
  { kind: "pace_threshold", minPercent: 85, maxPercent: 85 },
  { kind: "pace_10k", minPercent: 90, maxPercent: 90 },
  { kind: "pace_5k", minPercent: 95, maxPercent: 95 },
];

// Pourcentage de VMA auquel se court un 5 km dans la table : sert à estimer la VMA depuis un test de 5 km,
// de façon cohérente (l'allure 5 km proposée retombe sur l'allure réellement courue).
const FIVE_K_PERCENT = 95;

export const COOPER_MIN_DISTANCE_M = 1000;
export const COOPER_MAX_DISTANCE_M = 5000;

export type VmaResult = { ok: true; vmaKmh: number } | { ok: false; error: string };

const round1 = (value: number) => Math.round(value * 10) / 10;

// Test de Cooper : distance maximale en 12 minutes. Approximation classique : VMA (km/h) ≈ distance (m) / 200.
export function vmaFromCooper(distanceM: number): VmaResult {
  if (!Number.isFinite(distanceM) || !Number.isInteger(distanceM)) {
    return { ok: false, error: "Distance invalide : un nombre entier de mètres." };
  }
  if (distanceM < COOPER_MIN_DISTANCE_M || distanceM > COOPER_MAX_DISTANCE_M) {
    return { ok: false, error: "Distance hors limites : entre 1000 et 5000 m en 12 minutes." };
  }
  return { ok: true, vmaKmh: round1(distanceM / 200) };
}

// Test de 5 km : temps total en secondes. VMA ≈ vitesse sur 5 km / 95 %.
export function vmaFrom5k(totalSeconds: number): VmaResult {
  // 12 min (record du monde ≈ 12:35) à 60 min : au-delà, ce n'est plus un test d'effort.
  if (!Number.isFinite(totalSeconds) || totalSeconds < 12 * 60 || totalSeconds > 60 * 60) {
    return { ok: false, error: "Temps hors limites : entre 12:00 et 60:00 pour 5 km." };
  }
  const speedKmh = 5 / (totalSeconds / 3600);
  return { ok: true, vmaKmh: round1(speedKmh / (FIVE_K_PERCENT / 100)) };
}

// « 22:30 » ou « 1:02:30 » -> secondes. Secondes et minutes sur deux chiffres après le premier nombre.
export function parseDuration(input: string): number | null {
  const match = /^(?:(\d{1,2}):)?(\d{1,2}):([0-5]\d)$/.exec(input.trim());
  if (!match) return null;
  const [, hours, minutes, seconds] = match;
  if (hours !== undefined && Number(minutes) > 59) return null;
  return Number(hours ?? 0) * 3600 + Number(minutes) * 60 + Number(seconds);
}

// Allure (s/km) correspondant à un pourcentage de VMA : vitesse = VMA × % ; allure = 3600 / vitesse.
export function paceAtPercent(vmaKmh: number, percent: number): number {
  return Math.round(3600 / (vmaKmh * (percent / 100)));
}

export type ProposedPace = {
  kind: PaceZoneKind;
  minSecPerKm: number; // la plus rapide (pourcentage le plus haut)
  maxSecPerKm: number; // la plus lente (pourcentage le plus bas)
  minPercent: number;
  maxPercent: number;
};

export function proposePaces(
  vmaKmh: number,
  zones: readonly PaceZone[] = DEFAULT_PACE_ZONES,
): ProposedPace[] {
  return zones.map((zone) => ({
    kind: zone.kind,
    minSecPerKm: paceAtPercent(vmaKmh, zone.maxPercent),
    maxSecPerKm: paceAtPercent(vmaKmh, zone.minPercent),
    minPercent: zone.minPercent,
    maxPercent: zone.maxPercent,
  }));
}

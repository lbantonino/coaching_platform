// Allures de course : règles PURES (sans base ni interface), testées par Vitest (RUN-01, docs/05 §4 et §7).
// Stockage en secondes par kilomètre ; affichage « m:ss /km » (règle du 16/11/2026).

// Bornes raisonnables pour une allure de course à pied (2:00 à 15:00 min/km). Hors bornes = erreur de saisie probable.
export const PACE_MIN_SEC_PER_KM = 120;
export const PACE_MAX_SEC_PER_KM = 900;

export type PaceParseResult = { ok: true; secPerKm: number } | { ok: false; error: string };

export type PaceRangeParseResult =
  { ok: true; minSecPerKm: number; maxSecPerKm: number } | { ok: false; error: string };

// « 4:55 » -> 295. Les secondes doivent être écrites sur deux chiffres : « 4:5 » est ambigu (4:05 ou 4:50 ?)
// et refusé avec une explication, plutôt que deviné en silence (docs/05 §7).
export function parsePace(input: string): PaceParseResult {
  const value = input.trim().replace(/\s*(min\/km|\/km)$/i, "");
  const ambiguous = /^(\d{1,2}):(\d)$/.exec(value);
  if (ambiguous) {
    const [, min, sec] = ambiguous;
    return {
      ok: false,
      error: `Allure ambiguë : écris les secondes sur deux chiffres (${min}:0${sec} ou ${min}:${sec}0).`,
    };
  }
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(value);
  if (!match)
    return { ok: false, error: "Allure invalide : utilise le format min:ss, par exemple 4:55." };

  const secPerKm = Number(match[1]) * 60 + Number(match[2]);
  if (secPerKm < PACE_MIN_SEC_PER_KM || secPerKm > PACE_MAX_SEC_PER_KM) {
    return {
      ok: false,
      error: "Allure hors limites : elle doit être comprise entre 2:00 et 15:00 /km.",
    };
  }
  return { ok: true, secPerKm };
}

// « 6:40-7:15 » ou « 6:40–7:15 » -> plage ; une allure seule -> plage de largeur nulle.
export function parsePaceRange(input: string): PaceRangeParseResult {
  const parts = input.split(/\s*[-–—]\s*/);
  if (parts.length > 2)
    return { ok: false, error: "Plage invalide : écris par exemple 6:40-7:15." };

  const first = parsePace(parts[0]);
  if (!first.ok) return first;
  if (parts.length === 1)
    return { ok: true, minSecPerKm: first.secPerKm, maxSecPerKm: first.secPerKm };

  const second = parsePace(parts[1]);
  if (!second.ok) return second;
  // Une plage peut être saisie dans les deux sens : on la remet dans l'ordre (plus rapide -> plus lente).
  return {
    ok: true,
    minSecPerKm: Math.min(first.secPerKm, second.secPerKm),
    maxSecPerKm: Math.max(first.secPerKm, second.secPerKm),
  };
}

// 295 -> « 4:55 »
export function formatPace(secPerKm: number): string {
  const rounded = Math.round(secPerKm);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatPaceRange(minSecPerKm: number, maxSecPerKm: number): string {
  return minSecPerKm === maxSecPerKm
    ? formatPace(minSecPerKm)
    : `${formatPace(minSecPerKm)}–${formatPace(maxSecPerKm)}`;
}

// Formule sûre de docs/05 §4 : vitesse (km/h) = 3600 / allure (s/km), arrondie au dixième.
export function paceToSpeedKmh(secPerKm: number): number {
  return Math.round((3600 / secPerKm) * 10) / 10;
}

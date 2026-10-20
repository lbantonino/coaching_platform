import { formatPaceRange, paceToSpeedKmh } from "@/domain/training/pace";

import type { ReferenceKind } from "./schemas";

type Formattable = {
  kind: ReferenceKind;
  paceMin: number | null;
  paceMax: number | null;
  bpm: number | null;
  exercise: string | null;
  loadKg: number | null;
  reps: number | null;
};

const numberFr = new Intl.NumberFormat("fr-BE", { maximumFractionDigits: 2 });

// Valeur principale d'un repère, avec son unité (docs/05 §4 : « 05:00 min/km », km/h dérivé si utile).
export function formatReferenceValue(entry: Formattable): string {
  if (entry.paceMin !== null && entry.paceMax !== null) {
    return `${formatPaceRange(entry.paceMin, entry.paceMax)} min/km`;
  }
  if (entry.bpm !== null) return `${entry.bpm} bpm`;
  if (entry.loadKg !== null) {
    const load = `${numberFr.format(entry.loadKg)} kg`;
    return entry.reps ? `${load} × ${entry.reps}` : load;
  }
  return "—";
}

// Information secondaire : vitesse dérivée pour une allure (milieu de plage), exercice pour une charge.
export function formatReferenceDetail(entry: Formattable): string | null {
  if (entry.paceMin !== null && entry.paceMax !== null) {
    const middle = (entry.paceMin + entry.paceMax) / 2;
    return `≈ ${numberFr.format(paceToSpeedKmh(middle))} km/h`;
  }
  if (entry.exercise) return entry.exercise;
  return null;
}

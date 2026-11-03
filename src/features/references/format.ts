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
  // La VMA s'exprime en vitesse (km/h), même si elle est stockée comme une allure.
  if (entry.kind === "pace_vma" && entry.paceMin !== null) {
    return `${numberFr.format(paceToSpeedKmh(entry.paceMin))} km/h`;
  }
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

// La valeur et son unité séparées (maquette « Sportifs » du 03/11/2026 : grand chiffre, unité en
// plus petit) : « 4:50–5:05 » + « min/km », « 6 kg × 25 » + « reps », « 58 » + « bpm ».
export function splitReferenceValue(entry: Formattable): { value: string; unit: string } {
  if (entry.kind === "pace_vma" && entry.paceMin !== null) {
    return { value: numberFr.format(paceToSpeedKmh(entry.paceMin)), unit: "km/h" };
  }
  if (entry.paceMin !== null && entry.paceMax !== null) {
    return { value: formatPaceRange(entry.paceMin, entry.paceMax), unit: "min/km" };
  }
  if (entry.bpm !== null) return { value: String(entry.bpm), unit: "bpm" };
  if (entry.loadKg !== null) {
    const load = `${numberFr.format(entry.loadKg)} kg`;
    return entry.reps
      ? { value: `${load} × ${entry.reps}`, unit: "reps" }
      : { value: load, unit: "" };
  }
  return { value: "—", unit: "" };
}

// Information secondaire : vitesse dérivée pour une allure (milieu de plage), exercice pour une charge.
export function formatReferenceDetail(entry: Formattable): string | null {
  if (entry.kind === "pace_vma" && entry.paceMin !== null) {
    return `${formatPaceRange(entry.paceMin, entry.paceMin)} min/km`;
  }
  if (entry.paceMin !== null && entry.paceMax !== null) {
    const middle = (entry.paceMin + entry.paceMax) / 2;
    return `≈ ${numberFr.format(paceToSpeedKmh(middle))} km/h`;
  }
  if (entry.exercise) return entry.exercise;
  return null;
}

import { formatPace } from "@/domain/training/pace";
import {
  DEFAULT_PACE_ZONES,
  parseDuration,
  proposePaces,
  vmaFrom5k,
  vmaFromCooper,
  type PaceZoneKind,
} from "@/domain/training/vma";

import type { ReferenceValues } from "./schemas";

export type TestFormInput = {
  test: string; // "cooper" | "5k"
  distance: string; // mètres (Cooper)
  time: string; // mm:ss ou h:mm:ss (5 km)
  measuredOn: string; // AAAA-MM-JJ
  zones: string[]; // zones cochées par le coach
};

export type TestFormResult =
  { ok: true; vmaKmh: number; rows: ReferenceValues[] } | { ok: false; error: string };

const numberFr = new Intl.NumberFormat("fr-BE", { maximumFractionDigits: 1 });
const zoneKinds = new Set<string>(DEFAULT_PACE_ZONES.map((zone) => zone.kind));

const baseRow = (measuredOn: string, note: string) => ({
  bpm: null,
  exercise_label: null,
  load_kg: null,
  reps: null,
  source: "test" as const,
  measured_on: measuredOn,
  coach_note: note,
});

// Lecture PURE du formulaire « Calculer les allures depuis un test » : recalcule tout depuis le résultat brut.
export function parseTestForm(input: TestFormInput, today: string): TestFormResult {
  const measuredOn = input.measuredOn.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(measuredOn) || Number.isNaN(Date.parse(measuredOn))) {
    return { ok: false, error: "Indique la date du test." };
  }
  if (measuredOn > today)
    return { ok: false, error: "La date du test ne peut pas être dans le futur." };

  let vma;
  let description: string;
  if (input.test === "cooper") {
    const distance = Number(input.distance.trim());
    vma = vmaFromCooper(distance);
    description = `Test de Cooper : ${distance} m en 12 min`;
  } else if (input.test === "5k") {
    const seconds = parseDuration(input.time);
    if (seconds === null) return { ok: false, error: "Temps invalide : écris par exemple 22:30." };
    vma = vmaFrom5k(seconds);
    description = `Test de 5 km en ${input.time.trim()}`;
  } else {
    return { ok: false, error: "Choisis le type de test." };
  }
  if (!vma.ok) return { ok: false, error: vma.error };

  if (input.zones.some((zone) => !zoneKinds.has(zone))) {
    return { ok: false, error: "Zone d'allure inconnue." };
  }
  const selected = new Set<PaceZoneKind>(input.zones as PaceZoneKind[]);

  const note = `${description} · VMA ≈ ${numberFr.format(vma.vmaKmh)} km/h · table par défaut`;
  const vmaPace = Math.round(3600 / vma.vmaKmh);

  const rows: ReferenceValues[] = [
    {
      kind: "pace_vma",
      pace_min_sec_per_km: vmaPace,
      pace_max_sec_per_km: vmaPace,
      ...baseRow(measuredOn, note),
    },
    ...proposePaces(vma.vmaKmh)
      .filter((pace) => selected.has(pace.kind))
      .map((pace) => ({
        kind: pace.kind,
        pace_min_sec_per_km: pace.minSecPerKm,
        pace_max_sec_per_km: pace.maxSecPerKm,
        ...baseRow(
          measuredOn,
          `${note} (${pace.minPercent === pace.maxPercent ? pace.maxPercent : `${pace.minPercent}–${pace.maxPercent}`} % VMA)`,
        ),
      })),
  ];

  return { ok: true, vmaKmh: vma.vmaKmh, rows };
}

// Aperçu lisible pour le formulaire (« 5:20–6:09 »), partagé entre navigateur et serveur.
export function formatProposedPace(minSecPerKm: number, maxSecPerKm: number): string {
  return minSecPerKm === maxSecPerKm
    ? formatPace(minSecPerKm)
    : `${formatPace(minSecPerKm)}–${formatPace(maxSecPerKm)}`;
}

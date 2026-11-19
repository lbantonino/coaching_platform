import { formatPace } from "@/domain/training/pace";
import { parseDuration } from "@/domain/training/vma";
import {
  HYROX_CATEGORIES,
  hyroxCategoryLabels,
  type HyroxCategory,
} from "@/features/goals/schemas";

// Records personnels (P2-02 partie 4, OPEN-01). Règles PURES, testées par Vitest.
// Liste fermée d'épreuves (alignée sur la contrainte CHECK de *_records_personnels.sql).
export const RECORD_EVENTS = ["run_5k", "run_10k", "run_half", "run_marathon", "hyrox"] as const;
export type RecordEvent = (typeof RECORD_EVENTS)[number];

export const recordEventLabels: Record<RecordEvent, string> = {
  run_5k: "5 km",
  run_10k: "10 km",
  run_half: "Semi-marathon",
  run_marathon: "Marathon",
  hyrox: "Hyrox",
};

// Distance officielle en km (allure moyenne) ; Hyrox n'a pas d'allure qui ait du sens.
const distancesKm: Partial<Record<RecordEvent, number>> = {
  run_5k: 5,
  run_10k: 10,
  run_half: 21.0975,
  run_marathon: 42.195,
};

// Temps vraisemblables (en secondes) : protège des fautes de frappe, ex. « 3:15 » pour un marathon.
const plausible: Record<
  RecordEvent,
  { min: number; max: number; example: string; phrase: string }
> = {
  run_5k: { min: 10 * 60, max: 90 * 60, example: "21:45", phrase: "un 5 km" },
  run_10k: { min: 25 * 60, max: 3 * 3600, example: "46:10", phrase: "un 10 km" },
  run_half: { min: 55 * 60, max: 5 * 3600, example: "1:42:30", phrase: "un semi-marathon" },
  run_marathon: { min: 115 * 60, max: 8 * 3600, example: "3:45:00", phrase: "un marathon" },
  hyrox: { min: 40 * 60, max: 4 * 3600, example: "1:18:40", phrase: "un Hyrox" },
};

// 1305 -> « 21:45 » ; 6150 -> « 1:42:30 ».
export function formatRaceTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${ss}` : `${minutes}:${ss}`;
}

// Allure moyenne d'une course à pied (« 4:21 /km », règle du 16/11), ou null pour Hyrox.
export function recordPace(event: RecordEvent, totalSeconds: number): string | null {
  const km = distancesKm[event];
  return km ? `${formatPace(totalSeconds / km)} /km` : null;
}

// Libellé complet de l'épreuve : « Hyrox Open », « 10 km ».
export function recordTitle(event: RecordEvent, category: HyroxCategory | null): string {
  return event === "hyrox" && category
    ? `Hyrox ${hyroxCategoryLabels[category]}`
    : recordEventLabels[event];
}

export type RecordFormInput = {
  event: string;
  hyroxCategory: string;
  time: string;
  achievedOn: string;
  raceName: string;
};

// Valeurs prêtes à enregistrer (noms de colonnes de la base).
export type RecordValues = {
  event: RecordEvent;
  hyrox_category: HyroxCategory | null;
  time_seconds: number;
  achieved_on: string;
  race_name: string | null;
};

export type RecordParseResult = { ok: true; values: RecordValues } | { ok: false; error: string };

// Lecture PURE du formulaire « Ajouter une performance ». `today` (AAAA-MM-JJ) rend la règle
// « pas de date future » testable.
export function parseRecordForm(input: RecordFormInput, today: string): RecordParseResult {
  const event = RECORD_EVENTS.find((candidate) => candidate === input.event);
  if (!event) return { ok: false, error: "Choisis l'épreuve." };

  let category: HyroxCategory | null = null;
  if (event === "hyrox") {
    category = HYROX_CATEGORIES.find((candidate) => candidate === input.hyroxCategory) ?? null;
    if (!category) return { ok: false, error: "Choisis la catégorie Hyrox." };
  }

  const time = input.time.trim();
  const seconds = parseDuration(time);
  const bounds = plausible[event];
  if (seconds === null) {
    return {
      ok: false,
      error: `Temps invalide : écris mm:ss ou h:mm:ss, par exemple ${bounds.example}.`,
    };
  }
  if (seconds < bounds.min || seconds > bounds.max) {
    return {
      ok: false,
      error: `Temps invraisemblable pour ${bounds.phrase} : entre ${formatRaceTime(bounds.min)} et ${formatRaceTime(bounds.max)}, par exemple ${bounds.example}.`,
    };
  }

  const achievedOn = input.achievedOn.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(achievedOn) || Number.isNaN(Date.parse(achievedOn))) {
    return { ok: false, error: "Indique la date de la performance." };
  }
  if (achievedOn > today) {
    return { ok: false, error: "La date de la performance ne peut pas être dans le futur." };
  }
  if (achievedOn < "2000-01-01") return { ok: false, error: "Date de performance invalide." };

  const raceName = input.raceName.trim();
  if (raceName.length > 120) {
    return { ok: false, error: "Nom de la course trop long (120 caractères maximum)." };
  }

  return {
    ok: true,
    values: {
      event,
      hyrox_category: category,
      time_seconds: seconds,
      achieved_on: achievedOn,
      race_name: raceName === "" ? null : raceName,
    },
  };
}

export type RecordLike = {
  event: RecordEvent;
  hyroxCategory: HyroxCategory | null;
  timeSeconds: number;
  achievedOn: string;
};

// Record de chaque épreuve (et catégorie Hyrox) = meilleur temps ; à égalité, le plus ancien
// (c'est lui qui a établi le record). Ordre fixe : 5 km, 10 km, semi, marathon, Hyrox par catégorie.
export function bestRecords<T extends RecordLike>(entries: T[]): T[] {
  const best = new Map<string, T>();
  for (const entry of entries) {
    const key = `${entry.event}:${entry.hyroxCategory ?? ""}`;
    const current = best.get(key);
    if (
      !current ||
      entry.timeSeconds < current.timeSeconds ||
      (entry.timeSeconds === current.timeSeconds && entry.achievedOn < current.achievedOn)
    ) {
      best.set(key, entry);
    }
  }
  const rank = (entry: T) =>
    RECORD_EVENTS.indexOf(entry.event) * 10 +
    (entry.hyroxCategory ? HYROX_CATEGORIES.indexOf(entry.hyroxCategory) : 0);
  return [...best.values()].sort((a, b) => rank(a) - rank(b));
}

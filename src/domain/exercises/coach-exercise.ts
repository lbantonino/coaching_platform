import {
  EXERCISE_CATEGORIES,
  equipmentInfo,
  muscleGroupLabels,
  type ExerciseCategory,
  type MuscleGroup,
} from "./vocabulary";

// « Créer un exercice » (D-76) : règles PURES du formulaire, testées par Vitest. Le coach choisit des
// groupes musculaires et un matériel principal (ou aucun : poids du corps), écrit ses consignes une
// par ligne, et peut donner un lien vers une vidéo (YouTube, Instagram, TikTok…).
export const EXERCISE_NAME_MAX = 80;
export const INSTRUCTIONS_MAX_STEPS = 15;
export const INSTRUCTION_MAX = 300;
export const VIDEO_URL_MAX = 300;
// Photo envoyée par le coach : réduite dans le navigateur avant l'envoi ; 5 Mo au plus à l'arrivée.
export const EXERCISE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

export type CoachExerciseInput = {
  name: string;
  category: string;
  muscleGroups: string[];
  equipment: string;
  instructions: string;
  videoUrl: string;
};

export type CoachExerciseValues = {
  nameFr: string;
  category: ExerciseCategory;
  primaryMuscles: MuscleGroup[];
  equipment: string[];
  bodyweight: boolean;
  instructions: string[];
  videoUrl: string | null;
};

export type CoachExerciseResult =
  { ok: true; values: CoachExerciseValues } | { ok: false; error: string };

export function readCoachExerciseForm(formData: FormData): CoachExerciseInput {
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };
  return {
    name: text("name"),
    category: text("category"),
    muscleGroups: formData
      .getAll("muscles")
      .filter((value) => typeof value === "string") as string[],
    equipment: text("equipment"),
    instructions: text("instructions"),
    videoUrl: text("videoUrl"),
  };
}

export function parseCoachExerciseForm(input: CoachExerciseInput): CoachExerciseResult {
  const nameFr = input.name.trim().replace(/\s+/g, " ");
  if (nameFr.length < 1) return { ok: false, error: "Donne un nom à l'exercice." };
  if (nameFr.length > EXERCISE_NAME_MAX) {
    return { ok: false, error: `Nom trop long : ${EXERCISE_NAME_MAX} caractères maximum.` };
  }
  if (!(EXERCISE_CATEGORIES as readonly string[]).includes(input.category)) {
    return { ok: false, error: "Choisis une rubrique." };
  }
  const primaryMuscles = [...new Set(input.muscleGroups)];
  if (primaryMuscles.some((group) => !Object.hasOwn(muscleGroupLabels, group))) {
    return { ok: false, error: "Groupe musculaire inconnu." };
  }
  if (input.equipment && !Object.hasOwn(equipmentInfo, input.equipment)) {
    return { ok: false, error: "Matériel inconnu." };
  }
  const instructions = input.instructions
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-•*]\s*|^\d+[.)]\s*/, ""))
    .filter(Boolean);
  if (instructions.length > INSTRUCTIONS_MAX_STEPS) {
    return { ok: false, error: `${INSTRUCTIONS_MAX_STEPS} consignes maximum.` };
  }
  if (instructions.some((line) => line.length > INSTRUCTION_MAX)) {
    return { ok: false, error: `Une consigne fait plus de ${INSTRUCTION_MAX} caractères.` };
  }
  const video = parseVideoUrl(input.videoUrl);
  if (!video.ok) return video;
  return {
    ok: true,
    values: {
      nameFr,
      category: input.category as ExerciseCategory,
      primaryMuscles: primaryMuscles as MuscleGroup[],
      equipment: input.equipment ? [input.equipment] : [],
      bodyweight: !input.equipment,
      instructions,
      videoUrl: video.url,
    },
  };
}

// Lien vidéo : facultatif, https seulement (jamais javascript:, ni http en clair).
export function parseVideoUrl(
  raw: string,
): { ok: true; url: string | null } | { ok: false; error: string } {
  const value = raw.trim();
  if (!value) return { ok: true, url: null };
  const invalid = {
    ok: false as const,
    error: "Lien vidéo invalide : colle une adresse qui commence par https://.",
  };
  if (value.length > VIDEO_URL_MAX || /\s/.test(value)) return invalid;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !url.hostname.includes(".")) return invalid;
    return { ok: true, url: url.toString() };
  } catch {
    return invalid;
  }
}

// Nom de la plateforme du lien, pour le bouton « Voir la vidéo sur Instagram ».
const PLATFORMS: [RegExp, string][] = [
  [/(^|\.)(youtube\.com|youtu\.be)$/, "YouTube"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)tiktok\.com$/, "TikTok"],
  [/(^|\.)vimeo\.com$/, "Vimeo"],
  [/(^|\.)facebook\.com$|(^|\.)fb\.watch$/, "Facebook"],
];

export function videoPlatform(url: string): string | null {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return PLATFORMS.find(([pattern]) => pattern.test(host))?.[1] ?? null;
  } catch {
    return null;
  }
}

// Une photo d'exercice se sert uniquement depuis le dossier de son organisation.
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const PHOTO_PATH = new RegExp(`^org/${UUID}/${UUID}\\.(jpg|png|webp)$`, "i");

export function isExercisePhotoPath(path: string): boolean {
  return PHOTO_PATH.test(path);
}

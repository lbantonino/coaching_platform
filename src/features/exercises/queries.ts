import "server-only";

import { z } from "zod";

import {
  LIBRARY_CATEGORIES,
  thumbnailOf,
  type LibraryCategory,
  type LibraryExercise,
} from "@/domain/exercises/library";
import type { ExerciseCategory } from "@/domain/exercises/vocabulary";
import { createClient } from "@/lib/supabase/server";

// Bibliothèque d'exercices (P3-01, D-75 ; exercices du coach D-76), pour une personne DÉJÀ vérifiée
// (requireCoach). La RLS ne laisse lire que le catalogue commun et les exercices de son organisation.
const isLibraryCategory = (value: string): value is LibraryCategory =>
  (LIBRARY_CATEGORIES as readonly string[]).includes(value);

// Photo d'un exercice du coach : servie par la route /exercices/images (stockage privé). La version
// (date de modification) change l'adresse quand la photo change, ce qui permet de la garder en cache.
export const coachPhotoUrl = (id: string, updatedAt: string) =>
  `/exercices/images/${id}?v=${Date.parse(updatedAt)}`;

type ImageRow = {
  id: string;
  organization_id: string | null;
  image_main: string | null;
  image_start: string | null;
  updated_at: string;
};

const imagesOf = (row: ImageRow & { image_end?: string | null }) =>
  row.organization_id
    ? {
        main: row.image_main ? coachPhotoUrl(row.id, row.updated_at) : null,
        start: null,
        end: null,
      }
    : { main: row.image_main, start: row.image_start, end: row.image_end ?? null };

// Tous les exercices visibles (catalogue commun et exercices de l'organisation), avec seulement ce que
// la liste affiche : un peu plus de 600 lignes légères, filtrées ensuite en direct dans la page.
export async function listLibraryExercises(
  userId: string,
  organizationId: string,
): Promise<LibraryExercise[]> {
  const supabase = await createClient();
  const [{ data: rows, error }, { data: favorites }] = await Promise.all([
    supabase
      .from("exercises")
      .select(
        "id, key, organization_id, name_fr, name_en, aliases_fr, aliases_en, category, hyrox_station, equipment, primary_muscles, metrics, image_main, image_start, updated_at",
      )
      .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
      .eq("visibility", "active")
      .is("archived_at", null),
    supabase.from("exercise_favorites").select("exercise_id").eq("user_id", userId),
  ]);
  if (error || !rows) return [];
  const favoriteIds = new Set((favorites ?? []).map((row) => row.exercise_id));
  return rows.flatMap((row) =>
    isLibraryCategory(row.category)
      ? [
          {
            id: row.id,
            // Le catalogue commun s'ouvre par sa clé lisible, un exercice du coach par son identifiant.
            key: row.key ?? row.id,
            nameFr: row.name_fr,
            nameEn: row.name_en,
            aliasesFr: row.aliases_fr,
            aliasesEn: row.aliases_en,
            category: row.category,
            hyroxStation: row.hyrox_station,
            equipment: row.equipment,
            primaryMuscles: row.primary_muscles,
            // Mesuré en secondes seulement (planche, gainage…) : l'éditeur propose « 3 × 30 s » (D-166).
            timed: row.metrics.includes("duration_s") && !row.metrics.includes("reps"),
            thumbnail: thumbnailOf(imagesOf(row)),
            favorite: favoriteIds.has(row.id),
            mine: row.organization_id !== null,
          },
        ]
      : [],
  );
}

export type ExerciseSheet = {
  id: string;
  key: string;
  nameFr: string;
  category: ExerciseCategory;
  hyroxStation: number | null;
  equipment: string[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
  difficulty: string | null;
  unilateral: boolean;
  instructions: string[];
  images: { main: string | null; start: string | null; end: string | null };
  videoUrl: string | null;
  // Exercice de l'organisation : modifiable et supprimable par ses coachs.
  mine: boolean;
  // Variante d'un autre exercice (« Créer ma variante ») : son nom et l'adresse de sa fiche.
  variantOf: { key: string; nameFr: string } | null;
  // Image RepDB ou données RepDB : la mention « Exercise data by RepDB » s'affiche.
  attributionRequired: boolean;
  favorite: boolean;
};

const SHEET =
  "id, key, organization_id, name_fr, category, hyrox_station, equipment, primary_muscles, secondary_muscles, difficulty, unilateral, instructions_fr, image_main, image_start, image_end, video_url, variant_of, attribution_required, updated_at";

// Fiche d'un exercice visible : par sa clé (catalogue commun) ou par son identifiant (exercice de
// l'organisation, ou du catalogue depuis un programme : « Voir dans la Bibliothèque », D-187 ; pas de
// redirection vers sa clé : la page intermédiaire deviendrait la « page précédente » du retour).
// null si inconnu, masqué, ou d'une autre organisation (RLS).
export async function getExerciseSheet(
  param: string,
  userId: string,
): Promise<ExerciseSheet | null> {
  const supabase = await createClient();
  const byId = z.uuid().safeParse(param).success;
  const base = supabase
    .from("exercises")
    .select(SHEET)
    .eq("visibility", "active")
    .is("archived_at", null);
  const { data: row } = await (
    byId ? base.eq("id", param) : base.eq("key", param).is("organization_id", null)
  ).maybeSingle();
  if (!row) return null;
  const [{ data: favorite }, { data: parent }] = await Promise.all([
    supabase
      .from("exercise_favorites")
      .select("exercise_id")
      .eq("user_id", userId)
      .eq("exercise_id", row.id)
      .maybeSingle(),
    row.variant_of
      ? supabase.from("exercises").select("id, key, name_fr").eq("id", row.variant_of).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  return {
    id: row.id,
    key: row.key ?? row.id,
    nameFr: row.name_fr,
    category: row.category as ExerciseCategory,
    hyroxStation: row.hyrox_station,
    equipment: row.equipment,
    primaryMuscles: row.primary_muscles,
    secondaryMuscles: row.secondary_muscles,
    difficulty: row.difficulty,
    unilateral: row.unilateral,
    instructions: row.instructions_fr,
    images: imagesOf(row),
    videoUrl: row.video_url,
    mine: row.organization_id !== null,
    variantOf: parent ? { key: parent.key ?? parent.id, nameFr: parent.name_fr } : null,
    attributionRequired: row.attribution_required,
    favorite: Boolean(favorite),
  };
}

// Exercice de l'organisation, pour le formulaire « Modifier » ; null si ce n'en est pas un.
export async function getCoachExercise(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("exercises")
    .select(
      "id, organization_id, name_fr, category, equipment, primary_muscles, instructions_fr, image_main, video_url, updated_at",
    )
    .eq("id", id)
    .not("organization_id", "is", null)
    .maybeSingle();
  if (!row) return null;
  return {
    id: row.id,
    nameFr: row.name_fr,
    category: row.category as ExerciseCategory,
    equipment: row.equipment[0] ?? "",
    muscleGroups: row.primary_muscles,
    instructions: row.instructions_fr.join("\n"),
    videoUrl: row.video_url ?? "",
    photo: row.image_main ? coachPhotoUrl(row.id, row.updated_at) : null,
  };
}

import "server-only";

import { muscleGroupsOf } from "@/domain/exercises/library";
import { equipmentInfo, muscleGroupLabels } from "@/domain/exercises/vocabulary";
import { listLibraryExercises } from "@/features/exercises/queries";

// Exercices de la Bibliothèque proposés dans l'éditeur Musculation (05) : le nom, une ligne
// « Jambes · Haltères » et un texte de recherche sans accents (noms français, anglais, alias).
export type LibraryChoice = {
  id: string;
  name: string;
  meta: string;
  search: string;
  // Exercice tenu, mesuré en secondes (planche, gainage…, D-166).
  timed: boolean;
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const ORDER = ["strength", "hyrox", "cardio", "mobility"];

export async function listLibraryChoices(
  userId: string,
  organizationId: string,
): Promise<LibraryChoice[]> {
  const exercises = await listLibraryExercises(userId, organizationId);
  return exercises
    .map((exercise) => {
      const group = muscleGroupsOf(exercise.primaryMuscles)[0];
      const equipment =
        exercise.equipment.length === 0
          ? "Poids du corps"
          : (equipmentInfo[exercise.equipment[0] ?? ""]?.label ?? null);
      return {
        id: exercise.id,
        name: exercise.nameFr,
        meta: [group ? muscleGroupLabels[group] : null, equipment].filter(Boolean).join(" · "),
        search: normalize(
          [exercise.nameFr, exercise.nameEn, ...exercise.aliasesFr, ...exercise.aliasesEn]
            .filter(Boolean)
            .join(" "),
        ),
        rank: ORDER.indexOf(exercise.category),
        timed: exercise.timed ?? false,
      };
    })
    .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name, "fr"))
    .map((choice) => ({
      id: choice.id,
      name: choice.name,
      meta: choice.meta,
      search: choice.search,
      timed: choice.timed,
    }));
}

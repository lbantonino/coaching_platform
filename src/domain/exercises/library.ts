import { foldText } from "@/domain/documents/documents";

import {
  equipmentGroupLabels,
  equipmentInfo,
  muscleGroupLabels,
  muscleInfo,
  type EquipmentGroup,
  type ExerciseCategory,
  type MuscleGroup,
} from "./vocabulary";

// Bibliothèque d'exercices (P3-01, D-75) : ce qu'affiche la liste, et comment on y cherche. Rubriques
// Musculation, Cardio, Hyrox ; la mobilité du catalogue reste masquée, mais un coach peut créer ses
// propres exercices de mobilité (D-76) : la rubrique n'apparaît alors que s'il y en a.
export const LIBRARY_CATEGORIES = [
  "strength",
  "cardio",
  "hyrox",
  "mobility",
] as const satisfies ExerciseCategory[];
export type LibraryCategory = (typeof LIBRARY_CATEGORIES)[number];

export type LibraryExercise = {
  id: string;
  key: string;
  nameFr: string;
  nameEn: string | null;
  aliasesFr: string[];
  aliasesEn: string[];
  category: LibraryCategory;
  hyroxStation: number | null;
  equipment: string[];
  primaryMuscles: string[];
  // Image de la vignette, ou null : la tuile de remplacement s'affiche.
  thumbnail: string | null;
  favorite: boolean;
  // Exercice créé par l'organisation du coach (D-76), pas un exercice du catalogue commun.
  mine: boolean;
};

export type LibraryFilters = {
  query: string;
  category: LibraryCategory | "all";
  muscleGroup: MuscleGroup | "";
  equipmentGroup: EquipmentGroup | "";
  favoritesOnly: boolean;
  mineOnly: boolean;
};

export const emptyLibraryFilters: LibraryFilters = {
  query: "",
  category: "all",
  muscleGroup: "",
  equipmentGroup: "",
  favoritesOnly: false,
  mineOnly: false,
};

// Nombre de cartes affichées d'un coup : éviter des centaines de résultats sur un téléphone (docs/08).
export const LIBRARY_PAGE_SIZE = 24;

// Vignette : l'image principale, sinon celle du début du mouvement (RepDB n'a souvent que début et fin).
export const thumbnailOf = (images: { main: string | null; start: string | null }) =>
  images.main ?? images.start ?? null;

// Groupes de matériel d'un exercice ; sans matériel, il est « au poids du corps ».
export function equipmentGroupsOf(equipment: string[]): EquipmentGroup[] {
  if (equipment.length === 0) return ["bodyweight"];
  return [...new Set(equipment.map((code) => equipmentInfo[code]?.group).filter(Boolean))];
}

// Groupes musculaires travaillés en priorité (les muscles secondaires ne comptent pas pour le filtre).
export function muscleGroupsOf(primaryMuscles: string[]): MuscleGroup[] {
  return [...new Set(primaryMuscles.map((code) => muscleInfo[code]?.group).filter(Boolean))];
}

// Recherche sans accents ni majuscules, mot par mot, dans les noms français et anglais et leurs
// alias : « developpe couche », « bench press » et « RDL » trouvent leur exercice.
export function filterLibrary(exercises: LibraryExercise[], filters: LibraryFilters) {
  const words = foldText(filters.query).split(/\s+/).filter(Boolean);
  return exercises.filter((exercise) => {
    if (filters.category !== "all" && exercise.category !== filters.category) return false;
    if (filters.favoritesOnly && !exercise.favorite) return false;
    if (filters.mineOnly && !exercise.mine) return false;
    if (
      filters.muscleGroup &&
      !muscleGroupsOf(exercise.primaryMuscles).includes(filters.muscleGroup)
    ) {
      return false;
    }
    if (
      filters.equipmentGroup &&
      !equipmentGroupsOf(exercise.equipment).includes(filters.equipmentGroup)
    ) {
      return false;
    }
    if (words.length === 0) return true;
    const haystack = foldText(
      [exercise.nameFr, exercise.nameEn ?? "", ...exercise.aliasesFr, ...exercise.aliasesEn].join(
        " ",
      ),
    );
    return words.every((word) => haystack.includes(word));
  });
}

// Ordre d'affichage : les stations Hyrox dans l'ordre de la course, puis le reste par nom.
export function sortLibrary(exercises: LibraryExercise[]) {
  return [...exercises].sort(
    (a, b) =>
      (a.hyroxStation ?? 99) - (b.hyroxStation ?? 99) || a.nameFr.localeCompare(b.nameFr, "fr"),
  );
}

// Filtres dans l'adresse de la page (?rubrique=hyrox&q=squat&muscle=glutes&materiel=bodyweight&favoris
// &miens) :
// au retour d'une fiche, la liste se rouvre telle qu'on l'avait laissée. Une valeur inconnue est ignorée.
const categorySlugs: Record<LibraryFilters["category"], string> = {
  all: "tout",
  strength: "musculation",
  cardio: "cardio",
  hyrox: "hyrox",
  mobility: "mobilite",
};

export function filtersFromQuery(
  query: Record<string, string | string[] | undefined>,
): LibraryFilters {
  const one = (name: string) => (typeof query[name] === "string" ? (query[name] as string) : "");
  const category = (Object.keys(categorySlugs) as LibraryFilters["category"][]).find(
    (code) => categorySlugs[code] === one("rubrique"),
  );
  const muscle = one("muscle");
  const equipment = one("materiel");
  return {
    query: one("q").slice(0, 80),
    category: category ?? emptyLibraryFilters.category,
    muscleGroup: Object.hasOwn(muscleGroupLabels, muscle) ? (muscle as MuscleGroup) : "",
    equipmentGroup: Object.hasOwn(equipmentGroupLabels, equipment)
      ? (equipment as EquipmentGroup)
      : "",
    favoritesOnly: query.favoris !== undefined,
    mineOnly: query.miens !== undefined,
  };
}

export function queryFromFilters(filters: LibraryFilters): string {
  const params = new URLSearchParams();
  if (filters.category !== emptyLibraryFilters.category)
    params.set("rubrique", categorySlugs[filters.category]);
  if (filters.query.trim()) params.set("q", filters.query.trim());
  if (filters.muscleGroup) params.set("muscle", filters.muscleGroup);
  if (filters.equipmentGroup) params.set("materiel", filters.equipmentGroup);
  if (filters.favoritesOnly) params.set("favoris", "");
  if (filters.mineOnly) params.set("miens", "");
  const text = params.toString().replace(/(favoris|miens)=(&|$)/g, "$1$2");
  return text ? `?${text}` : "";
}

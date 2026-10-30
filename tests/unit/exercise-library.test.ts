import { describe, expect, it } from "vitest";

import {
  emptyLibraryFilters,
  equipmentGroupsOf,
  filterLibrary,
  filtersFromQuery,
  muscleGroupsOf,
  queryFromFilters,
  sortLibrary,
  thumbnailOf,
  type LibraryExercise,
} from "@/domain/exercises/library";

// Bibliothèque d'exercices (D-75) : recherche, filtres, ordre, vignette et filtres dans l'adresse.
const exercise = (overrides: Partial<LibraryExercise>): LibraryExercise => ({
  id: overrides.key ?? "id",
  key: "exercise",
  nameFr: "Exercice",
  nameEn: null,
  aliasesFr: [],
  aliasesEn: [],
  category: "strength",
  hyroxStation: null,
  equipment: [],
  primaryMuscles: [],
  thumbnail: null,
  favorite: false,
  mine: false,
  ...overrides,
});

const bench = exercise({
  key: "bench-press",
  nameFr: "Développé couché barre",
  nameEn: "Barbell Bench Press",
  aliasesFr: ["Bench press"],
  equipment: ["barbell", "bench"],
  primaryMuscles: ["pectoralis_major"],
});
const rdl = exercise({
  key: "romanian-deadlift",
  nameFr: "Soulevé de terre roumain",
  aliasesEn: ["RDL"],
  equipment: ["barbell"],
  primaryMuscles: ["hamstrings", "gluteus_maximus"],
  favorite: true,
});
const burpees = exercise({ key: "burpees", nameFr: "Burpees", category: "cardio" });
const wallBall = exercise({
  key: "wall-ball",
  nameFr: "Wall ball",
  category: "hyrox",
  hyroxStation: 8,
});
const skiErg = exercise({ key: "ski-erg", nameFr: "SkiErg", category: "hyrox", hyroxStation: 1 });
const all = [bench, rdl, burpees, wallBall, skiErg];
const filters = (patch: Partial<typeof emptyLibraryFilters>) => ({
  ...emptyLibraryFilters,
  ...patch,
});
const keys = (list: LibraryExercise[]) => list.map((item) => item.key);

describe("recherche", () => {
  it("sans accents ni majuscules, mot par mot", () => {
    expect(keys(filterLibrary(all, filters({ query: "DEVELOPPE couche" })))).toEqual([
      "bench-press",
    ]);
  });

  it("dans le nom anglais et les alias", () => {
    expect(keys(filterLibrary(all, filters({ query: "bench press" })))).toEqual(["bench-press"]);
    expect(keys(filterLibrary(all, filters({ query: "rdl" })))).toEqual(["romanian-deadlift"]);
  });

  it("sans mot, tout reste", () => {
    expect(filterLibrary(all, filters({ query: "   " }))).toHaveLength(5);
  });
});

describe("filtres", () => {
  it("par rubrique", () => {
    expect(keys(filterLibrary(all, filters({ category: "hyrox" })))).toEqual([
      "wall-ball",
      "ski-erg",
    ]);
    expect(keys(filterLibrary(all, filters({ category: "cardio" })))).toEqual(["burpees"]);
  });

  it("par groupe musculaire, d'après les muscles principaux", () => {
    expect(muscleGroupsOf(rdl.primaryMuscles)).toEqual(["hamstrings", "glutes"]);
    expect(keys(filterLibrary(all, filters({ muscleGroup: "glutes" })))).toEqual([
      "romanian-deadlift",
    ]);
  });

  it("par matériel ; sans matériel, c'est au poids du corps", () => {
    expect(equipmentGroupsOf([])).toEqual(["bodyweight"]);
    expect(equipmentGroupsOf(["barbell", "bench"])).toEqual(["free_weights", "small_equipment"]);
    expect(keys(filterLibrary(all, filters({ equipmentGroup: "bodyweight" })))).toEqual([
      "burpees",
      "wall-ball",
      "ski-erg",
    ]);
  });

  it("mes exercices seulement", () => {
    const mine = exercise({
      key: "mon-exo",
      nameFr: "Mon gainage",
      category: "mobility",
      mine: true,
    });
    expect(keys(filterLibrary([...all, mine], filters({ mineOnly: true })))).toEqual(["mon-exo"]);
    expect(keys(filterLibrary([...all, mine], filters({ category: "mobility" })))).toEqual([
      "mon-exo",
    ]);
  });

  it("favoris seulement", () => {
    expect(keys(filterLibrary(all, filters({ favoritesOnly: true })))).toEqual([
      "romanian-deadlift",
    ]);
  });
});

describe("ordre et vignette", () => {
  it("les stations Hyrox dans l'ordre de la course, puis le reste par nom", () => {
    expect(keys(sortLibrary(all))).toEqual([
      "ski-erg",
      "wall-ball",
      "burpees",
      "bench-press",
      "romanian-deadlift",
    ]);
  });

  it("la vignette prend l'image principale, sinon celle du début", () => {
    expect(thumbnailOf({ main: "/m.webp", start: "/s.webp" })).toBe("/m.webp");
    expect(thumbnailOf({ main: null, start: "/s.webp" })).toBe("/s.webp");
    expect(thumbnailOf({ main: null, start: null })).toBeNull();
  });
});

describe("filtres dans l'adresse", () => {
  it("aller-retour complet", () => {
    const chosen = filters({
      category: "hyrox",
      query: "sled",
      muscleGroup: "quads",
      equipmentGroup: "cardio",
      favoritesOnly: true,
      mineOnly: true,
    });
    const query = queryFromFilters(chosen);
    expect(query).toBe("?rubrique=hyrox&q=sled&muscle=quads&materiel=cardio&favoris&miens");
    expect(filtersFromQuery(Object.fromEntries(new URLSearchParams(query)))).toEqual(chosen);
  });

  it("sans filtre, une adresse nue ; une valeur inconnue est ignorée", () => {
    expect(queryFromFilters(emptyLibraryFilters)).toBe("");
    expect(filtersFromQuery({ rubrique: "pirate", muscle: "<script>", materiel: "laser" })).toEqual(
      emptyLibraryFilters,
    );
  });
});

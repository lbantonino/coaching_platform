"use client";

import { Plus, Search, Star, UserPen } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ExerciseImage, exerciseCategoryIcons } from "@/components/blocks/exercise-image";
import { FavoriteButton } from "@/components/blocks/favorite-button";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { buttonClass } from "@/components/ui/button";
import { chipActiveClass, chipClass, chipIdleClass } from "@/components/ui/chip";
import { inputClass } from "@/components/ui/form-styles";
import {
  LIBRARY_CATEGORIES,
  LIBRARY_PAGE_SIZE,
  emptyLibraryFilters,
  equipmentGroupsOf,
  filterLibrary,
  muscleGroupsOf,
  queryFromFilters,
  sortLibrary,
  type LibraryExercise,
  type LibraryFilters,
} from "@/domain/exercises/library";
import {
  equipmentGroupLabels,
  equipmentInfo,
  exerciseCategoryLabels,
  muscleGroupLabels,
  type EquipmentGroup,
  type MuscleGroup,
} from "@/domain/exercises/vocabulary";

// Bibliothèque (P3-01, D-75) : recherche en direct (français, anglais, alias, sans accents), rubriques
// Musculation / Cardio / Hyrox, filtres muscle et matériel, favoris. Cartes de 30 en 30 (docs/08 : pas
// des centaines de résultats d'un coup sur un téléphone). Un appui ouvre la fiche de l'exercice.
type SetFavorite = (exerciseId: string, favorite: boolean) => Promise<{ ok: boolean }>;

const subtitleOf = (exercise: LibraryExercise) => {
  if (exercise.hyroxStation) return `Station ${exercise.hyroxStation}`;
  if (exercise.mine) return "Mon exercice";
  const equipment = exercise.equipment[0];
  const muscle = muscleGroupsOf(exercise.primaryMuscles)[0];
  return [
    equipment ? equipmentInfo[equipment]?.label : equipmentGroupLabels.bodyweight,
    muscle ? muscleGroupLabels[muscle] : null,
  ]
    .filter(Boolean)
    .join(" · ");
};

export function LibraryView({
  exercises,
  initialFilters,
  setFavorite,
}: {
  exercises: LibraryExercise[];
  initialFilters: LibraryFilters;
  setFavorite: SetFavorite;
}) {
  const [filters, setFilters] = useState(initialFilters);
  const [limit, setLimit] = useState(LIBRARY_PAGE_SIZE);
  const rubrics = useRef<HTMLDivElement>(null);

  // Téléphone : la rangée des rubriques défile ; au retour sur « Hyrox », la pastille choisie
  // est ramenée à l'écran (sans faire défiler la page).
  useEffect(() => {
    const row = rubrics.current;
    const active = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (row && active && active.offsetLeft + active.offsetWidth > row.clientWidth) {
      row.scrollLeft = active.offsetLeft - 16;
    }
  }, []);

  const update = (patch: Partial<LibraryFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    setLimit(LIBRARY_PAGE_SIZE);
    // Les filtres suivent dans l'adresse, sans recharger la page (retour d'une fiche).
    window.history.replaceState(null, "", `${window.location.pathname}${queryFromFilters(next)}`);
  };

  const shown = sortLibrary(filterLibrary(exercises, filters));
  const filtered =
    filters.query.trim() !== "" ||
    filters.muscleGroup !== "" ||
    filters.equipmentGroup !== "" ||
    filters.favoritesOnly ||
    filters.mineOnly;
  const countOf = (category: LibraryFilters["category"]) =>
    category === "all"
      ? exercises.length
      : exercises.filter((exercise) => exercise.category === category).length;
  // Seuls les groupes présents dans la rubrique choisie sont proposés.
  const inCategory = exercises.filter(
    (exercise) => filters.category === "all" || exercise.category === filters.category,
  );
  const muscleGroups = (Object.keys(muscleGroupLabels) as MuscleGroup[]).filter((group) =>
    inCategory.some((exercise) => muscleGroupsOf(exercise.primaryMuscles).includes(group)),
  );
  const equipmentGroups = (Object.keys(equipmentGroupLabels) as EquipmentGroup[]).filter((group) =>
    inCategory.some((exercise) => equipmentGroupsOf(exercise.equipment).includes(group)),
  );

  return (
    <>
      <PageHeader
        title="Bibliothèque"
        subtitle="Exercices de musculation, de cardio et d'Hyrox, à retrouver d'un sportif à l'autre."
        actions={
          <Link href="/coach/bibliotheque/nouveau" className={buttonClass()}>
            <Plus aria-hidden size={16} strokeWidth={2} />
            Créer un exercice
          </Link>
        }
      />
      <PageBody>
        <div className="flex flex-col gap-3">
          <label className="flex h-11 items-center gap-2.5 rounded-control border border-line bg-surface px-3 text-[14px] focus-within:border-accent md:w-[420px]">
            <Search aria-hidden size={16} strokeWidth={1.8} className="shrink-0 text-muted" />
            <span className="sr-only">Rechercher un exercice</span>
            <input
              type="search"
              value={filters.query}
              onChange={(event) => update({ query: event.target.value })}
              placeholder="Rechercher un exercice (français ou anglais)…"
              autoComplete="off"
              maxLength={80}
              className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-text outline-none placeholder:text-muted md:text-[14px]"
            />
          </label>

          <div
            ref={rubrics}
            role="group"
            aria-label="Rubriques"
            className="-mx-3.5 flex gap-2 overflow-x-auto px-3.5 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
          >
            {/* Une rubrique vide n'apparaît pas (la Mobilité, si on la masque de nouveau). */}
            {(["all", ...LIBRARY_CATEGORIES] as const)
              .filter((category) => category !== "mobility" || countOf(category) > 0)
              .map((category) => {
                const Icon = category === "all" ? null : exerciseCategoryIcons[category];
                return (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={filters.category === category}
                    onClick={() => update({ category, muscleGroup: "", equipmentGroup: "" })}
                    className={`${chipClass} ${filters.category === category ? chipActiveClass : chipIdleClass}`}
                  >
                    {Icon ? <Icon aria-hidden size={15} strokeWidth={1.8} /> : null}
                    {category === "all" ? "Tout" : exerciseCategoryLabels[category]}
                    <span className="text-muted tabular">{countOf(category)}</span>
                  </button>
                );
              })}
            <button
              type="button"
              aria-pressed={filters.favoritesOnly}
              onClick={() => update({ favoritesOnly: !filters.favoritesOnly })}
              className={`${chipClass} ${filters.favoritesOnly ? chipActiveClass : chipIdleClass}`}
            >
              <Star aria-hidden size={15} strokeWidth={1.8} />
              Favoris
            </button>
            <button
              type="button"
              aria-pressed={filters.mineOnly}
              onClick={() => update({ mineOnly: !filters.mineOnly })}
              className={`${chipClass} ${filters.mineOnly ? chipActiveClass : chipIdleClass}`}
            >
              <UserPen aria-hidden size={15} strokeWidth={1.8} />
              Mes exercices
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 md:flex md:gap-3">
            <label className="flex min-w-0 flex-col md:w-60">
              <span className="sr-only">Filtrer par muscle</span>
              <select
                value={filters.muscleGroup}
                onChange={(event) =>
                  update({ muscleGroup: event.target.value as MuscleGroup | "" })
                }
                className={`${inputClass} h-11 text-[14px]`}
              >
                <option value="">Tous les muscles</option>
                {muscleGroups.map((group) => (
                  <option key={group} value={group}>
                    {muscleGroupLabels[group]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-w-0 flex-col md:w-60">
              <span className="sr-only">Filtrer par matériel</span>
              <select
                value={filters.equipmentGroup}
                onChange={(event) =>
                  update({ equipmentGroup: event.target.value as EquipmentGroup | "" })
                }
                className={`${inputClass} h-11 text-[14px]`}
              >
                <option value="">Tout le matériel</option>
                {equipmentGroups.map((group) => (
                  <option key={group} value={group}>
                    {equipmentGroupLabels[group]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <section aria-labelledby="library-results" className="flex flex-col gap-3">
          <div className="flex min-h-11 items-center justify-between gap-3">
            <h2 id="library-results" className="text-[14px] text-muted" aria-live="polite">
              {shown.length} exercice{shown.length > 1 ? "s" : ""}
            </h2>
            {filtered ? (
              <button
                type="button"
                onClick={() => update({ ...emptyLibraryFilters, category: filters.category })}
                className={buttonClass({ variant: "ghost", size: "sm" })}
              >
                Effacer les filtres
              </button>
            ) : null}
          </div>

          {shown.length === 0 ? (
            <p className="rounded-card border border-dashed border-line-2 p-4 text-[14px] text-muted">
              {filters.mineOnly && !filters.query && !filters.muscleGroup && !filters.equipmentGroup
                ? "Aucun exercice créé par toi dans cette rubrique. « Créer un exercice » l'ajoute à ta bibliothèque, avec sa photo et son lien vidéo."
                : filters.favoritesOnly &&
                    !filters.query &&
                    !filters.muscleGroup &&
                    !filters.equipmentGroup
                  ? "Aucun favori dans cette rubrique. Touche l'étoile d'un exercice pour le retrouver ici."
                  : "Aucun exercice ne correspond. Essaie un autre mot ou un autre filtre."}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {shown.slice(0, limit).map((exercise) => (
                <li key={exercise.id} className="relative min-w-0">
                  <Link
                    href={`/coach/bibliotheque/${exercise.key}`}
                    className="flex h-full flex-col gap-2 rounded-card border border-line bg-surface p-2 transition-colors duration-150 hover:bg-surface-2"
                  >
                    <ExerciseImage src={exercise.thumbnail} alt="" category={exercise.category} />
                    <span className="flex min-w-0 flex-col gap-0.5 px-1 pb-1">
                      <span className="line-clamp-2 text-[14px] leading-snug font-semibold">
                        {exercise.nameFr}
                      </span>
                      <span className="truncate text-[12px] text-muted">
                        {subtitleOf(exercise)}
                      </span>
                    </span>
                  </Link>
                  <div className="absolute top-1 right-1">
                    <FavoriteButton
                      name={exercise.nameFr}
                      favorite={exercise.favorite}
                      setFavorite={(favorite) => setFavorite(exercise.id, favorite)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {shown.length > limit ? (
            <button
              type="button"
              onClick={() => setLimit(limit + LIBRARY_PAGE_SIZE)}
              className={buttonClass({ variant: "outline", className: "self-center" })}
            >
              Afficher plus ({shown.length - limit} restants)
            </button>
          ) : null}
        </section>

        {/* Licence RepDB (terme 2) : mention visible ; terme 7 : pas un avis médical. */}
        <p className="text-[13px] leading-[1.5] text-muted">
          Musculation et cardio :{" "}
          <a
            href="https://repdb.co"
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="underline underline-offset-2 hover:text-text"
          >
            Exercise data by RepDB (repdb.co)
          </a>
          . Illustrations Hyrox : Coory. Contenu informatif, pas un avis médical.
        </p>
      </PageBody>
    </>
  );
}

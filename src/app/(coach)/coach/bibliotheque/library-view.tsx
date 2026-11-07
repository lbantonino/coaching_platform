"use client";

import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CardIllustration, ExerciseTag } from "@/components/blocks/exercise-image";
import { FavoriteButton } from "@/components/blocks/favorite-button";
import {
  LibraryBookIcon,
  PersonIcon,
  StarIcon,
  libraryCategoryDots,
  libraryCategoryIcons,
} from "@/components/blocks/library-icons";
import { LibraryFilter, type FilterOption } from "@/components/blocks/library-filter";
import { phoneFabClass } from "@/components/layout/mobile-bar";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { buttonClass } from "@/components/ui/button";
import {
  LIBRARY_CATEGORIES,
  LIBRARY_PAGE_SIZE,
  emptyLibraryFilters,
  equipmentGroupsOf,
  filterLibrary,
  muscleGroupsOf,
  queryFromFilters,
  sortLibrary,
  type LibraryCategory,
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
import { useWideScreen } from "@/lib/use-wide-screen";

// Bibliothèque (P3-01, D-75 ; maquette « Bibliothèque » du 06/11/2026, D-142) : recherche en direct
// (français, anglais, alias, sans accents), un seul menu « Catégorie » (rubriques, Favoris, Mes
// exercices), filtres Muscles et Matériel, cartes de 24 en 24 (rangées pleines en 2, 3 et 4
// colonnes ; docs/08 : pas des centaines de résultats d'un coup sur un téléphone). Un appui ouvre la
// fiche de l'exercice ; l'étoile le met en favori sans l'ouvrir.
// Ordinateur : tout dans une carte blanche ; téléphone : sur le fond de la page, cartes en 2 colonnes.
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

// Le menu « Catégorie » : une rubrique, Favoris ou Mes exercices (un seul choix à la fois).
type CategoryChoice = LibraryCategory | "all" | "favorites" | "mine";
const choiceOf = (filters: LibraryFilters): CategoryChoice =>
  filters.favoritesOnly ? "favorites" : filters.mineOnly ? "mine" : filters.category;

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
  const wide = useWideScreen();

  const update = (patch: Partial<LibraryFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    setLimit(LIBRARY_PAGE_SIZE);
    // Les filtres suivent dans l'adresse, sans recharger la page (retour d'une fiche).
    window.history.replaceState(null, "", `${window.location.pathname}${queryFromFilters(next)}`);
  };

  const shown = sortLibrary(filterLibrary(exercises, filters));
  const choice = choiceOf(filters);
  const narrowed =
    filters.query.trim() !== "" || filters.muscleGroup !== "" || filters.equipmentGroup !== "";
  const filtered = narrowed || choice !== "all";

  const countOf = (category: LibraryCategory | "all") =>
    category === "all"
      ? exercises.length
      : exercises.filter((exercise) => exercise.category === category).length;
  const categoryOptions: FilterOption[] = [
    { value: "all", label: "Tous", count: exercises.length, icon: LibraryBookIcon },
    // Une rubrique vide n'apparaît pas (la Mobilité, si on la masque de nouveau).
    ...LIBRARY_CATEGORIES.filter((category) => countOf(category) > 0).map((category) => ({
      value: category,
      label: exerciseCategoryLabels[category],
      count: countOf(category),
      icon: libraryCategoryIcons[category],
      dot: libraryCategoryDots[category],
    })),
    { value: "favorites", label: "Favoris", icon: StarIcon, separatorBefore: true },
    { value: "mine", label: "Mes exercices", icon: PersonIcon },
  ];
  const currentCategory = categoryOptions.find((option) => option.value === choice);
  const chooseCategory = (value: string) =>
    update({
      category:
        value === "favorites" || value === "mine" ? "all" : (value as LibraryCategory | "all"),
      favoritesOnly: value === "favorites",
      mineOnly: value === "mine",
      muscleGroup: "",
      equipmentGroup: "",
    });

  // Seuls les groupes présents dans la rubrique choisie sont proposés, avec leur nombre d'exercices.
  const inCategory = exercises.filter(
    (exercise) => filters.category === "all" || exercise.category === filters.category,
  );
  const muscleOptions: FilterOption[] = [
    { value: "", label: "Tous les muscles" },
    ...(Object.keys(muscleGroupLabels) as MuscleGroup[])
      .map((group) => ({
        value: group,
        label: muscleGroupLabels[group],
        count: inCategory.filter((exercise) =>
          muscleGroupsOf(exercise.primaryMuscles).includes(group),
        ).length,
      }))
      .filter((option) => option.count > 0),
  ];
  const equipmentOptions: FilterOption[] = [
    { value: "", label: "Tout le matériel" },
    ...(Object.keys(equipmentGroupLabels) as EquipmentGroup[])
      .map((group) => ({
        value: group,
        label: equipmentGroupLabels[group],
        count: inCategory.filter((exercise) =>
          equipmentGroupsOf(exercise.equipment).includes(group),
        ).length,
      }))
      .filter((option) => option.count > 0),
  ];

  const remaining = shown.length - limit;
  const emptyText =
    choice === "mine" && !narrowed
      ? {
          title: "Aucun exercice créé par toi",
          text: "« Créer un exercice » l'ajoute à ta bibliothèque, avec sa photo et son lien vidéo.",
        }
      : choice === "favorites" && !narrowed
        ? {
            title: "Aucun favori",
            text: "Touche l'étoile d'un exercice pour le retrouver ici.",
          }
        : { title: "Aucun exercice trouvé", text: "Essaie un autre mot ou retire un filtre." };

  return (
    <>
      <PageHeader
        title="Bibliothèque"
        subtitle="Exercices de musculation, de cardio et d'Hyrox, à retrouver d'un sportif à l'autre."
        actions={
          // Ordinateur : le bouton de l'en-tête (32 px, comme les autres pages) ; téléphone : le
          // bouton flottant (décision 4 d'Antonino, kit « Coory Pages », D-122).
          <Link
            href="/coach/bibliotheque/nouveau"
            className={buttonClass({
              className:
                "max-lg:hidden lg:h-8! lg:gap-1.5! lg:rounded-[9px]! lg:px-3.5! lg:text-[12.5px]! lg:font-medium!",
            })}
          >
            <Plus aria-hidden size={13} strokeWidth={2.2} />
            Créer un exercice
          </Link>
        }
      />
      <Link
        href="/coach/bibliotheque/nouveau"
        aria-label="Créer un exercice"
        data-phone-fab=""
        className={phoneFabClass}
      >
        <Plus aria-hidden size={24} strokeWidth={2.2} />
      </Link>
      <PageBody>
        <section
          aria-labelledby="library-results"
          className="flex flex-col gap-3 lg:gap-[18px] lg:rounded-[20px] lg:bg-surface lg:px-[22px] lg:pt-5 lg:pb-6 lg:inset-ring lg:inset-ring-line-soft"
        >
          {/* Recherche et filtres : une ligne à partir de 1 280 px (maquette) ; en dessous, la recherche
              puis les trois filtres (1,1 / 1 / 1), pour que la recherche garde de la place. */}
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-2.5">
            <label className="flex h-11 min-w-0 items-center gap-2.5 rounded-[13px] bg-surface px-3.5 inset-ring inset-ring-line transition-shadow duration-150 focus-within:inset-ring-[1.5px] focus-within:inset-ring-violet/55 lg:h-10 lg:rounded-[11px] xl:flex-1 lg:bg-surface-2 lg:inset-ring-popover-line">
              <Search
                aria-hidden
                strokeWidth={2}
                className="size-[17px] shrink-0 text-muted lg:size-4"
              />
              <span className="sr-only">Rechercher un exercice</span>
              <input
                type="search"
                value={filters.query}
                onChange={(event) => update({ query: event.target.value })}
                placeholder={
                  wide ? "Rechercher un exercice (français ou anglais)…" : "Rechercher un exercice…"
                }
                autoComplete="off"
                maxLength={80}
                // 16 px sur téléphone : en dessous, l'iPhone zoome sur le champ.
                className="h-full min-w-0 flex-1 truncate bg-transparent text-[16px] text-text outline-none placeholder:text-dlg-faint lg:text-[13.5px]"
              />
            </label>
            <div className="grid grid-cols-[1.1fr_1fr_1fr] gap-2 lg:gap-2.5 xl:flex">
              <LibraryFilter
                title="Catégorie"
                options={categoryOptions}
                value={choice}
                onChange={chooseCategory}
                onReset={() => chooseCategory("all")}
                label={currentCategory?.label ?? "Tous"}
                shortLabel={currentCategory?.label ?? "Tous"}
                count={currentCategory?.count}
                dark
                className="xl:w-[150px]"
              />
              <LibraryFilter
                title="Muscles"
                options={muscleOptions}
                value={filters.muscleGroup}
                onChange={(value) => update({ muscleGroup: value as MuscleGroup | "" })}
                onReset={() => update({ muscleGroup: "" })}
                label={
                  filters.muscleGroup ? muscleGroupLabels[filters.muscleGroup] : "Tous les muscles"
                }
                shortLabel={
                  filters.muscleGroup ? muscleGroupLabels[filters.muscleGroup] : "Muscles"
                }
                dark={filters.muscleGroup !== ""}
                className="xl:w-[176px]"
              />
              <LibraryFilter
                title="Matériel"
                options={equipmentOptions}
                value={filters.equipmentGroup}
                onChange={(value) => update({ equipmentGroup: value as EquipmentGroup | "" })}
                onReset={() => update({ equipmentGroup: "" })}
                label={
                  filters.equipmentGroup
                    ? equipmentGroupLabels[filters.equipmentGroup]
                    : "Tout le matériel"
                }
                shortLabel={
                  filters.equipmentGroup ? equipmentGroupLabels[filters.equipmentGroup] : "Matériel"
                }
                dark={filters.equipmentGroup !== ""}
                className="xl:w-[170px]"
              />
            </div>
          </div>

          <div className="flex min-h-[18px] items-center justify-between gap-3 px-0.5 pt-0.5 lg:min-h-4 lg:p-0">
            <h2
              id="library-results"
              aria-live="polite"
              className="text-[12.5px] leading-[normal] font-semibold text-muted lg:text-[13px] lg:text-text"
            >
              {shown.length} exercice{shown.length > 1 ? "s" : ""}
            </h2>
            {filtered ? (
              <button
                type="button"
                onClick={() => update(emptyLibraryFilters)}
                className="-my-2 rounded-[8px] py-2 text-[12.5px] leading-none font-medium text-violet-text underline-offset-2 hover:underline"
              >
                Effacer les filtres
              </button>
            ) : null}
          </div>

          {shown.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-[16px] bg-surface px-5 py-10 text-center lg:rounded-none lg:bg-transparent">
              <span className="grid size-12 place-items-center rounded-full bg-lib-lavender">
                <Search aria-hidden size={21} strokeWidth={1.8} className="text-violet-text" />
              </span>
              <span className="flex flex-col items-center gap-1">
                <span className="text-[15px] leading-[normal] font-semibold text-text">
                  {emptyText.title}
                </span>
                <span className="max-w-[320px] text-[13px] leading-[1.5] text-pretty text-dlg-faint">
                  {emptyText.text}
                </span>
              </span>
              {filtered ? (
                <button
                  type="button"
                  onClick={() => update(emptyLibraryFilters)}
                  className="inline-flex h-10 items-center rounded-[11px] bg-surface px-[18px] text-[13.5px] leading-none font-semibold text-text inset-ring inset-ring-lib-field-ring transition-[background-color,scale] duration-150 ease-out hover:bg-surface-2 active:scale-[0.98]"
                >
                  Réinitialiser les filtres
                </button>
              ) : null}
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:gap-3.5 xl:grid-cols-4 min-[1600px]:grid-cols-5">
              {shown.slice(0, limit).map((exercise) => (
                <li key={exercise.id} className="relative min-w-0">
                  <Link
                    href={`/coach/bibliotheque/${exercise.key}`}
                    className="flex h-full flex-col gap-2.5 rounded-[16px] bg-surface px-2 pt-2 pb-3 inset-ring inset-ring-line-soft transition-shadow duration-150 ease-out hover:shadow-[0_8px_24px_-12px_rgba(20,10,50,0.18)] hover:inset-ring-lib-field-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
                  >
                    <span className="relative block">
                      <CardIllustration src={exercise.thumbnail} alt="" />
                      {/* Le nom de l'exercice ouvre le nom du lien ; la rubrique est redite à la fin. */}
                      <span aria-hidden className="absolute bottom-2 left-2">
                        <ExerciseTag category={exercise.category} />
                      </span>
                    </span>
                    <span className="flex min-w-0 flex-col gap-[3px] px-1">
                      <span className="line-clamp-2 text-[13px] leading-[1.3] font-semibold text-text lg:text-[14px]">
                        {exercise.nameFr}
                      </span>
                      <span className="truncate text-[11.5px] leading-[normal] text-muted lg:text-[12.5px]">
                        {subtitleOf(exercise)}
                        <span className="sr-only">
                          , {exerciseCategoryLabels[exercise.category]}
                        </span>
                      </span>
                    </span>
                  </Link>
                  <div className="absolute top-4 right-4">
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

          {remaining > 0 ? (
            <button
              type="button"
              onClick={() => setLimit(limit + LIBRARY_PAGE_SIZE)}
              className="inline-flex h-10 items-center gap-2 self-center rounded-[11px] px-[18px] text-[13.5px] leading-none font-semibold text-text inset-ring inset-ring-lib-field-ring transition-[background-color,scale] duration-150 ease-out hover:bg-surface-2 active:scale-[0.98]"
            >
              Afficher plus
              <span className="font-medium text-dlg-faint">
                {remaining} restant{remaining > 1 ? "s" : ""}
              </span>
            </button>
          ) : null}
        </section>

        {/* Licence RepDB (terme 2) : mention visible ; terme 7 : pas un avis médical. */}
        <p className="text-[12px] leading-[1.5] text-dlg-faint">
          Musculation et cardio :{" "}
          <a
            href="https://repdb.co"
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="text-muted underline underline-offset-2 hover:text-text"
          >
            Exercise data by RepDB (repdb.co)
          </a>
          . Illustrations Hyrox : Coory. Contenu informatif, pas un avis médical.
        </p>
      </PageBody>
    </>
  );
}

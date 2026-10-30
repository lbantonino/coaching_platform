import type { Metadata } from "next";
import { Suspense } from "react";

import { PageLoading, pageMainClass } from "@/components/layout/page-header";
import { filtersFromQuery } from "@/domain/exercises/library";
import { requireCoach } from "@/features/auth/guards";
import { setExerciseFavorite } from "@/features/exercises/actions";
import { listLibraryExercises } from "@/features/exercises/queries";

import { LibraryView } from "./library-view";

export const metadata: Metadata = {
  title: "Bibliothèque",
};

// Bibliothèque d'exercices du coach (P3-01, D-75) : Musculation, Cardio et Hyrox. Les exercices sont lus
// ici (serveur) ; la recherche et les filtres se font en direct dans la page, et restent dans
// l'adresse (?rubrique=hyrox&q=…) pour retrouver la liste au retour d'une fiche.
export default function LibraryPage({ searchParams }: PageProps<"/coach/bibliotheque">) {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
        {searchParams.then((query) => (
          <Library query={query} />
        ))}
      </Suspense>
    </main>
  );
}

async function Library({ query }: { query: Record<string, string | string[] | undefined> }) {
  // Garde-fou serveur : connecté ET membre actif d'une organisation, sinon redirection.
  const { user, memberships } = await requireCoach();
  const exercises = await listLibraryExercises(user.id, memberships[0].organizationId);
  return (
    <LibraryView
      exercises={exercises}
      initialFilters={filtersFromQuery(query)}
      setFavorite={setExerciseFavorite}
    />
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";

import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { cleanQuery } from "@/domain/search/search";
import { requireCoach } from "@/features/auth/guards";
import { searchCoory } from "@/features/search/actions";

import { SearchView } from "./search-view";

export const metadata: Metadata = {
  title: "Recherche",
};

// Page Recherche du coach (4e, D-62). Avec ?q= (lien partagé, recherche du haut de page), les
// résultats arrivent déjà calculés ; ensuite tout se filtre en direct.
export default function SearchPage({ searchParams }: PageProps<"/coach/recherche">) {
  return (
    <main className={pageMainClass}>
      <PageHeader
        title="Recherche"
        subtitle="Sportifs, programmes, séances, documents et tâches."
        tools={false}
      />
      <PageBody>
        <Suspense fallback={<PageLoading />}>
          {searchParams.then((params) => (
            <Results query={typeof params.q === "string" ? cleanQuery(params.q) : ""} />
          ))}
        </Suspense>
      </PageBody>
    </main>
  );
}

async function Results({ query }: { query: string }) {
  const { memberships } = await requireCoach();
  const organizationId = memberships[0].organizationId;
  const search = searchCoory.bind(null, organizationId);
  const initial = query ? await search(query) : null;
  return (
    <SearchView
      // Une nouvelle recherche depuis le haut de page repart de sa saisie.
      key={query}
      initialQuery={query}
      initialResults={initial}
      orgBase={`/coach/o/${organizationId}`}
      search={search}
    />
  );
}

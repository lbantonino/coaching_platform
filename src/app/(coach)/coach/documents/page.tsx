import type { Metadata } from "next";
import { Suspense } from "react";

import { PageLoading, pageMainClass } from "@/components/layout/page-header";
import { requireCoach } from "@/features/auth/guards";
import {
  createDocumentCategory,
  deleteDocument,
  deleteDocumentCategory,
  renameDocumentCategory,
  setDocumentCategoryColor,
  updateDocument,
  uploadDocument,
} from "@/features/documents/actions";
import { listDocumentCategories, listDocuments } from "@/features/documents/queries";
import { listSessionAthletes } from "@/features/sessions/actions";
import { todayIsoInBrussels } from "@/lib/format";

import { DocumentsView } from "./documents-view";

export const metadata: Metadata = {
  title: "Documents",
};

// Page Documents du coach (4e, D-60). Les données sont lues ici (serveur) ; la recherche et les
// filtres se font en direct dans la page. ?sportif=<id> : filtrée sur ce sportif ; ?importer : avec
// l'import ouvert (onglet Documents de la fiche, D-67).
export default function DocumentsPage({ searchParams }: PageProps<"/coach/documents">) {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
        {searchParams.then((query) => (
          <Documents
            athleteId={typeof query.sportif === "string" ? query.sportif : ""}
            openImport={query.importer !== undefined}
          />
        ))}
      </Suspense>
    </main>
  );
}

async function Documents({ athleteId, openImport }: { athleteId: string; openImport: boolean }) {
  // Garde-fou serveur : connecté ET membre actif d'une organisation, sinon redirection.
  const { memberships } = await requireCoach();
  const organizationId = memberships[0].organizationId;
  const [documents, categories, athletes] = await Promise.all([
    listDocuments(organizationId),
    listDocumentCategories(organizationId),
    listSessionAthletes(organizationId),
  ]);
  return (
    <DocumentsView
      documents={documents}
      categories={categories}
      athletes={athletes}
      // Un sportif inconnu (ou d'une autre organisation) n'est simplement pas présélectionné.
      initialAthleteId={athletes.some((athlete) => athlete.id === athleteId) ? athleteId : ""}
      openImport={openImport}
      orgBase={`/coach/o/${organizationId}`}
      monthStart={`${todayIsoInBrussels().slice(0, 7)}-01`}
      upload={uploadDocument.bind(null, organizationId)}
      update={updateDocument.bind(null, organizationId)}
      remove={deleteDocument.bind(null, organizationId)}
      categoryActions={{
        create: createDocumentCategory.bind(null, organizationId),
        rename: renameDocumentCategory.bind(null, organizationId),
        remove: deleteDocumentCategory.bind(null, organizationId),
        recolor: setDocumentCategoryColor.bind(null, organizationId),
      }}
    />
  );
}

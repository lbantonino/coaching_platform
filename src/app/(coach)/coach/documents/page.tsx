import type { Metadata } from "next";
import { Suspense } from "react";

import { PageLoading, pageMainClass } from "@/components/layout/page-header";
import { requireCoach } from "@/features/auth/guards";
import { deleteDocument, updateDocument, uploadDocument } from "@/features/documents/actions";
import { listDocuments } from "@/features/documents/queries";
import { listSessionAthletes } from "@/features/sessions/actions";
import { todayIsoInBrussels } from "@/lib/format";

import { DocumentsView } from "./documents-view";

export const metadata: Metadata = {
  title: "Documents",
};

// Page Documents du coach (4e, D-60). Les données sont lues ici (serveur) ; la recherche et les
// filtres se font en direct dans la page.
export default function DocumentsPage() {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
        <Documents />
      </Suspense>
    </main>
  );
}

async function Documents() {
  // Garde-fou serveur : connecté ET membre actif d'une organisation, sinon redirection.
  const { memberships } = await requireCoach();
  const organizationId = memberships[0].organizationId;
  const [documents, athletes] = await Promise.all([
    listDocuments(organizationId),
    listSessionAthletes(organizationId),
  ]);
  return (
    <DocumentsView
      documents={documents}
      athletes={athletes}
      orgBase={`/coach/o/${organizationId}`}
      monthStart={`${todayIsoInBrussels().slice(0, 7)}-01`}
      upload={uploadDocument.bind(null, organizationId)}
      update={updateDocument.bind(null, organizationId)}
      remove={deleteDocument.bind(null, organizationId)}
    />
  );
}

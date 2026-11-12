import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { findSession } from "@/domain/training/plan-edit";
import { orderedSessions } from "@/domain/training/scheduling";
import { requireOrgAccess } from "@/features/auth/guards";
import { loadAthleteContext, loadDraft, loadStrengthMaxes } from "@/features/programs/drafts";
import { listLibraryChoices } from "@/features/programs/library-choices";
import { createClient } from "@/lib/supabase/server";

import { EditorProvider } from "../../../_editor/editor-provider";
import { programHref } from "../../../_session/links";
import {
  SessionEditor,
  SessionHeaderActions,
  type SessionMeta,
} from "../../../_session/session-editor";

export const metadata: Metadata = {
  title: "Séance",
};

// Modifier une séance du programme (04 Running ; 05 Musculation et 06 Hyrox, D-157). Adresse : la clé
// de la séance dans le brouillon. « Terminer » revient à l'éditeur du programme, sur sa semaine ; ou,
// venu de la fiche du sportif (?retour=…, demande d'Antonino du 10/11), à cette fiche.
export default function SessionPage({
  params,
  searchParams,
}: PageProps<"/coach/o/[orgId]/programmes/[programId]/seances/[cle]">) {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
        {Promise.all([params, searchParams]).then(([{ orgId, programId, cle }, query]) => (
          <Session
            orgId={orgId}
            programId={programId}
            sessionKey={cle}
            returnTo={typeof query.retour === "string" ? query.retour : null}
          />
        ))}
      </Suspense>
    </main>
  );
}

async function Session({
  orgId,
  programId,
  sessionKey,
  returnTo,
}: {
  orgId: string;
  programId: string;
  sessionKey: string;
  returnTo: string | null;
}) {
  const { user, membership } = await requireOrgAccess(orgId);
  const organizationId = membership.organizationId;
  const base = `/coach/o/${organizationId}/programmes`;
  const supabase = await createClient();
  const loaded = await loadDraft(supabase, organizationId, programId);
  if (!loaded?.draft) notFound();
  const found = findSession(loaded.draft, sessionKey);
  if (!found) notFound();
  const athleteId = loaded.program.athleteId;
  const isStrength = found.session.content.discipline === "strength";
  const [athlete, maxes, library] = await Promise.all([
    loadAthleteContext(supabase, organizationId, athleteId),
    isStrength ? loadStrengthMaxes(supabase, organizationId, athleteId) : Promise.resolve({}),
    isStrength ? listLibraryChoices(user.id, organizationId) : Promise.resolve([]),
  ]);

  const position =
    orderedSessions(found.week).findIndex((session) => session.key === sessionKey) + 1;
  const meta: SessionMeta = {
    base,
    programId,
    sessionKey,
    weekIndex: found.week.index,
    position,
    athlete: {
      firstName: athlete?.firstName ?? "ton sportif",
      vmaKmh: athlete?.vmaKmh ?? null,
      hrMax: athlete?.hrMax ?? null,
    },
    hyrox:
      found.session.content.discipline === "hyrox"
        ? {
            firstName: athlete?.firstName ?? "ton sportif",
            division: loaded.draft.goal?.hyroxDivision ?? athlete?.defaultHyroxDivision ?? null,
            sex: athlete?.sex ?? null,
          }
        : null,
    strength: isStrength
      ? { athlete: { firstName: athlete?.firstName ?? "ton sportif", maxes }, library }
      : null,
    // Retour vers la fiche du sportif : seulement une page de fiche de CETTE organisation (jamais une
    // adresse quelconque reçue dans l'URL).
    returnTo:
      returnTo &&
      returnTo.startsWith(`/coach/o/${organizationId}/sportifs/`) &&
      !returnTo.includes("//")
        ? { href: returnTo, label: athlete?.displayName ?? "Fiche du sportif" }
        : null,
  };
  const back = meta.returnTo?.href ?? programHref(meta);

  return (
    <EditorProvider
      key={`${programId}:${loaded.revision}`}
      organizationId={organizationId}
      target={{ kind: "program", programId }}
      readOnly={loaded.program.status === "archived"}
      initialPlan={loaded.draft}
      initialRevision={loaded.revision}
    >
      <PageHeader
        title={`Séance ${position}`}
        back={{ href: back, label: meta.returnTo?.label ?? loaded.draft.title }}
        visibleTitle={false}
        phoneBack={false}
        actions={<SessionHeaderActions href={back} />}
      />
      <PageBody>
        <SessionEditor meta={meta} />
      </PageBody>
    </EditorProvider>
  );
}

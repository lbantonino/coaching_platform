import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { requireOrgAccess } from "@/features/auth/guards";
import {
  aimContext,
  listCoachSessionSlots,
  loadAthleteContext,
  loadDraft,
} from "@/features/programs/drafts";
import { listSessionTemplateChoices } from "@/features/programs/templates";
import { todayIsoInBrussels } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

import { EditorProvider } from "../_editor/editor-provider";
import { EditorHeaderActions, ProgramEditor, type EditorMeta } from "../_editor/program-editor";
import { SafeBack } from "../_session/safe-leave";

export const metadata: Metadata = {
  title: "Programme",
};

// Éditeur d'un programme (maquette 03, EDT-01 à 05, D-157). Le brouillon s'enregistre tout seul ;
// « Publier » fige une version pour le sportif. Ordinateur : la page tient dans l'écran, chaque
// colonne défile à l'intérieur.
export default function ProgramPage({
  params,
  searchParams,
}: PageProps<"/coach/o/[orgId]/programmes/[programId]">) {
  return (
    <main className={`${pageMainClass} lg:h-dvh lg:flex-none`}>
      <Suspense fallback={<PageLoading />}>
        {Promise.all([params, searchParams]).then(([{ orgId, programId }, query]) => (
          <Program
            orgId={orgId}
            programId={programId}
            focus={{
              week: Number(typeof query.semaine === "string" ? query.semaine : NaN) || null,
              session: typeof query.seance === "string" ? query.seance : null,
            }}
            returnTo={typeof query.retour === "string" ? query.retour : null}
          />
        ))}
      </Suspense>
    </main>
  );
}

async function Program({
  orgId,
  programId,
  focus,
  returnTo,
}: {
  orgId: string;
  programId: string;
  // Retour d'une séance (« Terminer ») : ?semaine=2&seance=<clé> rouvre cette semaine et cette séance.
  focus: EditorMeta["focus"];
  // Ouvert depuis la fiche du sportif (?retour=, revue MVP du 13/11, B15) : le retour y ramène.
  returnTo: string | null;
}) {
  const { membership } = await requireOrgAccess(orgId);
  const organizationId = membership.organizationId;
  const base = `/coach/o/${organizationId}/programmes`;
  const supabase = await createClient();
  const loaded = await loadDraft(supabase, organizationId, programId);
  if (!loaded) notFound();
  const { program, draft } = loaded;
  // Seulement une fiche de CETTE organisation, jamais une adresse quelconque reçue dans l'URL.
  const fiche = `/coach/o/${organizationId}/sportifs/${program.athleteId}`;
  const fromFiche =
    returnTo !== null && returnTo.startsWith(fiche) && !returnTo.includes("//") ? returnTo : null;
  const back = { href: fromFiche ?? base, label: "Programmes" };

  if (!draft) {
    return (
      <>
        <PageHeader title={program.title} back={back} visibleTitle={false} />
        <PageBody>
          <p className="rounded-[20px] bg-surface p-6 text-[14px] text-muted">
            Ce programme ne peut pas s&apos;ouvrir dans l&apos;éditeur : son contenu n&apos;est pas
            lisible.
          </p>
        </PageBody>
      </>
    );
  }

  const [athlete, profile, others, coachSessions, sessionTemplates] = await Promise.all([
    loadAthleteContext(supabase, organizationId, program.athleteId),
    supabase
      .from("athlete_profiles")
      .select("photo_path")
      .eq("organization_id", organizationId)
      .eq("id", program.athleteId)
      .maybeSingle(),
    supabase
      .from("programs")
      .select("title, start_date, weeks_count")
      .eq("organization_id", organizationId)
      .eq("athlete_id", program.athleteId)
      .eq("status", "published")
      .neq("id", program.id),
    listCoachSessionSlots(supabase, organizationId),
    listSessionTemplateChoices(organizationId, draft.discipline),
  ]);
  if (!athlete) notFound();
  if (fromFiche) back.label = athlete.displayName;

  const context = aimContext(athlete, draft);
  const meta: EditorMeta = {
    base,
    mode: "program",
    athlete: {
      name: athlete.displayName,
      firstName: athlete.firstName,
      photoPath: profile.data?.photo_path ?? null,
    },
    publication: loaded.activePublication
      ? {
          number: loaded.activePublication.number,
          sourceRevision: loaded.activePublication.sourceRevision,
        }
      : null,
    athleteHref: `/coach/o/${organizationId}/sportifs/${program.athleteId}?onglet=programme`,
    today: todayIsoInBrussels(),
    templateSource: null,
    focus,
    sessionTemplates,
    returnTo: fromFiche ? back : null,
    publishContext: {
      hrMax: context.hrMax,
      maxByExercise: [...context.maxByExercise.entries()],
      hyroxDivision: context.hyroxDivision,
      sex: context.sex,
      otherPublished: (others.data ?? []).map((row) => ({
        title: row.title,
        startDate: row.start_date,
        weeksCount: row.weeks_count,
      })),
      availableDays: athlete.availableDays,
      coachSessionIds: coachSessions.map((session) => session.id),
    },
  };

  return (
    <EditorProvider
      key={`${program.id}:${loaded.revision}`}
      organizationId={organizationId}
      target={{ kind: "program", programId: program.id }}
      readOnly={program.status === "archived"}
      initialPlan={draft}
      initialRevision={loaded.revision}
    >
      {/* Le retour de l'en-tête enregistre d'abord ce qui attend (revue MVP du 13/11, C7). */}
      <SafeBack>
        <PageHeader
          title={draft.title}
          back={back}
          visibleTitle={false}
          phoneBack={false}
          actions={<EditorHeaderActions base={base} />}
        />
      </SafeBack>
      <PageBody fill>
        <ProgramEditor meta={meta} />
      </PageBody>
    </EditorProvider>
  );
}

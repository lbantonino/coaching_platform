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
}: {
  orgId: string;
  programId: string;
  // Retour d'une séance (« Terminer ») : ?semaine=2&seance=<clé> rouvre cette semaine et cette séance.
  focus: EditorMeta["focus"];
}) {
  const { membership } = await requireOrgAccess(orgId);
  const organizationId = membership.organizationId;
  const base = `/coach/o/${organizationId}/programmes`;
  const supabase = await createClient();
  const loaded = await loadDraft(supabase, organizationId, programId);
  if (!loaded) notFound();
  const { program, draft } = loaded;
  const back = { href: base, label: "Programmes" };

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
      organizationId={organizationId}
      target={{ kind: "program", programId: program.id }}
      readOnly={program.status === "archived"}
      initialPlan={draft}
      initialRevision={loaded.revision}
    >
      <PageHeader
        title={draft.title}
        back={back}
        visibleTitle={false}
        phoneBack={false}
        actions={<EditorHeaderActions base={base} />}
      />
      <PageBody fill>
        <ProgramEditor meta={meta} />
      </PageBody>
    </EditorProvider>
  );
}

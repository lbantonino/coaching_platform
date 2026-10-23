import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { SessionForm } from "@/components/blocks/session-form";
import { listAthletes } from "@/features/athletes/queries";
import { requireOrgAccess } from "@/features/auth/guards";
import { updateSession } from "@/features/sessions/actions";
import { getSession } from "@/features/sessions/queries";

export const metadata: Metadata = {
  title: "Modifier la séance",
};

export default function EditSessionPage({
  params,
}: PageProps<"/coach/o/[orgId]/agenda/seances/[sessionId]/modifier">) {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
        {params.then(({ orgId, sessionId }) => (
          <EditSession orgId={orgId} sessionId={sessionId} />
        ))}
      </Suspense>
    </main>
  );
}

async function EditSession({ orgId, sessionId }: { orgId: string; sessionId: string }) {
  const { membership } = await requireOrgAccess(orgId);
  const organizationId = membership.organizationId;
  if (!z.uuid().safeParse(sessionId).success) notFound();
  const [session, athletes] = await Promise.all([
    getSession(organizationId, sessionId),
    listAthletes(organizationId, { status: "all", q: "" }),
  ]);
  if (!session) notFound();

  const agendaPath = `/coach/o/${organizationId}/agenda`;
  // Les inscrits déjà présents restent proposés même si leur fiche a été archivée depuis.
  const enrolledIds = new Set(session.athletes.map((athlete) => athlete.id));
  const choices = athletes
    .filter((athlete) => athlete.status !== "archived" || enrolledIds.has(athlete.id))
    .map((athlete) => ({ id: athlete.id, name: athlete.displayName }));

  return (
    <>
      <PageHeader
        title="Modifier la séance"
        back={{ href: `${agendaPath}/seances/${session.id}`, label: session.title }}
      />
      <PageBody>
        <div className="flex w-full max-w-3xl flex-col gap-6">
          <section className="rounded-card border border-line bg-surface p-5 md:p-[22px]">
            <SessionForm
              action={updateSession.bind(null, organizationId, session.id)}
              athletes={choices}
              initial={{
                kind: session.kind,
                title: session.title,
                discipline: session.discipline ?? "",
                location: session.location ?? "",
                startsOn: session.startsOn,
                startTime: session.startTime,
                durationMinutes: String(session.durationMinutes),
                repeatsWeekly: session.repeatsWeekly,
                endsOn: session.endsOn ?? "",
                athleteId: session.kind === "individual" ? (session.athletes[0]?.id ?? "") : "",
                athleteIds: session.kind === "group" ? [...enrolledIds] : [],
                newClient: false,
                newAthleteName: "",
                notes: session.notes ?? "",
              }}
              locked
              submitLabel="Enregistrer"
            />
          </section>
        </div>
      </PageBody>
    </>
  );
}

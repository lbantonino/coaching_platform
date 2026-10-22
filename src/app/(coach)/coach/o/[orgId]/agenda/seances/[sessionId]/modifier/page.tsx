import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { listAthletes } from "@/features/athletes/queries";
import { requireOrgAccess } from "@/features/auth/guards";
import { updateSession } from "@/features/sessions/actions";
import { getSession } from "@/features/sessions/queries";

import { AgendaBreadcrumb } from "../../breadcrumb";
import { SessionForm } from "../../session-form";

export const metadata: Metadata = {
  title: "Modifier la séance",
};

export default function EditSessionPage({
  params,
}: PageProps<"/coach/o/[orgId]/agenda/seances/[sessionId]/modifier">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 py-6 md:px-8 md:py-[22px]">
      <Suspense fallback={<p className="text-muted">Chargement…</p>}>
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
    <div className="flex flex-col gap-6">
      <AgendaBreadcrumb
        items={[
          { href: agendaPath, label: "Agenda" },
          { href: `${agendaPath}/seances/${session.id}`, label: session.title },
          { href: "", label: "Modifier" },
        ]}
      />
      <h1 className="font-display text-h2 font-medium">Modifier la séance</h1>
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
            notes: session.notes ?? "",
          }}
          locked
          submitLabel="Enregistrer"
        />
      </section>
    </div>
  );
}

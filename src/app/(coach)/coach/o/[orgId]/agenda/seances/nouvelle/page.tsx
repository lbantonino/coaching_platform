import type { Metadata } from "next";
import { Suspense } from "react";

import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { listAthletes } from "@/features/athletes/queries";
import { requireOrgAccess } from "@/features/auth/guards";
import { createSession } from "@/features/sessions/actions";
import { todayIsoInBrussels } from "@/lib/format";

import { SessionForm } from "../session-form";

export const metadata: Metadata = {
  title: "Nouvelle séance",
};

export default function NewSessionPage({
  params,
  searchParams,
}: PageProps<"/coach/o/[orgId]/agenda/seances/nouvelle">) {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
        {Promise.all([params, searchParams]).then(([{ orgId }, query]) => (
          <NewSession orgId={orgId} date={typeof query.date === "string" ? query.date : null} />
        ))}
      </Suspense>
    </main>
  );
}

async function NewSession({ orgId, date }: { orgId: string; date: string | null }) {
  const { membership } = await requireOrgAccess(orgId);
  const organizationId = membership.organizationId;
  const athletes = await listAthletes(organizationId, { status: "all", q: "" });
  // Date proposée : celle choisie dans l'agenda (?date=), sinon aujourd'hui.
  const startsOn = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayIsoInBrussels();

  return (
    <>
      <PageHeader
        title="Nouvelle séance"
        back={{ href: `/coach/o/${organizationId}/agenda`, label: "Agenda" }}
        subtitle="Une séance que tu encadres en présentiel : collective (un groupe, souvent chaque semaine) ou individuelle (avec un sportif)."
      />
      <PageBody>
        <div className="flex w-full max-w-3xl flex-col gap-6">
          <section className="rounded-card border border-line bg-surface p-5 md:p-[22px]">
            <SessionForm
              action={createSession.bind(null, organizationId)}
              athletes={athletes
                .filter((athlete) => athlete.status !== "archived")
                .map((athlete) => ({ id: athlete.id, name: athlete.displayName }))}
              initial={{
                kind: "group",
                title: "",
                discipline: "",
                location: "",
                startsOn,
                startTime: "19:00",
                durationMinutes: "60",
                repeatsWeekly: true,
                endsOn: "",
                athleteId: "",
                athleteIds: [],
                notes: "",
              }}
              locked={false}
              submitLabel="Créer la séance"
            />
          </section>
        </div>
      </PageBody>
    </>
  );
}

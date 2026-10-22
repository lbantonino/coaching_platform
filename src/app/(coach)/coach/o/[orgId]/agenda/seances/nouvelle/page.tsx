import type { Metadata } from "next";
import { Suspense } from "react";

import { listAthletes } from "@/features/athletes/queries";
import { requireOrgAccess } from "@/features/auth/guards";
import { createSession } from "@/features/sessions/actions";
import { todayIsoInBrussels } from "@/lib/format";

import { AgendaBreadcrumb } from "../breadcrumb";
import { SessionForm } from "../session-form";

export const metadata: Metadata = {
  title: "Nouvelle séance",
};

export default function NewSessionPage({
  params,
  searchParams,
}: PageProps<"/coach/o/[orgId]/agenda/seances/nouvelle">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 py-6 md:px-8 md:py-[22px]">
      <Suspense fallback={<p className="text-muted">Chargement…</p>}>
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
    <div className="flex flex-col gap-6">
      <AgendaBreadcrumb
        items={[
          { href: `/coach/o/${organizationId}/agenda`, label: "Agenda" },
          { href: "", label: "Nouvelle séance" },
        ]}
      />
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-h2 font-medium">Nouvelle séance</h1>
        <p className="text-small text-muted">
          Une séance que tu encadres en présentiel : collective (un groupe, souvent chaque semaine)
          ou individuelle (avec un sportif).
        </p>
      </div>
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
  );
}

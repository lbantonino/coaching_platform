import { CalendarDays, Clock, MapPin, NotebookPen, Pencil, Trash2, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { disciplineLabels, disciplineStyles, disciplineTones } from "@/domain/training/discipline";
import { dayLabel } from "@/features/agenda/calendar";
import { requireOrgAccess } from "@/features/auth/guards";
import { deleteSession } from "@/features/sessions/actions";
import { getSession } from "@/features/sessions/queries";
import {
  describePeriod,
  describeSchedule,
  occurrencesBetween,
  sessionKindLabels,
} from "@/features/sessions/schemas";
import { todayIsoInBrussels } from "@/lib/format";

import { AgendaBreadcrumb } from "../breadcrumb";

export const metadata: Metadata = {
  title: "Séance",
};

export default function SessionPage({
  params,
  searchParams,
}: PageProps<"/coach/o/[orgId]/agenda/seances/[sessionId]">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 py-6 md:px-8 md:py-[22px]">
      <Suspense fallback={<p className="text-muted">Chargement de la séance…</p>}>
        {Promise.all([params, searchParams]).then(([{ orgId, sessionId }, query]) => (
          <SessionDetail
            orgId={orgId}
            sessionId={sessionId}
            enrolFailed={query.inscriptions === "echec"}
          />
        ))}
      </Suspense>
    </main>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Clock;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon aria-hidden size={17} strokeWidth={1.7} className="mt-0.5 shrink-0 text-muted" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-caption text-muted">{label}</span>
        <span>{children}</span>
      </div>
    </div>
  );
}

async function SessionDetail({
  orgId,
  sessionId,
  enrolFailed,
}: {
  orgId: string;
  sessionId: string;
  enrolFailed: boolean;
}) {
  const { membership } = await requireOrgAccess(orgId);
  const organizationId = membership.organizationId;
  if (!z.uuid().safeParse(sessionId).success) notFound();
  const session = await getSession(organizationId, sessionId);
  if (!session) notFound();

  const today = todayIsoInBrussels();
  const horizon = new Date(Date.parse(`${today}T00:00:00Z`) + 180 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const next = occurrencesBetween(session, today, horizon).slice(0, 4);
  const agendaPath = `/coach/o/${organizationId}/agenda`;
  const period = describePeriod(session);

  return (
    <div className="flex flex-col gap-6">
      <AgendaBreadcrumb
        items={[
          { href: agendaPath, label: "Agenda" },
          { href: "", label: session.title },
        ]}
      />

      {enrolFailed ? (
        <p
          role="alert"
          className="rounded-[14px] border border-warn/50 bg-warn-soft p-4 text-small"
        >
          La séance est créée, mais les inscriptions n&apos;ont pas pu être enregistrées. Ouvre «
          Modifier » pour les ajouter.
        </p>
      ) : null}

      <div
        className={`flex flex-col gap-4 rounded-card border p-5 md:flex-row md:items-start md:justify-between md:p-[22px] ${
          session.discipline
            ? disciplineStyles[session.discipline].header
            : "border-line bg-surface"
        }`}
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral">{sessionKindLabels[session.kind]}</Badge>
            {session.discipline ? (
              <Badge tone={disciplineTones[session.discipline]}>
                {disciplineLabels[session.discipline]}
              </Badge>
            ) : null}
          </div>
          <h1 className="font-display text-h2 font-medium">{session.title}</h1>
          <p className="text-muted">{describeSchedule(session)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`${agendaPath}/seances/${session.id}/modifier`}
            className={buttonClass({ variant: "inverse", size: "md" })}
          >
            <Pencil aria-hidden size={15} strokeWidth={1.8} />
            Modifier
          </Link>
          <form action={deleteSession.bind(null, organizationId, session.id)}>
            <ConfirmSubmitButton
              title="Supprimer cette séance ?"
              message={
                session.repeatsWeekly
                  ? "Toutes ses dates seront supprimées. Pour l'arrêter à une date, utilise plutôt « Modifier »."
                  : "Elle disparaîtra de l'agenda et des sportifs inscrits."
              }
              confirmLabel="Supprimer"
              className={buttonClass({ variant: "outline", size: "md" })}
            >
              <Trash2 aria-hidden size={15} strokeWidth={1.8} />
              Supprimer
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>

      <section
        aria-label="Détails de la séance"
        className="grid gap-5 rounded-card border border-line bg-surface p-5 md:grid-cols-2 md:p-[22px]"
      >
        <Row icon={Clock} label="Quand">
          {describeSchedule(session)}
          {period ? <span className="block text-small text-muted">{period}</span> : null}
        </Row>
        <Row icon={MapPin} label="Lieu">
          {session.location ?? <span className="text-muted">Non précisé</span>}
        </Row>
        <Row icon={CalendarDays} label="Prochaines dates">
          {next.length === 0 ? (
            <span className="text-muted">Aucune date à venir</span>
          ) : (
            <ul className="flex flex-col">
              {next.map((date) => (
                <li key={date} className="first-letter:uppercase">
                  {dayLabel(date)}
                </li>
              ))}
            </ul>
          )}
        </Row>
        {session.notes ? (
          <Row icon={NotebookPen} label="Note du coach">
            <span className="whitespace-pre-line">{session.notes}</span>
          </Row>
        ) : null}
      </section>

      <section
        aria-labelledby="enrolled-title"
        className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 md:p-[22px]"
      >
        <h2 id="enrolled-title" className="flex items-center gap-2 text-title font-medium">
          <Users aria-hidden size={18} strokeWidth={1.7} className="text-accent-text" />
          {session.kind === "group" ? `Sportifs inscrits (${session.athletes.length})` : "Sportif"}
        </h2>
        {session.athletes.length === 0 ? (
          <p className="text-small text-muted">
            Aucun inscrit pour l&apos;instant. Ajoute des sportifs avec « Modifier ».
          </p>
        ) : (
          <ul aria-label="Sportifs de la séance" className="flex flex-wrap gap-2">
            {session.athletes.map((athlete) => (
              <li key={athlete.id}>
                <Link
                  href={`/coach/o/${organizationId}/sportifs/${athlete.id}`}
                  className="inline-flex h-9 items-center rounded-pill border border-line-2 px-3.5 text-small hover:bg-surface-2"
                >
                  {athlete.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="text-caption text-muted">
          La présence réelle (présent ou absent) viendra avec l&apos;espace sportif.
        </p>
      </section>
    </div>
  );
}

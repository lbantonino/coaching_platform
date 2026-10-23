import { CalendarDays, Pencil, UserPlus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { KeyValueList } from "@/components/blocks/key-value";
import { ListRow } from "@/components/blocks/list-row";
import { DeleteMoreMenu } from "@/components/blocks/more-menu";
import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card, CardEmpty } from "@/components/ui/card";
import { disciplineLabels } from "@/domain/training/discipline";
import { dayLabel } from "@/features/agenda/calendar";
import { requireOrgAccess } from "@/features/auth/guards";
import { deleteSession } from "@/features/sessions/actions";
import { getSession } from "@/features/sessions/queries";
import {
  describePeriod,
  describeSchedule,
  formatDuration,
  sessionOccurrences,
  sessionKindLabels,
} from "@/features/sessions/schemas";
import { todayIsoInBrussels } from "@/lib/format";

export const metadata: Metadata = {
  title: "Séance",
};

// Détail d'une séance encadrée (prompt Claude Design §7.2) : détails, inscrits, prochaines dates ;
// « Modifier » en rouge, « Supprimer » dans le menu « ••• » avec confirmation.
export default function SessionPage({
  params,
  searchParams,
}: PageProps<"/coach/o/[orgId]/agenda/seances/[sessionId]">) {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
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

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

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
  const next = sessionOccurrences(session, today, horizon).slice(0, 4);
  const agendaPath = `/coach/o/${organizationId}/agenda`;
  const period = describePeriod(session);
  const enrolled = session.athletes.length;

  return (
    <>
      <PageHeader
        title={session.title}
        back={{ href: agendaPath, label: "Agenda" }}
        subtitle={[
          sessionKindLabels[session.kind],
          session.discipline ? disciplineLabels[session.discipline] : null,
          describeSchedule(session).replace(/^C/, "c").replace(/^L/, "l"),
        ]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <>
            <Link href={`${agendaPath}/seances/${session.id}/modifier`} className={buttonClass()}>
              <Pencil aria-hidden size={15} strokeWidth={1.8} />
              Modifier
            </Link>
            <DeleteMoreMenu
              menuTitle={session.title}
              action={deleteSession.bind(null, organizationId, session.id)}
              confirmTitle="Supprimer cette séance ?"
              confirmText={
                session.repeatsWeekly
                  ? "Toutes ses dates seront supprimées. Pour l'arrêter à une date, utilise plutôt « Modifier »."
                  : "Elle disparaîtra de l'agenda et des sportifs inscrits."
              }
            />
          </>
        }
      />
      <PageBody grid>
        {enrolFailed ? (
          <p
            role="alert"
            className="rounded-wide border border-warn/50 bg-warn-soft p-4 text-[14px] lg:col-span-12"
          >
            La séance est créée, mais les inscriptions n&apos;ont pas pu être enregistrées. Ouvre «
            Modifier » pour les ajouter.
          </p>
        ) : null}

        <Card id="details-title" title="Détails" className="lg:col-span-6">
          <KeyValueList
            items={[
              {
                label: "Quand",
                value: next[0]
                  ? `${capitalize(dayLabel(next[0].date))} · ${next[0].startTime.slice(0, 5)} · ${formatDuration(session.durationMinutes)}`
                  : describeSchedule(session),
              },
              { label: "Rythme", value: describeSchedule(session) },
              ...(period ? [{ label: "Récurrence", value: period }] : []),
              {
                label: "Lieu",
                value: session.location ?? <span className="text-muted">Non précisé</span>,
              },
              {
                label: "Discipline",
                value: session.discipline ? (
                  disciplineLabels[session.discipline]
                ) : (
                  <span className="text-muted">Non précisée</span>
                ),
              },
              ...(session.notes
                ? [
                    {
                      label: "Note du coach",
                      value: <span className="whitespace-pre-line">{session.notes}</span>,
                    },
                  ]
                : []),
            ]}
          />
        </Card>

        <Card
          id="enrolled-title"
          title={session.kind === "group" ? `Inscrits · ${enrolled}` : "Sportif"}
          className="lg:col-span-6"
        >
          {session.kind === "individual" && enrolled === 0 ? (
            // Nouveau client (D-35) : pas encore de fiche sportif.
            <CardEmpty icon={UserPlus}>
              {session.prospectName ? `${session.prospectName}, nouveau client` : "Nouveau client"}{" "}
              : pas encore de fiche.{" "}
              <Link
                href={`/coach/o/${organizationId}/sportifs/nouveau`}
                className="font-medium text-text underline underline-offset-4"
              >
                Crée sa fiche
              </Link>
              , puis rattache-lui la séance avec « Modifier ».
            </CardEmpty>
          ) : enrolled === 0 ? (
            <CardEmpty icon={Users}>
              Aucun inscrit pour l&apos;instant. Ajoute des sportifs avec « Modifier ».
            </CardEmpty>
          ) : (
            <ul aria-label="Sportifs de la séance" className="flex flex-col">
              {session.athletes.map((athlete) => (
                <li key={athlete.id}>
                  <ListRow
                    href={`/coach/o/${organizationId}/sportifs/${athlete.id}`}
                    leading={<Avatar name={athlete.name} />}
                    title={athlete.name}
                  />
                </li>
              ))}
            </ul>
          )}
          <p className="text-[12px] text-muted">
            La présence réelle (présent ou absent) viendra avec l&apos;espace sportif.
          </p>
        </Card>

        <Card id="next-title" title="Prochaines dates" className="lg:col-span-12">
          {next.length === 0 ? (
            <CardEmpty icon={CalendarDays}>Aucune date à venir.</CardEmpty>
          ) : (
            <div className="flex flex-col">
              {next.map((occurrence) => (
                <ListRow
                  key={occurrence.originalDate}
                  leading={
                    <span className="w-28 shrink-0 font-mono text-[13px] font-medium tabular">
                      {capitalize(dayLabel(occurrence.date))}
                    </span>
                  }
                  title={session.title}
                  sub={`${occurrence.startTime.slice(0, 5)} · ${session.kind === "group" ? `${enrolled} inscrit${enrolled > 1 ? "s" : ""}` : (session.athletes[0]?.name ?? session.prospectName ?? "Nouveau client")}`}
                  trailing={
                    occurrence.moved ? (
                      <Badge tone="moved">
                        Déplacée · prévue {dayLabel(occurrence.originalDate)}
                      </Badge>
                    ) : null
                  }
                />
              ))}
            </div>
          )}
        </Card>
      </PageBody>
    </>
  );
}

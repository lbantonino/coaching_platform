import { CalendarDays, ClipboardList, Euro, Pencil, Users } from "lucide-react";
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
import { Card, CardEmpty, CardTitle } from "@/components/ui/card";
import { formatEuros } from "@/domain/billing/invoices";
import { addVat, coveredByPackage, paymentMethodLabels, splitVat } from "@/domain/billing/payments";
import { disciplineLabels } from "@/domain/training/discipline";
import { dayLabel } from "@/features/agenda/calendar";
import { requireOrgAccess } from "@/features/auth/guards";
import { listPackageCovers } from "@/features/billing/payment-queries";
import { addDays } from "@/features/agenda/items";
import { mondayOf } from "@/features/agenda/week";
import { deleteSession, markSessionPaid, unmarkSessionPaid } from "@/features/sessions/actions";
import { getSession, listSessionPayments } from "@/features/sessions/queries";
import {
  describePeriod,
  describeSchedule,
  formatDuration,
  sessionOccurrences,
  sessionKindLabels,
  SESSION_VAT_RATE,
} from "@/features/sessions/schemas";
import { todayIsoInBrussels } from "@/lib/format";

import { PaymentRows } from "./payment-rows";

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
// Téléphone : « Lun 26 oct. » (la date longue ne laisse pas la place aux boutons de paiement).
const compactDay = new Intl.DateTimeFormat("fr-BE", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const shortDate = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const utc = (day: string) => new Date(`${day}T00:00:00Z`);

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
  const [session, payments, covers] = await Promise.all([
    getSession(organizationId, sessionId),
    listSessionPayments(organizationId, sessionId),
    listPackageCovers(organizationId),
  ]);
  if (!session) notFound();

  const today = todayIsoInBrussels();
  const horizon = new Date(Date.parse(`${today}T00:00:00Z`) + 180 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const next = sessionOccurrences(session, today, horizon).slice(0, 4);
  const agendaPath = `/coach/o/${organizationId}/agenda`;
  const period = describePeriod(session);
  const enrolled = session.athletes.length;
  // Paiements (D-52) : les dates des trois semaines passées et de la semaine en cours, la plus récente
  // d'abord ; chacune se marque « payée » (vrai paiement reçu, compté dans l'encaissé).
  const monday = mondayOf(today);
  const payable = sessionOccurrences(session, addDays(monday, -21), addDays(monday, 6))
    .reverse()
    .slice(0, 6);
  const paidByDate = new Map(payments.map((payment) => [payment.sessionDate, payment]));
  const priced = session.priceCents !== null && session.paymentMethod !== null;
  // Forfait du sportif (séance individuelle) : ses dates comprises dans la période ne se paient pas.
  const athleteId = session.kind === "individual" ? (session.athletes[0]?.id ?? null) : null;
  const hasPackage = payable.some((occurrence) =>
    coveredByPackage(covers, athleteId, occurrence.originalDate),
  );

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

        <Card
          id="details-title"
          title={
            <CardTitle icon={ClipboardList} color="var(--run)">
              Détails
            </CardTitle>
          }
          className="lg:col-span-6"
        >
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
          title={
            <CardTitle icon={Users} color="var(--strength)">
              {session.kind === "group" ? `Inscrits · ${enrolled}` : "Sportif"}
            </CardTitle>
          }
          className="lg:col-span-6"
        >
          {enrolled === 0 ? (
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

        <Card
          id="price-title"
          title={
            <CardTitle icon={Euro} color="var(--ok)">
              Prix et paiements
            </CardTitle>
          }
          className="lg:col-span-12"
        >
          {!priced && !hasPackage ? (
            <CardEmpty icon={Euro}>
              Pas de prix pour cette séance. Ajoute-le avec « Modifier » : chaque date payée
              comptera dans l&apos;encaissé de la semaine.
            </CardEmpty>
          ) : (
            <>
              <KeyValueList
                items={[
                  {
                    label: session.kind === "group" ? "Prix (toute la séance)" : "Prix",
                    value:
                      session.priceCents === null ? (
                        <span className="text-muted">Pas de prix à la séance</span>
                      ) : session.priceVatIncluded ? (
                        `${formatEuros(session.priceCents)} TVAC · ${formatEuros(splitVat(session.priceCents, SESSION_VAT_RATE).exclCents)} HTVA`
                      ) : (
                        `${formatEuros(session.priceCents)} HTVA · ${formatEuros(addVat(session.priceCents, SESSION_VAT_RATE))} TVAC, facturé`
                      ),
                  },
                  {
                    label: "Paiement",
                    value: session.paymentMethod ? (
                      paymentMethodLabels[session.paymentMethod]
                    ) : (
                      <span className="text-muted">Par forfait</span>
                    ),
                  },
                ]}
              />
              <PaymentRows
                priced={priced}
                amountLabel={
                  session.priceCents === null
                    ? ""
                    : formatEuros(
                        session.priceVatIncluded
                          ? session.priceCents
                          : addVat(session.priceCents, SESSION_VAT_RATE),
                      )
                }
                mark={markSessionPaid.bind(null, organizationId, session.id)}
                unmark={unmarkSessionPaid.bind(null, organizationId, session.id)}
                rows={payable.map((occurrence) => {
                  const paid = paidByDate.get(occurrence.originalDate);
                  const time = occurrence.startTime.slice(0, 5);
                  return {
                    date: occurrence.originalDate,
                    compact: `${capitalize(compactDay.format(utc(occurrence.date)).replace(".", ""))} · ${time}`,
                    long: `${capitalize(dayLabel(occurrence.date))} · ${time}`,
                    state: paid
                      ? "paid"
                      : coveredByPackage(covers, athleteId, occurrence.originalDate)
                        ? "covered"
                        : occurrence.date > today
                          ? "future"
                          : "unpaid",
                    paidLabel: paid
                      ? `Payée le ${shortDate.format(utc(paid.receivedOn))} · ${formatEuros(paid.amountCents)}`
                      : null,
                  };
                })}
              />
              <p className="text-[12px] text-muted">
                « Marquer payée » note le paiement reçu aujourd&apos;hui : il compte dans « Encaissé
                cette semaine » et dans la Comptabilité. Un forfait se note avec « Créer → Paiement
                reçu ».
              </p>
            </>
          )}
        </Card>

        <Card
          id="next-title"
          title={
            <CardTitle icon={CalendarDays} color="var(--accent-text)">
              Prochaines dates
            </CardTitle>
          }
          className="lg:col-span-12"
        >
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
                  sub={`${occurrence.startTime.slice(0, 5)} · ${session.kind === "group" ? `${enrolled} inscrit${enrolled > 1 ? "s" : ""}` : (session.athletes[0]?.name ?? "")}`}
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

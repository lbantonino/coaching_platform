import { Bell, Calendar, ChevronRight, Clock, MapPin, MessageCircle, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { z } from "zod";

import { FitList } from "@/components/blocks/fit-list";
import { DeleteMoreMenu } from "@/components/blocks/more-menu";
import { NotAvailableButton } from "@/components/blocks/not-available";
import { PageHeader, pageMainClass } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { SkeletonBar } from "@/components/ui/skeleton";
import { Quoted } from "@/components/ui/quoted";
import { FEATURES } from "@/config/features";
import { formatMoney, formatVatRate } from "@/domain/billing/money";
import { addVat, coveredByPackage, paymentMethodLabel, splitVat } from "@/domain/billing/payments";
import { disciplineLabels, type Discipline } from "@/domain/training/discipline";
import { dayLabel } from "@/features/agenda/calendar";
import { addDays } from "@/features/agenda/items";
import { mondayOf } from "@/features/agenda/week";
import { requireOrgAccess } from "@/features/auth/guards";
import { listPackageCovers } from "@/features/billing/payment-queries";
import { listProgramsLinkedToCoachSession } from "@/features/programs/queries";
import { deleteSession, markSessionPaid, unmarkSessionPaid } from "@/features/sessions/actions";
import { getSession, listSessionPayments } from "@/features/sessions/queries";
import { alertLabel } from "@/domain/sessions/alerts";
import {
  describePeriod,
  describeSchedule,
  formatDuration,
  sessionKindLabels,
  sessionOccurrences,
  seriesPosition,
  sessionTimeLabel,
} from "@/features/sessions/schemas";
import { todayIsoInBrussels } from "@/lib/format";

import { DatePayment, PaymentRows, type PaymentRow } from "./payment-rows";
import { PriceMore } from "./price-more";

export const metadata: Metadata = {
  title: "Séance",
};

// Détail d'une séance encadrée, au pixel près des maquettes d'Antonino du 03/11
// (coory-seance-brief : 1a ordinateur à partir de 1024 px, 1e téléphone en dessous). La page parle
// d'abord de CETTE séance, à la date touchée dans l'Agenda (?date=, sinon la prochaine) :
// - une carte héro : grand titre, discipline, la date (pastille « Aujourd'hui » ou « Demain »),
//   l'heure en grand, le lieu et la durée, « Écrire » (ordinateur) et l'encadré du sportif ;
// - ordinateur : Prix et paiements puis Détails à gauche, Prochaines dates à droite, de même hauteur ;
//   une barre d'actions en bas (Modifier, Supprimer). Téléphone : Détails, Prochaines dates, Prix,
//   « Supprimer la séance », et une barre fixe en bas (Écrire, Modifier).
// Seuls les jetons de couleur de l'app servent (le plus proche de chaque teinte de la maquette).
export default function SessionPage({
  params,
  searchParams,
}: PageProps<"/coach/o/[orgId]/agenda/seances/[sessionId]">) {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<SessionLoading />}>
        {Promise.all([params, searchParams]).then(([{ orgId, sessionId }, query]) => (
          <SessionDetail
            orgId={orgId}
            sessionId={sessionId}
            dateParam={typeof query.date === "string" ? query.date : null}
            allDates={query.dates === "toutes"}
            enrolFailed={query.inscriptions === "echec"}
            returnTo={typeof query.retour === "string" ? query.retour : null}
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
const weekdayName = new Intl.DateTimeFormat("fr-BE", { weekday: "long", timeZone: "UTC" });
// « 17:30 » + 60 min → « 18:30 ».
const endTime = (start: string, minutes: number) => {
  const total = Number(start.slice(0, 2)) * 60 + Number(start.slice(3, 5)) + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};
const dots: Record<Discipline, string> = {
  running: "bg-run-fill",
  strength: "bg-strength-fill",
  hyrox: "bg-hyrox-fill",
  hybrid: "bg-hybrid-fill",
};

// Les cartes de la page (maquette : blanc, rayon 20, contour fin intérieur).
const card = "rounded-[20px] bg-surface inset-ring inset-ring-line-soft";
const cardTitle = "text-[16px] font-semibold tracking-[-0.01em] lg:text-[17px]";
// Encadré du sportif (ou des participants) dans la carte héro : une seule ligne (03/11).
const box =
  "flex min-h-14 items-center gap-3 rounded-2xl px-3 py-2.5 inset-ring inset-ring-line transition-shadow duration-150";

// Une ligne « libellé / valeur » des cartes Détails et Prix (76 px de libellé sur téléphone, 150 sur
// ordinateur) ; la dernière n'a pas de filet et finit plus près du bas de la carte.
function InfoRows({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="flex flex-col">
      {rows.map((row, index) => {
        const last = index === rows.length - 1;
        return (
          <div
            key={row.label}
            className={`grid grid-cols-[76px_minmax(0,1fr)] gap-3 lg:grid-cols-[150px_minmax(0,1fr)] ${
              last ? "pt-3 pb-1" : "border-b border-line py-3"
            }`}
          >
            <dt className="text-[13.5px] text-muted lg:text-[14px]">{row.label}</dt>
            <dd className="min-w-0 text-[14px] leading-[1.45] font-medium break-words lg:text-[14.5px]">
              {row.value}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

// Séparateur vertical entre l'heure, le lieu et la durée.
function Divider({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`w-px shrink-0 bg-line-2 ${className}`} />;
}

async function SessionDetail({
  orgId,
  sessionId,
  dateParam,
  allDates,
  enrolFailed,
  returnTo,
}: {
  orgId: string;
  sessionId: string;
  dateParam: string | null;
  allDates: boolean;
  enrolFailed: boolean;
  // Ouverte depuis la fiche d'un sportif (?retour=, revue MVP du 13/11, B15) : le retour y ramène.
  returnTo: string | null;
}) {
  const { membership } = await requireOrgAccess(orgId);
  const organizationId = membership.organizationId;
  if (!z.uuid().safeParse(sessionId).success) notFound();
  const [session, payments, covers, linkedPrograms] = await Promise.all([
    getSession(organizationId, sessionId),
    listSessionPayments(organizationId, sessionId),
    listPackageCovers(organizationId),
    listProgramsLinkedToCoachSession(organizationId, sessionId),
  ]);
  if (!session) notFound();
  // Prix dans la devise de la séance (D-69).
  const money = (cents: number) => formatMoney(cents, session.currency);

  const today = todayIsoInBrussels();
  // Prochaines dates : six mois, ou jusqu'à la fin de la série (un an au plus) pour « Toutes les dates ».
  const horizon =
    allDates && session.endsOn && session.endsOn > addDays(today, 180)
      ? [session.endsOn, addDays(today, 365)].sort()[0]
      : addDays(today, 180);
  const agendaPath = `/coach/o/${organizationId}/agenda`;
  const sessionPath = `${agendaPath}/seances/${session.id}`;
  // Retour vers la fiche : seulement une fiche de CETTE organisation, jamais une adresse quelconque.
  const fichePrefix = `/coach/o/${organizationId}/sportifs/`;
  const ficheReturn =
    returnTo && returnTo.startsWith(fichePrefix) && !returnTo.includes("//") ? returnTo : null;
  const ficheAthlete = ficheReturn
    ? session.athletes.find((person) => ficheReturn.startsWith(`${fichePrefix}${person.id}`))
    : undefined;
  const back = ficheReturn
    ? { href: ficheReturn, label: ficheAthlete?.name ?? "Fiche du sportif" }
    : { href: agendaPath, label: "Agenda" };
  const period = describePeriod(session);
  const enrolled = session.athletes.length;
  const athlete = session.kind === "individual" ? (session.athletes[0] ?? null) : null;
  const kindLine = [
    session.discipline ? disciplineLabels[session.discipline] : null,
    sessionKindLabels[session.kind],
  ]
    .filter(Boolean)
    .join(" · ");

  // La date affichée : celle touchée dans l'Agenda (?date=, une date de cette séance), sinon la
  // prochaine, sinon la dernière passée.
  const requested =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? sessionOccurrences(session, addDays(dateParam, -1), addDays(dateParam, 1)).find(
          (occurrence) => occurrence.date === dateParam,
        )
      : undefined;
  const upcoming = sessionOccurrences(session, today, horizon);
  const current =
    requested ?? upcoming[0] ?? sessionOccurrences(session, addDays(today, -365), today).at(-1);
  const others = upcoming.filter((occurrence) => occurrence.date !== current?.date);
  // Ordinateur : la carte montre autant de dates que sa hauteur en contient (FitList, 03/11), d'où
  // une trentaine envoyées ; téléphone : les quatre premières.
  const next = allDates ? others : others.slice(0, 30);
  // Les liens de la page gardent le retour vers la fiche (B15).
  const keepReturn = ficheReturn ? `retour=${encodeURIComponent(ficheReturn)}` : "";
  const datesHref = (all: boolean) =>
    `${sessionPath}?${current ? `date=${current.date}&` : ""}${all ? "dates=toutes&" : ""}${keepReturn}`.replace(
      /[?&]$/,
      "",
    );
  const position = current ? seriesPosition(session, current.originalDate) : null;
  const badge =
    current?.date === today ? "Aujourd'hui" : current?.date === addDays(today, 1) ? "Demain" : null;

  // Paiements (D-52) : les dates des trois semaines passées et de la semaine en cours, la plus récente
  // d'abord ; chacune se marque « payée » (vrai paiement reçu, compté dans l'encaissé).
  const monday = mondayOf(today);
  // Ordinateur : jusqu'à douze semaines en arrière, autant que la carte Prix en montre (03/11) ;
  // téléphone : les quatre dernières semaines, comme avant.
  const payable = sessionOccurrences(session, addDays(monday, -84), addDays(monday, 6))
    .reverse()
    .slice(0, 13);
  const recentPayable = payable.filter((o) => o.date >= addDays(monday, -21)).slice(0, 6);
  const paidByDate = new Map(payments.map((payment) => [payment.sessionDate, payment]));
  const priced = session.priceCents !== null && session.paymentMethod !== null;
  // Forfait du sportif (séance individuelle) : ses dates comprises dans la période ne se paient pas.
  const athleteId = athlete?.id ?? null;
  const hasPackage = recentPayable.some((occurrence) =>
    coveredByPackage(covers, athleteId, occurrence.originalDate),
  );
  // TVA de la séance (D-163, 0 = sans TVA).
  const vatRate = session.vatRate;
  const amountLabel =
    session.priceCents === null
      ? ""
      : money(session.priceVatIncluded ? session.priceCents : addVat(session.priceCents, vatRate));
  const paymentRow = (occurrence: NonNullable<typeof current>): PaymentRow => {
    const paid = paidByDate.get(occurrence.originalDate);
    const time = sessionTimeLabel(occurrence.startTime, session.allDay).toLowerCase();
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
        ? `Payée le ${shortDate.format(utc(paid.receivedOn))} · ${formatMoney(paid.amountCents, paid.currency)}`
        : null,
    };
  };
  const currentRow = current ? paymentRow(current) : null;
  // « 65,00 € HTVA · 78,65 € TVAC (21 %) · Virement » ; sans TVA (D-163), le prix seul.
  const priceDetail =
    session.priceCents === null
      ? null
      : `${
          vatRate === 0
            ? money(session.priceCents)
            : session.priceVatIncluded
              ? `${money(session.priceCents)} TVAC · ${money(splitVat(session.priceCents, vatRate).exclCents)} HTVA`
              : `${money(session.priceCents)} HTVA · ${money(addVat(session.priceCents, vatRate))} TVAC (${formatVatRate(vatRate)})`
        }${
          session.paymentMethod
            ? ` · ${paymentMethodLabel(session.paymentMethod, membership.country)}`
            : ""
        }${session.kind === "group" ? " · prix de toute la séance" : ""}`;
  const mark = markSessionPaid.bind(null, organizationId, session.id);
  const remove = deleteSession.bind(null, organizationId, session.id);
  // Menu « ••• » (kit, boîte 17) : « Chaque mercredi · 19:00 · Running » ; « Modifier » change
  // toute la série (même page que le bouton « Modifier »).
  const menuSubtitle = [
    session.repeatsWeekly
      ? `Chaque ${weekdayName.format(utc(session.startsOn))}`
      : shortDate.format(utc(current?.date ?? session.startsOn)),
    sessionTimeLabel(session.startTime, session.allDay),
    session.discipline ? disciplineLabels[session.discipline] : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const edit = {
    label: session.repeatsWeekly ? "Modifier toute la série" : "Modifier la séance",
    href: `${sessionPath}/modifier`,
  };
  // Revue MVP du 13/11 (B4) : une séance reliée à des séances de programme (« avec le coach ») le
  // dit avant d'être supprimée ; ces séances afficheront « Rendez-vous supprimé ».
  const linkedText =
    linkedPrograms.length > 0 ? (
      <>
        {" "}
        Elle est reliée {linkedPrograms.length > 1 ? "aux programmes" : "au programme"}{" "}
        {linkedPrograms
          .map((program) =>
            program.athleteName
              ? `« ${program.title} » (${program.athleteName})`
              : `« ${program.title} »`,
          )
          .join(", ")}{" "}
        : leurs séances avec le coach afficheront « Rendez-vous supprimé ».
      </>
    ) : null;
  // Kit (boîte 18) : le nom de la séance en gras en tête du texte.
  const deleteText = session.repeatsWeekly ? (
    <>
      <Quoted>{session.title}</Quoted> : toutes ses dates seront supprimées. Pour l&apos;arrêter à
      une date, utilise plutôt « Modifier ».{linkedText}
    </>
  ) : (
    <>
      <Quoted>{session.title}</Quoted> disparaîtra de l&apos;agenda et des sportifs inscrits.
      {linkedText}
    </>
  );

  // Détails : le rythme et la période d'une série (avec sa barre), la note du coach.
  const detailRows = [
    ...(session.repeatsWeekly
      ? [
          { label: "Rythme", value: describeSchedule(session) },
          {
            label: "Période",
            value: (
              <span className="flex flex-col gap-2.5">
                <span>{period}</span>
                {position ? (
                  <span className="flex flex-col gap-1.5">
                    {position.total ? (
                      <span aria-hidden className="flex gap-0.5">
                        {Array.from({ length: position.total }, (_, index) => (
                          <span
                            key={index}
                            className={`h-1.5 flex-1 rounded-[2px] ${
                              index + 1 < position.index
                                ? "bg-violet-line"
                                : index + 1 === position.index
                                  ? "bg-violet"
                                  : "bg-chip"
                            }`}
                          />
                        ))}
                      </span>
                    ) : null}
                    <span className="text-[12.5px] leading-[normal] font-normal text-muted">
                      Séance {position.index}
                      {position.total ? ` sur ${position.total}` : ""}
                    </span>
                  </span>
                ) : null}
              </span>
            ),
          },
        ]
      : []),
    ...(session.notes
      ? [
          {
            label: "Note",
            value: <span className="font-normal whitespace-pre-line">{session.notes}</span>,
          },
        ]
      : []),
  ];

  const writeLabel = (
    <>
      <MessageCircle aria-hidden strokeWidth={1.8} className="size-4 lg:size-[15px]" />
      Écrire
    </>
  );

  return (
    <>
      {/* L'en-tête reste celui de base (03/11) : retour, recherche, assistant, cloche, Modifier, ••• ;
          le titre de la séance est dans la carte héro. */}
      <PageHeader
        title={session.title}
        back={back}
        visibleTitle={false}
        actions={
          // Ordinateur : en haut ; téléphone : dans la barre fixe du bas.
          <span className="flex gap-2 max-lg:hidden">
            <Link
              href={`${sessionPath}/modifier`}
              className={buttonClass({
                className: "lg:h-8 lg:rounded-lg lg:px-3.5 lg:text-[12px] lg:font-medium",
              })}
            >
              <Pencil aria-hidden size={15} strokeWidth={1.8} />
              Modifier
            </Link>
            <DeleteMoreMenu
              menuTitle={session.title}
              menuSubtitle={menuSubtitle}
              edit={edit}
              deleteLabel="Supprimer la séance"
              action={remove}
              confirmTitle="Supprimer cette séance ?"
              confirmText={deleteText}
              compact
            />
          </span>
        }
      />
      {/* Bas de page (demande d'Antonino du 04/11) : téléphone, la dernière carte s'arrête à 12 px (l'écart
          entre deux cartes) au-dessus de la barre fixe « Écrire / Modifier » (75 px + zone du geste) ;
          ordinateur, au niveau du bas du menu de gauche (14 px). */}
      <div className="flex flex-col gap-3 px-3.5 pt-1 pb-[calc(87px+env(safe-area-inset-bottom))] leading-[normal] lg:flex-1 lg:gap-4 lg:pr-3.5 lg:pl-5 lg:pt-4 lg:pb-3.5">
        {enrolFailed ? (
          <p
            role="alert"
            className="rounded-wide border border-warn/50 bg-warn-soft p-4 text-[14px]"
          >
            La séance est créée, mais les inscriptions n&apos;ont pas pu être enregistrées. Ouvre «
            Modifier » pour les ajouter.
          </p>
        ) : null}

        {/* Carte héro, compacte (03/11) : cette séance (quand, où, combien de temps) et son sportif. */}
        <section
          aria-label="Cette séance"
          className={`${card} flex flex-col gap-3.5 p-4 lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center lg:gap-6 lg:px-6 lg:py-5`}
        >
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-[20px] leading-[1.2] font-semibold tracking-[-0.02em] break-words lg:text-[22px]">
                {session.title}
              </h2>
              <p className="flex items-center gap-1.5 text-[13px] text-text-2">
                {session.discipline ? (
                  <span
                    aria-hidden
                    className={`h-4 w-[3px] shrink-0 rounded-[2px] ${dots[session.discipline]}`}
                  />
                ) : null}
                {kindLine}
              </p>
            </div>

            {current ? (
              <div className="flex flex-col gap-1">
                <p className="flex min-h-[22px] flex-wrap items-center gap-2 text-[13px] font-medium lg:text-[13.5px]">
                  <Calendar aria-hidden size={14} strokeWidth={1.8} className="shrink-0" />
                  {capitalize(dayLabel(current.date))}
                  {badge ? (
                    <span className="inline-flex h-5 items-center rounded-[5px] bg-violet-soft px-2 text-[11.5px] font-medium text-violet-text">
                      {badge}
                    </span>
                  ) : null}
                  {current.moved ? (
                    <Badge tone="moved">Déplacée · prévue {dayLabel(current.originalDate)}</Badge>
                  ) : null}
                </p>
                {/* Téléphone : l'heure, puis le lieu et la durée dessous ; ordinateur : sur une ligne,
                    séparés par des traits. L'heure ne se coupe jamais. */}
                <div className="flex flex-col gap-1.5 text-[13px] lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-4 lg:gap-y-1 lg:text-[13.5px]">
                  {session.allDay ? (
                    <p className="text-[28px] leading-none font-semibold tracking-[-0.03em] whitespace-nowrap text-violet-text lg:text-[32px]">
                      Toute la journée
                    </p>
                  ) : (
                    <p className="flex items-baseline gap-1.5 whitespace-nowrap tabular">
                      <span className="text-[32px] leading-none font-semibold tracking-[-0.03em] text-violet-text lg:text-[36px]">
                        {current.startTime.slice(0, 5)}
                      </span>
                      <span className="text-[15px] text-muted lg:text-[16px]">
                        – {endTime(current.startTime, session.durationMinutes)}
                      </span>
                    </p>
                  )}
                  <Divider className="h-[18px] max-lg:hidden" />
                  <p className="flex flex-wrap items-center gap-x-3.5 gap-y-1 lg:contents">
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      <MapPin aria-hidden size={14} strokeWidth={1.8} className="shrink-0" />
                      {session.location ?? <span className="text-muted">Lieu non précisé</span>}
                    </span>
                    {session.allDay ? null : (
                      <>
                        <Divider className="h-4 lg:h-[18px]" />
                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                          <Clock aria-hidden size={14} strokeWidth={1.8} className="shrink-0" />
                          {formatDuration(session.durationMinutes)}
                        </span>
                      </>
                    )}
                    {session.alerts.length > 0 ? (
                      <>
                        <Divider className="h-4 lg:h-[18px]" />
                        <span className="flex items-center gap-1.5">
                          <Bell aria-hidden size={14} strokeWidth={1.8} className="shrink-0" />
                          <span className="sr-only">Alerte : </span>
                          {session.alerts
                            .map((offset) => alertLabel(offset, session.allDay))
                            .join(" · ")}
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[13.5px] text-muted">{describeSchedule(session)}</p>
            )}
          </div>

          {/* Le sportif sur une ligne ; « Écrire » dessous sur ordinateur (barre du bas sur téléphone). */}
          <div className="flex min-w-0 flex-col gap-2.5">
            {session.kind === "individual" ? (
              athlete ? (
                <Link
                  href={`/coach/o/${organizationId}/sportifs/${athlete.id}`}
                  className={`${box} hover:inset-ring-violet-line`}
                >
                  <Avatar name={athlete.name} size="sm" photoPath={athlete.photoPath ?? null} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[12px] text-muted">Sportif</span>
                    <span className="truncate text-[14px] font-semibold">{athlete.name}</span>
                  </span>
                  <ChevronRight
                    aria-hidden
                    size={15}
                    strokeWidth={2}
                    className="shrink-0 text-faint"
                  />
                </Link>
              ) : (
                <p className={`${box} text-[13px] text-text-2`}>
                  Aucun sportif pour l&apos;instant. Ajoute-le avec « Modifier ».
                </p>
              )
            ) : enrolled === 0 ? (
              <p className={`${box} text-[13px] text-text-2`}>
                Aucun inscrit pour l&apos;instant. Ajoute des sportifs avec « Modifier ».
              </p>
            ) : (
              // Séance collective : les avatars empilés ; toucher l'encadré déplie la liste.
              <details className="group rounded-2xl inset-ring inset-ring-line transition-shadow duration-150 hover:inset-ring-violet-line">
                <summary
                  className={`${box} cursor-pointer list-none inset-ring-0 [&::-webkit-details-marker]:hidden`}
                >
                  <span aria-hidden className="flex shrink-0 items-center">
                    {session.athletes.slice(0, 4).map((person) => (
                      <span
                        key={person.id}
                        className="-ml-2 rounded-full ring-2 ring-surface first:ml-0"
                      >
                        <Avatar name={person.name} size="xs" photoPath={person.photoPath ?? null} />
                      </span>
                    ))}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[12px] text-muted">Participants</span>
                    <span className="truncate text-[14px] font-semibold">
                      {enrolled} inscrit{enrolled > 1 ? "s" : ""}
                    </span>
                  </span>
                  <ChevronRight
                    aria-hidden
                    size={15}
                    strokeWidth={2}
                    className="shrink-0 text-faint transition-transform duration-200 group-open:rotate-90"
                  />
                </summary>
                <ul aria-label="Sportifs de la séance" className="flex flex-col px-1.5 pb-1.5">
                  {session.athletes.map((person) => (
                    <li key={person.id}>
                      <Link
                        href={`/coach/o/${organizationId}/sportifs/${person.id}`}
                        className="flex min-h-11 items-center gap-3 rounded-xl px-2 transition-colors duration-150 hover:bg-selected-hover"
                      >
                        <Avatar name={person.name} size="xs" photoPath={person.photoPath ?? null} />
                        <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">
                          {person.name}
                        </span>
                        <ChevronRight
                          aria-hidden
                          size={15}
                          strokeWidth={2}
                          className="shrink-0 text-faint"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            )}
            {athlete ? (
              <WriteButton
                athleteId={athlete.id}
                className={buttonClass({
                  variant: "outline",
                  className:
                    "h-9! rounded-[10px]! bg-surface px-3.5! text-[13.5px]! font-medium! max-lg:hidden",
                })}
              >
                {writeLabel}
              </WriteButton>
            ) : null}
          </div>
        </section>

        {/* Ordinateur : Prochaines dates à gauche ; Détails puis Prix à droite (03/11). Les deux
            colonnes prennent la hauteur restante de l'écran : la barre d'actions finit au bas du menu
            de gauche (12 px du bord), comme le tableau de bord. Téléphone : Prochaines dates, Détails,
            Prix (les colonnes s'effacent, l'ordre des cartes reste). */}
        <div
          className={`flex flex-col gap-3 max-lg:contents lg:grid lg:flex-1 lg:items-stretch lg:gap-4 ${
            session.repeatsWeekly ? "lg:grid-cols-2" : ""
          }`}
        >
          {session.repeatsWeekly ? (
            <section
              aria-labelledby="next-title"
              className={`${card} flex min-w-0 flex-col gap-1 px-[18px] pt-[18px] pb-1.5 max-lg:order-1 lg:gap-1.5 lg:px-[22px] lg:pt-5 lg:pb-2.5`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="next-title" className={`${cardTitle} whitespace-nowrap`}>
                  Prochaines dates
                </h2>
                {allDates || others.length > 0 ? (
                  <Link
                    href={datesHref(!allDates)}
                    scroll={false}
                    // Cible de 44 px sans déplacer le titre. Visible quand des dates restent cachées :
                    // au-delà de 4 sur téléphone, au-delà de la hauteur de la carte sur ordinateur.
                    className={`relative text-[13px] whitespace-nowrap text-violet-text after:absolute after:-inset-x-2 after:-inset-y-3.5 hover:underline ${
                      allDates
                        ? ""
                        : `hidden ${others.length > 4 ? "max-lg:inline" : ""} lg:[section:has([data-fit-overflow])_&]:inline`
                    }`}
                  >
                    {allDates ? "Voir moins" : "Toutes les dates"}
                  </Link>
                ) : null}
              </div>
              {next.length === 0 ? (
                <p className="pt-2 pb-3 text-[14px] text-muted">Aucune autre date à venir.</p>
              ) : (
                (() => {
                  const list = (
                    <ul className="flex flex-col">
                      {next.map((occurrence, index) => {
                        const first = index === 0;
                        const last = index === next.length - 1;
                        // Dernière date montrée : la vraie dernière, la 4e sur téléphone, ou la
                        // dernière qui tient dans la carte sur ordinateur (data-fit-last).
                        const phoneLast = !allDates && !last && index === 3;
                        const rule = `${last ? "" : "border-b border-line"} ${
                          phoneLast ? "max-lg:border-b-0" : ""
                        } lg:group-data-[fit-last]/date:border-b-0`;
                        return (
                          <li key={occurrence.originalDate} className="group/date">
                            <Link
                              href={`${sessionPath}?date=${occurrence.date}${keepReturn ? `&${keepReturn}` : ""}`}
                              className="grid grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-x-2.5 transition-colors duration-150 hover:bg-surface-2 lg:gap-x-3.5"
                            >
                              {/* Le rail : il relie le centre du premier point à celui du dernier. */}
                              <span
                                aria-hidden
                                className="relative flex justify-center self-stretch"
                              >
                                <span
                                  className={`absolute left-2.5 w-0.5 bg-violet-ring ${first ? "top-6" : "top-0"} ${
                                    last
                                      ? "bottom-[calc(100%-24px)]"
                                      : `bottom-0 ${phoneLast ? "max-lg:bottom-[calc(100%-24px)]" : ""} lg:group-data-[fit-last]/date:bottom-[calc(100%-24px)]`
                                  }`}
                                />
                                <span className="relative mt-[19px] size-2.5 rounded-full bg-surface inset-ring-[2.5px] inset-ring-violet-line" />
                              </span>
                              <span className={`flex min-w-0 flex-col gap-0.5 py-2.5 ${rule}`}>
                                <span className="text-[14px] font-medium whitespace-nowrap">
                                  {capitalize(dayLabel(occurrence.date))}
                                </span>
                                <span className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted tabular">
                                  {session.allDay
                                    ? "Toute la journée"
                                    : `${occurrence.startTime.slice(0, 5)} – ${endTime(occurrence.startTime, session.durationMinutes)}`}
                                  {occurrence.moved ? (
                                    <Badge tone="moved">
                                      Déplacée · prévue {dayLabel(occurrence.originalDate)}
                                    </Badge>
                                  ) : null}
                                </span>
                              </span>
                              <span className={`flex items-center self-stretch ${rule}`}>
                                <ChevronRight
                                  aria-hidden
                                  size={15}
                                  strokeWidth={2}
                                  className="text-faint"
                                />
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  );
                  return allDates ? list : <FitList phoneLimit={4}>{list}</FitList>;
                })()
              )}
            </section>
          ) : null}

          <div className="flex min-w-0 flex-col gap-3 max-lg:contents lg:gap-4">
            {detailRows.length > 0 ? (
              <section
                aria-labelledby="details-title"
                className={`${card} flex flex-col gap-0.5 px-[18px] pt-[18px] pb-3.5 max-lg:order-2 lg:gap-1 lg:px-[22px] lg:pt-5 lg:pb-4 ${
                  priced || hasPackage ? "" : "lg:flex-1"
                }`}
              >
                <h2 id="details-title" className={cardTitle}>
                  Détails
                </h2>
                <InfoRows rows={detailRows} />
              </section>
            ) : null}

            {/* Prix et paiements (03/11) : le montant et où en est cette date, puis le détail (TVA, mode
                de paiement) et les dates récentes. Téléphone : le détail sous « Voir plus » ;
                ordinateur : toujours visible, les dates remplissant la hauteur de la carte. */}
            <section
              aria-labelledby="price-title"
              className={`${card} relative flex min-w-0 flex-col gap-2 px-[18px] pt-4 pb-3 max-lg:order-3 lg:px-[22px] lg:pt-5 lg:pb-3 ${
                priced || hasPackage || detailRows.length === 0 ? "lg:min-h-0 lg:flex-auto" : ""
              }`}
            >
              <h2 id="price-title" className={cardTitle}>
                Prix et paiements
              </h2>
              {!priced && !hasPackage ? (
                <p className="pb-1 text-[13.5px] leading-[1.5] text-text-2">
                  Pas de prix pour cette séance.{" "}
                  <span className="text-muted">Ajoute-le avec « Modifier ».</span>
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <p className="flex min-w-0 items-baseline gap-2">
                        <span className="text-[15px] font-semibold whitespace-nowrap tabular">
                          {session.priceCents === null ? "Par forfait" : amountLabel}
                        </span>
                        {currentRow &&
                        (currentRow.state === "unpaid" || currentRow.state === "future") ? (
                          <span className="truncate text-[13px] text-muted">
                            · {currentRow.state === "future" ? "À venir" : "En attente"}
                          </span>
                        ) : null}
                      </p>
                      {/* Ordinateur : le détail sous le montant (téléphone : sous « Voir plus »). */}
                      {priceDetail ? (
                        <p className="truncate text-[12.5px] text-muted max-lg:hidden">
                          {priceDetail}
                        </p>
                      ) : null}
                    </div>
                    {currentRow ? (
                      <DatePayment
                        row={currentRow}
                        priced={priced}
                        amountLabel={amountLabel}
                        mark={mark}
                        className="lg:h-9! lg:px-3.5! lg:text-[13.5px]!"
                      />
                    ) : null}
                  </div>
                  <PriceMore>
                    {priceDetail ? (
                      <p className="text-[13px] text-muted lg:hidden">{priceDetail}</p>
                    ) : null}
                    {/* Ordinateur : au moins deux dates, puis autant que la carte en contient ;
                        « Toutes les dates » (puis « Voir moins ») dans l'en-tête de la carte. */}
                    <FitList
                      phoneLimit={recentPayable.length}
                      minHeight={97}
                      moreLabel="Toutes les dates"
                      moreClassName="lg:absolute lg:top-[21px] lg:right-[22px] lg:min-h-0"
                    >
                      <PaymentRows
                        priced={priced}
                        amountLabel={amountLabel}
                        mark={mark}
                        unmark={unmarkSessionPaid.bind(null, organizationId, session.id)}
                        rows={payable.map(paymentRow)}
                      />
                    </FitList>
                    <p className="text-[12px] text-muted lg:hidden">
                      « Marquer payée » note le paiement reçu aujourd&apos;hui : il compte dans «
                      Encaissé cette semaine » et dans la Comptabilité. Un forfait se note avec «
                      Créer → Paiement reçu ».
                    </p>
                  </PriceMore>
                </>
              )}
            </section>
          </div>
        </div>

        {/* Ordinateur : la barre d'actions en bas de la page. */}
        <section
          aria-label="Actions de la séance"
          className={`${card} flex items-center gap-4 px-[22px] py-3 max-lg:hidden`}
        >
          <p className="flex-1 text-[13px] text-muted">
            {session.repeatsWeekly
              ? "« Modifier » change toute la série. Pour déplacer une seule date, glisse-la dans l'Agenda."
              : "« Modifier » change l'heure, le lieu, le prix et les sportifs de cette séance."}
          </p>
          <Link
            href={`${sessionPath}/modifier`}
            className={buttonClass({
              variant: "outline",
              className: "h-10! rounded-[11px]! bg-surface px-5! text-[14px]! font-medium!",
            })}
          >
            <Pencil aria-hidden size={15} strokeWidth={1.8} />
            Modifier
          </Link>
          <DeleteMoreMenu
            menuTitle={session.title}
            action={remove}
            confirmTitle="Supprimer cette séance ?"
            confirmText={deleteText}
            button="Supprimer la séance"
            buttonClassName="flex h-10 items-center gap-2 rounded-[11px] px-3.5 text-[14px] font-medium text-alert transition-colors duration-150 hover:bg-alert-soft"
          />
        </section>

        {/* Téléphone : « Supprimer la séance » centré sous les cartes. */}
        <DeleteMoreMenu
          menuTitle={session.title}
          action={remove}
          confirmTitle="Supprimer cette séance ?"
          confirmText={deleteText}
          button="Supprimer la séance"
          buttonClassName="flex min-h-11 items-center gap-2 self-center rounded-xl px-3 text-[14px] font-medium text-alert transition-colors duration-150 active:bg-alert-soft max-lg:order-4 lg:hidden"
        />
      </div>

      {/* Téléphone : Écrire et Modifier toujours à portée de pouce. */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 grid gap-2.5 border-t border-line-soft bg-bg/92 px-3.5 pt-3 pb-[calc(14px+env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden ${
          athlete ? "grid-cols-2" : "grid-cols-1"
        }`}
      >
        {athlete ? (
          <WriteButton
            athleteId={athlete.id}
            className={buttonClass({
              variant: "outline",
              className: "h-12! rounded-[13px]! bg-surface text-[15px]! font-medium!",
            })}
          >
            {writeLabel}
          </WriteButton>
        ) : null}
        <Link
          href={`${sessionPath}/modifier`}
          className={buttonClass({
            className: "h-12! rounded-[13px]! text-[15px]! font-medium!",
          })}
        >
          <Pencil aria-hidden size={16} strokeWidth={1.8} />
          Modifier
        </Link>
      </div>
    </>
  );
}

// « Écrire » : le fil du sportif, ou (MVP espace coach seul, D-167) la fenêtre « pas encore ».
function WriteButton({
  athleteId,
  className,
  children,
}: {
  athleteId: string;
  className: string;
  children: ReactNode;
}) {
  return FEATURES.messages ? (
    <Link href={`/coach/messages?sportif=${athleteId}`} className={className}>
      {children}
    </Link>
  ) : (
    <NotAvailableButton className={className}>{children}</NotAvailableButton>
  );
}

// Chargement : des cartes vides aux dimensions de la page (en-tête, héro, colonnes).
function SessionLoading() {
  return (
    <div
      role="status"
      aria-label="Chargement de la séance"
      className="flex flex-col gap-3 px-3.5 pt-1 lg:gap-4 lg:pr-3.5 lg:pl-5 lg:pt-3"
    >
      <div className="flex h-9 items-center px-1 lg:h-16 lg:rounded-[20px] lg:bg-surface lg:px-5">
        <SkeletonBar className="w-20 lg:w-24" />
      </div>
      <div className={`${card} flex flex-col gap-3 p-4 lg:h-[150px] lg:px-6 lg:py-5`}>
        <SkeletonBar className="h-5 w-3/5 lg:w-1/3" />
        <SkeletonBar className="w-2/5 lg:w-1/5" />
        <SkeletonBar className="h-8 w-1/2 lg:w-1/4" />
        <SkeletonBar className="h-14 w-full rounded-2xl lg:hidden" />
      </div>
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4">
        <div className={`${card} h-[262px] lg:h-[300px]`} />
        <div className={`${card} h-[180px] lg:h-[300px]`} />
      </div>
    </div>
  );
}

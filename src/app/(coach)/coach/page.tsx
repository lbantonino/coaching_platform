import {
  CalendarDays,
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  Euro,
  FileText,
  ListChecks,
  ReceiptText,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Suspense } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { iconButtonClass } from "@/components/ui/button";
import { disciplineLabels } from "@/domain/training/discipline";
import { addDays } from "@/features/agenda/items";
import { dayLabel, monthGrid, monthLabel, shiftMonth } from "@/features/agenda/calendar";
import {
  lastSessionFor,
  layoutDays,
  layoutWeek,
  mondayOf,
  parseDay,
  weekCounts,
  type WeekBlock,
} from "@/features/agenda/week";
import { listAthletes, type AthleteListItem } from "@/features/athletes/queries";
import { athleteStatusLabels } from "@/features/athletes/schemas";
import { requireCoach } from "@/features/auth/guards";
import { getCoachProfile } from "@/features/coach/profile";
import { listSessions } from "@/features/sessions/queries";
import { formatDate, nowTimeInBrussels, todayIsoInBrussels } from "@/lib/format";

import { CreateMenu } from "./create-menu";
import { WeekAgenda, type AgendaView } from "./week-agenda";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

// Tableau de bord du coach, d'après la maquette d'Antonino (D-28). Chiffres RÉELS uniquement : ce qui
// dépend d'un module pas encore construit est dessiné avec « Bientôt » et sa phase, jamais simulé.
export default function CoachHomePage({ searchParams }: PageProps<"/coach">) {
  return (
    <main className="mx-auto flex w-full max-w-[1320px] flex-1 flex-col gap-5 px-5 py-6 md:px-8 md:py-[22px]">
      {/* La session et la semaine se lisent à la requête : derrière Suspense (Cache Components). */}
      <Suspense fallback={<p className="text-muted">Chargement de ton espace…</p>}>
        {searchParams.then((query) => (
          <Dashboard
            view={query.vue === "jour" || query.vue === "mois" ? query.vue : "semaine"}
            date={typeof query.date === "string" ? query.date : undefined}
          />
        ))}
      </Suspense>
    </main>
  );
}

const longDate = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

async function Dashboard({
  view,
  date: dateParam,
}: {
  view: AgendaView;
  date: string | undefined;
}) {
  // Garde-fou serveur : connecté ET membre actif d'une organisation, sinon redirection.
  const { user, memberships } = await requireCoach();
  const current = memberships[0];
  const orgBase = `/coach/o/${current.organizationId}`;
  const [profile, athletes, sessions] = await Promise.all([
    getCoachProfile(user),
    listAthletes(current.organizationId, { status: "all", q: "" }),
    listSessions(current.organizationId),
  ]);

  const today = todayIsoInBrussels();
  const now = nowTimeInBrussels();
  // Une seule date dans l'adresse (?date=) : sa semaine, sa journée ou son mois selon la vue (?vue=).
  const date = parseDay(dateParam, today);
  const monday = mondayOf(date);
  const month = date.slice(0, 7);
  const layout = view === "jour" ? layoutDays(sessions, [date]) : layoutWeek(sessions, monday);
  const monthDates = monthGrid(month)
    .flat()
    .filter((day) => day.inMonth)
    .map((day) => day.iso);
  const monthBlocks = new Map<string, WeekBlock[]>(
    view === "mois"
      ? layoutDays(sessions, monthDates).days.map((day) => [day.date, day.blocks])
      : [],
  );
  const counts = weekCounts(sessions, monday);
  const total = counts.reduce((sum, n) => sum + n, 0);
  const previous = weekCounts(sessions, addDays(monday, -7)).reduce((sum, n) => sum + n, 0);
  const delta = total - previous;

  const active = athletes.filter((athlete) => athlete.status === "active");
  const recent = active
    .map((athlete) => ({ athlete, last: lastSessionFor(athlete.id, sessions, today, now) }))
    .sort((a, b) => (b.last?.date ?? "").localeCompare(a.last?.date ?? ""))
    .slice(0, 4);

  const viewHref = (target: AgendaView, at: string = date) =>
    target === "semaine" && at === today ? "/coach" : `/coach?vue=${target}&date=${at}`;
  const isThisWeek = monday === mondayOf(today);
  // Précédent / suivant : une semaine, un jour ou un mois selon la vue.
  const step = (direction: 1 | -1) =>
    view === "jour"
      ? addDays(date, direction)
      : view === "mois"
        ? `${shiftMonth(month, direction)}-01`
        : addDays(monday, 7 * direction);
  const periodLabel =
    view === "jour"
      ? `${dayLabel(date)} ${date.slice(0, 4)}`
      : view === "mois"
        ? monthLabel(month)
        : `Semaine du ${longDate.format(new Date(`${monday}T00:00:00Z`))}`;

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1 text-center lg:text-left">
          <h1 className="font-display text-h2 font-medium md:text-h1">
            Bonjour {profile.firstName ?? profile.displayName} <span aria-hidden>👋</span>
          </h1>
          <p className="text-muted">Voici un aperçu de ton activité cette semaine.</p>
        </div>
        {/* Téléphone : période et bouton « Créer » centrés (demande d'Antonino). */}
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center lg:justify-end">
          <nav aria-label="Changer de période" className="flex items-center gap-1">
            <Link
              href={viewHref(view, step(-1))}
              aria-label="Période précédente"
              className={iconButtonClass()}
            >
              <ChevronLeft aria-hidden size={17} strokeWidth={1.8} />
            </Link>
            <span className="inline-flex h-[38px] items-center rounded-md border border-line bg-surface px-4 text-small first-letter:uppercase">
              {periodLabel}
            </span>
            <Link
              href={viewHref(view, step(1))}
              aria-label="Période suivante"
              className={iconButtonClass()}
            >
              <ChevronRight aria-hidden size={17} strokeWidth={1.8} />
            </Link>
          </nav>
          <CreateMenu orgBase={orgBase} />
        </div>
      </div>

      <section
        aria-label="Chiffres clés"
        className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-4"
      >
        <KpiCard
          href={`${orgBase}/agenda`}
          icon={CalendarDays}
          tone="red"
          value={String(total)}
          label={`séance${total > 1 ? "s" : ""} ${isThisWeek ? "cette semaine" : "cette semaine-là"}`}
          footer={
            <div className="flex items-end justify-between gap-3">
              <span className="text-caption text-accent-text">
                {delta === 0
                  ? "Autant que la semaine précédente"
                  : `${delta > 0 ? "+" : "−"}${Math.abs(delta)} vs semaine précédente`}
              </span>
              <span aria-hidden className="flex h-7 items-end gap-1">
                {counts.map((count, i) => (
                  <span
                    key={i}
                    className="w-1.5 rounded-t-[2px] bg-accent"
                    style={{
                      height: `${Math.max(12, (count / Math.max(1, ...counts)) * 100)}%`,
                      opacity: count === 0 ? 0.25 : 1,
                    }}
                  />
                ))}
              </span>
            </div>
          }
        />
        <KpiCard
          href={`${orgBase}/sportifs`}
          icon={Users}
          tone="blue"
          value={String(active.length)}
          label={`sportif${active.length > 1 ? "s" : ""} actif${active.length > 1 ? "s" : ""}`}
          footer={
            <span className="flex items-center">
              {active.slice(0, 3).map((athlete) => (
                <span
                  key={athlete.id}
                  className="-ml-1.5 rounded-full ring-2 ring-surface first:ml-0"
                >
                  <Avatar name={athlete.displayName} photoPath={athlete.photoPath} size="sm" />
                </span>
              ))}
              {active.length > 3 ? (
                <span className="ml-2 text-caption text-muted">+{active.length - 3}</span>
              ) : null}
            </span>
          }
        />
        <KpiCard
          href="/coach/bientot/programmes"
          icon={FileText}
          tone="indigo"
          value="—"
          label="programmes à livrer"
          footer={<SoonBadge phase="P4" />}
        />
        <KpiCard
          href="/coach/bientot/facturation"
          icon={Euro}
          tone="green"
          value="—"
          label="factures en attente"
          footer={<SoonBadge phase="après P6" />}
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <WeekAgenda
          view={view}
          layout={layout}
          month={month}
          monthBlocks={monthBlocks}
          today={today}
          agendaHref={`${orgBase}/agenda`}
          viewHref={viewHref}
        />
        <div className="flex flex-col gap-5">
          <SoonCard
            icon={ListChecks}
            title="Tâches prioritaires"
            phase="avec P4 à P7"
            href="/coach/bientot/taches"
            text="Programme à finaliser, facture à envoyer, suivi à faire, message auquel répondre : les tâches se créeront à partir des modules qui les produisent."
          />
          <SoonCard
            icon={ChartColumn}
            title="Revenus du mois"
            phase="après P6"
            href="/coach/bientot/comptabilite"
            text="Encaissé, en attente et évolution sur six mois, à partir des paiements que tu noteras dans la facturation."
          />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section
          aria-labelledby="recent-athletes-title"
          className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 md:p-5"
        >
          <CardHeader
            id="recent-athletes-title"
            icon={Users}
            title="Sportifs récents"
            link={{ href: `${orgBase}/sportifs`, label: `Voir tous (${active.length})` }}
          />
          {recent.length === 0 ? (
            <p className="text-small text-muted">Aucun sportif actif pour l&apos;instant.</p>
          ) : (
            <ul className="flex flex-col">
              {recent.map(({ athlete, last }) => (
                <li key={athlete.id}>
                  <RecentAthlete
                    athlete={athlete}
                    last={last}
                    today={today}
                    href={`${orgBase}/sportifs/${athlete.id}`}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
        <SoonCard
          icon={FileText}
          title="Programmes en cours"
          phase="P4"
          href="/coach/bientot/programmes"
          text="Chaque programme avec son sportif et sa progression (semaine 6 sur 12…), dès que l'éditeur de programmes existe."
        />
        <SoonCard
          icon={ReceiptText}
          title="Factures récentes"
          phase="après P6"
          href="/coach/bientot/facturation"
          text="Montant, statut (payée, à envoyer, en retard) et date de chaque facture, sans aucun paiement en ligne via Coory."
        />
      </div>
    </>
  );
}

const kpiTones = {
  red: {
    box: "border-accent/40 bg-[color-mix(in_srgb,var(--accent)_var(--tint-card),var(--surface))]",
    icon: "border border-accent/50 bg-accent-soft text-accent-text",
  },
  blue: {
    box: "border-blue/40 bg-[color-mix(in_srgb,var(--blue)_var(--tint-card),var(--surface))]",
    icon: "border border-blue/50 bg-blue-soft text-blue",
  },
  indigo: {
    box: "border-strength/40 bg-[color-mix(in_srgb,var(--strength)_var(--tint-card),var(--surface))]",
    icon: "border border-strength/50 bg-strength-soft text-strength",
  },
  green: {
    box: "border-green/40 bg-[color-mix(in_srgb,var(--green)_var(--tint-card),var(--surface))]",
    icon: "border border-green/50 bg-green-soft text-green",
  },
} as const;

function KpiCard({
  href,
  icon: Icon,
  tone,
  value,
  label,
  footer,
}: {
  href: string;
  icon: LucideIcon;
  tone: keyof typeof kpiTones;
  value: string;
  label: string;
  footer: ReactNode;
}) {
  const colors = kpiTones[tone];
  return (
    <Link
      href={href}
      className={`flex min-w-[240px] shrink-0 snap-start flex-col gap-3 rounded-card border p-4 transition-[filter] hover:brightness-110 md:min-w-0 ${colors.box}`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={`inline-flex size-12 shrink-0 items-center justify-center rounded-[12px] ${colors.icon}`}
        >
          <Icon size={22} strokeWidth={1.7} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-display text-h2 leading-none font-medium">{value}</span>
          <span className="text-small text-muted">{label}</span>
        </span>
        <ChevronRight aria-hidden size={16} strokeWidth={1.8} className="text-muted" />
      </div>
      {footer}
    </Link>
  );
}

function SoonBadge({ phase }: { phase: string }) {
  return (
    <span className="w-fit">
      <Badge tone="neutral">Bientôt · {phase}</Badge>
    </span>
  );
}

function CardHeader({
  id,
  icon: Icon,
  title,
  link,
  badge,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  link?: { href: string; label: string };
  badge?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 id={id} className="flex items-center gap-2 text-title font-medium">
        <Icon aria-hidden size={19} strokeWidth={1.7} className="text-accent-text" />
        {title}
      </h2>
      {link ? (
        <Link
          href={link.href}
          className="text-caption text-muted underline underline-offset-4 hover:text-text"
        >
          {link.label}
        </Link>
      ) : (
        badge
      )}
    </div>
  );
}

// Carte d'un bloc dont le module n'existe pas encore : son titre, ce qu'il montrera, sa phase.
function SoonCard({
  icon,
  title,
  phase,
  href,
  text,
}: {
  icon: LucideIcon;
  title: string;
  phase: string;
  href: string;
  text: string;
}) {
  const id = `soon-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-3 rounded-card border border-dashed border-line-2 bg-surface p-4 md:p-5"
    >
      <CardHeader id={id} icon={icon} title={title} badge={<SoonBadge phase={phase} />} />
      <p className="text-small text-muted">{text}</p>
      <Link
        href={href}
        className="w-fit text-caption text-muted underline underline-offset-4 hover:text-text"
      >
        Ce qui arrive
      </Link>
    </section>
  );
}

function relativeDay(date: string, today: string): string {
  if (date === today) return "aujourd'hui";
  if (date === addDays(today, -1)) return "hier";
  return `le ${formatDate(date)}`;
}

function RecentAthlete({
  athlete,
  last,
  today,
  href,
}: {
  athlete: AthleteListItem;
  last: { date: string; time: string } | null;
  today: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[12px] px-1 py-2.5 transition-colors hover:bg-surface-2"
    >
      <Avatar name={athlete.displayName} photoPath={athlete.photoPath} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-2">
          <span className="truncate font-medium">{athlete.displayName}</span>
          <Badge tone="ok">{athleteStatusLabels[athlete.status]}</Badge>
        </span>
        <span className="truncate text-caption text-muted">
          {athlete.mainDiscipline ? `${disciplineLabels[athlete.mainDiscipline]} · ` : ""}
          {last ? `Dernière séance ${relativeDay(last.date, today)}` : "Aucune séance encore"}
        </span>
      </span>
    </Link>
  );
}

import { CalendarDays, Flag } from "lucide-react";
import Link from "next/link";

import { buttonClass } from "@/components/ui/button";
import { addDays, type AgendaItem } from "@/features/agenda/items";
import { mondayOf } from "@/features/agenda/week";
import { dayShortLabel } from "@/lib/format";

// Agenda d'un sportif sur sa fiche (demande d'Antonino du 26/10) : ses séances encadrées avec le coach
// (individuelles, et collectives où il est inscrit) et ses compétitions. Les séances de son programme
// s'y ajouteront avec l'espace sportif (P6), marquées « Programme » pour les distinguer.

// Une ligne : jour et heure à gauche, titre et détail ; « Aujourd'hui » surligné. Partagée par la
// carte « Prochaines séances » de la vue d'ensemble et l'onglet Agenda.
export function AgendaItemRow({
  item,
  today,
  agendaPath,
  goalsHref,
}: {
  item: AgendaItem;
  today: string;
  agendaPath: string;
  goalsHref: string;
}) {
  const isToday = item.date === today;
  return (
    <Link
      href={item.type === "session" ? `${agendaPath}/seances/${item.sessionId}` : goalsHref}
      scroll={item.type === "session"}
      className={`-mx-2 flex min-h-[52px] items-center gap-3 rounded-[10px] px-2 py-2.5 transition-colors duration-150 hover:bg-surface-2 ${
        isToday ? "bg-accent-soft" : ""
      }`}
    >
      <span className="flex w-[92px] shrink-0 flex-col font-mono text-[12px] leading-tight tabular">
        <span className={isToday ? "font-medium text-accent-text" : "text-muted"}>
          {dayShortLabel(item.date, today)}
        </span>
        <span className="text-[14px] font-medium">
          {item.type === "session" ? item.time : "Journée"}
        </span>
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="flex min-w-0 items-center gap-1.5 font-medium">
          {item.type === "event" ? (
            <Flag aria-hidden size={14} strokeWidth={2} className="shrink-0 text-accent-text" />
          ) : null}
          <span className="truncate">{item.title}</span>
        </span>
        <span className="truncate text-[13px] text-muted">
          {item.type === "event"
            ? `Compétition · ${item.detail}`
            : item.individual
              ? // Le détail commence par « Avec {sportif} » : inutile sur sa propre fiche.
                ["Avec le coach", ...item.detail.split(" · ").slice(1)].join(" · ")
              : `Collective · ${item.detail}`}
        </span>
      </span>
    </Link>
  );
}

const shortDate = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function weekTitle(monday: string, today: string): string {
  const current = mondayOf(today);
  if (monday === current) return "Cette semaine";
  if (monday === addDays(current, 7)) return "Semaine prochaine";
  return `Semaine du ${shortDate.format(new Date(`${monday}T00:00:00Z`))}`;
}

// Onglet « Agenda » : les 8 prochaines semaines, rangées par semaine.
export function AthleteAgendaSection({
  name,
  items,
  today,
  agendaPath,
  goalsHref,
}: {
  name: string;
  items: AgendaItem[];
  today: string;
  agendaPath: string;
  goalsHref: string;
}) {
  const weeks = new Map<string, AgendaItem[]>();
  for (const item of items) {
    const monday = mondayOf(item.date);
    weeks.set(monday, [...(weeks.get(monday) ?? []), item]);
  }
  const todayCount = items.filter((item) => item.date === today).length;

  return (
    <section
      aria-labelledby="athlete-agenda-title"
      className="flex flex-col gap-5 rounded-card border border-line bg-surface p-5 md:p-[22px]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="athlete-agenda-title" className="text-title font-medium">
            Agenda de {name}
          </h2>
          <p className="text-small text-muted">
            {todayCount > 0
              ? `Aujourd'hui : ${todayCount} rendez-vous.`
              : "Rien de prévu aujourd'hui."}{" "}
            Séances avec le coach et compétitions, sur les 8 prochaines semaines.
          </p>
        </div>
        <Link href={agendaPath} className={buttonClass({ variant: "outline", size: "sm" })}>
          <CalendarDays aria-hidden size={14} strokeWidth={1.8} />
          Agenda complet
        </Link>
      </div>

      {items.length === 0 ? (
        <p
          role="status"
          className="rounded-[14px] border border-dashed border-line-2 p-4 text-muted"
        >
          Rien de prévu avec {name} dans les 8 prochaines semaines. Utilise « + Créer → Séance » en
          haut de la fiche pour lui planifier une séance.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {[...weeks.entries()].map(([monday, weekItems]) => (
            <div key={monday} className="flex flex-col gap-1">
              <h3 className="text-[13px] font-medium text-muted">{weekTitle(monday, today)}</h3>
              <ul aria-label={weekTitle(monday, today)} className="flex flex-col">
                {weekItems.map((item) => (
                  <li key={item.key} className="border-t border-line first:border-t-0">
                    <AgendaItemRow
                      item={item}
                      today={today}
                      agendaPath={agendaPath}
                      goalsHref={goalsHref}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// Onglet « Programme » : en attendant l'éditeur de programmes, un état vide honnête et le bouton
// pour en créer un (prompt : pas d'onglet grisé ni de « Bientôt »).
export function AthleteProgramSection({ name }: { name: string }) {
  return (
    <section
      aria-labelledby="athlete-program-title"
      className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 md:p-[22px]"
    >
      <h2 id="athlete-program-title" className="text-title font-medium">
        Programme
      </h2>
      <div className="flex flex-col items-start gap-3 rounded-[14px] border border-dashed border-line-2 p-5">
        <p className="text-muted">
          Aucun programme pour {name} pour l&apos;instant. Ici, tu verras son programme semaine par
          semaine, tu pourras le modifier et y ajouter des séances.
        </p>
        <Link href="/coach/programmes" className={buttonClass({ variant: "outline" })}>
          Créer un programme
        </Link>
      </div>
    </section>
  );
}

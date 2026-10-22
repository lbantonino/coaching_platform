import { CalendarDays, User } from "lucide-react";
import Link from "next/link";

import { disciplineStyles } from "@/domain/training/discipline";
import { dayLabel } from "@/features/agenda/calendar";
import { addDays } from "@/features/agenda/items";
import type { CoachSession } from "@/features/sessions/queries";
import { occurrencesBetween } from "@/features/sessions/schemas";

type Coaching = {
  key: string;
  date: string;
  time: string;
  sessionId: string;
  title: string;
  athlete: string;
  icon: string;
};

// Lundi de la semaine qui contient `today` (AAAA-MM-JJ, calcul en UTC).
function mondayOf(today: string): string {
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
  return addDays(today, -((weekday + 6) % 7));
}

// Semaine en cours du coach (lundi -> dimanche) : uniquement ses coachings individuels.
export function CoachingWeek({
  sessions,
  today,
  agendaHref,
}: {
  sessions: CoachSession[];
  today: string;
  agendaHref: string;
}) {
  const monday = mondayOf(today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const coachings: Coaching[] = sessions
    .filter((session) => session.kind === "individual")
    .flatMap((session) =>
      occurrencesBetween(session, days[0], days[6]).map((date) => ({
        key: `${session.id}:${date}`,
        date,
        time: session.startTime,
        sessionId: session.id,
        title: session.title,
        athlete: session.athletes[0]?.name ?? "Sportif",
        icon: session.discipline
          ? disciplineStyles[session.discipline].icon
          : "border border-line-2 bg-chip text-muted",
      })),
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const sessionHref = (id: string) => `${agendaHref}/seances/${id}`;

  return (
    <section
      aria-labelledby="coaching-week-title"
      className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 md:p-[22px]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="coaching-week-title" className="flex items-center gap-2 text-title font-medium">
          <CalendarDays aria-hidden size={18} strokeWidth={1.7} className="text-accent-text" />
          Coachings individuels de la semaine
        </h2>
        <Link
          href={agendaHref}
          className="text-small text-muted underline underline-offset-4 hover:text-text"
        >
          Voir l&apos;agenda
        </Link>
      </div>

      {coachings.length === 0 ? (
        <p role="status" className="text-small text-muted">
          Aucun coaching individuel cette semaine. Tu peux en créer un depuis l&apos;agenda.
        </p>
      ) : (
        <>
          {/* Ordinateur : les sept jours côte à côte. */}
          <ol className="hidden grid-cols-7 gap-2 md:grid">
            {days.map((date) => {
              const items = coachings.filter((c) => c.date === date);
              return (
                <li
                  key={date}
                  className={`flex min-h-28 flex-col gap-2 rounded-[12px] border p-2 ${
                    date === today ? "border-accent/60" : "border-line"
                  } ${date < today ? "opacity-60" : ""}`}
                >
                  <span className="text-caption text-muted first-letter:uppercase">
                    {dayLabel(date).split(" ").slice(0, 2).join(" ")}
                  </span>
                  {items.map((c) => (
                    <Link
                      key={c.key}
                      href={sessionHref(c.sessionId)}
                      title={`${c.time} · ${c.title} · ${c.athlete}`}
                      className="flex flex-col rounded-[8px] bg-bg px-2 py-1.5 hover:bg-surface-2"
                    >
                      <span className="font-mono text-caption tabular">{c.time}</span>
                      <span className="truncate text-caption font-medium">{c.athlete}</span>
                      <span className="truncate text-micro text-muted">{c.title}</span>
                    </Link>
                  ))}
                </li>
              );
            })}
          </ol>

          {/* Téléphone : seulement les jours qui ont un coaching. */}
          <ul className="flex flex-col gap-2 md:hidden">
            {coachings.map((c) => (
              <li key={c.key}>
                <Link
                  href={sessionHref(c.sessionId)}
                  className="flex items-center gap-3 rounded-[14px] border border-line bg-bg p-3 hover:bg-surface-2"
                >
                  <span className="flex w-16 shrink-0 flex-col">
                    <span className="text-caption text-muted first-letter:uppercase">
                      {c.date === today ? "Aujourd'hui" : dayLabel(c.date).split(" ")[0]}
                    </span>
                    <span className="font-mono text-small tabular">{c.time}</span>
                  </span>
                  <span
                    aria-hidden
                    className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full ${c.icon}`}
                  >
                    <User size={16} strokeWidth={1.75} />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{c.athlete}</span>
                    <span className="truncate text-caption text-muted">{c.title}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

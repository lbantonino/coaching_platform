import { Users } from "lucide-react";
import Link from "next/link";

import type { Discipline } from "@/domain/training/discipline";
import type { WeekBlock } from "@/features/agenda/week";

// Vue Liste de la page Agenda, à la façon du « Planning » de Google Agenda (D-78, maquette agenda-v1) :
// les jours qui ont des séances, dans l'ordre. Ordinateur : une ligne par jour (le numéro en grand, le
// mois et le jour en petit), puis chaque séance avec le point de sa discipline (cerclé pour une
// collective), « 07:00 – 08:00 », le titre et le détail. Téléphone : la semaine en intertitre
// (« 2 – 8 novembre »), le jour à gauche, chaque séance en carte de la couleur de sa discipline.
// Aujourd'hui : numéro en gras violet, sans rond (02/11), et une ligne violette à l'heure actuelle.
const dots: Record<Discipline | "none", string> = {
  running: "bg-run-fill",
  strength: "bg-strength-fill",
  hyrox: "bg-hyrox-fill",
  hybrid: "bg-hybrid-fill",
  none: "bg-muted",
};
const cards: Record<Discipline | "none", string> = {
  running: "bg-run-fill text-on-run-fill",
  strength: "bg-strength-fill text-on-strength-fill",
  hyrox: "bg-hyrox-fill text-on-hyrox-fill",
  hybrid: "bg-hybrid-fill text-on-hybrid-fill",
  none: "bg-chip text-text",
};

const utc = (day: string) => new Date(`${day}T00:00:00Z`);
const monthShort = new Intl.DateTimeFormat("fr-BE", { month: "short", timeZone: "UTC" });
const weekdayShort = new Intl.DateTimeFormat("fr-BE", { weekday: "short", timeZone: "UTC" });
const dayMonth = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const dayMonthShort = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const addDays = (day: string, n: number) => {
  const date = utc(day);
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
};
const mondayOf = (day: string) => addDays(day, -((utc(day).getUTCDay() + 6) % 7));
const time = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
// « 2 – 8 novembre », ou « 26 oct. – 1 nov. » à cheval sur deux mois.
const weekRange = (monday: string) => {
  const sunday = addDays(monday, 6);
  return monday.slice(0, 7) === sunday.slice(0, 7)
    ? `${utc(monday).getUTCDate()} – ${dayMonth.format(utc(sunday))}`
    : `${dayMonthShort.format(utc(monday))} – ${dayMonthShort.format(utc(sunday))}`;
};

function NowLine({ minutes }: { minutes: number }) {
  const time = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  return (
    // « Maintenant » : l'heure dans une étiquette, puis le trait violet (16/11/2026 : plus de point).
    <span aria-hidden className="my-1 flex items-center gap-1.5">
      <span className="shrink-0 rounded-[4px] bg-accent px-1.5 text-[11px] leading-[18px] font-semibold text-on-accent tabular">
        {time}
      </span>
      <span className="h-0.5 flex-1 rounded-[1px] bg-violet" />
    </span>
  );
}

export function SessionDayList({
  blocks,
  today,
  nowMinutes,
  sessionHref,
}: {
  blocks: WeekBlock[];
  today: string;
  nowMinutes: number;
  // Page de la séance, ouverte sur cette date (02/11).
  sessionHref: (sessionId: string, date: string) => string;
}) {
  const days = [...new Set(blocks.map((block) => block.date))];
  let lastWeek = "";
  return (
    <div className="flex flex-col pb-24 lg:pb-2">
      {days.map((day) => {
        const list = blocks.filter((block) => block.date === day);
        const isToday = day === today;
        // Ligne « maintenant » : avant la première séance pas encore commencée (ou après la dernière).
        const nowIndex = isToday ? list.findIndex((block) => block.start > nowMinutes) : -2;
        const monday = mondayOf(day);
        const newWeek = monday !== lastWeek;
        lastWeek = monday;
        return (
          <div key={day}>
            {newWeek ? (
              <p className="pt-4 pb-1 pl-[72px] text-[11px] font-medium text-muted lg:hidden">
                {weekRange(monday)}
              </p>
            ) : null}
            <div className="grid grid-cols-[48px_minmax(0,1fr)] gap-3 px-3 py-2 lg:grid-cols-[132px_minmax(0,1fr)] lg:gap-2 lg:border-b lg:border-line-soft lg:px-4 lg:py-3">
              {/* Le jour : « dim. 1 » (téléphone), « 1 nov. dim. » (ordinateur). */}
              <div className="flex flex-col items-center pt-0.5 lg:flex-row lg:items-start lg:gap-2.5 lg:pt-1">
                <span
                  className={`text-[10.5px] lg:hidden ${isToday ? "font-medium text-violet-text" : "text-muted"}`}
                >
                  {weekdayShort.format(utc(day))}
                </span>
                <span
                  className={`grid size-9 place-items-center text-[18px] tabular lg:-mt-1.5 lg:text-[17px] ${
                    isToday ? "font-bold text-violet-text" : "font-semibold text-text"
                  }`}
                >
                  {utc(day).getUTCDate()}
                </span>
                <span
                  className={`hidden text-[11.5px] leading-tight lg:block ${isToday ? "text-violet-text" : "text-muted"}`}
                >
                  {monthShort.format(utc(day))}
                  <br />
                  {weekdayShort.format(utc(day))}
                </span>
              </div>
              <ul className="flex flex-col gap-2 lg:gap-0">
                {list.map((block, index) => {
                  const discipline = block.discipline ?? "none";
                  const range = block.allDay
                    ? "Toute la journée"
                    : `${time(block.start)} – ${time(block.end)}`;
                  const detail = block.individual
                    ? block.subtitle
                    : `Collective · ${block.subtitle}`;
                  return (
                    <li key={block.key}>
                      {index === nowIndex ? <NowLine minutes={nowMinutes} /> : null}
                      {/* Ordinateur : une ligne. */}
                      <Link
                        href={sessionHref(block.sessionId, block.date)}
                        className="hidden grid-cols-[14px_120px_minmax(0,1fr)] items-center gap-2 rounded-lg px-2 py-1.5 transition-colors duration-150 hover:bg-selected-hover lg:grid"
                      >
                        <span
                          aria-hidden
                          className={`h-4 w-[3px] rounded-[2px] ${dots[discipline]}`}
                        />
                        <span className="text-[12.5px] text-muted tabular">{range}</span>
                        <span className="truncate">
                          <span className="text-[13px] font-medium">{block.title}</span>
                          <span className="text-[12.5px] text-muted"> · {detail}</span>
                        </span>
                      </Link>
                      {/* Téléphone : une carte de la couleur de la discipline. */}
                      <Link
                        href={sessionHref(block.sessionId, block.date)}
                        className={`block rounded-xl px-3 py-2 lg:hidden ${cards[discipline]}`}
                      >
                        <span className="flex min-w-0 items-center gap-1 text-[13.5px] font-semibold">
                          {block.individual ? null : (
                            <Users aria-hidden size={13} strokeWidth={2.2} className="shrink-0" />
                          )}
                          <span className="truncate">{block.title}</span>
                        </span>
                        <span className="block truncate text-[12px] opacity-90 tabular">
                          {range} · {detail}
                        </span>
                      </Link>
                    </li>
                  );
                })}
                {isToday && nowIndex === -1 ? (
                  <li aria-hidden>
                    <NowLine minutes={nowMinutes} />
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}

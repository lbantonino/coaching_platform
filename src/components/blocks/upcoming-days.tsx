import Link from "next/link";

import { MoreDays } from "./more-days";

import { disciplineLabels, type Discipline } from "@/domain/training/discipline";
import type { WeekBlock } from "@/features/agenda/week";

// « Séances à venir » du tableau de bord (D-78, maquette tableau-de-bord-v7, variante « Frise » choisie
// par Antonino le 01/11) : les deux prochains jours qui ont des séances, une colonne par jour (l'un sous
// l'autre sur téléphone). En tête, une pastille calendrier (« lun. 2 », violette pour le premier jour),
// la date en toutes lettres et « Demain · 6 séances ». Chaque jour est une ligne de temps verticale
// (violette pour le premier, grise ensuite) avec un point de la couleur de la discipline par séance ;
// la plus proche est teintée de violet, « Prochaine ». Téléphone (02/11) : le premier jour seul, puis
// « Voir plus » pour les suivants (MoreDays).
export type UpcomingDay = {
  date: string;
  // « Lundi 2 novembre »
  title: string;
  // « lun. » et « 2 » (pastille calendrier)
  weekday: string;
  day: string;
  // « Aujourd'hui », « Demain », « Dans 3 jours »
  relative: string;
  blocks: WeekBlock[];
};

const dots: Record<Discipline, string> = {
  running: "bg-run-fill",
  strength: "bg-strength-fill",
  hyrox: "bg-hyrox-fill",
  hybrid: "bg-hybrid-fill",
};
const texts: Record<Discipline, string> = {
  running: "text-run",
  strength: "text-strength",
  hyrox: "text-hyrox",
  hybrid: "text-hybrid",
};

export function UpcomingDays({
  days,
  nextKey,
  sessionHref,
}: {
  days: UpcomingDay[];
  // La séance la plus proche (« Prochaine »).
  nextKey: string | null;
  // Page de la séance, ouverte sur cette date (02/11).
  sessionHref: (sessionId: string, date: string) => string;
}) {
  return (
    <div className="grid gap-y-6 pt-2 sm:grid-cols-2 sm:gap-x-8">
      {days.slice(0, 1).map((day) => renderDay(day, true))}
      {days.length > 1 ? (
        <MoreDays>{days.slice(1).map((day) => renderDay(day, false))}</MoreDays>
      ) : null}
    </div>
  );

  function renderDay(day: UpcomingDay, first: boolean) {
    return (
      <div key={day.date} className="min-w-0">
        <div className="flex items-center gap-3 pb-3">
          <span
            aria-hidden
            className={`flex size-11 shrink-0 flex-col items-center justify-center rounded-xl leading-none lg:size-10 ${
              first ? "bg-violet-soft text-violet-text" : "bg-chip text-text"
            }`}
          >
            <span className={`text-[12px] lg:text-[10px] ${first ? "" : "text-muted"}`}>
              {day.weekday}
            </span>
            <span className="mt-0.5 text-[17px] font-semibold tabular lg:text-[15px]">
              {day.day}
            </span>
          </span>
          <div className="min-w-0">
            <h3 className="text-[16px] font-medium lg:text-[13px]">{day.title}</h3>
            <p className="text-[13px] text-muted lg:text-[11.5px]">
              {day.relative} · {day.blocks.length} {day.blocks.length > 1 ? "séances" : "séance"}
            </p>
          </div>
        </div>
        <ol
          className={`ml-5 flex flex-col gap-1 border-l-2 pl-5 ${first ? "border-violet" : "border-line-2"}`}
        >
          {day.blocks.map((block) => {
            const next = block.key === nextKey;
            return (
              <li key={block.key} className="relative">
                {/* Le point, posé sur la ligne de temps : la couleur de la discipline. */}
                <span
                  aria-hidden
                  className={`absolute top-[19px] -left-[27px] size-3 rounded-full border-2 border-surface lg:top-[17px] ${
                    block.discipline ? dots[block.discipline] : "bg-muted"
                  }`}
                />
                <Link
                  href={sessionHref(block.sessionId, block.date)}
                  className={`block rounded-xl px-3 py-2 transition-colors duration-150 ${
                    next ? "bg-violet-soft" : "hover:bg-selected-hover"
                  }`}
                >
                  <span className="flex items-baseline justify-between gap-2 leading-snug">
                    <span className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold tabular lg:text-[13px]">
                        {block.allDay ? "Journée" : block.label.slice(0, 5)}
                      </span>
                      {next ? (
                        <span className="-my-1 grid h-6 place-items-center rounded-[6px] bg-accent px-2.5 text-[12px] font-medium text-on-accent lg:h-5 lg:rounded-[5px] lg:px-2 lg:text-[11px]">
                          Prochaine
                        </span>
                      ) : null}
                    </span>
                    {block.discipline ? (
                      <span className={`text-[12px] lg:text-[10px] ${texts[block.discipline]}`}>
                        {disciplineLabels[block.discipline]}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-px block truncate text-[14px] leading-snug text-muted lg:text-[12px]">
                    {block.title} ·{" "}
                    {block.individual ? block.subtitle : `Collective · ${block.subtitle}`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }
}

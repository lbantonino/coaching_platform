import { Users } from "lucide-react";
import Link from "next/link";

import type { Discipline } from "@/domain/training/discipline";
import { monthGrid } from "@/features/agenda/calendar";
import type { WeekBlock } from "@/features/agenda/week";
import { shortName } from "./week-grid";

// Vue Mois de la page Agenda, à la façon de Google Agenda (D-78, maquette agenda-v1) : de grandes cases
// qui remplissent la carte, séparées d'un filet. Ordinateur : jusqu'à trois séances écrites par jour
// (« ▍07:00 Nadia E. », barre de la discipline, icône « groupe » pour une collective), puis « +3 autres ». Téléphone : de petites
// étiquettes de la couleur de la discipline. Aujourd'hui : case teintée de violet, numéro en gras
// violet, sans rond (02/11) ; les jours des mois voisins sont grisés. Une case ouvre sa journée ; son nom, lu par un
// lecteur d'écran, dit aussi quelles séances elle contient.
const dots: Record<Discipline | "none", string> = {
  running: "bg-run-fill",
  strength: "bg-strength-fill",
  hyrox: "bg-hyrox-fill",
  hybrid: "bg-hybrid-fill",
  none: "bg-muted",
};
const chips: Record<Discipline | "none", string> = {
  running: "bg-run-fill text-on-run-fill",
  strength: "bg-strength-fill text-on-strength-fill",
  hyrox: "bg-hyrox-fill text-on-hyrox-fill",
  hybrid: "bg-hybrid-fill text-on-hybrid-fill",
  none: "bg-chip text-text",
};

const weekDayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MAX = 3;

export function MonthGrid({
  month,
  monthBlocks,
  today,
  dayHref,
}: {
  month: string;
  // Séances de chaque jour de la grille (mois voisins compris).
  monthBlocks: Map<string, WeekBlock[]>;
  today: string;
  dayHref: (date: string) => string;
}) {
  const weeks = monthGrid(month);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div aria-hidden className="grid shrink-0 grid-cols-7 text-center text-[11px] text-muted">
        {weekDayNames.map((name) => (
          <span key={name} className="py-2">
            <span className="lg:hidden">{name.charAt(0)}</span>
            <span className="max-lg:hidden">{name}</span>
          </span>
        ))}
      </div>
      <ol
        className="-ml-px grid min-h-0 flex-1 grid-cols-7"
        style={{ gridTemplateRows: `repeat(${weeks.length}, minmax(0, 1fr))` }}
      >
        {weeks.flat().map((day) => {
          const blocks = monthBlocks.get(day.iso) ?? [];
          const isToday = day.iso === today;
          const more = blocks.length - MAX;
          return (
            <li key={day.iso} className="min-h-0 min-w-0">
              <Link
                href={dayHref(day.iso)}
                aria-label={`${day.day} : ${blocks.length} séance${blocks.length > 1 ? "s" : ""}${
                  blocks.length > 0 ? ` · ${blocks.map((block) => block.title).join(", ")}` : ""
                }`}
                className={`flex h-full min-h-[64px] flex-col gap-0.5 overflow-hidden border-t border-l border-line-soft p-1 transition-colors duration-150 hover:bg-selected-hover lg:p-1.5 ${
                  isToday ? "bg-today-col" : ""
                } ${day.inMonth ? "" : "opacity-45"}`}
              >
                <span
                  className={`grid size-5 shrink-0 place-items-center self-center text-[11px] tabular lg:size-6 lg:self-start lg:text-[12px] ${
                    isToday ? "font-bold text-violet-text" : "font-medium text-text"
                  }`}
                >
                  {day.day}
                </span>
                {/* Ordinateur : les séances écrites. */}
                <span className="hidden min-w-0 flex-col lg:flex">
                  {blocks.slice(0, MAX).map((block) => (
                    <span
                      key={block.key}
                      className="flex h-[18px] min-w-0 items-center gap-1.5 px-1 text-[11px]"
                    >
                      {/* La discipline : une barre fine (16/11/2026 : plus de pastilles) ; une collective
                          porte l'icône « groupe », comme sur téléphone. */}
                      <span
                        className={`h-3 w-[3px] shrink-0 rounded-[1.5px] ${dots[block.discipline ?? "none"]}`}
                      />
                      <span className="text-muted tabular">
                        {block.allDay ? "Journée" : block.label.slice(0, 5)}
                      </span>
                      {block.individual ? null : (
                        <Users
                          aria-hidden
                          size={10}
                          strokeWidth={2.4}
                          className="-mr-0.5 shrink-0 text-muted"
                        />
                      )}
                      <span className="truncate text-text">{shortName(block)}</span>
                    </span>
                  ))}
                  {more > 0 ? (
                    <span className="px-1 text-[11px] text-muted">
                      +{more} autre{more > 1 ? "s" : ""}
                    </span>
                  ) : null}
                </span>
                {/* Téléphone : de petites étiquettes de couleur. */}
                <span className="flex min-w-0 flex-col gap-0.5 lg:hidden">
                  {blocks.slice(0, MAX).map((block) => (
                    <span
                      key={block.key}
                      className={`flex min-w-0 items-center gap-0.5 rounded-[4px] px-1 text-[10px] leading-[15px] font-semibold ${
                        chips[block.discipline ?? "none"]
                      }`}
                    >
                      {block.individual ? null : (
                        <Users aria-hidden size={9} strokeWidth={2.4} className="shrink-0" />
                      )}
                      <span className="truncate">{shortName(block)}</span>
                    </span>
                  ))}
                  {more > 0 ? <span className="px-0.5 text-[10px] text-muted">+{more}</span> : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

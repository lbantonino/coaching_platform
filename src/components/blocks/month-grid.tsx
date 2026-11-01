import Link from "next/link";

import type { Discipline } from "@/domain/training/discipline";
import { monthGrid } from "@/features/agenda/calendar";
import type { WeekBlock } from "@/features/agenda/week";

// Vue Mois de l'agenda (maquette v6, D-77) : grille de 7 colonnes, une case sobre par jour : son
// numéro, le total d'heures de coaching (ordinateur seulement, demande d'Antonino du 01/11) et un point
// par séance dans la couleur de sa discipline (plein pour une individuelle, cerclé pour une
// collective, 26/10).
// Aujourd'hui : case teintée de violet, numéro dans un rond violet. Ordinateur : cases de 96 px de haut,
// pour que la colonne de droite du tableau de bord (calée sur la hauteur de l'agenda) ne soit pas coupée. Un jour ouvre sa journée ; son nom
// lu par un lecteur d'écran dit aussi quelles séances il contient.
const dotClasses: Record<Discipline | "none", string> = {
  running: "bg-run-fill",
  strength: "bg-strength-fill",
  hyrox: "bg-hyrox-fill",
  hybrid: "bg-hybrid-fill",
  none: "bg-muted",
};
const ringClasses: Record<Discipline | "none", string> = {
  running: "border-run-fill",
  strength: "border-strength-fill",
  hyrox: "border-hyrox-fill",
  hybrid: "border-hybrid-fill",
  none: "border-muted",
};

const weekDayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// Durée courte : « 1h30 », « 0h45 », « 6h ».
const hoursLabel = (minutes: number) =>
  `${Math.floor(minutes / 60)}h${minutes % 60 ? String(minutes % 60).padStart(2, "0") : ""}`;

export function MonthGrid({
  month,
  monthBlocks,
  today,
  dayHref,
}: {
  month: string;
  monthBlocks: Map<string, WeekBlock[]>;
  today: string;
  dayHref: (date: string) => string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div aria-hidden className="grid grid-cols-7 text-center text-[11px] text-muted">
        {weekDayNames.map((name) => (
          <span key={name} className="pb-1.5">
            {name}
          </span>
        ))}
      </div>
      <ol className="grid grid-cols-7 gap-1.5">
        {monthGrid(month)
          .flat()
          .map((day) => {
            const blocks = monthBlocks.get(day.iso) ?? [];
            if (!day.inMonth) return <li key={day.iso} aria-hidden />;
            const isToday = day.iso === today;
            const minutes = blocks.reduce((sum, block) => sum + block.end - block.start, 0);
            return (
              <li key={day.iso}>
                <Link
                  href={dayHref(day.iso)}
                  aria-label={`${day.day} : ${blocks.length} séance${blocks.length > 1 ? "s" : ""}${
                    blocks.length > 0 ? ` · ${blocks.map((block) => block.title).join(", ")}` : ""
                  }`}
                  className={`flex min-h-[58px] flex-col gap-1 rounded-lg border p-1.5 lg:min-h-24 transition-colors duration-150 ${
                    isToday
                      ? "border-transparent bg-today-col shadow-[inset_0_0_0_1px_var(--violet-line)]"
                      : "border-line-soft hover:border-line"
                  }`}
                >
                  <span
                    className={`grid size-5 place-items-center rounded-full text-[11px] font-medium tabular ${
                      isToday ? "bg-accent text-on-accent" : "text-text"
                    }`}
                  >
                    {day.day}
                  </span>
                  {blocks.length > 0 ? (
                    <>
                      <span className="hidden text-[11px] text-muted tabular lg:block">
                        {hoursLabel(minutes)}
                      </span>
                      <span className="flex flex-wrap gap-[3px]">
                        {blocks.map((block) => (
                          <span
                            key={block.key}
                            className={`size-[5px] shrink-0 rounded-full ${
                              block.individual
                                ? dotClasses[block.discipline ?? "none"]
                                : `border ${ringClasses[block.discipline ?? "none"]}`
                            }`}
                          />
                        ))}
                      </span>
                    </>
                  ) : null}
                </Link>
              </li>
            );
          })}
      </ol>
    </div>
  );
}

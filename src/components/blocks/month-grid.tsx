import { Users } from "lucide-react";
import Link from "next/link";

import type { Discipline } from "@/domain/training/discipline";
import { monthGrid } from "@/features/agenda/calendar";
import type { WeekBlock } from "@/features/agenda/week";

// Vue Mois de l'agenda (prompt Claude Design §6) : grille 7 colonnes, cases carrées, un point de
// couleur par séance (couleur de la discipline), aujourd'hui en rouge plein. Ordinateur : l'heure et
// le nom des deux premières séances. Un jour ouvre sa journée. Séance collective (26/10) : point creux
// (cerclé) sur téléphone, icône « groupe » sur ordinateur ; individuelle : point plein.
const dotClasses: Record<Discipline | "none", string> = {
  running: "bg-run",
  strength: "bg-strength",
  hyrox: "bg-hyrox",
  hybrid: "bg-hybrid",
  none: "bg-muted",
};
const textClasses: Record<Discipline | "none", string> = {
  running: "text-run",
  strength: "text-strength",
  hyrox: "text-hyrox",
  hybrid: "text-hybrid",
  none: "text-muted",
};

const weekDayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

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
      <div className="grid grid-cols-7 text-center font-mono text-[11px] text-muted uppercase">
        {weekDayNames.map((name) => (
          <span key={name} className="py-1">
            {name}
          </span>
        ))}
      </div>
      <ol className="grid grid-cols-7 gap-1 lg:gap-1.5">
        {monthGrid(month)
          .flat()
          .map((day) => {
            const blocks = monthBlocks.get(day.iso) ?? [];
            if (!day.inMonth) return <li key={day.iso} aria-hidden />;
            const isToday = day.iso === today;
            return (
              <li key={day.iso}>
                <Link
                  href={dayHref(day.iso)}
                  // Le nom dit aussi QUELLES séances (le téléphone n'affiche que des points).
                  aria-label={`${day.day} : ${blocks.length} séance${blocks.length > 1 ? "s" : ""}${
                    blocks.length > 0 ? ` · ${blocks.map((block) => block.title).join(", ")}` : ""
                  }`}
                  className="flex aspect-square flex-col items-center gap-1 rounded-[10px] border border-line p-1 transition-colors duration-150 hover:bg-surface-2 lg:aspect-auto lg:min-h-24 lg:items-stretch lg:p-1.5"
                >
                  <span
                    className={`inline-flex size-7 shrink-0 items-center justify-center self-center rounded-full text-[13px] tabular lg:self-start ${
                      isToday ? "bg-accent font-semibold text-on-accent" : ""
                    }`}
                  >
                    {day.day}
                  </span>
                  <span className="flex flex-wrap justify-center gap-0.5 lg:hidden">
                    {blocks.slice(0, 4).map((block) => (
                      <span
                        key={block.key}
                        className={`size-1.5 rounded-full ${
                          block.individual
                            ? dotClasses[block.discipline ?? "none"]
                            : `border border-current ${textClasses[block.discipline ?? "none"]}`
                        }`}
                      />
                    ))}
                  </span>
                  <span className="hidden min-w-0 flex-col gap-0.5 lg:flex">
                    {blocks.slice(0, 2).map((block) => (
                      <span key={block.key} className="truncate text-[11px] leading-tight">
                        {block.individual ? null : (
                          <Users
                            aria-hidden
                            size={10}
                            strokeWidth={2.4}
                            className={`mr-0.5 inline align-[-1px] ${textClasses[block.discipline ?? "none"]}`}
                          />
                        )}
                        <span className={`font-mono ${textClasses[block.discipline ?? "none"]}`}>
                          {block.label.slice(0, 5)}
                        </span>{" "}
                        {block.title}
                      </span>
                    ))}
                    {blocks.length > 2 ? (
                      <span className="text-[11px] text-muted">+{blocks.length - 2}</span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
      </ol>
    </div>
  );
}

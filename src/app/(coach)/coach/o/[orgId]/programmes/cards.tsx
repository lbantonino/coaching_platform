import { Flag } from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { disciplineLabels, disciplineStyles } from "@/domain/training/discipline";
import { programEnd } from "@/domain/training/program-status";
import type { ProgramListItem } from "@/features/programs/queries";
import type { TemplateCard as TemplateItem } from "@/features/programs/templates";
import { formatDayMonth } from "@/lib/format";

// Cartes de la page Programmes (maquette 01, PRG-01 / 02 / 05 / 06, D-157). Rayon 20, fond de carte ;
// ordinateur 18 px de marge et 12 d'écart, téléphone 16 et 10. Toute la carte ouvre le programme (un
// lien étendu sous le titre) ; « Utiliser » reste un lien à part.

const pillBase =
  "inline-flex h-6 shrink-0 items-center rounded-[12px] px-[9px] text-[11.5px] leading-[normal] font-semibold whitespace-nowrap";

function StatusPill({ program }: { program: ProgramListItem }) {
  switch (program.status) {
    case "draft":
      return (
        <span className={`${pillBase} bg-surface text-text-2 inset-ring inset-ring-ring-strong`}>
          Brouillon
        </span>
      );
    case "upcoming":
      return <span className={`${pillBase} bg-violet-soft text-violet-text`}>À venir</span>;
    case "finished":
      // Non dessiné (PROPOSÉ) : gris, comme une version publiée.
      return <span className={`${pillBase} bg-bg text-muted`}>Terminé</span>;
    default:
      return (
        <span className={`${pillBase} bg-bg text-text`}>
          Publié v{program.publicationNumber ?? 1}
        </span>
      );
  }
}

const stretched =
  "after:absolute after:inset-0 after:rounded-[20px] focus-visible:outline-none after:focus-visible:outline-2 after:focus-visible:outline-offset-2 after:focus-visible:outline-violet";

export function ProgramCard({ program, href }: { program: ProgramListItem; href: string }) {
  const lastDay = programEnd(program.startDate, program.weeksCount);
  const sunday = new Date(`${lastDay}T00:00:00Z`);
  sunday.setUTCDate(sunday.getUTCDate() - 1);
  const period = `${formatDayMonth(program.startDate)} → ${formatDayMonth(sunday.toISOString().slice(0, 10))}`;
  const discipline = program.discipline;
  const progress =
    program.status === "current" && program.currentWeek
      ? program.currentWeek / program.weeksCount
      : program.status === "finished"
        ? 1
        : 0;
  const left =
    program.status === "current" && program.currentWeek
      ? `Semaine ${program.currentWeek} / ${program.weeksCount}`
      : program.status === "upcoming"
        ? `Commence le ${formatDayMonth(program.startDate)}`
        : `${program.weeksCount} semaine${program.weeksCount > 1 ? "s" : ""}`;

  return (
    <article className="relative flex min-w-0 flex-col gap-2.5 rounded-[20px] bg-surface p-4 transition-[scale,box-shadow] duration-150 active:scale-[0.99] lg:gap-3 lg:p-[18px] lg:hover:shadow-lift">
      <div className="flex min-w-0 items-center gap-2.5">
        <Avatar name={program.athleteName} photoPath={program.photoPath} size="stack" />
        <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-text-2">
          {program.athleteName}
        </span>
        <StatusPill program={program} />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="min-w-0 truncate text-[16.5px] leading-[1.25] font-semibold tracking-[-0.01em] text-text">
          <Link href={href} className={stretched}>
            {program.title}
          </Link>
        </h2>
        <p className="flex min-w-0 items-center gap-1.5 text-[12.5px] leading-[normal] text-muted">
          {discipline ? (
            <>
              <span
                aria-hidden
                className={`size-[7px] shrink-0 rounded-full ${disciplineStyles[discipline].dot}`}
              />
              <span className="shrink-0">{disciplineLabels[discipline]}</span>
              <span aria-hidden className="text-faint">
                ·
              </span>
            </>
          ) : null}
          <span className="truncate">{period}</span>
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3 text-[13px] leading-[normal]">
          <span className="truncate font-medium text-text">{left}</span>
          {program.sessionsTotal !== null ? (
            <span className="shrink-0 text-[12.5px] text-muted tabular">
              {program.sessionsTotal} séances
            </span>
          ) : null}
        </div>
        <div
          role="progressbar"
          aria-label="Avancement du programme"
          aria-valuemin={0}
          aria-valuemax={program.weeksCount}
          aria-valuenow={program.status === "current" ? (program.currentWeek ?? 0) : 0}
          className="h-1.5 overflow-hidden rounded-full bg-dlg-divider"
        >
          <span
            className="block h-full rounded-full bg-violet"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>
      {program.goalLine ? (
        <p className="flex min-w-0 items-center gap-2 border-t border-dlg-divider pt-3 text-[12.5px] leading-[normal] text-text-2">
          <Flag aria-hidden size={13} strokeWidth={2} className="shrink-0" />
          <span className="truncate">{program.goalLine}</span>
        </p>
      ) : null}
    </article>
  );
}

export function TemplateCard({
  template,
  href,
  useHref,
}: {
  template: TemplateItem;
  href: string;
  useHref: string;
}) {
  return (
    <article className="relative flex min-w-0 flex-col gap-[9px] rounded-[20px] bg-surface p-4 transition-[scale,box-shadow] duration-150 active:scale-[0.99] lg:px-[18px] lg:hover:shadow-lift">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11.5px] leading-[normal] font-semibold tracking-[0.05em] text-faint uppercase">
          {template.kind === "program" ? "Programme" : "Séance"}
        </span>
        {template.source === "coory" ? (
          <span className={`${pillBase} bg-violet-soft-2 text-violet-text`}>Coory</span>
        ) : (
          <span className={`${pillBase} bg-bg text-text-2`}>Mes modèles</span>
        )}
      </div>
      <h2 className="min-w-0 truncate text-[16.5px] leading-[1.25] font-semibold tracking-[-0.01em] text-text">
        <Link href={href} className={stretched}>
          {template.title}
        </Link>
      </h2>
      <p className="flex min-w-0 items-center gap-1.5 text-[12.5px] leading-[normal] text-muted">
        <span
          aria-hidden
          className={`size-[7px] shrink-0 rounded-full ${disciplineStyles[template.discipline].dot}`}
        />
        <span className="shrink-0">{disciplineLabels[template.discipline]}</span>
        <span aria-hidden className="text-faint">
          ·
        </span>
        <span className="truncate">{template.detail}</span>
      </p>
      {/* Pied : seulement sur ordinateur (la maquette du téléphone n'en a pas). */}
      <div className="mt-[3px] hidden items-center justify-between gap-3 border-t border-dlg-divider pt-3 lg:flex">
        <span className="min-w-0 truncate text-[13px] text-text-2">{template.footer}</span>
        <Link
          href={useHref}
          className="relative z-10 inline-flex h-[30px] shrink-0 items-center rounded-[9px] bg-surface px-3 text-[12.5px] font-semibold text-text inset-ring inset-ring-field-ring transition-[scale,background-color] duration-150 hover:bg-surface-2 active:scale-[0.97]"
        >
          Utiliser
        </Link>
      </div>
    </article>
  );
}

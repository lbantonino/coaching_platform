import { ChevronLeft, ChevronRight, FileDown, FilePlus, Flag, Plus } from "lucide-react";
import Link from "next/link";

import { disciplineStyles } from "@/domain/training/discipline";
import { hyroxDivisionLabels } from "@/domain/training/hyrox-official";
import { weekdayLabels } from "@/domain/training/scheduling";
import type { AthleteProgram, ProgramSessionCard, ProgramWeek } from "@/features/programs/queries";

import { WeekPicker } from "./week-picker";

// Onglet « Programme » de la fiche d'un sportif (maquette 07, TAB-01 à 04, D-157) : le programme
// publié (semaine, séances faites, version, objectif), la semaine choisie avec l'état de chaque
// séance, les autres semaines, « Ouvrir l'éditeur » et « PDF ». Sans programme : « Créer un
// programme » ouvre l'assistant avec ce sportif déjà choisi.
//
// États : « Faite » viendra du retour du sportif (son espace n'existe pas encore) : aucune séance
// n'est marquée faite tant qu'il n'a rien envoyé. « À faire » (la prochaine en violet). Manquée,
// reportée, annulée : non dessinées (DESIGN_AUDIT §5), donc absentes.

const dayMonth = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const dayOnly = new Intl.DateTimeFormat("fr-BE", { day: "numeric", timeZone: "UTC" });
const asDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
const addDays = (iso: string, days: number) => {
  const date = asDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};
const range = (monday: string, sunday: string) =>
  asDate(monday).getUTCMonth() === asDate(sunday).getUTCMonth()
    ? `${dayOnly.format(asDate(monday))} – ${dayMonth.format(asDate(sunday))}`
    : `${dayMonth.format(asDate(monday))} – ${dayMonth.format(asDate(sunday))}`;
const DAY_INDEX = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 } as const;

// « Sam 7 nov. » : le jour d'une séance qui en a un (jours fixes ou rendez-vous du coach).
function sessionDate(week: ProgramWeek, session: ProgramSessionCard): string | null {
  if (session.coachDate) return session.coachDate;
  return session.day ? addDays(week.monday, DAY_INDEX[session.day]) : null;
}
function when(week: ProgramWeek, session: ProgramSessionCard): string | null {
  const date = sessionDate(week, session);
  if (!date) return null;
  const day = session.day ? weekdayLabels[session.day] : "";
  const label = `${day} ${dayMonth.format(asDate(date))}${session.time ? ` · ${session.time}` : ""}`;
  return session.coachDate ? `Avec le coach · ${label}` : label;
}

export function ProgramTab({
  name,
  program,
  requestedWeek,
  today,
  basePath,
  editorHref,
  newHref,
  copyHref,
  draft,
}: {
  name: string;
  program: AthleteProgram | null;
  requestedWeek: number | null;
  today: string;
  // Fiche du sportif (onglets en ?onglet=…).
  basePath: string;
  editorHref: string | null;
  newHref: string;
  copyHref: string | null;
  // Un brouillon pas encore publié (programme jamais publié).
  draft: { title: string; href: string } | null;
}) {
  if (!program)
    return <EmptyProgram name={name} newHref={newHref} copyHref={copyHref} draft={draft} />;

  const current =
    program.weeks.find((week) => week.monday <= today && today <= week.sunday) ?? null;
  const shown =
    program.weeks.find((week) => week.index === requestedWeek) ?? current ?? program.weeks[0];
  if (!shown)
    return <EmptyProgram name={name} newHref={newHref} copyHref={copyHref} draft={draft} />;
  const isCurrent = shown.index === current?.index;
  const past = shown.sunday < today;
  // Prochaine séance de la semaine en cours : la première dont le jour n'est pas passé (sans jour :
  // la première dans l'ordre).
  const next = isCurrent
    ? (shown.sessions.find((session) => {
        const date = sessionDate(shown, session);
        return date === null || date >= today;
      }) ?? null)
    : null;
  const total = program.weeks.reduce((sum, week) => sum + week.sessions.length, 0);
  const weekHref = (index: number) => `${basePath}?onglet=programme&semaine=${index}`;
  const hrefFor = Object.fromEntries(
    program.weeks.map((week) => [week.index, weekHref(week.index)]),
  );
  const last = program.weeks[program.weeks.length - 1];
  const dot = program.discipline ? disciplineStyles[program.discipline].dot : "bg-violet";
  const ofName = /^[aeiouyéèêàâîïôûh]/i.test(name) ? `d'${name}` : `de ${name}`;
  const others = program.weeks.filter((week) => week.index !== shown.index);
  const nearby = others.filter((week) => Math.abs(week.index - shown.index) <= 2).slice(0, 3);
  const weekState = (week: ProgramWeek) =>
    week.sunday < today ? "Passée" : week.monday <= today ? "En cours" : "À venir";

  const programCard = (
    <section className="flex flex-col gap-4 rounded-[20px] bg-surface p-4 lg:gap-4 lg:p-5">
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-[17px] font-semibold text-text">
          <span aria-hidden className={`size-2 shrink-0 rounded-full ${dot}`} />
          {program.title}
        </h2>
        <p className="text-[13px] text-muted">
          {dayMonth.format(asDate(program.startDate))} →{" "}
          {dayMonth.format(asDate(last?.sunday ?? program.startDate))}
          <span className="max-lg:hidden"> · {program.weeksCount} semaines</span> · Publié v
          {program.publicationNumber}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
        <div className="flex flex-col gap-2">
          <p className="flex justify-between text-[13px] font-medium">
            <span className="text-muted">Semaine</span>
            <span className="font-semibold text-text">
              {current ? current.index : shown.index} / {program.weeksCount}
            </span>
          </p>
          <div aria-hidden className="flex gap-[3px]">
            {program.weeks.map((week) => (
              <span
                key={week.index}
                className={`h-2 flex-1 rounded-[3px] ${
                  week.sunday < today
                    ? "bg-cta"
                    : week.index === current?.index
                      ? "bg-violet"
                      : "bg-chip"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="flex justify-between text-[13px] font-medium">
            <span className="text-muted">
              <span className="lg:hidden">Faites</span>
              <span className="max-lg:hidden">Séances faites</span>
            </span>
            <span className="font-semibold text-text">0 / {total}</span>
          </p>
          <div aria-hidden className="h-2 overflow-hidden rounded-[4px] bg-chip" />
        </div>
      </div>
      {program.race ? (
        <p className="flex items-center gap-2.5 rounded-[12px] text-[13px] leading-[1.4] text-text-2 lg:bg-surface-2 lg:px-3 lg:py-2.5">
          <Flag aria-hidden size={15} strokeWidth={1.8} className="shrink-0 max-lg:hidden" />
          <span>
            <strong className="font-semibold text-text">
              {program.race.name}
              {program.race.date ? ` · ${dayMonth.format(asDate(program.race.date))}` : ""}
            </strong>
            {program.race.division ? ` · ${hyroxDivisionLabels[program.race.division]}` : ""}
          </span>
        </p>
      ) : null}
      <div className="flex gap-2">
        {editorHref ? (
          <Link
            href={editorHref}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-[13px] bg-cta px-4 text-[15px] font-semibold text-on-cta transition-[scale,background-color] duration-150 hover:bg-cta-hover active:scale-[0.98] lg:h-[42px] lg:rounded-[11px] lg:text-[14px]"
          >
            Ouvrir l&apos;éditeur
          </Link>
        ) : null}
        <button
          type="button"
          disabled
          title="Les PDF arrivent avec la phase 5."
          className="inline-flex h-12 items-center gap-1.5 rounded-[13px] px-4 text-[15px] font-semibold text-faint inset-ring inset-ring-field-ring lg:h-[42px] lg:rounded-[11px] lg:px-3.5 lg:text-[13.5px]"
        >
          <FileDown aria-hidden size={14} strokeWidth={2} className="max-lg:hidden" />
          PDF
        </button>
      </div>
    </section>
  );

  const navigator = (
    <div className="relative flex items-center gap-1.5">
      <Link
        href={weekHref(Math.max(1, shown.index - 1))}
        scroll={false}
        aria-label="Semaine précédente"
        aria-disabled={shown.index <= 1}
        className={`grid size-11 shrink-0 place-items-center rounded-[13px] bg-surface inset-ring inset-ring-field-ring lg:size-9 lg:rounded-[10px] ${shown.index <= 1 ? "pointer-events-none text-dlg-disabled" : "text-text"}`}
      >
        <ChevronLeft aria-hidden size={16} strokeWidth={2} />
      </Link>
      <div className="flex-1 lg:flex-none [&_button]:w-full [&_button]:justify-center lg:[&_button]:h-9 lg:[&_button]:w-auto">
        <WeekPicker
          shown={shown.index}
          current={current?.index ?? null}
          count={program.weeksCount}
          ofName={ofName}
          hrefFor={hrefFor}
        />
      </div>
      <Link
        href={weekHref(Math.min(program.weeksCount, shown.index + 1))}
        scroll={false}
        aria-label="Semaine suivante"
        aria-disabled={shown.index >= program.weeksCount}
        className={`grid size-11 shrink-0 place-items-center rounded-[13px] bg-surface inset-ring inset-ring-field-ring lg:size-9 lg:rounded-[10px] ${shown.index >= program.weeksCount ? "pointer-events-none text-dlg-disabled" : "text-text"}`}
      >
        <ChevronRight aria-hidden size={16} strokeWidth={2} />
      </Link>
    </div>
  );

  const meta = [range(shown.monday, shown.sunday), shown.label, shown.light ? "allégée" : null]
    .filter(Boolean)
    .join(" · ");

  const sessions = (
    <ol className="m-0 flex list-none flex-col gap-2 p-0">
      {shown.sessions.length === 0 ? (
        <li className="rounded-[15px] bg-surface-2 px-4 py-6 text-center text-[13.5px] text-muted">
          Aucune séance cette semaine.
        </li>
      ) : null}
      {shown.sessions.map((session, index) => {
        const isNext = session.id === next?.id;
        const date = when(shown, session);
        return (
          <li key={session.id}>
            <Link
              href={`${basePath}/programme/${session.id}`}
              className={`flex items-start gap-3 rounded-[15px] bg-surface px-3.5 py-3 transition-[box-shadow] duration-150 lg:gap-3.5 lg:px-4 lg:py-3.5 ${
                isNext
                  ? "inset-ring-[1.5px] inset-ring-violet/45"
                  : "inset-ring inset-ring-line hover:inset-ring-field-ring"
              }`}
            >
              <span
                className={`grid size-[30px] shrink-0 place-items-center rounded-full text-[12.5px] font-bold text-text ${
                  isNext
                    ? "inset-ring-[1.5px] inset-ring-violet"
                    : "inset-ring-[1.5px] inset-ring-field-ring"
                }`}
              >
                {index + 1}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="text-[11.5px] font-semibold tracking-[0.05em] text-faint uppercase max-lg:hidden">
                  Séance {index + 1}
                </span>
                <span className="flex min-w-0 items-center gap-2 text-[15px] font-semibold text-text">
                  <span
                    aria-hidden
                    className={`size-2 shrink-0 rounded-full ${disciplineStyles[session.content.discipline ?? "hybrid"].dot}`}
                  />
                  <span className="truncate">{session.content.title}</span>
                </span>
                <span className="text-[13px] text-text-2">{session.headline}</span>
                {date ? <span className="text-[12px] text-muted lg:hidden">{date}</span> : null}
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1.5">
                {past ? null : (
                  <span
                    className={`inline-flex h-[26px] items-center rounded-[13px] px-2.5 text-[12px] font-semibold whitespace-nowrap ${
                      isNext ? "bg-violet-soft text-violet-text" : "bg-bg text-text-2"
                    }`}
                  >
                    À faire
                  </span>
                )}
                {date ? (
                  <span className="text-[12px] whitespace-nowrap text-muted max-lg:hidden">
                    {date}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );

  return (
    <div className="grid w-full items-start gap-3 lg:grid-cols-[minmax(0,1fr)_352px]">
      {/* Téléphone : la carte du programme d'abord (maquette 7b). */}
      <div className="lg:hidden">{programCard}</div>
      <div className="lg:hidden">{navigator}</div>

      <section
        aria-labelledby="program-week-title"
        className={`flex flex-col gap-3.5 rounded-[20px] bg-surface p-3 lg:p-5 ${isCurrent ? "max-lg:inset-ring-[1.5px] max-lg:inset-ring-violet/45" : ""}`}
      >
        <div className="flex items-center justify-between gap-3 max-lg:px-1 max-lg:pt-1">
          <div className="flex min-w-0 flex-col gap-[3px]">
            <h2
              id="program-week-title"
              className="flex items-center gap-2 text-[17px] font-semibold whitespace-nowrap text-text"
            >
              <span className="lg:hidden">
                {isCurrent ? "Semaine en cours" : `Semaine ${shown.index}`}
              </span>
              <span className="max-lg:hidden">Semaine {shown.index}</span>
              {isCurrent ? (
                <span className="inline-flex h-[22px] items-center rounded-[11px] bg-violet-soft px-2 text-[11.5px] font-medium text-violet-text max-lg:hidden">
                  Semaine en cours
                </span>
              ) : null}
            </h2>
            <p className="truncate text-[13px] text-muted max-lg:hidden">
              {meta} · {shown.sessions.length} séance{shown.sessions.length > 1 ? "s" : ""}
            </p>
          </div>
          <span className="text-[12.5px] whitespace-nowrap text-muted lg:hidden">
            {range(shown.monday, shown.sunday)} · 0 / {shown.sessions.length}
          </span>
          <div className="max-lg:hidden">{navigator}</div>
        </div>
        {sessions}
      </section>

      <div className="flex flex-col gap-3">
        <div className="max-lg:hidden">{programCard}</div>
        <section className="flex flex-col rounded-[20px] bg-surface px-3 pt-4 pb-2.5">
          <h3 className="px-2 pb-2 text-[14px] font-semibold text-text">Autres semaines</h3>
          {nearby.map((week) => (
            <Link
              key={week.index}
              href={weekHref(week.index)}
              scroll={false}
              className="flex min-h-11 items-center gap-2.5 border-t border-dlg-divider px-2 transition-colors duration-150 hover:bg-surface-2"
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[13.5px] font-semibold text-text">Semaine {week.index}</span>
                <span className="truncate text-[12px] text-faint">
                  {[range(week.monday, week.sunday), week.light ? "allégée" : null]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              <span className="text-[12.5px] font-medium whitespace-nowrap text-muted">
                {weekState(week)}
              </span>
              <ChevronRight aria-hidden size={15} strokeWidth={2} className="shrink-0 text-faint" />
            </Link>
          ))}
          <Link
            href={`${basePath}?onglet=agenda&vue=toutes`}
            className="flex min-h-10 items-center border-t border-dlg-divider px-2 text-[13px] font-medium text-violet-text hover:underline"
          >
            Voir les {program.weeksCount} semaines
          </Link>
        </section>
      </div>
    </div>
  );
}

function EmptyProgram({
  name,
  newHref,
  copyHref,
  draft,
}: {
  name: string;
  newHref: string;
  copyHref: string | null;
  draft: { title: string; href: string } | null;
}) {
  return (
    <section className="flex w-full flex-col items-center rounded-[20px] bg-surface px-6 py-12 text-center lg:px-10 lg:py-14">
      <span className="grid size-16 place-items-center rounded-[20px] bg-lib-lavender text-violet-text">
        <FilePlus aria-hidden size={24} strokeWidth={1.7} />
      </span>
      <h2 className="mt-5 text-[22px] leading-[1.2] font-bold tracking-[-0.02em] text-text">
        {draft ? `Le programme de ${name} est en brouillon` : `Aucun programme pour ${name}`}
      </h2>
      <p className="mt-2 max-w-[440px] text-[14.5px] leading-[1.6] text-pretty text-muted">
        {draft
          ? `« ${draft.title} » n'est pas encore publié : ${name} ne le voit pas. Termine-le puis publie-le depuis l'éditeur.`
          : "Crée-lui un programme semaine par semaine. Tu pars d'un modèle ou de zéro, et tu le publies quand il est prêt."}
      </p>
      <div className="mt-6 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
        {draft ? (
          <Link
            href={draft.href}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[11px] bg-cta px-[18px] text-[14px] font-semibold whitespace-nowrap text-on-cta transition-[scale,background-color] duration-150 hover:bg-cta-hover active:scale-[0.98]"
          >
            Ouvrir le brouillon
          </Link>
        ) : (
          <Link
            href={newHref}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[11px] bg-cta px-[18px] text-[14px] font-semibold whitespace-nowrap text-on-cta transition-[scale,background-color] duration-150 hover:bg-cta-hover active:scale-[0.98]"
          >
            <Plus aria-hidden size={16} strokeWidth={2.2} />
            Créer un programme
          </Link>
        )}
        {copyHref && !draft ? (
          <Link
            href={copyHref}
            className="inline-flex h-11 items-center justify-center rounded-[11px] px-4 text-[14px] font-semibold whitespace-nowrap text-text inset-ring inset-ring-field-ring transition-colors duration-150 hover:bg-surface-2"
          >
            Copier un programme précédent
          </Link>
        ) : null}
      </div>
      {draft ? null : (
        <p className="mt-[18px] text-[12.5px] text-faint">
          L&apos;assistant s&apos;ouvre avec {name} déjà choisi.
        </p>
      )}
    </section>
  );
}

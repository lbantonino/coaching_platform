import { ChevronLeft, ChevronRight, FilePlus, Flag, Plus } from "lucide-react";
import Link from "next/link";

import { ProgramPdfMenu } from "@/components/programs/program-pdf-menu";

import { disciplineLabels, disciplineStyles } from "@/domain/training/discipline";
import { hyroxDivisionLabels } from "@/domain/training/hyrox-official";
import { weekdayLabels } from "@/domain/training/scheduling";
import { sessionStats } from "@/domain/training/session-view";
import { draftSessionKeys } from "@/features/programs/drafts";
import { sessionEditHref } from "@/features/programs/edit-href";
import type { AthleteProgram, ProgramSessionCard, ProgramWeek } from "@/features/programs/queries";
import { createClient } from "@/lib/supabase/server";

import { ProgramWeekBoard, type BoardSession } from "./program-week-board";
import { WeekPicker } from "./week-picker";

// Onglet « Programme » de la fiche d'un sportif (maquette 07, TAB-01 à 04, D-157 ; revu à la demande
// d'Antonino le 10/11) : la semaine choisie avec l'état de chaque séance ; à droite, la carte du
// programme (épurée : dates, version, objectif, « Ouvrir l'éditeur », « PDF ») et le DÉTAIL de la
// séance choisie, comme dans l'éditeur, avec « Modifier la séance ». Sans programme : « Créer un
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

export async function ProgramTab({
  organizationId,
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
  organizationId: string;
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
  const weekHref = (index: number) => `${basePath}?onglet=programme&semaine=${index}`;
  const hrefFor = Object.fromEntries(
    program.weeks.map((week) => [week.index, weekHref(week.index)]),
  );
  const last = program.weeks[program.weeks.length - 1];
  const dot = program.discipline ? disciplineStyles[program.discipline].dot : "bg-violet";
  const ofName = /^[aeiouyéèêàâîïôûh]/i.test(name) ? `d'${name}` : `de ${name}`;

  // « Modifier la séance » : directement l'éditeur de la séance si elle est encore dans le brouillon
  // (le brouillon peut avoir changé depuis la publication) ; sinon l'éditeur, sur sa semaine.
  const draftKeys = editorHref
    ? new Set(await draftSessionKeys(await createClient(), organizationId, program.id))
    : new Set<string>();
  const editHref = (session: ProgramSessionCard) =>
    editorHref
      ? sessionEditHref(
          editorHref,
          draftKeys,
          shown.index,
          session.key,
          `${basePath}?onglet=programme&semaine=${shown.index}`,
        )
      : null;

  // Carte du programme, épurée (demandes d'Antonino du 10/11) : le titre, les dates et la version,
  // l'objectif en petit dessous, l'avancement des semaines ; plus de « Séances faites ».
  const programCard = (
    <section className="flex flex-col gap-4 rounded-[20px] bg-surface p-4 lg:p-5">
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-[17px] font-semibold text-text">
          <span aria-hidden className={`size-2 shrink-0 rounded-full ${dot}`} />
          {program.title}
        </h2>
        <p className="text-[13px] text-muted">
          {dayMonth.format(asDate(program.startDate))} →{" "}
          {dayMonth.format(asDate(last?.sunday ?? program.startDate))} · {program.weeksCount}{" "}
          semaines · Publié v{program.publicationNumber}
        </p>
        {program.race ? (
          <p className="flex items-center gap-1.5 text-[12.5px] leading-[1.4] text-text-2">
            <Flag aria-hidden size={13} strokeWidth={1.8} className="shrink-0 text-muted" />
            <span>
              <span className="font-semibold text-text">
                {program.race.name}
                {program.race.date ? ` · ${dayMonth.format(asDate(program.race.date))}` : ""}
              </span>
              {program.race.division ? ` · ${hyroxDivisionLabels[program.race.division]}` : ""}
            </span>
          </p>
        ) : null}
      </div>
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
      <div className="flex gap-2">
        {editorHref ? (
          <Link
            href={editorHref}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-[13px] bg-cta px-4 text-[15px] font-semibold text-on-cta transition-[scale,background-color] duration-150 hover:bg-cta-hover active:scale-[0.98] lg:h-[42px] lg:rounded-[11px] lg:text-[14px]"
          >
            Ouvrir l&apos;éditeur
          </Link>
        ) : null}
        {editorHref ? (
          <ProgramPdfMenu
            base={`${editorHref}/pdf`}
            iconSize={14}
            iconClassName="max-lg:hidden"
            className="inline-flex h-12 items-center gap-1.5 rounded-[13px] px-4 text-[15px] font-semibold text-text inset-ring inset-ring-field-ring transition-[scale,background-color] duration-150 hover:bg-surface-2 active:scale-[0.98] lg:h-[42px] lg:rounded-[11px] lg:px-3.5 lg:text-[13.5px]"
          />
        ) : null}
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

  const weekHeader = (
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
  );

  // Le détail de chaque séance (comme le panneau de l'éditeur), version publiée : v2 structurée ou
  // v1 en texte.
  const sessions: BoardSession[] = shown.sessions.map((session, i) => {
    const discipline = session.content.discipline ?? "hybrid";
    return {
      id: session.id,
      index: i + 1,
      title: session.content.title,
      dot: disciplineStyles[discipline].dot,
      headline: session.headline,
      date: when(shown, session),
      isNext: session.id === next?.id,
      editHref: editHref(session),
      detail: {
        discipline,
        title: session.content.title,
        kicker: `${disciplineLabels[discipline]} · Séance ${i + 1}`,
        line: [session.content.sessionType, `Semaine ${shown.index}`].filter(Boolean).join(" · "),
        stats: session.published
          ? sessionStats(session.published)
          : [
              { label: "Durée", value: `≈ ${session.content.durationMinutes} min` },
              { label: "Blocs", value: String(session.content.steps.length) },
            ],
        steps: session.content.steps,
      },
    };
  });

  return (
    <ProgramWeekBoard
      key={shown.index}
      programCard={programCard}
      phoneTop={navigator}
      weekHeader={weekHeader}
      weekRing={isCurrent}
      sessions={sessions}
      initialId={next?.id ?? shown.sessions[0]?.id ?? null}
      showTodo={!past}
    />
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

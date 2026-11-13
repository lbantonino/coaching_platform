import { ChevronLeft, ChevronRight, FilePlus, Flag, Plus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { ProgramPdfMenu } from "@/components/programs/program-pdf-menu";

import { disciplineLabels, disciplineStyles } from "@/domain/training/discipline";
import { hyroxDivisionLabels } from "@/domain/training/hyrox-official";
import { defaultWeekIndex, programStatusLabels } from "@/domain/training/program-status";
import { weekdayLabels } from "@/domain/training/scheduling";
import { sessionMomentLabels } from "@/domain/training/session-v2";
import { sessionStats } from "@/domain/training/session-view";
import { draftSessionKeys } from "@/features/programs/drafts";
import { sessionEditHref } from "@/features/programs/edit-href";
import type {
  AthleteProgram,
  AthleteProgramRow,
  ProgramSessionCard,
  ProgramWeek,
} from "@/features/programs/queries";
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

// « Sam 7 nov. » : le jour d'une séance qui en a un (jours fixes ou rendez-vous RÉEL du coach, lu
// dans l'agenda : revue MVP du 13/11, B3 et B4).
function sessionDate(week: ProgramWeek, session: ProgramSessionCard): string | null {
  if (session.coachDate) return session.coachDate;
  return session.day ? addDays(week.monday, DAY_INDEX[session.day]) : null;
}
function when(week: ProgramWeek, session: ProgramSessionCard): string | null {
  // Le rendez-vous n'existe plus dans l'agenda, ou pas cette semaine-là : on le dit.
  if (session.coach?.status === "deleted") return "Avec le coach · Rendez-vous supprimé";
  if (session.coach?.status === "absent") return "Avec le coach · Pas de rendez-vous cette semaine";
  const date = sessionDate(week, session);
  if (!date) return null;
  const day = session.day ? weekdayLabels[session.day] : "";
  // Plusieurs séances le même jour (D-164) : leur moment (« Sam 7 nov. · Soir »), puis l'heure.
  const moment = session.moment ? ` · ${sessionMomentLabels[session.moment]}` : "";
  const label = `${day} ${dayMonth.format(asDate(date))}${moment}${session.time ? ` · ${session.time}` : ""}`;
  return session.coachDate ? `Avec le coach · ${label}` : label;
}

// Les autres programmes du sportif (revue MVP du 13/11, B7) : brouillons, terminés, archivés, à
// venir ; chacun s'ouvre dans l'éditeur, et la page Programmes les montre tous.
function OtherPrograms({
  rows,
  editorBase,
  returnTo,
  allHref,
}: {
  rows: AthleteProgramRow[];
  editorBase: string;
  returnTo: string;
  allHref: string;
}) {
  if (rows.length === 0) return null;
  return (
    <section
      aria-labelledby="other-programs-title"
      className="flex w-full flex-col gap-2 rounded-[20px] bg-surface p-4 lg:p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="other-programs-title" className="text-[15.5px] font-semibold text-text">
          Autres programmes
        </h2>
        <Link
          href={allHref}
          className="tap-44 text-[13px] font-medium whitespace-nowrap text-violet-text hover:underline"
        >
          Tous ses programmes
        </Link>
      </div>
      <ul className="m-0 flex list-none flex-col p-0">
        {rows.map((row) => (
          <li key={row.id} className="border-t border-line first:border-t-0">
            <Link
              href={`${editorBase}/${row.id}?retour=${encodeURIComponent(returnTo)}`}
              className="flex min-h-12 items-center justify-between gap-3 py-2 transition-colors duration-150 hover:text-violet-text"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[14px] font-medium">{row.title}</span>
                <span className="text-[12.5px] text-muted">
                  {dayMonth.format(asDate(row.startDate))} · {row.weeksCount} semaine
                  {row.weeksCount > 1 ? "s" : ""}
                </span>
              </span>
              <span className="inline-flex h-6 shrink-0 items-center rounded-[12px] bg-bg px-[9px] text-[11.5px] font-semibold text-text-2">
                {programStatusLabels[row.listStatus]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export async function ProgramTab({
  organizationId,
  name,
  program,
  requestedWeek,
  today,
  basePath,
  editorBase,
  newHref,
  copyHref,
  draft,
  others,
  allProgramsHref,
  archived,
}: {
  organizationId: string;
  name: string;
  // Le programme publié en cours ou à venir (un programme terminé n'est plus montré ici : B2).
  program: AthleteProgram | null;
  requestedWeek: number | null;
  today: string;
  // Fiche du sportif (onglets en ?onglet=…).
  basePath: string;
  // « …/programmes » : l'éditeur d'un programme est `${editorBase}/${id}`.
  editorBase: string;
  newHref: string;
  copyHref: string | null;
  // Un brouillon pas encore publié (programme jamais publié).
  draft: { title: string; href: string } | null;
  // Ses autres programmes (B7) et la page Programmes filtrée sur lui.
  others: AthleteProgramRow[];
  allProgramsHref: string;
  // Fiche archivée (B11) : l'assistant ne s'ouvre pas pour elle.
  archived: boolean;
}) {
  const tabHref = `${basePath}?onglet=programme`;
  const otherPrograms = (
    <OtherPrograms
      rows={others.filter((row) => row.id !== program?.id)}
      editorBase={editorBase}
      returnTo={tabHref}
      allHref={allProgramsHref}
    />
  );
  const empty = (
    <div className="flex w-full flex-col gap-3">
      <EmptyProgram
        name={name}
        newHref={newHref}
        copyHref={copyHref}
        draft={draft}
        archived={archived}
      />
      {otherPrograms}
    </div>
  );
  if (!program) return empty;

  const editorHref = `${editorBase}/${program.id}`;
  const current =
    program.weeks.find((week) => week.monday <= today && today <= week.sunday) ?? null;
  // La même semaine par défaut que l'onglet Agenda (B2) : en cours, sinon la 1 (à venir).
  const fallback = defaultWeekIndex(program.startDate, program.weeksCount, today);
  const shown =
    program.weeks.find((week) => week.index === requestedWeek) ??
    program.weeks.find((week) => week.index === fallback) ??
    program.weeks[0];
  if (!shown) return empty;
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
  const draftKeys = new Set(
    await draftSessionKeys(await createClient(), organizationId, program.id),
  );
  const weekTab = `${basePath}?onglet=programme&semaine=${shown.index}`;
  const editHref = (session: ProgramSessionCard) =>
    sessionEditHref(editorHref, draftKeys, shown.index, session.key, weekTab);

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
        {/* Programme à venir (B2) : sa date de début plutôt qu'un avancement. */}
        <p className="flex justify-between text-[13px] font-medium">
          <span className="text-muted">
            {program.timing === "upcoming" ? "À venir" : "Semaine"}
          </span>
          <span className="font-semibold text-text">
            {program.timing === "upcoming"
              ? `commence le ${dayMonth.format(asDate(program.startDate))}`
              : `${current ? current.index : shown.index} / ${program.weeksCount}`}
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
        {/* Le retour de l'éditeur ramène sur cet onglet (B15). */}
        <Link
          href={`${editorHref}?retour=${encodeURIComponent(weekTab)}`}
          className="inline-flex h-12 flex-1 items-center justify-center rounded-[13px] bg-cta px-4 text-[15px] font-semibold text-on-cta transition-[scale,background-color] duration-150 hover:bg-cta-hover active:scale-[0.98] lg:h-[42px] lg:rounded-[11px] lg:text-[14px]"
        >
          Ouvrir l&apos;éditeur
        </Link>
        <ProgramPdfMenu
          base={`${editorHref}/pdf`}
          iconSize={14}
          iconClassName="max-lg:hidden"
          className="inline-flex h-12 items-center gap-1.5 rounded-[13px] px-4 text-[15px] font-semibold text-text inset-ring inset-ring-field-ring transition-[scale,background-color] duration-150 hover:bg-surface-2 active:scale-[0.98] lg:h-[42px] lg:rounded-[11px] lg:px-3.5 lg:text-[13.5px]"
        />
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
      {/* B12 : le nombre de séances (« 0 / 4 » laissait croire à un suivi des séances faites). */}
      <span className="text-[12.5px] whitespace-nowrap text-muted lg:hidden">
        {range(shown.monday, shown.sunday)} · {shown.sessions.length} séance
        {shown.sessions.length > 1 ? "s" : ""}
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
    <div className="flex w-full flex-col gap-3">
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
      {otherPrograms}
    </div>
  );
}

function EmptyProgram({
  name,
  newHref,
  copyHref,
  draft,
  archived,
}: {
  name: string;
  newHref: string;
  copyHref: string | null;
  draft: { title: string; href: string } | null;
  archived: boolean;
}) {
  // Fiche archivée (B11) : pas d'assistant (il ne propose que les sportifs actifs).
  if (archived && !draft) {
    return (
      <EmptyCard title={`Aucun programme en cours pour ${name}`}>
        La fiche est archivée : réactive-la (onglet Profil, statut) pour lui créer un programme.
      </EmptyCard>
    );
  }
  return (
    <EmptyCard
      title={
        draft ? `Le programme de ${name} est en brouillon` : `Aucun programme en cours pour ${name}`
      }
      footer={
        draft ? null : (
          <p className="mt-[18px] text-[12.5px] text-faint">
            L&apos;assistant s&apos;ouvre avec {name} déjà choisi.
          </p>
        )
      }
    >
      {draft
        ? `« ${draft.title} » n'est pas encore publié\u00a0: termine-le puis publie-le depuis l'éditeur.`
        : "Crée-lui un programme semaine par semaine. Tu pars d'un modèle, d'un ancien programme ou de zéro, et tu le publies quand il est prêt."}
      <div className="mt-6 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
        {draft ? (
          <Link
            href={draft.href}
            className="inline-flex h-[50px] items-center justify-center sm:h-11 gap-2 rounded-[11px] bg-cta px-[18px] text-[14px] font-semibold whitespace-nowrap text-on-cta transition-[scale,background-color] duration-150 hover:bg-cta-hover active:scale-[0.98]"
          >
            Ouvrir le brouillon
          </Link>
        ) : (
          <Link
            href={newHref}
            className="inline-flex h-[50px] items-center justify-center sm:h-11 gap-2 rounded-[11px] bg-cta px-[18px] text-[14px] font-semibold whitespace-nowrap text-on-cta transition-[scale,background-color] duration-150 hover:bg-cta-hover active:scale-[0.98]"
          >
            <Plus aria-hidden size={16} strokeWidth={2.2} />
            Créer un programme
          </Link>
        )}
        {copyHref && !draft ? (
          <Link
            href={copyHref}
            className="inline-flex h-[50px] items-center justify-center sm:h-11 rounded-[11px] px-4 text-[14px] font-semibold whitespace-nowrap text-text inset-ring inset-ring-field-ring transition-colors duration-150 hover:bg-surface-2"
          >
            Copier un programme précédent
          </Link>
        ) : null}
      </div>
    </EmptyCard>
  );
}

// La carte de l'état vide, son icône, son titre et son texte.
function EmptyCard({
  title,
  children,
  footer = null,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="flex w-full flex-col items-center rounded-[20px] bg-surface px-6 py-12 text-center lg:px-10 lg:py-14">
      <span className="grid size-16 place-items-center rounded-[20px] bg-lib-lavender text-violet-text">
        <FilePlus aria-hidden size={24} strokeWidth={1.7} />
      </span>
      <h2 className="mt-5 text-[22px] leading-[1.2] font-bold tracking-[-0.02em] text-text">
        {title}
      </h2>
      <div className="mt-2 flex max-w-[440px] flex-col items-center text-[14.5px] leading-[1.6] text-pretty text-muted">
        {children}
      </div>
      {footer}
    </section>
  );
}

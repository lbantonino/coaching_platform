"use client";

import {
  ChevronDown,
  ExternalLink,
  FileDown,
  MessageSquareQuote,
  Repeat2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useState, type CSSProperties } from "react";

import { disciplineLabels, disciplineStyles, type Discipline } from "@/domain/training/discipline";
import type { ProgramSessionContent } from "@/domain/training/program-session";

// Séances d'une semaine dans l'agenda du programme (maquette 2c, AGD-01 à 04, D-157) : cartes
// colorées côte à côte (ordinateur) ou l'une sous l'autre (téléphone), avec leurs lignes de détail.
// Un appui déplie la séance : sous la rangée sur ordinateur, en place sur téléphone ; une seule à la
// fois. Le détail : ses blocs, écrits ligne par ligne (jamais de graphique), et le conseil du coach.

export type WeekSessionView = {
  id: string;
  slot: number;
  href: string;
  content: ProgramSessionContent;
  lines: string[];
  // « Mardi 3 » en jours fixes (ou le jour du rendez-vous du coach).
  dayLabel: string | null;
  coach: { label: string | null; today: boolean } | null;
  // « Semaine 2 · 2 nov. – 8 nov. · au jour choisi par Inès ».
  context: string;
};

const discipline = (content: ProgramSessionContent): Discipline => content.discipline ?? "hybrid";

// Une ligne d'un bloc répété : « 4 min @4:55 min/km » -> Effort · 4:55 min/km · 4 min ;
// « 1:45 min de récupération (trot lent) » -> Récupération · Trot lent · 1:45 min.
function repeatRow(line: string): { title: string; sub: string; right: string } {
  const recovery = /^(\S+(?: min| s)?) de (récupération|repos)(?: \((.+)\))?/i.exec(line);
  if (recovery) {
    const note = recovery[3] ?? "";
    return {
      title: /repos/i.test(recovery[2] ?? "") ? "Repos" : "Récupération",
      sub: note ? note.charAt(0).toUpperCase() + note.slice(1) : "",
      right:
        recovery[1]?.includes("min") || recovery[1]?.includes(" s")
          ? (recovery[1] ?? "")
          : `${recovery[1]} min`,
    };
  }
  const effort = /^(\S+ (?:min|s|m|km))\s*@\s*(.+)$/.exec(line);
  if (effort) return { title: "Effort", sub: effort[2] ?? "", right: effort[1] ?? "" };
  return { title: line, sub: "", right: "" };
}

// Une ligne d'exercice : « Back squat · 4 × 6 · 60 kg · repos 2:30 » -> titre + détail + repos.
function exerciseRow(line: string): { title: string; sub: string; right: string } {
  const [title = line, ...rest] = line.split(" · ");
  const rest2 = rest.filter((part) => !part.startsWith("repos "));
  const rest3 = rest.find((part) => part.startsWith("repos "));
  return { title, sub: rest2.join(" · "), right: rest3 ? rest3.replace("repos ", "") : "" };
}

function SessionDetail({
  session,
  count,
  onClose,
}: {
  session: WeekSessionView;
  count: number;
  onClose: () => void;
}) {
  const { content } = session;
  const kind = discipline(content);
  const styles = disciplineStyles[kind];
  return (
    <div className="flex flex-col gap-4 rounded-[18px] bg-surface-2 p-4 lg:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span
            className={`text-[11.5px] font-semibold tracking-[0.05em] uppercase ${styles.text}`}
          >
            {disciplineLabels[kind]} · Séance {session.slot} sur {count}
          </span>
          <h4 className="text-[22px] leading-[1.15] font-bold tracking-[-0.02em] text-text lg:text-[24px]">
            {content.title}
          </h4>
          <p className="text-[13px] text-muted">{session.context}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[13px] whitespace-nowrap text-muted max-lg:hidden">
            {content.steps.length} bloc{content.steps.length > 1 ? "s" : ""} · ≈{" "}
            {content.durationMinutes} min
          </span>
          <button
            type="button"
            disabled
            title="Les PDF arrivent avec la phase 5."
            className="inline-flex h-8 items-center gap-1.5 rounded-[9px] bg-surface px-3 text-[12.5px] font-semibold text-faint inset-ring inset-ring-field-ring max-lg:hidden"
          >
            <FileDown aria-hidden size={13} strokeWidth={2} />
            PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Replier la séance"
            className="grid size-8 place-items-center rounded-[9px] bg-surface text-text inset-ring inset-ring-field-ring max-lg:hidden"
          >
            <ChevronDown aria-hidden size={15} strokeWidth={2} className="rotate-180" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {content.steps.map((step, index) => {
            const nested = step.repeat
              ? step.repeat.lines.map(repeatRow)
              : step.lines.length > 1
                ? step.lines.map(exerciseRow)
                : null;
            return (
              <li
                key={index}
                className={`flex flex-col gap-2.5 rounded-[14px] p-3 lg:p-3.5 ${nested ? styles.tint : "bg-surface"}`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`grid size-[26px] shrink-0 place-items-center rounded-full text-[12px] font-bold ${
                      nested ? styles.number : "text-text inset-ring-[1.5px] inset-ring-field-ring"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[15px] font-semibold text-text">{step.title}</span>
                      {step.repeat ? (
                        <span
                          className={`inline-flex h-7 items-center gap-1.5 rounded-[9px] bg-surface px-2.5 text-[12.5px] font-semibold whitespace-nowrap ${styles.text}`}
                        >
                          <Repeat2 aria-hidden size={13} strokeWidth={2} />
                          Répéter {step.repeat.times} fois
                        </span>
                      ) : nested && step.badge ? (
                        <span
                          className={`inline-flex h-7 items-center rounded-[9px] bg-surface px-2.5 text-[12.5px] font-semibold whitespace-nowrap ${styles.text}`}
                        >
                          {step.badge}
                        </span>
                      ) : step.badge ? (
                        <span className="text-[14px] font-semibold whitespace-nowrap text-text">
                          {step.badge}
                        </span>
                      ) : null}
                    </span>
                    {!nested && step.lines[0] ? (
                      <span className="text-[13px] leading-[1.45] text-muted">
                        {step.lines.join(" · ")}
                      </span>
                    ) : null}
                  </span>
                </div>
                {nested ? (
                  <ul className="m-0 flex list-none flex-col gap-1.5 p-0 lg:pl-[38px]">
                    {nested.map((row, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 rounded-[12px] bg-surface px-3 py-2.5"
                      >
                        <span
                          aria-hidden
                          className={`h-8 w-[3px] shrink-0 rounded-[2px] ${row.title === "Récupération" || row.title === "Repos" ? "bg-dlg-disabled" : styles.dot}`}
                        />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-[14px] font-semibold text-text">
                            {row.title}
                          </span>
                          {row.sub ? (
                            <span className="text-[13px] text-muted">{row.sub}</span>
                          ) : null}
                        </span>
                        {row.right ? (
                          <span className="text-[14px] font-semibold whitespace-nowrap text-text">
                            {row.right}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ol>
        <div className="flex flex-col gap-3">
          {content.coachTips ? (
            <div className="flex items-start gap-3 rounded-[14px] bg-surface p-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-cta text-on-cta">
                <MessageSquareQuote aria-hidden size={15} strokeWidth={2} />
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-[13.5px] font-semibold text-text">Conseil du coach</span>
                <span className="text-[13.5px] leading-[1.5] text-text-2">{content.coachTips}</span>
              </span>
            </div>
          ) : null}
          <Link
            href={session.href}
            className="inline-flex min-h-10 items-center gap-1.5 self-start rounded-[10px] px-1 text-[13px] font-medium text-violet-text hover:underline"
          >
            <ExternalLink aria-hidden size={14} strokeWidth={2} />
            Ouvrir la page de la séance
          </Link>
        </div>
      </div>
    </div>
  );
}

export function WeekSessionCards({
  weekIndex,
  sessions,
}: {
  weekIndex: number;
  sessions: WeekSessionView[];
}) {
  const [open, setOpen] = useState<string | null>(null);
  const openSession = sessions.find((session) => session.id === open) ?? null;
  const toggle = (id: string) => setOpen((current) => (current === id ? null : id));

  return (
    <div className="flex flex-col gap-3">
      <ol
        aria-label={`Séances de la semaine ${weekIndex}`}
        style={{ "--n": sessions.length } as CSSProperties}
        className="m-0 grid list-none grid-cols-1 gap-2 p-0 lg:grid-cols-[repeat(var(--n),minmax(0,1fr))] lg:gap-2.5"
      >
        {sessions.map((session) => {
          const kind = discipline(session.content);
          const styles = disciplineStyles[kind];
          const isOpen = open === session.id;
          return (
            <li key={session.id} className="flex min-w-0 flex-col gap-2">
              <div
                className={`relative flex w-full min-w-0 flex-col gap-2 rounded-[14px] p-4 transition-[box-shadow] duration-150 lg:p-3.5 ${styles.tint} ${
                  isOpen ? "inset-ring-[1.5px] inset-ring-violet lg:shadow-lift" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={`grid size-[26px] shrink-0 place-items-center rounded-full text-[12.5px] font-bold ${styles.number}`}
                  >
                    {session.slot}
                  </span>
                  {session.dayLabel ? (
                    <span className={`text-[12px] font-bold ${styles.text}`}>
                      {session.dayLabel}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => toggle(session.id)}
                    aria-expanded={isOpen}
                    aria-label={`${isOpen ? "Replier" : "Déplier"} la séance ${session.slot} : ${session.content.title}`}
                    className="ml-auto grid size-9 place-items-center rounded-[10px] bg-surface/70 text-text transition-colors duration-150 after:absolute after:inset-0 after:rounded-[inherit] hover:bg-surface lg:size-[26px] lg:rounded-[8px]"
                  >
                    <ChevronDown
                      aria-hidden
                      size={15}
                      strokeWidth={2}
                      className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>
                <span className="text-[15px] leading-[1.3] font-semibold [overflow-wrap:anywhere] text-text lg:text-[14.5px]">
                  {session.content.title}
                </span>
                <span className="-mt-1 text-[12.5px] leading-[1.4] text-text-2">
                  <span className={`font-semibold ${styles.text}`}>{disciplineLabels[kind]}</span> ·{" "}
                  {session.content.sessionType}
                </span>
                {session.lines.length > 0 ? (
                  <span className="flex flex-col gap-0.5 border-t border-line pt-2.5 text-[12px] leading-[1.45] font-medium text-text">
                    {session.lines.map((line, i) => (
                      <span key={i} className="truncate">
                        {line}
                      </span>
                    ))}
                  </span>
                ) : null}
                {session.coach ? (
                  <span
                    className={`flex items-center gap-1.5 pt-1 text-[12px] leading-[1.4] font-medium lg:mt-auto ${
                      session.coach.today ? "text-violet-text" : "text-text"
                    }`}
                  >
                    <UserRound aria-hidden size={13} strokeWidth={2} className="shrink-0" />
                    {/* « Avec le coach » sur téléphone, « Coach » sur ordinateur (maquettes 2c). */}
                    <span className="min-w-0">
                      <span className="lg:hidden">Avec le </span>
                      <span className="lg:capitalize">coach</span>
                      {session.coach.label ? ` · ${session.coach.label}` : ""}
                    </span>
                  </span>
                ) : null}
              </div>
              {/* Téléphone : le détail se déplie en place. */}
              {isOpen ? (
                <div className="lg:hidden">
                  <SessionDetail
                    session={session}
                    count={sessions.length}
                    onClose={() => setOpen(null)}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
      {/* Ordinateur : le détail sous la rangée. */}
      {openSession ? (
        <div className="max-lg:hidden">
          <SessionDetail
            session={openSession}
            count={sessions.length}
            onClose={() => setOpen(null)}
          />
        </div>
      ) : null}
    </div>
  );
}

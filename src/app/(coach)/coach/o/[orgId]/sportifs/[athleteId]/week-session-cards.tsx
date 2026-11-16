"use client";

import { ChevronDown, MessageSquareQuote, Pencil, UserRound } from "lucide-react";
import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import { disciplineLabels, disciplineStyles, type Discipline } from "@/domain/training/discipline";
import { ProgramPdfMenu } from "@/components/programs/program-pdf-menu";
import { SessionCardsView } from "@/components/programs/session-cards";
import { SessionLine } from "@/components/programs/session-line";
import type { SessionCard } from "@/domain/training/session-cards";
import type { CardLine } from "@/domain/training/card-lines";
import type { ProgramSessionContent } from "@/domain/training/program-session";

// Séances d'une semaine dans l'agenda du programme (maquette 2c, AGD-01 à 04, D-157) : cartes
// colorées côte à côte (ordinateur) ou l'une sous l'autre (téléphone), avec leurs lignes de détail.
// Un appui déplie la séance : sous la rangée sur ordinateur, en place sur téléphone ; une seule à la
// fois. Le détail : ses blocs, écrits ligne par ligne (jamais de graphique), et le conseil du coach.

export type WeekSessionView = {
  id: string;
  slot: number;
  // « Modifier la séance » : son éditeur (edit-href.ts).
  editHref: string;
  content: ProgramSessionContent;
  // Lignes de la carte (card-lines.ts) : une info par ligne, le bloc répété groupé.
  lines: CardLine[];
  // « Mardi 3 » en jours fixes (ou le jour du rendez-vous du coach).
  dayLabel: string | null;
  // « Mer 18 », quand la carte est trop étroite pour « Mercredi 18 ».
  dayShort: string | null;
  // Moment et heure fixée (« Soir · 18:00 », revue MVP du 13/11, B9).
  when: string | null;
  // Rendez-vous réel du coach (« Mar 3 · 07:00 », « Rendez-vous supprimé ») et la séance de l'agenda
  // à cette date (B18), null quand elle n'existe plus.
  coach: { label: string; today: boolean; href: string | null } | null;
  // « Semaine 2 · 2 nov. – 8 nov. · au jour choisi par Inès ».
  context: string;
  // Le détail en cartes (session-cards.ts, D-187) : depuis la version publiée structurée, sinon la v1.
  cards: SessionCard[];
};

const discipline = (content: ProgramSessionContent): Discipline => content.discipline ?? "hybrid";

// Une ligne de carte : le composant commun aux cartes et au détail des séances (session-line.tsx).
function CardItem({ text, discipline }: { text: string; discipline: Discipline }) {
  return <SessionLine text={text} discipline={discipline} />;
}

function SessionDetail({
  session,
  count,
  onClose,
  pdfBase,
  weekIndex,
}: {
  session: WeekSessionView;
  count: number;
  onClose: () => void;
  pdfBase: string;
  weekIndex: number;
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
          {/* Téléphone aussi (revue MVP du 13/11, B14) : 44 px de cible. */}
          <ProgramPdfMenu
            base={pdfBase}
            week={weekIndex}
            className="inline-flex h-11 items-center gap-1.5 rounded-[11px] bg-surface px-3 text-[13px] font-semibold text-text inset-ring inset-ring-field-ring transition-[scale,background-color] duration-150 hover:bg-surface-2 active:scale-[0.97] lg:h-8 lg:rounded-[9px] lg:text-[12.5px]"
          />
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
        {/* La séance en cartes, la même vue que la page du programme (D-187). */}
        <SessionCardsView cards={session.cards} discipline={kind} onTint />
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
          {/* La page d'une séance a été retirée (décision d'Antonino du 10/11) : on modifie la
              séance directement dans son éditeur. */}
          <Link
            href={session.editHref}
            className="inline-flex min-h-10 items-center gap-1.5 self-start rounded-[10px] px-1 text-[13px] font-medium text-violet-text hover:underline"
          >
            <Pencil aria-hidden size={14} strokeWidth={2} />
            Modifier la séance
          </Link>
        </div>
      </div>
    </div>
  );
}

// Une seule séance dépliée à la fois, même dans la vue « Toutes les semaines » (AGD-F02, TC-16) :
// les semaines partagent l'état ; Échap referme.
type OpenState = [string | null, Dispatch<SetStateAction<string | null>>];
const OpenSessionContext = createContext<OpenState | null>(null);

function useEscapeClose(open: string | null, setOpen: OpenState[1], active: boolean) {
  useEffect(() => {
    if (!active || !open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen, active]);
}

export function OpenSessionProvider({ children }: { children: ReactNode }) {
  const state = useState<string | null>(null);
  useEscapeClose(state[0], state[1], true);
  return <OpenSessionContext.Provider value={state}>{children}</OpenSessionContext.Provider>;
}

export function WeekSessionCards({
  weekIndex,
  sessions,
  pdfBase,
}: {
  weekIndex: number;
  sessions: WeekSessionView[];
  pdfBase: string;
}) {
  const shared = useContext(OpenSessionContext);
  const local = useState<string | null>(null);
  const [open, setOpen] = shared ?? local;
  useEscapeClose(open, setOpen, shared === null);
  const openSession = sessions.find((session) => session.id === open) ?? null;
  const toggle = (id: string) => setOpen((current) => (current === id ? null : id));

  return (
    <div className="flex flex-col gap-3">
      {/* 7 colonnes au plus (B10 : une semaine de 14 séances passe à la ligne au lieu de 14 colonnes
          illisibles). */}
      <ol
        aria-label={`Séances de la semaine ${weekIndex}`}
        style={{ "--n": Math.min(sessions.length, 7) } as CSSProperties}
        className="m-0 grid list-none grid-cols-1 gap-2 p-0 lg:grid-cols-[repeat(var(--n),minmax(0,1fr))] lg:gap-2.5"
      >
        {sessions.map((session) => {
          const kind = discipline(session.content);
          const styles = disciplineStyles[kind];
          const isOpen = open === session.id;
          return (
            <li key={session.id} className="flex min-w-0 flex-col gap-2">
              <div
                // Ordinateur : toutes les cartes d'une semaine ont la hauteur de la plus haute (la
                // colonne de la grille s'étire, la carte la remplit ; aucune taille écrite en dur).
                className={`@container relative flex w-full min-w-0 flex-col gap-2 rounded-[14px] p-4 transition-[box-shadow] duration-150 lg:flex-1 lg:p-3.5 ${styles.tint} ${
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
                    // Une seule ligne : « Mercredi 18 » si la carte est assez large (requête de
                    // conteneur), sinon « Mer 18 » (semaine de 7 séances).
                    <span
                      className={`min-w-0 text-[12px] font-bold whitespace-nowrap ${styles.text}`}
                    >
                      <span className="@min-[180px]:hidden">
                        {session.dayShort ?? session.dayLabel}
                      </span>
                      <span className="hidden @min-[180px]:inline">{session.dayLabel}</span>
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
                {session.when ? (
                  <span className={`-mt-1 text-[12px] leading-[1.3] font-semibold ${styles.text}`}>
                    {session.when}
                  </span>
                ) : null}
                <span className="text-[15px] leading-[1.3] font-semibold [overflow-wrap:anywhere] text-text lg:text-[14.5px]">
                  {session.content.title}
                </span>
                <span className="-mt-1 text-[12.5px] leading-[1.4] text-text-2">
                  <span className={`font-semibold ${styles.text}`}>{disciplineLabels[kind]}</span> ·{" "}
                  {session.content.sessionType}
                </span>
                {session.lines.length > 0 ? (
                  // Tout se lit : le texte passe à la ligne au lieu d'être coupé (« … »).
                  <span className="flex flex-col gap-1 border-t border-line pt-2.5 text-[12px] leading-[1.4] font-normal [overflow-wrap:anywhere] text-text lg:text-[11.5px]">
                    {session.lines.map((line, i) =>
                      line.kind === "line" ? (
                        <CardItem key={i} text={line.text} discipline={kind} />
                      ) : (
                        // Bloc répété : « 4 × » puis, derrière un trait, l'effort et la récup qui le
                        // suit, pour lire que la récup fait partie de chaque répétition. Un bloc Hyrox
                        // sans tours (« AMRAP 20 min ») se lit de la même façon, sous son nom.
                        <span key={i} className="flex flex-col gap-0.5">
                          <span className={`text-[11.5px] font-bold ${styles.text}`}>
                            {line.kind === "repeat" ? `${line.times} ×` : line.label}
                          </span>
                          {/* Le trait du bloc, à gauche des lignes répétées (plus de puces depuis
                              D-187 : les lignes sont décalées pour ne pas passer sur le trait). */}
                          <span className="relative flex flex-col gap-0.5 pl-2.5">
                            <span
                              aria-hidden
                              className={`absolute inset-y-0 left-[1.5px] w-0.5 rounded-full opacity-50 ${styles.dot}`}
                            />
                            {line.lines.map((text, j) => (
                              <CardItem key={j} text={text} discipline={kind} />
                            ))}
                          </span>
                        </span>
                      ),
                    )}
                  </span>
                ) : null}
                {session.coach
                  ? (() => {
                      const coachClass = `flex items-center gap-1.5 pt-1 text-[12px] leading-[1.4] font-medium lg:mt-auto ${
                        session.coach.today ? "text-violet-text" : "text-text"
                      }`;
                      const coachText = (
                        <>
                          <UserRound aria-hidden size={13} strokeWidth={2} className="shrink-0" />
                          {/* « Avec le coach » sur téléphone, « Coach » sur ordinateur (maquettes 2c). */}
                          <span className="min-w-0">
                            <span className="lg:hidden">Avec le </span>
                            <span className="lg:capitalize">coach</span> · {session.coach.label}
                          </span>
                        </>
                      );
                      // B18 : la ligne ouvre la séance de l'agenda à cette date ; au-dessus du bouton
                      // qui couvre la carte (z-10).
                      return session.coach.href ? (
                        <Link
                          href={session.coach.href}
                          className={`${coachClass} relative z-10 min-h-8 self-start hover:underline`}
                        >
                          {coachText}
                        </Link>
                      ) : (
                        <span className={coachClass}>{coachText}</span>
                      );
                    })()
                  : null}
              </div>
              {/* Téléphone : le détail se déplie en place. */}
              {isOpen ? (
                <div className="lg:hidden">
                  <SessionDetail
                    session={session}
                    pdfBase={pdfBase}
                    weekIndex={weekIndex}
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
            pdfBase={pdfBase}
            weekIndex={weekIndex}
            count={sessions.length}
            onClose={() => setOpen(null)}
          />
        </div>
      ) : null}
    </div>
  );
}

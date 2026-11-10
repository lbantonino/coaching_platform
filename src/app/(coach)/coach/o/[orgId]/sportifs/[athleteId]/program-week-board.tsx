"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import { useId, useState, type ReactNode } from "react";

import { SessionDetailView, type SessionDetailModel } from "@/components/programs/session-detail";
import { DialogBody, DialogHeader, Overlay } from "@/components/ui/overlay";

// Onglet Programme de la fiche d'un sportif (demande d'Antonino du 10/11) : comme dans l'éditeur de
// programme, un appui sur une séance de la semaine affiche son détail dans la colonne de droite (sous
// la carte du programme) au lieu d'ouvrir une autre page ; sur téléphone, le détail s'ouvre dans une
// feuille du bas. « Modifier la séance » ouvre directement son éditeur.

export type BoardSession = {
  id: string;
  index: number;
  title: string;
  // Classe de la pastille de discipline (bg-run-fill…).
  dot: string;
  headline: string;
  // « Mar 10 nov. », « Avec le coach · Sam 7 nov. · 10:00 ».
  date: string | null;
  isNext: boolean;
  detail: SessionDetailModel;
  editHref: string | null;
};

const editClass =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-[13px] bg-cta px-4 text-[15px] font-semibold text-on-cta transition-[scale,background-color] duration-150 hover:bg-cta-hover active:scale-[0.98] lg:h-[42px] lg:rounded-[11px] lg:text-[14px]";

function EditLink({ href }: { href: string | null }) {
  return href ? (
    <Link href={href} className={editClass}>
      <Pencil aria-hidden size={15} strokeWidth={2} />
      Modifier la séance
    </Link>
  ) : null;
}

export function ProgramWeekBoard({
  programCard,
  phoneTop,
  weekHeader,
  weekRing,
  sessions,
  initialId,
  showTodo,
}: {
  // Carte du programme (colonne de droite sur ordinateur, en haut sur téléphone).
  programCard: ReactNode;
  // Téléphone : sélecteur de semaine sous la carte du programme.
  phoneTop: ReactNode;
  weekHeader: ReactNode;
  weekRing: boolean;
  sessions: BoardSession[];
  // Séance montrée d'abord : la prochaine à faire, sinon la première de la semaine.
  initialId: string | null;
  // « À faire » sur une semaine pas encore passée.
  showTodo: boolean;
}) {
  const [selectedId, setSelectedId] = useState(initialId);
  const [sheet, setSheet] = useState(false);
  const titleId = useId();
  const selected = sessions.find((session) => session.id === selectedId) ?? sessions[0] ?? null;

  const choose = (id: string) => {
    setSelectedId(id);
    // Téléphone : la colonne de droite n'existe pas, le détail s'ouvre en feuille.
    if (!window.matchMedia("(min-width: 1024px)").matches) setSheet(true);
  };

  return (
    <div className="grid w-full items-start gap-3 lg:grid-cols-[minmax(0,1fr)_352px]">
      {/* Téléphone : la carte du programme d'abord (maquette 7b). */}
      <div className="lg:hidden">{programCard}</div>
      <div className="lg:hidden">{phoneTop}</div>

      <section
        aria-labelledby="program-week-title"
        className={`flex flex-col gap-3.5 rounded-[20px] bg-surface p-3 lg:p-5 ${weekRing ? "max-lg:inset-ring-[1.5px] max-lg:inset-ring-violet/45" : ""}`}
      >
        {weekHeader}
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {sessions.length === 0 ? (
            <li className="rounded-[15px] bg-surface-2 px-4 py-6 text-center text-[13.5px] text-muted">
              Aucune séance cette semaine.
            </li>
          ) : null}
          {sessions.map((session) => {
            const active = session.id === selected?.id;
            return (
              <li key={session.id}>
                <button
                  type="button"
                  onClick={() => choose(session.id)}
                  aria-pressed={active}
                  // Ordinateur : la séance affichée à droite est marquée comme la carte choisie de
                  // l'éditeur (anneau violet, ombre) ; téléphone : la prochaine séance seulement.
                  className={`flex w-full items-start gap-3 rounded-[15px] bg-surface px-3.5 py-3 text-left transition-[box-shadow] duration-150 lg:gap-3.5 lg:px-4 lg:py-3.5 ${
                    session.isNext
                      ? "inset-ring-[1.5px] inset-ring-violet/45"
                      : "inset-ring inset-ring-line hover:inset-ring-field-ring"
                  } ${active ? "lg:inset-ring-[1.5px] lg:inset-ring-violet lg:shadow-lift" : ""}`}
                >
                  <span
                    className={`grid size-[30px] shrink-0 place-items-center rounded-full text-[12.5px] font-bold text-text ${
                      session.isNext
                        ? "inset-ring-[1.5px] inset-ring-violet"
                        : "inset-ring-[1.5px] inset-ring-field-ring"
                    }`}
                  >
                    {session.index}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                    <span className="text-[11.5px] font-semibold tracking-[0.05em] text-faint uppercase max-lg:hidden">
                      Séance {session.index}
                    </span>
                    <span className="flex min-w-0 items-center gap-2 text-[15px] font-semibold text-text">
                      <span aria-hidden className={`size-2 shrink-0 rounded-full ${session.dot}`} />
                      <span className="truncate">{session.title}</span>
                    </span>
                    <span className="text-[13px] text-text-2">{session.headline}</span>
                    {session.date ? (
                      <span className="text-[12px] text-muted lg:hidden">{session.date}</span>
                    ) : null}
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1.5">
                    {showTodo ? (
                      <span
                        className={`inline-flex h-[26px] items-center rounded-[13px] px-2.5 text-[12px] font-semibold whitespace-nowrap ${
                          session.isNext ? "bg-violet-soft text-violet-text" : "bg-bg text-text-2"
                        }`}
                      >
                        À faire
                      </span>
                    ) : null}
                    {session.date ? (
                      <span className="text-[12px] whitespace-nowrap text-muted max-lg:hidden">
                        {session.date}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="flex flex-col gap-3 max-lg:hidden">
        {programCard}
        {selected ? (
          <section
            aria-label={`Détail de la séance ${selected.index}`}
            className="flex flex-col gap-4 rounded-[20px] bg-surface p-[18px]"
          >
            <SessionDetailView model={selected.detail} />
            <EditLink href={selected.editHref} />
          </section>
        ) : null}
      </div>

      <Overlay
        open={sheet && selected !== null}
        onClose={() => setSheet(false)}
        labelledBy={titleId}
        size="form"
        tall
      >
        {selected ? (
          <>
            <DialogHeader
              titleId={titleId}
              title={selected.detail.title}
              subtitle={`${selected.detail.kicker} · ${selected.detail.line}`}
              onClose={() => setSheet(false)}
            />
            <DialogBody>
              <div className="flex flex-col gap-4 pb-2">
                <SessionDetailView model={selected.detail} heading={false} />
                <EditLink href={selected.editHref} />
              </div>
            </DialogBody>
          </>
        ) : null}
      </Overlay>
    </div>
  );
}

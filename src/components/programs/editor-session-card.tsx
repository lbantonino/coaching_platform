import { ChevronDown, ChevronUp, GripVertical, User } from "lucide-react";
import type { ReactNode } from "react";

import { disciplineLabels, disciplineStyles, type Discipline } from "@/domain/training/discipline";

// Carte d'une séance dans l'éditeur de programme (maquette 03, EDT-01 à 05, D-156). Mesures exactes :
// - ordinateur : rayon 15, 14 / 12 / 14 / 8 px, écart 12, filet .08 ; poignée (6 points) ; « SÉANCE n »
//   11,5/600 espacé gris clair ; pastille 8 et nom 15/600 ; « Running · Endurance » 12,5 gris ;
//   résumé 12,5/500 (plusieurs infos, chacune sur une ligne, qui passent à la ligne entre elles) ; badge
//   du coach 22 px rayon 11 ; flèches ↑ ↓ de 28 × 24 rayon 7, désactivées en gris très clair ;
// - téléphone : rayon 18, 14 / 10 / 14 / 16 px, écart 10, sans filet ni poignée ni ligne de type ; nom
//   16/600, résumé 13, badge 24 px ; flèches de 44 × 40 (cible tactile).
// Choisie : anneau violet 1,5 px (et une ombre douce sur ordinateur). Lecture seule (modèle Coory) : ni
// poignée ni flèches. Toute la carte choisit la séance (un bouton étendu sous le texte) ; les flèches
// restent des boutons à part.
export type EditorSessionCardProps = {
  index: number;
  title: string;
  discipline: Discipline;
  sessionType: string;
  // Infos écrites, une par élément (« 15 min + 5 × (2 + 2) + 10 min », « ≈ 45 min »).
  summary: string[];
  // « Avec le coach · Sam 7 · 10:00 ».
  coach?: string;
  // Plusieurs séances le même jour (D-164) : « Matin », « Soir »… à côté du numéro.
  moment?: string;
  selected?: boolean;
  readOnly?: boolean;
  onSelect?: () => void;
  // Absent = flèche désactivée (première ou dernière séance).
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  // Contenu ajouté sous le texte de la carte.
  aside?: ReactNode;
  // Jours fixes (03b, FIX-02 / 03) : le pavé du jour à gauche ; ni poignée ni flèches (l'ordre suit
  // les jours). Carte : 9 / 12 / 9 / 9 px sur ordinateur, 10 / 14 / 10 / 10 sur téléphone.
  dayPad?: ReactNode;
  // Poignée qui glisse la carte (ordinateur, EDT-F06) ; sans elle, la poignée est un simple repère.
  handle?: ReactNode;
  // Carte en train d'être glissée : estompée.
  dragging?: boolean;
};

const arrowClass =
  "tap-44 grid h-10 w-11 place-items-center text-text-2 transition-[scale,color,background-color] duration-150 enabled:active:scale-[0.94] disabled:text-dlg-disabled lg:h-6 lg:w-7 lg:rounded-[7px] lg:enabled:hover:bg-surface-2";

export function EditorSessionCard({
  index,
  title,
  discipline,
  sessionType,
  summary,
  coach,
  moment,
  selected = false,
  readOnly = false,
  onSelect,
  onMoveUp,
  onMoveDown,
  aside,
  dayPad,
  handle,
  dragging = false,
}: EditorSessionCardProps) {
  const styles = disciplineStyles[discipline];
  return (
    <div
      className={`relative flex items-center rounded-[18px] bg-surface transition-shadow duration-150 lg:rounded-[15px] ${
        dayPad
          ? "gap-3 py-2.5 pr-3.5 pl-2.5 lg:py-[9px] lg:pr-3 lg:pl-[9px]"
          : "gap-2.5 py-3.5 pr-2.5 pl-4 lg:gap-3 lg:pr-3 lg:pl-2"
      } ${
        selected
          ? "inset-ring-[1.5px] inset-ring-violet/55 lg:shadow-lift"
          : "lg:inset-ring lg:inset-ring-line"
      } ${dragging ? "opacity-60" : ""}`}
    >
      {dayPad ?? null}
      {handle ? (
        <span className="relative z-10 hidden lg:flex">{handle}</span>
      ) : readOnly || dayPad ? null : (
        <GripVertical
          aria-hidden
          size={16}
          strokeWidth={2.2}
          className="hidden shrink-0 text-dlg-disabled lg:block"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
        <span className="flex min-w-0 items-center gap-2">
          <span className="text-[11.5px] leading-[normal] font-semibold tracking-[0.05em] text-faint uppercase">
            Séance {index}
          </span>
          {moment ? (
            <span className="inline-flex h-5 items-center rounded-[6px] bg-surface-2 px-1.5 text-[11.5px] leading-none font-semibold text-text-2">
              {moment}
            </span>
          ) : null}
        </span>
        <span className="flex min-w-0 items-center gap-2">
          <span aria-hidden className={`size-2 shrink-0 rounded-full ${styles.dot}`} />
          {onSelect ? (
            <button
              type="button"
              onClick={onSelect}
              aria-pressed={selected}
              className="min-w-0 truncate text-left text-[16px] leading-[1.25] font-semibold text-text after:absolute after:inset-0 after:rounded-[inherit] focus-visible:outline-none after:focus-visible:outline-2 after:focus-visible:outline-offset-2 after:focus-visible:outline-violet lg:text-[15px]"
            >
              {title}
            </button>
          ) : (
            <span className="min-w-0 truncate text-[16px] leading-[1.25] font-semibold text-text lg:text-[15px]">
              {title}
            </span>
          )}
        </span>
        <span className="hidden truncate text-[12.5px] leading-[normal] text-muted lg:block">
          {disciplineLabels[discipline]} · {sessionType}
        </span>
        {summary.length > 0 ? (
          <span className="flex flex-wrap gap-x-2.5 gap-y-1.5 text-[13px] leading-[1.35] font-medium text-text-2 lg:text-[12.5px]">
            {summary.map((line) => (
              <span key={line} className="max-w-full truncate">
                {line}
              </span>
            ))}
          </span>
        ) : null}
        {coach ? (
          <span className="inline-flex h-6 items-center gap-[5px] self-start rounded-[12px] bg-bg px-[9px] text-[12.5px] leading-[normal] font-medium text-text-2 lg:h-[22px] lg:rounded-[11px] lg:px-2 lg:text-[11.5px]">
            <User aria-hidden size={12} strokeWidth={2} className="shrink-0" />
            <span className="truncate">{coach}</span>
          </span>
        ) : null}
        {aside}
      </div>

      {readOnly || dayPad ? null : (
        <div className="relative z-10 flex shrink-0 flex-col gap-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!onMoveUp}
            aria-label={`Monter la séance ${index}`}
            className={arrowClass}
          >
            <ChevronUp aria-hidden strokeWidth={2} className="size-[17px] lg:size-3.5" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!onMoveDown}
            aria-label={`Descendre la séance ${index}`}
            className={arrowClass}
          >
            <ChevronDown aria-hidden strokeWidth={2} className="size-[17px] lg:size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

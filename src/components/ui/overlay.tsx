"use client";

import { ArrowLeft, Check, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

import {
  SHEET_SPRING,
  easingFor,
  prefersReducedMotion,
  project,
  releaseVelocity,
  rubberband,
  springCurve,
} from "@/lib/motion";

import { buttonClass } from "./button";

// Fenêtres par-dessus la page (prompt Claude Design §4 « Sheet », « ActionMenu », « Dialog »).
// Téléphone : feuille du bas (rayon 22 22 0 0, poignée 40 × 4, 88 % de hauteur max, défile).
// Ordinateur (≥ 768 px) : fenêtre centrée de 560 px, rayon 20. Fond d'écran rgba(3,6,12,.6).
// Base : l'élément natif <dialog> ouvert avec showModal() : focus piégé, aria-modal et touche
// Échap fournis par le navigateur. Fermeture aussi par la croix, « Annuler » et un clic sur le fond.
//
// Mouvement (audit apple-design du 28/10) : la feuille monte du bas et y redescend (même chemin),
// avec un ressort sans rebond ; on peut la glisser vers le bas pour la fermer, par sa poignée ou son
// en-tête : elle suit le doigt 1:1, résiste si on tire vers le haut, et au lâcher elle part (ou
// revient) à la vitesse du doigt, selon l'endroit où l'élan l'aurait menée. Une animation en cours
// se reprend toujours depuis la position affichée. Ordinateur : léger fondu et zoom. « Réduire les
// animations » : simple fondu.

const PHONE = "(max-width: 767.98px)";

// Décalage vertical affiché (px), lu sur l'élément : une animation interrompue repart de là.
function shownOffset(element: HTMLElement): number {
  const transform = getComputedStyle(element).transform;
  return transform && transform !== "none" ? new DOMMatrix(transform).m42 : 0;
}

function Overlay({
  open,
  onClose,
  labelledBy,
  describedBy,
  wide = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  // Grande fenêtre (Paramètres, D-58) : presque tout l'écran du téléphone, 960 px sur ordinateur.
  wide?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const running = useRef<Animation | null>(null);
  // Vitesse du doigt au lâcher (px/s) : la sortie la reprend, sans couture.
  const thrown = useRef(0);
  const drag = useRef<{
    startY: number;
    base: number;
    active: boolean;
    points: { y: number; t: number }[];
  } | null>(null);
  // Un glissé vient de finir : le « clic » qui suit le lâcher n'est pas un clic sur le fond (le doigt,
  // capturé par la fenêtre pendant le glissé, la ferait sinon toujours).
  const justDragged = useRef(false);
  // Copie visuelle en train de sortir (voir `leave`).
  const ghost = useRef<{ sheet: HTMLElement; backdrop: HTMLElement } | null>(null);
  // Le contenu est encore dans la page au moment de fermer (pour en faire la copie), puis disparaît.
  const [rendered, setRendered] = useState(open);
  if (open && !rendered) setRendered(true);

  // Anime un élément de sa position affichée vers `to` (0 = ouverte, sinon px vers le bas), avec la
  // vitesse de départ du doigt.
  const slide = useCallback((element: HTMLElement, to: number, velocity = 0) => {
    const from = shownOffset(element);
    const distance = to - from;
    const curve = springCurve(SHEET_SPRING, distance === 0 ? 0 : velocity / distance);
    return element.animate(
      [{ transform: `translateY(${from}px)` }, { transform: `translateY(${to}px)` }],
      { duration: curve.duration, easing: easingFor(curve), fill: "forwards" },
    );
  }, []);

  const enter = useCallback(
    (dialog: HTMLDialogElement) => {
      const phone = window.matchMedia(PHONE).matches;
      const reduced = prefersReducedMotion();
      // Rouverte pendant sa sortie : elle repart de là où la copie était, sans saut.
      const previous = ghost.current;
      const from = previous ? shownOffset(previous.sheet) : null;
      previous?.sheet.remove();
      previous?.backdrop.remove();
      ghost.current = null;
      if (!dialog.open) dialog.showModal();
      try {
        dialog.animate([{ opacity: previous ? 0.6 : 0 }, { opacity: 1 }], {
          duration: 220,
          easing: "ease-out",
          pseudoElement: "::backdrop",
        });
      } catch {
        // Navigateur sans animation du fond : il apparaît simplement.
      }
      running.current?.cancel();
      let animation: Animation;
      if (phone && !reduced) {
        dialog.style.transform = `translateY(${from ?? dialog.getBoundingClientRect().height}px)`;
        animation = slide(dialog, 0);
      } else {
        const curve = springCurve(SHEET_SPRING);
        animation = dialog.animate(
          reduced
            ? [{ opacity: 0 }, { opacity: 1 }]
            : [
                { opacity: 0, transform: "scale(0.97)" },
                { opacity: 1, transform: "scale(1)" },
              ],
          {
            duration: reduced ? 160 : Math.min(curve.duration, 320),
            easing: reduced ? "ease-out" : easingFor(curve),
          },
        );
      }
      running.current = animation;
      animation.finished.then(
        () => {
          if (running.current !== animation) return;
          animation.cancel();
          running.current = null;
          dialog.style.transform = "";
        },
        () => {},
      );
    },
    [slide],
  );

  // Sortie : la vraie fenêtre se ferme TOUT DE SUITE (le focus revient, la page répond au doigt
  // sans attendre la fin de l'animation : on ne bloque jamais l'interface), et une copie visuelle,
  // inerte et transparente aux appuis, joue la sortie par le même chemin que l'entrée.
  const leave = useCallback(
    (dialog: HTMLDialogElement) => {
      const phone = window.matchMedia(PHONE).matches;
      const reduced = prefersReducedMotion();
      const rect = dialog.getBoundingClientRect();
      const offset = shownOffset(dialog);
      const sheet = document.createElement("div");
      sheet.className = dialog.className;
      sheet.setAttribute("aria-hidden", "true");
      sheet.inert = true;
      // La copie garde la saisie en cours (les champs copiés gardent leur valeur).
      const content = dialog.firstElementChild?.cloneNode(true);
      if (content) sheet.append(content);
      Object.assign(sheet.style, {
        position: "fixed",
        left: `${rect.left}px`,
        top: `${rect.top - offset}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        margin: "0",
        maxHeight: "none",
        overflow: "hidden",
        zIndex: "2147483647",
        pointerEvents: "none",
        transform: `translateY(${offset}px)`,
      });
      const backdrop = document.createElement("div");
      backdrop.setAttribute("aria-hidden", "true");
      Object.assign(backdrop.style, {
        position: "fixed",
        inset: "0",
        background: "rgba(3, 6, 12, 0.6)",
        zIndex: "2147483646",
        pointerEvents: "none",
      });
      const scrollTop = dialog.scrollTop;
      document.body.append(backdrop, sheet);
      sheet.scrollTop = scrollTop;

      running.current?.cancel();
      running.current = null;
      dialog.style.transform = "";
      dialog.close();
      ghost.current = { sheet, backdrop };

      const velocity = thrown.current;
      thrown.current = 0;
      backdrop.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 200,
        easing: "ease-out",
        fill: "forwards",
      });
      const curve = springCurve(SHEET_SPRING);
      const animation =
        phone && !reduced
          ? slide(sheet, rect.height, velocity)
          : sheet.animate(
              reduced
                ? [{ opacity: 1 }, { opacity: 0 }]
                : [
                    { opacity: 1, transform: "scale(1)" },
                    { opacity: 0, transform: "scale(0.97)" },
                  ],
              {
                duration: reduced ? 140 : Math.min(curve.duration, 260),
                easing: reduced ? "ease-out" : easingFor(curve),
                fill: "forwards",
              },
            );
      const cleanup = () => {
        if (ghost.current?.sheet === sheet) ghost.current = null;
        sheet.remove();
        backdrop.remove();
      };
      animation.finished.then(cleanup, cleanup);
    },
    [slide],
  );

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      enter(dialog);
    } else if (dialog.open) {
      leave(dialog);
      // Le contenu de la vraie fenêtre (fermée) peut partir : la copie a pris le relais.
      requestAnimationFrame(() => setRendered(false));
    }
  }, [open, enter, leave]);

  // Copie restante si la page change pendant une sortie.
  useEffect(
    () => () => {
      ghost.current?.sheet.remove();
      ghost.current?.backdrop.remove();
    },
    [],
  );

  // Glisser vers le bas pour fermer (téléphone), depuis la poignée ou un en-tête [data-sheet-grab].
  const onPointerDown = (event: React.PointerEvent<HTMLDialogElement>) => {
    const dialog = ref.current;
    const target = event.target as HTMLElement;
    if (!dialog || !window.matchMedia(PHONE).matches || prefersReducedMotion()) return;
    if (
      !target.closest("[data-sheet-grab]") ||
      target.closest("button, a, input, select, textarea")
    ) {
      return;
    }
    // La feuille en mouvement se rattrape là où elle est.
    const base = shownOffset(dialog);
    running.current?.cancel();
    running.current = null;
    dialog.style.transform = `translateY(${base}px)`;
    dialog.setPointerCapture(event.pointerId);
    drag.current = {
      startY: event.clientY,
      base,
      active: false,
      points: [{ y: event.clientY, t: event.timeStamp }],
    };
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDialogElement>) => {
    const dialog = ref.current;
    const current = drag.current;
    if (!dialog || !current) return;
    const dy = event.clientY - current.startY;
    // Petit seuil avant de partir : un simple appui ne déplace rien.
    if (!current.active && Math.abs(dy) < 6) return;
    current.active = true;
    const raw = current.base + dy;
    const offset = raw < 0 ? rubberband(raw, dialog.getBoundingClientRect().height) : raw;
    dialog.style.transform = `translateY(${offset}px)`;
    current.points.push({ y: event.clientY, t: event.timeStamp });
    if (current.points.length > 8) current.points.shift();
  };
  const onPointerEnd = () => {
    const dialog = ref.current;
    const current = drag.current;
    drag.current = null;
    if (!dialog || !current?.active) return;
    justDragged.current = true;
    setTimeout(() => {
      justDragged.current = false;
    }, 0);
    const velocity = releaseVelocity(current.points);
    const offset = shownOffset(dialog);
    const height = dialog.getBoundingClientRect().height;
    // Là où l'élan mènerait la feuille : au-delà de la moitié, elle se ferme.
    if (offset + project(velocity) > height / 2) {
      thrown.current = Math.max(velocity, 0);
      onClose();
    } else {
      const animation = slide(dialog, 0, velocity);
      running.current = animation;
      animation.finished.then(
        () => {
          if (running.current !== animation) return;
          animation.cancel();
          running.current = null;
          dialog.style.transform = "";
        },
        () => {},
      );
    }
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // Un clic sur le fond (hors du contenu) arrive sur le <dialog> lui-même.
      onClick={(event) => {
        if (justDragged.current) {
          justDragged.current = false;
          return;
        }
        if (event.target === event.currentTarget) onClose();
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      className={`m-0 mt-auto w-full max-w-none overflow-y-auto rounded-t-sheet border border-line-2 bg-bg p-0 text-text backdrop:bg-[rgba(3,6,12,0.6)] md:m-auto md:rounded-card ${
        wide
          ? "h-[94%] max-h-[94%] md:h-[min(86vh,800px)] md:max-h-[86vh] md:max-w-[min(960px,calc(100vw-48px))]"
          : "max-h-[88%] md:max-h-[86vh] md:max-w-[560px]"
      }`}
    >
      {rendered ? (
        <div className="flex flex-col gap-4 px-[18px] pt-[18px] pb-[22px]">
          {/* Poignée : une zone de 44 px de haut à attraper, pas seulement le trait. */}
          <span
            aria-hidden
            data-sheet-grab
            className="-mx-[18px] -mt-[18px] -mb-3 flex h-8 touch-none items-start justify-center pt-2.5 md:hidden"
          >
            <span className="h-1 w-10 rounded-[4px] bg-line-2" />
          </span>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Fermer"
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-control border border-line bg-surface text-text transition-colors duration-150 hover:bg-surface-2"
    >
      <X aria-hidden size={18} strokeWidth={1.8} />
    </button>
  );
}

// Feuille de formulaire : titre 20/600, sous-titre 14 gris, contenu libre, pied (Annuler + action).
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const titleId = useId();
  return (
    <Overlay open={open} onClose={onClose} labelledBy={titleId}>
      <div data-sheet-grab className="flex touch-none items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id={titleId} className="font-display text-[20px] font-semibold tracking-[-0.02em]">
            {title}
          </h2>
          {subtitle ? <p className="text-[14px] text-muted">{subtitle}</p> : null}
        </div>
        <CloseButton onClose={onClose} />
      </div>
      {children}
      {footer ? <div className="flex gap-2.5 [&>*]:flex-1">{footer}</div> : null}
    </Overlay>
  );
}

// Grande fenêtre de travail (Paramètres, D-58, comme les réglages de Claude.ai) : titre, fermer, et
// un contenu libre qui défile (menu des sections compris).
export function PanelDialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const titleId = useId();
  return (
    <Overlay open={open} onClose={onClose} labelledBy={titleId} wide>
      {/* Titre et croix restent en haut pendant qu'on défile (comme les réglages de Claude.ai). */}
      <div
        data-sheet-grab
        className="sticky top-0 z-10 -mx-[18px] flex touch-none items-center justify-between gap-3 bg-bg px-[18px] py-2 md:-mt-[18px] md:pt-[18px] md:pb-3"
      >
        <h2 id={titleId} className="font-display text-[22px] font-semibold tracking-[-0.02em]">
          {title}
        </h2>
        <CloseButton onClose={onClose} />
      </div>
      {children}
    </Overlay>
  );
}

export type ActionMenuItem = {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  destructive?: boolean;
  // Choix en cours (ex. statut du sportif) : coche à droite, annoncé aux lecteurs d'écran.
  selected?: boolean;
};

// Menu « ••• » : lignes de 52 px, icône 19 + libellé 16/500 ; action destructrice en rouge texte.
// `onBack` : sous-menu ouvert depuis un autre menu (ex. « Changer le statut » depuis « ••• ») ;
// une flèche avant le titre ramène au menu de départ.
export function ActionMenu({
  open,
  onClose,
  onBack,
  title,
  items,
}: {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  title: string;
  items: ActionMenuItem[];
}) {
  const titleId = useId();
  return (
    <Overlay open={open} onClose={onClose} labelledBy={titleId}>
      <div data-sheet-grab className="flex touch-none items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Retour"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-control border border-line bg-surface text-text transition-colors duration-150 hover:bg-surface-2"
            >
              <ArrowLeft aria-hidden size={18} strokeWidth={1.8} />
            </button>
          ) : null}
          <h2 id={titleId} className="min-w-0 font-display text-block font-semibold">
            {title}
          </h2>
        </div>
        <CloseButton onClose={onClose} />
      </div>
      <ul className="flex flex-col">
        {items.map((item) => (
          <li key={item.label}>
            <button
              type="button"
              aria-current={item.selected ? "true" : undefined}
              onClick={() => {
                onClose();
                item.onSelect();
              }}
              className={`flex min-h-[52px] w-full items-center gap-3.5 border-t border-line text-left text-[16px] font-medium transition-colors duration-150 hover:bg-surface ${
                item.destructive ? "text-alert" : "text-text"
              }`}
            >
              <item.icon aria-hidden size={19} strokeWidth={1.8} />
              {item.label}
              {item.selected ? (
                <Check
                  aria-hidden
                  size={18}
                  strokeWidth={2.2}
                  className="ml-auto text-accent-text"
                />
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </Overlay>
  );
}

// Confirmation (suppression, publication, suspension, déconnexion globale) : icône « triangle-alert »
// dans un carré rouge doux de 48 px, titre 20/600, texte 15 gris, « Annuler » + action rouge.
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel,
  pending = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  pending?: boolean;
}) {
  const titleId = useId();
  const bodyId = useId();
  return (
    <Overlay open={open} onClose={onClose} labelledBy={titleId} describedBy={bodyId}>
      <div data-sheet-grab className="flex touch-none flex-col gap-2.5">
        <span
          aria-hidden
          className="inline-flex size-12 items-center justify-center rounded-wide bg-alert-soft text-alert"
        >
          <TriangleAlert size={22} strokeWidth={1.8} />
        </span>
        <h2 id={titleId} className="font-display text-[20px] font-semibold tracking-[-0.02em]">
          {title}
        </h2>
        {children ? (
          <p id={bodyId} className="text-[15px] leading-[1.55] text-muted">
            {children}
          </p>
        ) : null}
      </div>
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className={buttonClass({ variant: "outline", className: "flex-1 px-4" })}
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className={buttonClass({ variant: "danger", className: "flex-1" })}
        >
          {confirmLabel}
        </button>
      </div>
    </Overlay>
  );
}

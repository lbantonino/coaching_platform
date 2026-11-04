"use client";

import { ArrowLeft, Check, ChevronRight, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { Fragment, useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

import {
  SHEET_SPRING,
  easingFor,
  prefersReducedMotion,
  project,
  releaseVelocity,
  rubberband,
  springCurve,
} from "@/lib/motion";

import { dlgDangerButtonClass, dlgSecondaryButtonClass } from "./dialog-styles";

// Fenêtres par-dessus la page : fenêtres de saisie, menus d'actions, confirmations, grands panneaux.
// Dessin : kit « Coory Boites » (04/11/2026, coory-design/COORY-MODALS-PIXEL-PERFECT-KIT), au pixel près.
// Téléphone (< 768 px) : feuille du bas, rayon 28 28 0 0, poignée 40 × 5, hauteur max « écran − 44 px ».
// Ordinateur : fenêtre centrée, rayon 24, largeur selon la famille (menu et confirmation 460, saisie
// 600, aperçu 980, paramètres 1000), hauteur max min(720 px, écran − 48 px). Voile rgba(23,21,29,.44)
// et ombre du kit (jetons --dlg-*). Base : l'élément natif <dialog> ouvert avec showModal() : focus
// piégé, aria-modal et touche Échap fournis par le navigateur. Fermeture aussi par la croix,
// « Annuler » et un clic sur le fond.
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

// Largeur sur ordinateur, par famille du kit ; jamais plus large que l'écran moins 48 px.
const WIDTHS = {
  menu: "md:max-w-[min(460px,calc(100vw-48px))]",
  confirm: "md:max-w-[min(460px,calc(100vw-48px))]",
  form: "md:max-w-[min(600px,calc(100vw-48px))]",
  preview: "md:max-w-[min(980px,calc(100vw-48px))] md:h-[min(700px,calc(100vh-48px))]",
  settings: "md:max-w-[min(1000px,calc(100vw-48px))] md:h-[min(700px,calc(100vh-48px))]",
} as const;
export type OverlaySize = keyof typeof WIDTHS;

function Overlay({
  open,
  onClose,
  labelledBy,
  describedBy,
  size = "menu",
  tall = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  size?: OverlaySize;
  // Feuille haute sur téléphone (Nouvelle séance, 03/11) : ouverte à sa hauteur maximale, son contenu
  // défile entre l'en-tête et le pied, fixes.
  tall?: boolean;
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
        display: "flex",
        flexDirection: "column",
        zIndex: "2147483647",
        pointerEvents: "none",
        transform: `translateY(${offset}px)`,
      });
      const backdrop = document.createElement("div");
      backdrop.setAttribute("aria-hidden", "true");
      Object.assign(backdrop.style, {
        position: "fixed",
        inset: "0",
        background: "var(--dlg-scrim)",
        zIndex: "2147483646",
        pointerEvents: "none",
      });
      // Le corps qui défile garde sa position dans la copie.
      const scrolled = [...dialog.querySelectorAll<HTMLElement>("[data-dialog-body], ul")].map(
        (element) => element.scrollTop,
      );
      document.body.append(backdrop, sheet);
      sheet.querySelectorAll<HTMLElement>("[data-dialog-body], ul").forEach((element, index) => {
        element.scrollTop = scrolled[index] ?? 0;
      });

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
      // La fenêtre ne défile pas : en-tête et pied restent fixes, seul le corps défile (kit). En bas
      // du téléphone, la zone du geste d'accueil est laissée libre (safe-area).
      className={`m-0 mt-auto max-h-[calc(100%-44px)] w-full max-w-none overflow-hidden rounded-t-[28px] bg-dlg p-0 pb-[env(safe-area-inset-bottom)] text-text shadow-[var(--dlg-shadow)] backdrop:bg-[var(--dlg-scrim)] open:flex open:flex-col md:m-auto md:max-h-[min(720px,calc(100vh-48px))] md:rounded-[24px] md:pb-0 ${
        WIDTHS[size]
      } ${tall || size === "preview" || size === "settings" ? "max-md:h-[calc(100%-44px)]" : ""}`}
    >
      {rendered ? (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Poignée du téléphone (40 × 5) ; on attrape aussi l'en-tête, juste dessous. */}
          <span
            aria-hidden
            data-sheet-grab
            className="flex shrink-0 touch-none justify-center pt-2.5 pb-0.5 md:hidden"
          >
            <span className="h-[5px] w-10 rounded-[5px] bg-dlg-handle" />
          </span>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}

// Boutons ronds de l'en-tête (retour, fermer) : 38 px gris clair, zone tactile élargie à 44 px.
function HeaderButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative grid size-[38px] shrink-0 place-items-center rounded-full bg-dlg-tile text-text transition-[background-color,scale] duration-150 before:absolute before:-inset-[3px] before:content-[''] hover:bg-dlg-tile-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dlg-accent active:scale-[0.96]"
    >
      {children}
    </button>
  );
}

// En-tête commun (kit, shared-components/modal-header) : retour facultatif, titre 20/700 (21 sur
// téléphone) et sous-titre 14 gris, fermer. On peut glisser la feuille vers le bas en l'attrapant.
export function DialogHeader({
  titleId,
  title,
  subtitle,
  subtitleId,
  onClose,
  onBack,
}: {
  titleId: string;
  title: ReactNode;
  subtitle?: ReactNode;
  subtitleId?: string;
  onClose: () => void;
  onBack?: () => void;
}) {
  return (
    <div
      data-sheet-grab
      className="flex shrink-0 touch-none items-start gap-3 pt-2.5 pr-[18px] pb-2.5 pl-5 md:pt-[22px] md:pr-[22px] md:pl-6"
    >
      {onBack ? (
        <HeaderButton label="Retour" onClick={onBack}>
          <ArrowLeft aria-hidden size={18} strokeWidth={2} />
        </HeaderButton>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-1 pt-1.5">
        <h2
          id={titleId}
          className="text-[21px] leading-[1.2] font-bold tracking-[-0.02em] text-balance md:text-[20px]"
        >
          {title}
        </h2>
        {subtitle ? (
          <p id={subtitleId} className="text-[14px] leading-[1.5] text-pretty text-muted">
            {subtitle}
          </p>
        ) : null}
      </div>
      <HeaderButton label="Fermer" onClick={onClose}>
        <X aria-hidden size={17} strokeWidth={2} />
      </HeaderButton>
    </div>
  );
}

// Corps qui défile entre l'en-tête et le pied ; arrivé en bout, le défilement ne passe pas à la page.
const bodyClass =
  "min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-5 pt-2.5 pb-[22px] md:px-6";

// Pied fixe (kit, shared-components/modal-footer) : filet en haut ; sur ordinateur, à droite,
// « Annuler » puis l'action principale (une action destructrice éventuelle à gauche) ; sur
// téléphone, l'action principale seule, pleine largeur.
export function DialogFooter({
  primary,
  onCancel,
  destructive,
}: {
  primary: ReactNode;
  onCancel?: () => void;
  destructive?: ReactNode;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2.5 border-t border-dlg-divider bg-dlg px-5 pt-3.5 pb-[22px] md:px-6 md:py-3.5 max-md:[&>[data-primary]]:flex-1">
      {destructive ? <div className="max-md:hidden">{destructive}</div> : null}
      {onCancel ? (
        <button
          type="button"
          onClick={onCancel}
          className={`${dlgSecondaryButtonClass} ml-auto max-md:hidden`}
        >
          Annuler
        </button>
      ) : null}
      <div data-primary className={`flex ${onCancel ? "" : "md:ml-auto"} [&>*]:flex-1`}>
        {primary}
      </div>
    </div>
  );
}

// Fenêtre de saisie (kit, famille « formulaire ») : en-tête, corps qui défile, pied fixe facultatif.
// `footer` libre (boutons existants) ; DialogFooter donne la disposition du kit.
export function Sheet({
  open,
  onClose,
  onBack,
  title,
  subtitle,
  footer,
  tall = false,
  size = "form",
  children,
}: {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  // Sur téléphone, ouverte à sa hauteur maximale (Nouvelle séance) même si le contenu est court.
  tall?: boolean;
  size?: OverlaySize;
  children: ReactNode;
}) {
  const titleId = useId();
  const subtitleId = useId();
  return (
    <Overlay
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      describedBy={subtitle ? subtitleId : undefined}
      size={size}
      tall={tall}
    >
      <DialogHeader
        titleId={titleId}
        title={title}
        subtitle={subtitle}
        subtitleId={subtitleId}
        onClose={onClose}
        onBack={onBack}
      />
      <div data-dialog-body className={`${bodyClass} flex flex-col gap-4`}>
        {children}
      </div>
      {footer ? (
        <div className="flex shrink-0 gap-2.5 border-t border-dlg-divider bg-dlg px-5 pt-3.5 pb-[22px] md:px-6 md:py-3.5 [&>*]:flex-1">
          {footer}
        </div>
      ) : null}
    </Overlay>
  );
}

// Grand panneau (Paramètres 1000 px, aperçu d'un document 980 px ; 700 px de haut sur ordinateur) :
// en-tête puis contenu libre qui défile (menu des sections compris).
export function PanelDialog({
  open,
  onClose,
  title,
  size = "settings",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: "settings" | "preview";
  children: ReactNode;
}) {
  const titleId = useId();
  return (
    <Overlay open={open} onClose={onClose} labelledBy={titleId} size={size}>
      <DialogHeader titleId={titleId} title={title} onClose={onClose} />
      <div data-dialog-body className={bodyClass}>
        {children}
      </div>
    </Overlay>
  );
}

export type ActionMenuItem = {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  // Ligne de description sous le libellé (13 px gris, coupée par « … » si trop longue).
  description?: string;
  destructive?: boolean;
  // Choix en cours (ex. statut du sportif) : ligne violet pâle et rond violet coché à droite,
  // annoncé aux lecteurs d'écran.
  selected?: boolean;
  // Mène à un sous-menu : chevron à droite.
  chevron?: boolean;
  // Tuile teintée du kit : verte (« Atteint », « Actif ») ou ambre (« Abandonné », « En pause »).
  tone?: "ok" | "warn";
  // Couleurs propres de la tuile (ex. pastille de statut), à la place du gris du kit.
  tileClassName?: string;
  // Filet avant la ligne (posé tout seul avant une action destructrice qui n'est pas la seule).
  separatorBefore?: boolean;
};

const toneTiles = {
  ok: "bg-dlg-ok-tile text-dlg-ok",
  warn: "bg-dlg-warn-tile text-dlg-warn",
} as const;

// Flèches ↑ / ↓ (et Début / Fin) d'une ligne à l'autre du menu ; Entrée choisit (kit, interactions).
function moveFocus(event: React.KeyboardEvent<HTMLUListElement>) {
  const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
  if (!keys.includes(event.key)) return;
  const rows = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button")];
  if (rows.length === 0) return;
  event.preventDefault();
  const index = rows.indexOf(document.activeElement as HTMLButtonElement);
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? rows.length - 1
        : event.key === "ArrowDown"
          ? (index + 1) % rows.length
          : (index - 1 + rows.length) % rows.length;
  rows[next].focus();
}

// Menu d'actions (kit, famille « menu ») : lignes de 58 px (62 sur téléphone), tuile d'icône 38,
// libellé 15,5/600 et description 13 gris ; action destructrice en rouge (tuile rose), après un filet
// quand d'autres actions la précèdent.
// `onBack` : sous-menu ouvert depuis un autre menu ; la flèche ramène au menu de départ.
export function ActionMenu({
  open,
  onClose,
  onBack,
  title,
  subtitle,
  items,
}: {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  title: string;
  subtitle?: string;
  items: ActionMenuItem[];
}) {
  const titleId = useId();
  const subtitleId = useId();
  return (
    <Overlay
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      describedBy={subtitle ? subtitleId : undefined}
      size="menu"
    >
      <DialogHeader
        titleId={titleId}
        title={title}
        subtitle={subtitle}
        subtitleId={subtitleId}
        onClose={onClose}
        onBack={onBack}
      />
      <ul
        onKeyDown={moveFocus}
        className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain px-2.5 pt-1 pb-5 md:px-3 md:pb-3.5"
      >
        {items.map((item, index) => (
          <Fragment key={item.label}>
            {item.separatorBefore ||
            (item.destructive && index > 0 && !items[index - 1].destructive) ? (
              <li role="separator" className="mx-3 my-1.5 h-px shrink-0 bg-dlg-divider" />
            ) : null}
            <li>
              <button
                type="button"
                aria-current={item.selected ? "true" : undefined}
                onClick={() => {
                  onClose();
                  item.onSelect();
                }}
                className={`flex min-h-[62px] w-full items-center gap-3.5 rounded-[14px] px-3 py-2 text-left transition-[background-color] duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-dlg-accent md:min-h-[58px] ${
                  item.selected ? "bg-dlg-accent-soft" : "hover:bg-dlg-field"
                }`}
              >
                <span
                  aria-hidden
                  className={`grid size-[38px] shrink-0 place-items-center rounded-[11px] ${
                    item.destructive
                      ? "bg-dlg-danger-soft text-dlg-danger-ink"
                      : item.tone
                        ? toneTiles[item.tone]
                        : (item.tileClassName ?? "bg-dlg-tile text-text")
                  }`}
                >
                  <item.icon size={19} strokeWidth={1.8} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span
                    className={`text-[15.5px] leading-[normal] font-semibold ${
                      item.destructive ? "text-dlg-danger-ink" : "text-text"
                    }`}
                  >
                    {item.label}
                  </span>
                  {item.description ? (
                    <span className="truncate text-[13px] leading-[1.4] text-muted">
                      {item.description}
                    </span>
                  ) : null}
                </span>
                {item.selected ? (
                  <span
                    aria-hidden
                    className="grid size-6 shrink-0 place-items-center rounded-full bg-dlg-accent text-white"
                  >
                    <Check size={13} strokeWidth={3} />
                  </span>
                ) : item.chevron ? (
                  <ChevronRight
                    aria-hidden
                    size={18}
                    strokeWidth={2}
                    className="shrink-0 text-dlg-chev"
                  />
                ) : null}
              </button>
            </li>
          </Fragment>
        ))}
      </ul>
    </Overlay>
  );
}

// Confirmation (kit, famille « confirmation », sans en-tête) : tuile rose 52 px avec l'icône
// « triangle-alert » 24, titre 21/700, texte 15 gris, « Annuler » + action rouge côte à côte.
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
    <Overlay
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      describedBy={children ? bodyId : undefined}
      size="confirm"
    >
      <div
        data-sheet-grab
        className="flex min-h-0 flex-1 touch-none flex-col overflow-y-auto overscroll-contain px-5 pt-3.5 pb-[26px] md:p-7"
      >
        <span
          aria-hidden
          className="grid size-[52px] shrink-0 place-items-center rounded-[16px] bg-dlg-danger-soft text-dlg-danger-ink"
        >
          <TriangleAlert size={24} strokeWidth={1.8} />
        </span>
        <h2
          id={titleId}
          className="mt-[18px] text-[21px] leading-[1.25] font-bold tracking-[-0.02em] text-balance"
        >
          {title}
        </h2>
        {children ? (
          <p id={bodyId} className="mt-2 text-[15px] leading-[1.55] text-pretty text-muted">
            {children}
          </p>
        ) : null}
        <div className="mt-[26px] grid grid-cols-2 gap-2.5">
          <button type="button" onClick={onClose} className={dlgSecondaryButtonClass}>
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={dlgDangerButtonClass}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

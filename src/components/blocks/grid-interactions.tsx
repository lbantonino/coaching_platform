"use client";

import { CalendarDays, Repeat } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type ReactNode,
} from "react";

import { ActionMenu } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { dayLabel } from "@/features/agenda/calendar";
import type { MoveSessionInput } from "@/features/sessions/actions";

// Glisser-déposer des séances dans la grille horaire (demande d'Antonino, 23/10, D-35).
// Souris : la séance part dès qu'on la tire de quelques pixels. Doigt : appui long (≈ 0,45 s), petite
// vibration, puis on glisse ; un glissé rapide fait toujours défiler les jours, un appui court ouvre
// toujours la séance. Pendant le glissé, un aperçu montre la nouvelle place au quart d'heure ; près
// des bords, la grille (et la page) défilent. Séance hebdomadaire : on demande « seulement cette date »
// ou « toute la série ». L'action serveur revérifie tout ; la grille se met à jour ensuite.
type Move = (input: MoveSessionInput) => Promise<{ ok: boolean; error?: string }>;

export type DragBlock = {
  sessionId: string;
  originalDate: string;
  date: string;
  start: number;
  end: number;
  title: string;
  recurring: boolean;
  moved: boolean;
};
type Target = { date: string; start: number };
type Drag = { block: DragBlock; grab: number; target: Target | null };

type Ctx = {
  begin: (block: DragBlock, element: HTMLElement, clientY: number) => void;
  update: (clientX: number, clientY: number) => void;
  end: () => void;
  // Bloc en cours de déplacement (glissé ou en enregistrement), et sa nouvelle place.
  active: {
    key: string;
    target: Target | null;
    duration: number;
    title: string;
    saving: boolean;
  } | null;
};

const DragContext = createContext<Ctx | null>(null);

const pad = (value: number) => String(value).padStart(2, "0");
export const toTime = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
const keyOf = (block: { sessionId: string; originalDate: string }) =>
  `${block.sessionId}:${block.originalDate}`;
const weekdayLong = new Intl.DateTimeFormat("fr-BE", { weekday: "long", timeZone: "UTC" });

// Colonne (jour) sous le pointeur et heure visée, arrondie au quart d'heure, sans sortir de la grille.
function targetAt(clientX: number, clientY: number, grab: number, duration: number): Target | null {
  const column = document
    .elementsFromPoint(clientX, clientY)
    .find(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && !!element.dataset.dropDate,
    );
  if (!column) return null;
  const box = column.getBoundingClientRect();
  const first = Number(column.dataset.firstHour);
  const span = Number(column.dataset.span);
  const minutes = ((clientY - grab - box.top) / box.height) * span * 60;
  const start = first * 60 + Math.round(minutes / 15) * 15;
  const latest = Math.min((first + span) * 60, 24 * 60) - duration;
  return { date: column.dataset.dropDate!, start: Math.max(first * 60, Math.min(start, latest)) };
}

export function GridInteractions({ move, children }: { move?: Move; children: ReactNode }) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const [confirm, setConfirm] = useState<{ block: DragBlock; target: Target } | null>(null);
  const [saving, setSaving] = useState<{ block: DragBlock; target: Target } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const dragRef = useRef<Drag | null>(null);
  const pointer = useRef<{ x: number; y: number; scroller: HTMLElement | null } | null>(null);

  const setDragBoth = (next: Drag | null) => {
    dragRef.current = next;
    setDrag(next);
  };

  // Défilement près des bords pendant le glissé : la grille horizontalement (téléphone), la page
  // verticalement (agenda plus haut que l'écran). Boucle d'animation tant qu'une séance est tenue.
  const dragging = drag !== null;
  useEffect(() => {
    if (!dragging) return;
    let id = 0;
    const loop = () => {
      const current = dragRef.current;
      const last = pointer.current;
      if (current && last) {
        const scroller = last.scroller;
        const box = scroller?.getBoundingClientRect();
        // Côté gauche : la colonne des heures (48 px) reste collée, on vise juste après elle.
        const dx = !box ? 0 : last.x < box.left + 72 ? -8 : last.x > box.right - 32 ? 8 : 0;
        // Verticalement : la grille si elle défile dans sa carte (en-tête des jours en haut), sinon
        // la page.
        const inner = Boolean(scroller && box && scroller.scrollHeight > scroller.clientHeight);
        const dy =
          inner && box
            ? last.y < box.top + 72
              ? -8
              : last.y > box.bottom - 32
                ? 8
                : 0
            : last.y < 72
              ? -8
              : last.y > window.innerHeight - 48
                ? 8
                : 0;
        if (scroller && dx) scroller.scrollLeft += dx;
        if (scroller && dy && inner) scroller.scrollTop += dy;
        else if (dy) window.scrollBy(0, dy);
        if (dx || dy) {
          const duration = current.block.end - current.block.start;
          setDragBoth({ ...current, target: targetAt(last.x, last.y, current.grab, duration) });
        }
      }
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [dragging]);

  const perform = (block: DragBlock, target: Target, scope: "single" | "series") => {
    setSaving({ block, target });
    startTransition(async () => {
      const result = await move!({
        sessionId: block.sessionId,
        originalDate: block.originalDate,
        newDate: target.date,
        newTime: toTime(target.start),
        scope,
      });
      toast(
        result.ok ? "Séance déplacée." : (result.error ?? "La séance n'a pas pu être déplacée."),
      );
      router.refresh();
    });
  };

  const ctx: Ctx | null = move
    ? {
        begin: (block, element, clientY) => {
          const grab = clientY - element.getBoundingClientRect().top;
          pointer.current = { x: 0, y: clientY, scroller: element.closest("[data-grid-scroll]") };
          setDragBoth({ block, grab, target: null });
          navigator.vibrate?.(10);
        },
        update: (clientX, clientY) => {
          const current = dragRef.current;
          if (!current) return;
          if (pointer.current) Object.assign(pointer.current, { x: clientX, y: clientY });
          const duration = current.block.end - current.block.start;
          setDragBoth({ ...current, target: targetAt(clientX, clientY, current.grab, duration) });
        },
        end: () => {
          const current = dragRef.current;
          setDragBoth(null);
          if (!current?.target) return;
          const { block, target } = current;
          if (target.date === block.date && target.start === block.start) return;
          if (block.recurring && !block.moved) setConfirm({ block, target });
          else perform(block, target, "single");
        },
        active: drag
          ? {
              key: keyOf(drag.block),
              target: drag.target,
              duration: drag.block.end - drag.block.start,
              title: drag.block.title,
              saving: false,
            }
          : saving && isPending
            ? {
                key: keyOf(saving.block),
                target: saving.target,
                duration: saving.block.end - saving.block.start,
                title: saving.block.title,
                saving: true,
              }
            : confirm
              ? {
                  key: keyOf(confirm.block),
                  target: confirm.target,
                  duration: confirm.block.end - confirm.block.start,
                  title: confirm.block.title,
                  saving: false,
                }
              : null,
      }
    : null;

  return (
    <DragContext.Provider value={ctx}>
      {children}
      {move ? (
        <ActionMenu
          open={confirm !== null}
          onClose={() => setConfirm(null)}
          title={confirm ? `Déplacer « ${confirm.block.title} »` : "Déplacer"}
          items={
            confirm
              ? [
                  {
                    label: `Seulement le ${dayLabel(confirm.block.originalDate)}`,
                    icon: CalendarDays,
                    onSelect: () => perform(confirm.block, confirm.target, "single"),
                  },
                  {
                    label: `Toute la série · chaque ${weekdayLong.format(
                      new Date(`${confirm.target.date}T00:00:00Z`),
                    )} à ${toTime(confirm.target.start)}`,
                    icon: Repeat,
                    onSelect: () => perform(confirm.block, confirm.target, "series"),
                  },
                ]
              : []
          }
        />
      ) : null}
    </DragContext.Provider>
  );
}

// Un glissé est en cours (la couche « ajouter une séance » se fait alors discrète).
export function useDragging(): boolean {
  return Boolean(useContext(DragContext)?.active);
}

// Bloc d'une séance : un lien vers sa page, qu'on peut aussi attraper et déplacer.
export function DraggableBlock({
  block,
  href,
  title,
  style,
  className,
  children,
}: {
  block: DragBlock;
  href: string;
  title: string;
  style: CSSProperties;
  className: string;
  children: ReactNode;
}) {
  const ctx = useContext(DragContext);
  const ref = useRef<HTMLAnchorElement>(null);
  // Un glissé terminé ne doit pas aussi ouvrir la séance.
  const suppressClick = useRef(false);
  // Dernières valeurs pour les écouteurs natifs ci-dessous (installés une fois par bloc).
  const latest = useRef({ ctx, block });
  useEffect(() => {
    latest.current = { ctx, block };
  });
  const enabled = Boolean(ctx);
  const blockKey = keyOf(block);

  // Doigt : écouteurs natifs, car React les rend « passifs » et un glissé doit pouvoir bloquer le
  // défilement (preventDefault) une fois la séance attrapée.
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let origin: { x: number; y: number } | null = null;
    let dragging = false;
    const onStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      origin = { x: touch.clientX, y: touch.clientY };
      suppressClick.current = false;
      timer = setTimeout(() => {
        dragging = true;
        suppressClick.current = true;
        latest.current.ctx?.begin(latest.current.block, element, touch.clientY);
        latest.current.ctx?.update(touch.clientX, touch.clientY);
      }, 450);
    };
    const onMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (dragging) {
        event.preventDefault();
        latest.current.ctx?.update(touch.clientX, touch.clientY);
      } else if (origin && Math.hypot(touch.clientX - origin.x, touch.clientY - origin.y) > 8) {
        clearTimeout(timer);
        origin = null;
      }
    };
    const onEnd = () => {
      clearTimeout(timer);
      origin = null;
      if (dragging) {
        dragging = false;
        latest.current.ctx?.end();
      }
    };
    element.addEventListener("touchstart", onStart, { passive: true });
    element.addEventListener("touchmove", onMove, { passive: false });
    element.addEventListener("touchend", onEnd);
    element.addEventListener("touchcancel", onEnd);
    return () => {
      clearTimeout(timer);
      element.removeEventListener("touchstart", onStart);
      element.removeEventListener("touchmove", onMove);
      element.removeEventListener("touchend", onEnd);
      element.removeEventListener("touchcancel", onEnd);
    };
  }, [enabled, blockKey]);

  const dimmed = ctx?.active?.key === blockKey;
  return (
    <Link
      ref={ref}
      href={href}
      title={title}
      style={style}
      draggable={false}
      onClick={(event) => {
        if (suppressClick.current) {
          event.preventDefault();
          suppressClick.current = false;
        }
      }}
      onContextMenu={(event) => {
        if (suppressClick.current) event.preventDefault();
      }}
      onPointerDown={(event) => {
        if (!ctx || event.pointerType === "touch" || event.button !== 0) return;
        suppressClick.current = false;
        const element = event.currentTarget;
        const origin = { x: event.clientX, y: event.clientY };
        let dragging = false;
        const onMove = (move: PointerEvent) => {
          if (!dragging && Math.hypot(move.clientX - origin.x, move.clientY - origin.y) > 4) {
            dragging = true;
            suppressClick.current = true;
            ctx.begin(block, element, origin.y);
          }
          if (dragging) ctx.update(move.clientX, move.clientY);
        };
        const onUp = () => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          if (dragging) ctx.end();
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
      }}
      className={`${className} select-none [-webkit-touch-callout:none] ${
        ctx ? "cursor-grab active:cursor-grabbing" : ""
      } ${dimmed ? "opacity-35" : ""}`}
    >
      {children}
    </Link>
  );
}

// Aperçu de la nouvelle place dans la colonne visée (tirets, heure de début et de fin).
export function DropPreview({ date, firstHour }: { date: string; firstHour: number }) {
  const ctx = useContext(DragContext);
  const active = ctx?.active;
  if (!active?.target || active.target.date !== date) return null;
  const { start } = active.target;
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-x-[3px] z-20 flex flex-col overflow-hidden rounded-[8px] border-2 border-dashed border-accent bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface))] px-1.5 ${
        active.duration <= 60 ? "justify-center" : "py-0.5"
      }`}
      style={{
        top: `calc(var(--hour) * ${(start - firstHour * 60) / 60})`,
        height: `calc(var(--hour) * ${active.duration / 60} - 3px)`,
      }}
    >
      {/* Séance d'une heure ou moins : une seule ligne, comme les blocs courts de la grille. */}
      {active.duration <= 60 ? (
        <span className="truncate text-[12px] leading-tight">
          <span className="font-mono text-[11px] text-accent-text tabular">{toTime(start)}</span>{" "}
          <span className="font-semibold">{active.title}</span>
          {active.saving ? " · …" : ""}
        </span>
      ) : (
        <>
          <span className="truncate font-mono text-[11px] leading-tight text-accent-text tabular">
            {toTime(start)} – {toTime(start + active.duration)}
            {active.saving ? " · …" : ""}
          </span>
          <span className="truncate text-[12px] leading-tight font-semibold">{active.title}</span>
        </>
      )}
    </span>
  );
}

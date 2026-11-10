"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";

// Changer l'ordre d'une liste par sa poignée (éditeurs de séance 04 à 06) : le doigt ou la souris
// glisse la poignée (Pointer Events, capture du pointeur : le suivi continue hors de la poignée), et
// le clavier déplace d'un cran avec ↑ / ↓. Pas de bibliothèque : une liste verticale courte suffit.
// Le conteneur porte `data-reorder-list` (listProps) et ses lignes `data-reorder-row` (enfants directs) :
// la poignée retrouve sa liste au moment du geste, sans référence lue pendant le rendu.

export type ReorderState = { from: number; to: number } | null;

export function useReorder(onMove: (from: number, to: number) => void) {
  const [drag, setDrag] = useState<ReorderState>(null);

  const targetAt = (handle: HTMLElement, clientY: number, from: number) => {
    const list = handle.closest<HTMLElement>("[data-reorder-list]");
    const rows = [...(list?.querySelectorAll<HTMLElement>(":scope > [data-reorder-row]") ?? [])];
    let to = 0;
    rows.forEach((row, index) => {
      if (index === from) return;
      const rect = row.getBoundingClientRect();
      if (clientY > rect.top + rect.height / 2) to += 1;
    });
    return to;
  };

  const handleProps = (index: number, count: number) => ({
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      setDrag({ from: index, to: index });
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      if (!drag || drag.from !== index) return;
      const to = targetAt(event.currentTarget, event.clientY, index);
      if (to !== drag.to) setDrag({ from: index, to });
    },
    onPointerUp: () => {
      if (drag && drag.from === index && drag.to !== drag.from) onMove(drag.from, drag.to);
      setDrag(null);
    },
    onPointerCancel: () => setDrag(null),
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "ArrowUp" && index > 0) {
        event.preventDefault();
        onMove(index, index - 1);
      } else if (event.key === "ArrowDown" && index < count - 1) {
        event.preventDefault();
        onMove(index, index + 1);
      }
    },
  });

  // Où dessiner le repère violet : au-dessus de la ligne visée (en montant) ou en dessous (en descendant).
  const dropMark = (index: number): "before" | "after" | null => {
    if (!drag || drag.to === drag.from || index === drag.from) return null;
    if (drag.to < drag.from && index === drag.to) return "before";
    if (drag.to > drag.from && index === drag.to) return "after";
    return null;
  };

  const listProps = { "data-reorder-list": "" } as const;
  return { listProps, drag, handleProps, dropMark };
}

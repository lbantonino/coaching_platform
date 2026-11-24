"use client";

import { useEffect, type RefObject } from "react";

// Panneau de droite de l'éditeur de séance (ordinateur) : il défile seul et reste collé en haut quand
// la page défile. Sa hauteur s'arrête toujours à `gap` px du bas de l'écran, où qu'il soit (sous
// l'en-tête au départ, collé en haut ensuite) : son pied « Valider … » est donc toujours visible
// (demande d'Antonino du 24/11/2026). Posée dans `--panel-max-h`, recalculée au défilement (capté
// partout : la page ou un conteneur) et au redimensionnement, une fois par image.
export function useFitToScreen(ref: RefObject<HTMLElement | null>, gap = 12) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let frame = 0;
    const fit = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const top = Math.max(node.getBoundingClientRect().top, gap);
        node.style.setProperty(
          "--panel-max-h",
          `${Math.max(window.innerHeight - top - gap, 240)}px`,
        );
      });
    };
    fit();
    document.addEventListener("scroll", fit, { capture: true, passive: true });
    window.addEventListener("resize", fit);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("scroll", fit, { capture: true });
      window.removeEventListener("resize", fit);
    };
  }, [ref, gap]);
}

"use client";

import { useSyncExternalStore } from "react";

// Vrai sur ordinateur (≥ 1 024 px, la rupture lg de l'app). Pour les rares textes qui changent selon
// l'écran sans pouvoir passer par la CSS (un placeholder, par exemple). Côté serveur et pendant
// l'hydratation : ordinateur, puis la vraie valeur juste après (pas d'écart d'hydratation).
const QUERY = "(min-width: 1024px)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function useWideScreen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => true,
  );
}

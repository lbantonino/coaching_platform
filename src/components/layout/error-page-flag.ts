"use client";

import { useEffect, useSyncExternalStore } from "react";

// Une page d'erreur est-elle affichée DANS la coquille (D-147) ? Le menu de gauche n'y montre alors
// aucune page active (maquette « Coory Erreurs ») : sinon « Bibliothèque » resterait allumé sur un
// exercice introuvable. On compte les pages d'erreur montées (comme le titre de la barre du
// téléphone) : Next peut garder une page quittée, cachée, dans la page.
let mounted = 0;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// Appelé par la page d'erreur : signale sa présence tant qu'elle est affichée.
export function useMarkErrorPage() {
  useEffect(() => {
    mounted += 1;
    notify();
    return () => {
      mounted -= 1;
      notify();
    };
  }, []);
}

// Lu par le menu : vrai pendant une page d'erreur.
export function useOnErrorPage(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => mounted > 0,
    () => false,
  );
}

"use client";

import { createContext, useContext } from "react";

// Fenêtre des Paramètres du coach (D-58) : le menu du compte l'ouvre par-dessus la page en cours,
// sur une section précise (« profil ») ou sur le sommaire (null). Hors de l'espace coach, pas de
// fenêtre : le menu garde ses liens.
export type SettingsSection =
  "profil" | "preferences" | "argent" | "securite" | "donnees" | "legal" | "aide";

export const SettingsContext = createContext<((section: SettingsSection | null) => void) | null>(
  null,
);

export function useOpenSettings() {
  return useContext(SettingsContext);
}

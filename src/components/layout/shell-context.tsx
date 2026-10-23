"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { Space } from "./navigation";

// Ce que la coquille sait de l'espace ouvert : quel espace, l'organisation du coach (pour les
// liens), et la personne connectée (carte du menu). Lu par le menu, la barre du haut et l'en-tête
// de page. Ce n'est PAS une protection : chaque page appelle son garde-fou.
export type ShellUser = {
  name: string;
  role: string;
  photoPath: string | null;
  sex: "female" | "male" | "unspecified" | null;
  // Page « Paramètres » ou profil ; null quand l'espace n'en a pas (administration)
  settingsHref: string | null;
};

export type ShellValue = {
  space: Space;
  orgBase: string | null;
  user: ShellUser | null;
  // Messages reçus non lus (coach, D-36) : pastille rouge sur « Messages » et sur la cloche.
  unreadMessages?: number;
};

const ShellContext = createContext<ShellValue>({ space: "coach", orgBase: null, user: null });

export function ShellProvider({ value, children }: { value: ShellValue; children: ReactNode }) {
  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell() {
  return useContext(ShellContext);
}

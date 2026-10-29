"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

import { iconButtonClass } from "./button";

// Bouton clair / sombre des pages d'accès (connexion, inscription…). Dans l'app, le thème se choisit
// dans les Paramètres (ThemeChoice, avec « Système »).
// Le thème actif est l'attribut data-theme de <html> (posé avant l'affichage par themeInitScript).
// useSyncExternalStore lit cette valeur hors de React ; côté serveur, on suppose « graphite » (défaut
// depuis le 29/10/2026).
// Plusieurs boutons peuvent coexister (barre latérale + en-tête mobile) : ils restent synchronisés.
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Stockage bloqué : le thème change pour cette visite, sans être retenu.
  }
  listeners.forEach((listener) => listener());
}

export function ThemeToggle({ size = "md" }: { size?: "sm" | "md" }) {
  const theme = useSyncExternalStore(subscribe, readTheme, (): Theme => "dark");
  const next: Theme = theme === "light" ? "dark" : "light";
  const label = next === "light" ? "Passer au thème clair" : "Passer au thème sombre";
  const Icon = theme === "light" ? Moon : Sun;
  return (
    <button
      type="button"
      onClick={() => applyTheme(next)}
      aria-label={label}
      title={label}
      className={iconButtonClass({ size })}
    >
      <Icon aria-hidden size={18} strokeWidth={1.7} />
    </button>
  );
}

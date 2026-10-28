"use client";

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useSyncExternalStore } from "react";

import { THEME_STORAGE_KEY, type ThemePreference } from "@/lib/theme";

// Choix du thème (D-38, comme dans Codex et Claude Code) : Clair, Sombre ou Système (celui de
// l'appareil). Dans les Paramètres et dans le menu de la roue dentée. Retenu dans ce navigateur ;
// tous les sélecteurs ouverts restent synchronisés.
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "dark" || stored === "system" ? stored : "light";
  } catch {
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  }
}

export function applyThemePreference(preference: ThemePreference) {
  const dark =
    preference === "dark" ||
    (preference === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  if (dark) document.documentElement.dataset.theme = "dark";
  else delete document.documentElement.dataset.theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Stockage bloqué : le thème change pour cette visite, sans être retenu.
  }
  listeners.forEach((listener) => listener());
}

const options: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
  { value: "system", label: "Système", icon: Monitor },
];

// `compact` : dans le menu du compte (plus petit, choix actif en rouge doux).
export function ThemeChoice({
  name = "theme",
  compact = false,
}: {
  name?: string;
  compact?: boolean;
}) {
  const preference = useSyncExternalStore(
    subscribe,
    readPreference,
    (): ThemePreference => "light",
  );
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">Thème</legend>
      <div className="flex w-full gap-1 rounded-control border border-line bg-surface p-1">
        {options.map(({ value, label, icon: Icon }) => (
          <label
            key={value}
            className="flex-1 cursor-pointer rounded-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent"
          >
            <input
              type="radio"
              name={name}
              value={value}
              checked={preference === value}
              onChange={() => applyThemePreference(value)}
              className="peer sr-only"
            />
            <span
              className={`flex items-center justify-center gap-1.5 rounded-[9px] font-medium whitespace-nowrap text-muted transition-colors duration-150 hover:text-text ${
                compact
                  ? "h-9 px-1.5 text-[13px] peer-checked:bg-accent-soft peer-checked:text-text"
                  : "h-9 px-3 text-[14px] peer-checked:bg-inv peer-checked:text-on-inv"
              }`}
            >
              <Icon aria-hidden size={compact ? 14 : 15} strokeWidth={1.8} />
              {label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

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
    // Graphite par défaut (29/10/2026).
    return stored === "light" || stored === "system" ? stored : "dark";
  } catch {
    return document.documentElement.dataset.theme === "light" ? "light" : "dark";
  }
}

export function applyThemePreference(preference: ThemePreference) {
  const light =
    preference === "light" ||
    (preference === "system" && !matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = light ? "light" : "dark";
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
  look = "page",
}: {
  name?: string;
  compact?: boolean;
  // « dialog » : segments du kit des boîtes (menu du compte, boîte 32).
  // « kit » : Paramètres › Préférences (kit « Coory Pages », page 13, D-127) : trois segments de texte,
  // égaux sur téléphone (46 px), à la largeur du contenu sur ordinateur (42 px).
  look?: "page" | "dialog" | "kit";
}) {
  const preference = useSyncExternalStore(subscribe, readPreference, (): ThemePreference => "dark");
  if (look === "kit") {
    return (
      <fieldset className="min-w-0">
        <legend className="sr-only">Thème</legend>
        <div className="flex h-[46px] gap-0.5 rounded-[12px] bg-dlg-segment p-[3px] md:inline-flex md:h-[42px] md:rounded-[11px]">
          {options.map(({ value, label }) => (
            <label
              key={value}
              className="tap-44 flex flex-1 cursor-pointer items-center justify-center rounded-[9px] text-[14px] leading-[normal] font-medium whitespace-nowrap text-muted transition-[color,background-color,box-shadow] duration-150 hover:text-text has-checked:bg-dlg-segment-active has-checked:text-text has-checked:shadow-[0_1px_3px_rgba(22,18,40,0.12)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent md:flex-none md:rounded-[8px] md:px-[18px] md:text-[13px]"
            >
              <input
                type="radio"
                name={name}
                value={value}
                checked={preference === value}
                onChange={() => applyThemePreference(value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }
  if (look === "dialog") {
    return (
      <fieldset className="mx-3 mb-1.5 min-w-0">
        <legend className="sr-only">Thème</legend>
        <div className="grid grid-cols-3 gap-1 rounded-[13px] bg-dlg-segment p-1">
          {options.map(({ value, label, icon: Icon }) => (
            <label
              key={value}
              className="flex h-[38px] cursor-pointer items-center justify-center gap-[7px] rounded-[10px] text-[13.5px] leading-[normal] font-semibold whitespace-nowrap text-muted transition-[color,background-color,box-shadow] duration-150 has-checked:bg-dlg-segment-active has-checked:text-text has-checked:shadow-[0_1px_3px_rgba(23,21,29,0.12)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-dlg-accent"
            >
              <input
                type="radio"
                name={name}
                value={value}
                checked={preference === value}
                onChange={() => applyThemePreference(value)}
                className="sr-only"
              />
              <Icon aria-hidden size={15} strokeWidth={1.9} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }
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
                  ? "h-9 px-1.5 text-[13px] peer-checked:bg-selected peer-checked:text-text"
                  : "h-9 px-3 text-[14px] peer-checked:bg-selected peer-checked:text-text"
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

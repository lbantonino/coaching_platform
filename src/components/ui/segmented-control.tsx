"use client";

import { useId, type ReactNode } from "react";

import { segmentItemClass, segmentTrackClass, type SegmentedSize } from "./segmented-styles";

export { segmentItemClass, segmentTrackClass, type SegmentedSize };

// Sélecteur segmenté CONTRÔLÉ (maquettes « Programmes » du 09/11/2026, D-156) : le choix agit tout de
// suite (« Allure | Zone de FC », « kg | % du max », « Dans l'ordre | Jours fixes »), contrairement à
// <Segmented>, lu à l'envoi d'un formulaire. Groupe de boutons radio natifs : flèches du clavier,
// lecteurs d'écran et focus fournis par le navigateur.
export type SegmentOption<T extends string> = {
  value: T;
  label: ReactNode;
  // Compteur à droite du libellé (filtres de statut : « Brouillons 2 »).
  count?: number;
  disabled?: boolean;
};

export function SegmentedControl<T extends string>({
  label,
  value,
  onChange,
  options,
  size = "field",
  className = "",
}: {
  // Nom du groupe pour les lecteurs d'écran (« Cible de l'étape »).
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
  size?: SegmentedSize;
  className?: string;
}) {
  const name = useId();
  return (
    <fieldset className={`m-0 min-w-0 border-0 p-0 ${className}`}>
      <legend className="sr-only">{label}</legend>
      <div className={segmentTrackClass(size)}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <label
              key={option.value}
              className={`${segmentItemClass(size, active)} cursor-pointer has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-violet`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={active}
                disabled={option.disabled}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span className="truncate">{option.label}</span>
              {option.count === undefined ? null : (
                <span className="text-[12px] font-medium text-faint tabular">{option.count}</span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

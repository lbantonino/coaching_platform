"use client";

import { useId, type ReactNode } from "react";

// Choix uniques des maquettes « Programmes » (D-156), sur des boutons radio natifs (clavier, lecteurs
// d'écran) dessinés comme la maquette.

// Rond d'un choix : 20 px (22 dans l'assistant). Coché : encre pleine (blanc en sombre) et point clair
// de 7 px (8) ; vide : fond de carte et anneau marqué de 1,5 px.
export function RadioMark({ checked, large = false }: { checked: boolean; large?: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full transition-colors duration-150 ${
        large ? "size-[22px]" : "size-5"
      } ${checked ? "bg-cta" : "bg-surface inset-ring-[1.5px] inset-ring-ring-strong"}`}
    >
      {checked ? (
        <span className={`rounded-full bg-on-cta ${large ? "size-2" : "size-[7px]"}`} />
      ) : null}
    </span>
  );
}

export type RadioRowOption<T extends string> = {
  value: T;
  title: ReactNode;
  subtitle?: ReactNode;
  disabled?: boolean;
};

// Liste de choix (sélecteur de jour : « Sans jour », « Appliquer ce jour à ») : cadre rayon 13 et filet
// .10, lignes de 48 px (42 en compact, ordinateur) séparées d'un filet, 14 px de côté ; titre 13,5/600,
// sous-titre 12 gris ; ligne choisie sur un fond doux.
export function RadioList<T extends string>({
  label,
  value,
  onChange,
  options,
  compact = false,
  className = "",
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: RadioRowOption<T>[];
  compact?: boolean;
  className?: string;
}) {
  const name = useId();
  return (
    <fieldset className={`m-0 min-w-0 border-0 p-0 ${className}`}>
      <legend className="sr-only">{label}</legend>
      <div className="flex flex-col overflow-hidden rounded-[13px] inset-ring inset-ring-field-ring">
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-3 border-b border-dlg-divider px-3.5 py-1.5 last:border-b-0 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-violet ${
                compact ? "min-h-12 lg:min-h-[42px]" : "min-h-12"
              } ${checked ? "bg-surface-2" : ""}`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                disabled={option.disabled}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <RadioMark checked={checked} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[13.5px] leading-[1.3] font-semibold text-text">
                  {option.title}
                </span>
                {option.subtitle ? (
                  <span className="truncate text-[12px] leading-[1.35] text-muted">
                    {option.subtitle}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

// Carte de choix (assistant : organisation de la semaine, point de départ, discipline) : 14 × 16 px de
// marge intérieure, rayon 14, fond de carte, filet .12 ; choisie, un anneau encre de 1,5 px. Le rond
// est facultatif (absent pour « Point de départ » et la discipline). Contenu libre en dessous du titre.
export function OptionCard({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  radio = true,
  children,
  className = "",
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: ReactNode;
  description?: ReactNode;
  radio?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-[14px] bg-surface px-4 py-3.5 transition-[box-shadow,scale] duration-150 active:scale-[0.99] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-violet ${
        checked ? "inset-ring-[1.5px] inset-ring-text" : "inset-ring inset-ring-field-ring"
      } ${className}`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {radio ? (
        <span className="mt-px">
          <RadioMark checked={checked} />
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[14.5px] leading-[1.3] font-semibold text-text">{title}</span>
        {description ? (
          <span className="text-[13px] leading-[1.45] text-muted">{description}</span>
        ) : null}
        {children}
      </span>
    </label>
  );
}

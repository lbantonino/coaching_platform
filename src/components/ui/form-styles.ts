import { buttonClass } from "./button";

// Styles communs des formulaires, alignés sur le design system Coory (§6 Input).
// 44 px sur téléphone (cible tactile minimale), 38 px sur ordinateur. Dans une carte, le champ
// est posé sur bg-bg (profondeur inversée) et cerné par line-2 (contour des contrôles).
export const inputClass =
  "h-11 w-full rounded-md border border-line-2 bg-bg px-3 text-body text-text placeholder:text-faint outline-none transition-colors focus:border-accent read-only:text-muted sm:h-[38px] sm:text-small";

export const labelClass = "text-small font-medium text-text";

export const hintClass = "text-caption text-muted";

export const primaryButtonClass = buttonClass({
  variant: "primary",
  size: "lg",
  className: "w-full",
});

// Message d'erreur : rouge en TEXTE (accent-text), lisible en sombre comme en clair (contraste ≥ 4,5:1).
// Le rouge plein + texte blanc est réservé aux pastilles d'alerte (Badge « danger »).
export const errorTextClass = "text-small font-medium text-accent-text";

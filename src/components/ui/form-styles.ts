import { buttonClass } from "./button";

// Styles communs des formulaires, alignés sur le design system Athlix (Champs & contrôles).
// Hauteur 48 px : cibles tactiles confortables sur téléphone.
export const inputClass =
  "h-12 w-full rounded-[10px] border border-line-2 bg-bg px-3.5 text-body text-text placeholder:text-faint outline-none transition-colors focus:border-accent read-only:text-muted";

export const labelClass = "text-small font-medium text-text";

export const hintClass = "text-caption text-muted";

export const primaryButtonClass = buttonClass({
  variant: "primary",
  size: "lg",
  className: "w-full",
});

export const errorTextClass = "text-small text-danger";

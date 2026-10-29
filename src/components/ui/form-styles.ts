import { buttonClass } from "./button";

// Styles communs des formulaires (prompt Claude Design §4 « Input ») : champ de 50 px, rayon 12,
// fond surface, contour line-2, contour rouge au focus et en erreur. Texte en 16 px partout : en
// dessous, iOS zoome sur le champ quand on le touche.
const fieldBase =
  "w-full rounded-control border border-line-2 bg-field text-[16px] text-text placeholder:text-faint outline-none transition-colors duration-150 focus:border-accent aria-[invalid=true]:border-alert read-only:text-muted";

export const inputClass = `${fieldBase} h-[50px] px-4`;

// Pages d'entrée (connexion, inscription, mot de passe, invitation) : champs de 52 px (prototype §7.1).
export const entryInputClass = `${fieldBase} h-[52px] px-4`;

// Zone de texte : même habillage, hauteur libre (3 lignes par défaut).
export const textareaClass = `${fieldBase} min-h-[96px] px-4 py-3 leading-normal`;

export const labelClass = "text-[14px] font-medium text-text";

export const hintClass = "text-[13px] text-muted";

export const primaryButtonClass = buttonClass({
  variant: "primary",
  size: "lg",
  className: "w-full",
});

// Message d'erreur : rouge d'alerte en TEXTE (--alert), lisible en sombre comme en clair (≥ 4,5:1).
// Le composant FieldError (field.tsx) y ajoute l'icône « circle-alert ».
export const errorTextClass = "text-[13px] font-medium text-alert";

// Pastille cochable (lieux, jours, disciplines…) : c'est le <label> qui porte ce style, la vraie case
// reste dans la page (classe sr-only) pour le clavier et les lecteurs d'écran. Cochée = couleurs
// jaune doré (D-71) et « ✓ » devant. Mettre une icône Check avec la classe « hidden group-has-checked:block ».
export const checkboxChipClass =
  "group inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-pill border border-line-2 px-3.5 text-[14px] font-medium whitespace-nowrap text-text transition-colors duration-150 not-has-checked:hover:bg-surface has-checked:border-transparent has-checked:bg-selected has-checked:text-text has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent";

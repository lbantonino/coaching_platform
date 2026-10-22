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

// Case à cocher en forme de pastille (lieux, jours…) : c'est le <label> qui porte ce style, la vraie case
// reste dans la page (classe sr-only) pour le clavier et les lecteurs d'écran. Cochée = couleurs inversées ;
// le survol ne change que les pastilles non cochées (sinon le texte coché devenait illisible).
// Mettre une icône Check avec la classe « hidden group-has-checked:block » à l'intérieur.
export const checkboxChipClass =
  "group inline-flex h-11 cursor-pointer items-center gap-2 rounded-pill border border-line-2 px-3.5 text-small text-muted transition-colors not-has-checked:hover:text-text has-checked:border-inv has-checked:bg-inv has-checked:text-on-inv has-focus-visible:outline-2 has-focus-visible:outline-accent sm:h-9";

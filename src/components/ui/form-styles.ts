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

// Champs de la fiche sportif (maquette « Sportifs » du 03/11/2026, § Champs) : 46 px, rayon 12,
// filet intérieur (il ne prend pas de place), texte 15 px sur ordinateur et 16 px sur téléphone (en
// dessous, iOS zoome). Focus : anneau violet, la proposition de la maquette. Non modifiable : grisé
// (champs texte seulement : pour le navigateur, un <select> est toujours « read-only »).
const ficheFieldBase =
  "w-full rounded-[12px] bg-field text-[16px] text-text inset-ring inset-ring-line-2 outline-none placeholder:text-faint transition-shadow duration-150 focus:inset-ring-[1.5px] focus:inset-ring-violet/55 aria-[invalid=true]:inset-ring-alert [&:is(input,textarea):read-only]:bg-surface-2 [&:is(input,textarea):read-only]:text-muted lg:text-[15px]";

export const ficheInputClass = `${ficheFieldBase} h-[46px] px-3.5`;

export const ficheTextareaClass = `${ficheFieldBase} block min-h-24 resize-y px-3.5 py-3 leading-normal`;

// Hauteurs de ligne en pixels, celles de la maquette (la police servie par l'app donne 0,3 px de moins
// en « normal », soit 2 px d'écart cumulé en bas du formulaire).
export const ficheLabelClass = "text-[13.5px] leading-[17px] font-medium text-text";

export const ficheHintClass = "text-[12.5px] leading-[1.45] text-muted";

// Sur-titre d'un groupe de champs (IDENTITÉ, CONTACT…) : 11,5 px, capitales espacées, gris clair.
export const ficheOvertitleClass =
  "pt-2 text-[11.5px] leading-[14.5px] font-semibold tracking-[0.09em] text-faint uppercase";

// Grille des champs : autant de colonnes de 240 px minimum que la largeur en permet (3 à 1280 px,
// 1 sur téléphone). « auto-fill » garde les colonnes vides : un champ seul (Niveau) garde sa largeur.
export const ficheGridClass =
  "grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr))]";

// Pastille cochable de la fiche : 38 px, arrondie, « ✓ » devant le libellé quand elle est cochée,
// fond et texte violets avec un anneau violet. Même principe que checkboxChipClass (vraie case sr-only).
// Le « ✓ » est un pseudo-élément : le texte du libellé reste le nom du lieu ou du jour, seul (resserré
// de 0,75 px par caractère : le « ✓ » de la police servie est 1,5 px plus large que celui de la
// maquette ; mesuré sur les jours de la page 2h).
export const ficheChipClass =
  "has-checked:before:whitespace-pre has-checked:before:tracking-[-0.75px] has-checked:before:content-['✓_'] group inline-flex h-[38px] cursor-pointer items-center rounded-full px-3.5 text-[13.5px] font-medium whitespace-nowrap text-text-2 inset-ring inset-ring-line-2 transition-colors duration-150 not-has-checked:hover:bg-surface-2 has-checked:bg-selected has-checked:text-violet-text has-checked:inset-ring-violet/35 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-violet";

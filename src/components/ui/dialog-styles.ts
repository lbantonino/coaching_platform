// Styles communs des boîtes de dialogue (kit « Coory Boites », 04/11/2026 : fenêtres, feuilles du bas,
// menus d'actions, confirmations). Valeurs exactes du kit en thème clair (jetons --dlg-* de
// tokens.css), accordées au thème sombre. Module neutre (ni serveur ni client) : utilisable partout.
// Bascule téléphone / ordinateur à 768 px (md:), comme les boîtes.

// Boutons (kit, shared-components/buttons) : 46 px sur ordinateur, 52 px sur téléphone, rayon 12,
// 600. Principal : encre (--cta, noir en clair, blanc en sombre) ; secondaire : blanc à filet ;
// danger : rouge plein ; lien destructif : texte rouge.
const dlgButtonBase =
  "inline-flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-[12px] leading-[normal] font-semibold whitespace-nowrap transition-[background-color,transform,opacity] duration-150 active:scale-[0.98] disabled:cursor-not-allowed md:h-[46px]";

export const dlgPrimaryButtonClass = `${dlgButtonBase} px-[22px] text-[15px] bg-cta text-on-cta hover:bg-cta-hover disabled:bg-dlg-disabled disabled:text-white`;

export const dlgSecondaryButtonClass = `${dlgButtonBase} border border-dlg-border px-[18px] text-[14.5px] bg-dlg text-text hover:bg-dlg-tile`;

// « Annuler » d'une confirmation : comme le secondaire, mais en 15 px (kit, famille confirmation).
export const dlgCancelButtonClass = `${dlgButtonBase} border border-dlg-border px-[18px] text-[15px] bg-dlg text-text hover:bg-dlg-tile`;

export const dlgDangerButtonClass = `${dlgButtonBase} px-[22px] text-[15px] bg-dlg-danger text-white hover:brightness-95 disabled:opacity-60`;

// « Supprimer » à gauche du pied (kit, 19) : 46 px aussi sur téléphone, corbeille 16, rouge.
export const dlgDestructiveLinkClass =
  "mr-auto inline-flex h-[46px] shrink-0 items-center gap-2 rounded-[12px] px-3.5 text-[14.5px] leading-[normal] font-semibold whitespace-nowrap text-dlg-danger-ink transition-[background-color,scale] duration-150 hover:bg-dlg-danger-soft active:scale-[0.98]";

// Champs (kit, shared-components/form-controls) : 50 px sur téléphone, 46 px sur ordinateur, rayon 12,
// fond gris très clair à filet, texte 15/500, indication 400 en gris clair.
export const dlgLabelClass =
  "text-[13.5px] leading-[normal] font-semibold whitespace-nowrap text-text";

export const dlgOptionalClass = "font-normal text-dlg-faint";

// Texte des champs : 15 px sur ordinateur comme le kit, 16 px sur téléphone (en dessous, Safari sur
// iPhone agrandit la page quand on touche le champ).
const dlgFieldBase =
  "w-full min-w-0 rounded-[12px] border border-dlg-field-line bg-dlg-field text-[16px] leading-[normal] font-medium text-text tabular-nums outline-none transition-[border-color,box-shadow] duration-150 placeholder:font-normal placeholder:text-dlg-faint aria-[invalid=true]:border-dlg-danger-ink focus:border-dlg-accent focus:ring-[3px] focus:ring-dlg-accent/15 disabled:opacity-60 md:text-[15px]";

export const dlgInputClass = `${dlgFieldBase} h-[50px] px-3.5 md:h-[46px]`;

// Menu déroulant : la flèche (17 px, gris) est posée par DialogSelect, d'où la marge à droite.
export const dlgSelectClass = `${dlgFieldBase} h-[50px] appearance-none pr-[41px] pl-3.5 md:h-[46px]`;

export const dlgTextareaClass = `${dlgFieldBase} block min-h-[92px] resize-y px-3.5 py-[13px] leading-[1.5]!`;

// Contrôle segmenté : fond gris rayon 13, marge 4, options de 38 px ; l'option active est blanche avec
// une ombre douce. Pleine largeur, colonnes égales ; DlgSegmented `fit` : à la largeur de son contenu
// sur ordinateur (priorité d'une tâche).
export const dlgSegmentedClass =
  "grid w-full auto-cols-[1fr] grid-flow-col gap-1 rounded-[13px] bg-dlg-segment p-1";

export const dlgSegmentOptionClass =
  "flex h-[38px] cursor-pointer items-center justify-center rounded-[10px] px-3.5 text-[14px] leading-[normal] font-semibold whitespace-nowrap text-muted transition-[color,background-color,border-color,box-shadow] duration-150 has-checked:bg-dlg-segment-active has-checked:text-text has-checked:shadow-[0_1px_3px_rgba(23,21,29,0.12)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-dlg-accent";

// Pastilles à choisir : 38 px, rayon 20, filet ; choisie : fond et filet violets, texte violet et coche
// de 14 px (classe `group` : la coche s'affiche avec group-has-checked).
export const dlgChipClass =
  "group inline-flex h-[38px] cursor-pointer items-center gap-[7px] rounded-[20px] border border-dlg-border bg-dlg px-3.5 text-[14px] leading-[normal] font-semibold whitespace-nowrap text-text transition-[color,background-color,border-color] duration-150 has-checked:border-dlg-chip-line has-checked:bg-dlg-accent-tile has-checked:text-dlg-accent-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-dlg-accent";

// Zone de dépôt d'un fichier (kit, 21) : marge 20, rayon 16, pointillés violets 1,5, fond violet très
// pâle ; tuile 46 à gauche, texte à droite.
export const dlgDropZoneClass =
  "relative flex items-center gap-4 rounded-[16px] border-[1.5px] border-dashed border-dlg-drop-line bg-dlg-drop p-5 transition-[background-color] duration-150 hover:bg-dlg-accent-soft has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-dlg-accent";

// Grille du corps d'un formulaire : 12 colonnes sur ordinateur (2 sur téléphone), écarts 18 / 14.
export const dlgFormGridClass = "grid grid-cols-2 gap-x-3.5 gap-y-[18px] md:grid-cols-12";

// Un champ : libellé au-dessus (écart 8). Largeur : toute la ligne, ou la moitié sur ordinateur.
export const dlgFieldClass = "flex min-w-0 flex-col gap-2";
export const dlgSpanFull = "col-span-2 md:col-span-12";
export const dlgSpanHalf = "col-span-2 md:col-span-6";

// Message d'erreur du formulaire : 13 px rouge, sur toute la largeur.
export const dlgErrorClass =
  "col-span-2 text-[13px] leading-[1.5] text-dlg-danger-ink md:col-span-12";

// Champ à suffixe (« min », « € TVAC », « % ») : le cadre du champ porte le fond, le filet et l'anneau
// de focus ; le vrai champ, transparent, prend la place libre ; le suffixe (13 px 600 gris clair)
// suit à 10 px.
export const dlgSuffixFieldClass =
  "flex h-[50px] w-full min-w-0 items-center gap-2.5 rounded-[12px] border border-dlg-field-line bg-dlg-field px-3.5 transition-[border-color,box-shadow] duration-150 focus-within:border-dlg-accent focus-within:ring-[3px] focus-within:ring-dlg-accent/15 has-aria-[invalid=true]:border-dlg-danger-ink md:h-[46px]";
export const dlgSuffixInputClass =
  "h-full min-w-0 flex-1 bg-transparent text-[16px] leading-[normal] font-medium text-text tabular-nums outline-none placeholder:font-normal placeholder:text-dlg-faint md:text-[15px]";

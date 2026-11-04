// Styles communs des boîtes de dialogue (kit « Coory Boites », 04/11/2026 : fenêtres, feuilles du bas,
// menus d'actions, confirmations). Valeurs exactes du kit en thème clair (jetons --dlg-* de
// tokens.css), accordées au thème sombre. Module neutre (ni serveur ni client) : utilisable partout.
// Bascule téléphone / ordinateur à 768 px (md:), comme les boîtes.

// Boutons (kit, shared-components/buttons) : 46 px sur ordinateur, 52 px sur téléphone, rayon 12,
// 600. Principal : encre (--cta, noir en clair, blanc en sombre) ; secondaire : blanc à filet ;
// danger : rouge plein ; lien destructif : texte rouge.
const dlgButtonBase =
  "inline-flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-[12px] px-[22px] text-[15px] font-semibold whitespace-nowrap transition-[background-color,transform,opacity] duration-150 active:scale-[0.98] disabled:cursor-not-allowed md:h-[46px]";

export const dlgPrimaryButtonClass = `${dlgButtonBase} bg-cta text-on-cta hover:bg-cta-hover disabled:bg-dlg-disabled disabled:text-white`;

export const dlgSecondaryButtonClass = `${dlgButtonBase} bg-dlg px-[18px] text-[14.5px] text-text inset-ring inset-ring-dlg-border hover:bg-dlg-tile`;

export const dlgDangerButtonClass = `${dlgButtonBase} bg-dlg-danger text-white hover:brightness-95 disabled:opacity-60`;

export const dlgDestructiveLinkClass =
  "inline-flex h-[52px] items-center gap-2 rounded-[12px] px-2 text-[14.5px] font-semibold text-dlg-danger-ink transition-[color,background-color,border-color,box-shadow] duration-150 hover:bg-dlg-danger-soft md:h-[46px]";

// Champs (kit, shared-components/form-controls) : 50 px sur téléphone, 46 px sur ordinateur, rayon 12,
// fond gris très clair à filet, texte 15/500, indication 400 en gris clair.
export const dlgLabelClass =
  "text-[13.5px] leading-[17px] font-semibold whitespace-nowrap text-text";

export const dlgOptionalClass = "font-normal text-dlg-faint";

export const dlgHintClass = "text-[13px] leading-[1.5] text-muted text-pretty";

const dlgFieldBase =
  "w-full min-w-0 rounded-[12px] border border-dlg-field-line bg-dlg-field text-[16px] font-medium text-text outline-none transition-[border-color,box-shadow] duration-150 placeholder:font-normal placeholder:text-dlg-faint focus:border-dlg-accent focus:ring-[3px] focus:ring-dlg-accent/15 disabled:opacity-60 md:text-[15px]";

export const dlgInputClass = `${dlgFieldBase} h-[50px] px-3.5 md:h-[46px]`;

// Menu déroulant : la flèche (17 px, gris) est posée par DialogSelect, d'où la marge à droite.
export const dlgSelectClass = `${dlgFieldBase} h-[50px] appearance-none pr-10 pl-3.5 md:h-[46px]`;

export const dlgTextareaClass = `${dlgFieldBase} block min-h-[92px] resize-y px-3.5 py-3 leading-[1.5]`;

// Suffixe dans le champ (« min », « % », « kg »…) : 13 px 600 gris clair.
export const dlgSuffixClass =
  "pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[13px] font-semibold text-dlg-faint";

// Contrôle segmenté : fond gris rayon 13, marge 4, options de 38 px ; l'option active est blanche avec
// une ombre douce.
export const dlgSegmentedClass = "grid w-full gap-1 rounded-[13px] bg-dlg-segment p-1";

export const dlgSegmentOptionClass =
  "flex h-[38px] min-w-0 cursor-pointer items-center justify-center rounded-[10px] px-2 text-[14px] font-semibold text-muted transition-[color,background-color,border-color,box-shadow] duration-150 has-checked:bg-dlg-segment-active has-checked:text-text has-checked:shadow-[0_1px_3px_rgba(23,21,29,0.12)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-dlg-accent";

// Pastilles à choisir : 38 px, rayon 20, filet ; choisie : fond et filet violets, texte violet.
export const dlgChipClass =
  "inline-flex h-[38px] cursor-pointer items-center gap-1.5 rounded-[20px] px-3.5 text-[14px] font-semibold whitespace-nowrap text-dlg-ink-2 inset-ring inset-ring-dlg-border transition-[color,background-color,border-color,box-shadow] duration-150 has-checked:bg-dlg-accent-tile has-checked:text-dlg-accent-ink has-checked:inset-ring-dlg-accent-line has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-dlg-accent";

// Case à cocher : 22 px, rayon 7, filet 1,5 ; cochée : violet plein, coche blanche.
export const dlgCheckboxClass =
  "peer grid size-[22px] shrink-0 cursor-pointer appearance-none place-items-center rounded-[7px] border-[1.5px] border-dlg-check-line bg-dlg transition-[color,background-color,border-color,box-shadow] duration-150 checked:border-dlg-accent checked:bg-dlg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dlg-accent";

// Carte à cocher (case + texte) : marge 14, rayon 14, filet ; cochée : fond et filet violets doux.
export const dlgCheckCardClass =
  "relative flex cursor-pointer items-start gap-3 rounded-[14px] p-3.5 text-[15px] leading-[1.4] font-semibold text-text inset-ring inset-ring-dlg-field-line transition-[color,background-color,border-color,box-shadow] duration-150 has-checked:bg-dlg-accent-soft has-checked:inset-ring-dlg-accent-line";

// Zone de dépôt d'un fichier : rayon 16, pointillés violets.
export const dlgDropZoneClass =
  "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-[16px] border-[1.5px] border-dashed border-dlg-drop-line bg-dlg-accent-soft/40 px-4 py-6 text-center transition-[color,background-color,border-color,box-shadow] duration-150 hover:bg-dlg-accent-soft";

// Grille du corps d'un formulaire : 12 colonnes sur ordinateur (2 sur téléphone), écarts 18 / 14.
export const dlgFormGridClass = "grid grid-cols-2 gap-x-3.5 gap-y-[18px] md:grid-cols-12";

// Un champ : libellé au-dessus (écart 8).
export const dlgFieldClass = "flex min-w-0 flex-col gap-2";

// Styles communs des formulaires (prompt Claude Design §4 « Input ») : champ de 50 px, rayon 12,
// fond surface, contour line-2, contour rouge au focus et en erreur. Texte en 16 px partout : en
// dessous, iOS zoome sur le champ quand on le touche.
const fieldBase =
  "w-full rounded-control border border-line-2 bg-field text-[16px] text-text placeholder:text-faint outline-none transition-colors duration-150 focus:border-accent aria-[invalid=true]:border-alert read-only:text-muted";

export const inputClass = `${fieldBase} h-[50px] px-4`;

// Pages d'accès sans icône (mot de passe oublié, nouveau mot de passe, invitation) : même habillage
// que les champs de la connexion (maquette du 06/11/2026, D-139), sans la place de l'icône.
export const entryInputClass =
  "h-[50px] w-full rounded-[13px] bg-dlg-field px-4 text-[16px] text-text inset-ring inset-ring-line outline-none placeholder:text-faint transition-shadow duration-150 focus:inset-ring-[1.5px] focus:inset-ring-violet aria-[invalid=true]:inset-ring-alert disabled:opacity-60 read-only:text-muted lg:h-12 lg:rounded-[12px] lg:text-[14.5px]";

// Champs à icône des pages d'entrée (maquettes d'Antonino du 06/11/2026, D-139) : téléphone 50 px
// rayon 13 en 16 px (sinon l'iPhone agrandit la page), ordinateur rayon 12 en 14,5 px ; fond des
// champs de fenêtre, filet intérieur, anneau violet de 1,5 px au focus, rouge en erreur. La place de
// l'icône est réservée à gauche, celle de l'œil à droite pour un mot de passe. Une variante par
// taille (jamais deux hauteurs dans la même classe : la CSS ne garantit pas laquelle gagne).
const authFieldBase =
  "h-[50px] w-full rounded-[13px] bg-dlg-field pl-[46px] text-[16px] text-text inset-ring inset-ring-line outline-none placeholder:text-faint transition-shadow duration-150 focus:inset-ring-[1.5px] focus:inset-ring-violet aria-[invalid=true]:inset-ring-alert disabled:opacity-60 lg:rounded-[12px] lg:text-[14.5px]";

// Connexion (écran 01) : 48 px, icône à 44 px.
export const authInputClass = `${authFieldBase} pr-4 lg:h-12 lg:pr-3.5 lg:pl-11`;
export const authPasswordClass = `${authFieldBase} pr-[52px] lg:h-12 lg:pr-12 lg:pl-11`;

// Inscription (écran 02) : 45 px, icône à 40 px.
export const authInputCompactClass = `${authFieldBase} pr-4 lg:h-[45px] lg:pr-3 lg:pl-10`;
export const authPasswordCompactClass = `${authFieldBase} pr-[52px] lg:h-[45px] lg:pr-[46px] lg:pl-10`;

// Zone de texte : même habillage, hauteur libre (3 lignes par défaut).
export const textareaClass = `${fieldBase} min-h-[96px] px-4 py-3 leading-normal`;

export const labelClass = "text-[14px] font-medium text-text";

export const hintClass = "text-[13px] text-muted";

// Message d'erreur : rouge d'alerte en TEXTE (--alert), lisible en sombre comme en clair (≥ 4,5:1).
// Le composant FieldError (field.tsx) y ajoute l'icône « circle-alert ».
export const errorTextClass = "text-[13px] font-medium text-alert";

// Pastille cochable (lieux, jours, disciplines…) : c'est le <label> qui porte ce style, la vraie case
// reste dans la page (classe sr-only) pour le clavier et les lecteurs d'écran. Cochée = couleurs
// jaune doré (D-71) et « ✓ » devant. Mettre une icône Check avec la classe « hidden group-has-checked:block ».
export const checkboxChipClass =
  "group inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-pill border border-line-2 px-3.5 text-[14px] font-medium whitespace-nowrap text-text transition-colors duration-150 not-has-checked:hover:bg-surface has-checked:border-transparent has-checked:bg-selected has-checked:text-text has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent";

// Champs du kit « Coory Pages » (page 10 Nouveau sportif, D-126 ; mêmes valeurs que 08 / 11).
// Téléphone d'abord : 48 px en 16 px (en dessous, l'iPhone agrandit la page) ; ordinateur : 46 px en
// 14 px. Filet intérieur, anneau violet au focus, rouge en erreur. Le fond est ajouté à part (gris
// pâle dans une carte, blanc dans un encadré gris) : deux classes de fond sur un même champ se
// contrediraient. Menu déroulant resté sur son choix vide (« Non précisé ») : gris comme un exemple,
// ses options gardent la couleur du texte.
const kitFieldBase =
  "w-full rounded-[12px] text-[16px] text-text inset-ring inset-ring-line-2 outline-none placeholder:text-faint transition-shadow duration-150 focus:inset-ring-[1.5px] focus:inset-ring-violet aria-[invalid=true]:inset-ring-alert has-[option[value='']:checked]:text-faint [&_option]:text-text lg:text-[14px]";

export const kitInputBaseClass = `${kitFieldBase} h-12 px-3.5 lg:h-[46px]`;
export const kitInputClass = `${kitInputBaseClass} bg-surface-2`;

export const kitTextareaBaseClass = `${kitFieldBase} block resize-y px-3.5 py-3 leading-[1.5]`;
export const kitTextareaClass = `${kitTextareaBaseClass} min-h-[88px] bg-surface-2 lg:min-h-[84px]`;

export const kitLabelClass =
  "text-[14px] leading-[normal] font-semibold text-text lg:text-[13.5px]";

// « facultatif » après le libellé, sans parenthèses (kit).
export const kitOptionalClass = "font-normal text-faint";

export const kitHintClass = "text-[13px] leading-[1.45] text-faint lg:text-[12px]";

// Pilule cochable (lieux, jours) : 40 px sur téléphone, 34 px sur ordinateur ; cochée = fond et texte
// violets, « ✓ » devant (icône Check « hidden group-has-checked:block »). La vraie case reste dans la
// page (sr-only) pour le clavier et les lecteurs d'écran.
export const kitPillClass =
  "tap-44 group inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-surface px-[15px] text-[14px] leading-[normal] font-medium whitespace-nowrap text-text inset-ring inset-ring-line-2 transition-colors duration-150 not-has-checked:hover:bg-surface-2 has-checked:bg-status-accent-soft has-checked:text-status-accent has-checked:inset-ring-transparent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent lg:h-[34px] lg:px-3.5 lg:text-[13px]";

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

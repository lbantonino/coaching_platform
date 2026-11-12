// Classes du sélecteur segmenté (maquettes « Programmes », D-156), sans « use client » : utilisables par
// une page serveur (onglets en liens) comme par le composant contrôlé (segmented-control.tsx).
// Mesures exactes des maquettes, par endroit :
// - header : onglets dans l'en-tête d'ordinateur (Programmes / Modèles), piste du fond de page 3 px r11,
//   segments 34 px r9, 14/600 ;
// - page : filtres posés sur la page (statuts, sources), piste grise 4 px r12, segments 32 px r9, 13/500,
//   compteur 12/500 gris clair ;
// - full : téléphone, toute la largeur (Programmes / Modèles), piste grise 4 px r13, segments 38 px r10,
//   14/600 ; « tall » pour le mode de la semaine (40 px) ;
// - card : dans une carte (mode de la semaine, ordinateur), piste du fond 3 px r11, segments 34 px r9,
//   13/500 ;
// - field : champ d'un formulaire (Mesure, Cible, Charge), toute la largeur, 3 px r11, segments 36 px r9,
//   13,5/500.
// Segment choisi : fond clair et ombre douce, texte encre ; les autres, texte gris. Champ d'un
// formulaire (« field ») : fond de carte et anneau d'encre de 1,5 px, comme la source des maquettes
// des éditeurs de séance (`inset 0 0 0 1.5px #17151d`, recette du 11/11/2026).
export type SegmentedSize = "header" | "page" | "full" | "tall" | "card" | "field";

const TRACK: Record<SegmentedSize, string> = {
  header: "inline-flex rounded-[11px] bg-bg p-[3px]",
  page: "inline-flex rounded-[12px] bg-track p-1",
  full: "flex w-full rounded-[13px] bg-track p-1",
  tall: "flex w-full rounded-[13px] bg-track p-1",
  card: "inline-flex rounded-[11px] bg-bg p-[3px]",
  field: "flex w-full rounded-[11px] bg-bg p-[3px]",
};

const ITEM: Record<SegmentedSize, string> = {
  header: "h-[34px] rounded-[9px] px-3.5 text-[14px] font-semibold",
  page: "h-8 gap-1.5 rounded-[9px] px-3 text-[13px] font-medium",
  full: "h-[38px] flex-1 rounded-[10px] text-[14px] font-semibold",
  tall: "h-10 flex-1 rounded-[10px] text-[14px] font-semibold",
  card: "h-[34px] rounded-[9px] px-3 text-[13px] font-medium",
  field: "h-9 flex-1 rounded-[9px] px-1.5 text-[13.5px] font-medium",
};

export function segmentTrackClass(size: SegmentedSize): string {
  return TRACK[size];
}

// Aussi pour des onglets en liens (Programmes / Modèles changent l'adresse) : même dessin.
export function segmentItemClass(size: SegmentedSize, active: boolean): string {
  return `tap-44 inline-flex min-w-0 items-center justify-center leading-[normal] whitespace-nowrap transition-[background-color,color,box-shadow] duration-150 ${ITEM[size]} ${
    active
      ? size === "field"
        ? "bg-surface text-text inset-ring-[1.5px] inset-ring-text"
        : "bg-track-active text-text shadow-segment"
      : size === "field"
        ? "text-text-2 hover:text-text"
        : "text-muted hover:text-text"
  }`;
}

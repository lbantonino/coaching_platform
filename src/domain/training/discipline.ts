// Les quatre disciplines natives de Coory (docs/01, D-18), chacune avec sa couleur (D-23).
// Elles serviront partout : objectifs aujourd'hui, séances, programmes et calendrier ensuite.
export const DISCIPLINES = ["running", "strength", "hyrox", "hybrid"] as const;
export type Discipline = (typeof DISCIPLINES)[number];

export const disciplineLabels: Record<Discipline, string> = {
  running: "Running",
  strength: "Musculation",
  hyrox: "Hyrox",
  hybrid: "Hybride",
};

// Ton de pastille (composant Badge) de chaque discipline.
export const disciplineTones = {
  running: "run",
  strength: "strength",
  hyrox: "hyrox",
  hybrid: "hybrid",
} as const satisfies Record<Discipline, string>;

// Classes de couleur par discipline (D-24), écrites en entier pour que Tailwind les trouve :
// carte neutre au contour légèrement coloré (29/10/2026 : la couleur va au titre et à l'icône, pas à
// la carte), fond d'avatar, cadre d'objectif, icône dans son cercle, texte coloré.
export const disciplineStyles = {
  running: {
    header: "border-run/35 bg-surface",
    avatar: "bg-[color-mix(in_srgb,var(--run)_24%,var(--surface))]",
    frame: "border-run",
    icon: "border border-run/50 bg-run-soft text-run",
    text: "text-run",
    // Point de 6 à 8 px devant le nom de la discipline (couleur pleine, maquette du 03/11/2026).
    dot: "bg-run-fill",
    // Carte d'une séance du programme (maquette « Sportifs », page 2c) : fond teinté et numéro plein.
    tint: "bg-run-soft",
    number: "bg-run-fill text-on-run-fill",
  },
  strength: {
    header: "border-strength/35 bg-surface",
    avatar: "bg-[color-mix(in_srgb,var(--strength)_24%,var(--surface))]",
    frame: "border-strength",
    icon: "border border-strength/50 bg-strength-soft text-strength",
    text: "text-strength",
    // Point de 6 à 8 px devant le nom de la discipline (couleur pleine, maquette du 03/11/2026).
    dot: "bg-strength-fill",
    // Carte d'une séance du programme (maquette « Sportifs », page 2c) : fond teinté et numéro plein.
    tint: "bg-strength-soft",
    number: "bg-strength-fill text-on-strength-fill",
  },
  hyrox: {
    header: "border-hyrox/35 bg-surface",
    avatar: "bg-[color-mix(in_srgb,var(--hyrox)_24%,var(--surface))]",
    frame: "border-hyrox",
    icon: "border border-hyrox/50 bg-hyrox-soft text-hyrox",
    text: "text-hyrox",
    // Point de 6 à 8 px devant le nom de la discipline (couleur pleine, maquette du 03/11/2026).
    dot: "bg-hyrox-fill",
    // Carte d'une séance du programme (maquette « Sportifs », page 2c) : fond teinté et numéro plein.
    tint: "bg-hyrox-soft",
    number: "bg-hyrox-fill text-on-hyrox-fill",
  },
  hybrid: {
    header: "border-hybrid/35 bg-surface",
    avatar: "bg-[color-mix(in_srgb,var(--hybrid)_24%,var(--surface))]",
    frame: "border-hybrid",
    icon: "border border-hybrid/50 bg-hybrid-soft text-hybrid",
    text: "text-hybrid",
    // Point de 6 à 8 px devant le nom de la discipline (couleur pleine, maquette du 03/11/2026).
    dot: "bg-hybrid-fill",
    // Carte d'une séance du programme (maquette « Sportifs », page 2c) : fond teinté et numéro plein.
    tint: "bg-hybrid-soft",
    number: "bg-hybrid-fill text-on-hybrid-fill",
  },
} as const satisfies Record<
  Discipline,
  Record<"header" | "avatar" | "frame" | "icon" | "text" | "dot" | "tint" | "number", string>
>;

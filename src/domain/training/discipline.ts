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
// teinte d'en-tête de fiche, fond d'avatar, liseré d'objectif, icône dans sa pastille.
export const disciplineStyles = {
  running: {
    header: "border-run/35 bg-[color-mix(in_srgb,var(--run)_9%,var(--surface))]",
    avatar: "bg-[color-mix(in_srgb,var(--run)_24%,var(--surface))]",
    edge: "border-l-[3px] border-l-run",
    icon: "bg-run-soft text-run",
  },
  strength: {
    header: "border-strength/35 bg-[color-mix(in_srgb,var(--strength)_9%,var(--surface))]",
    avatar: "bg-[color-mix(in_srgb,var(--strength)_24%,var(--surface))]",
    edge: "border-l-[3px] border-l-strength",
    icon: "bg-strength-soft text-strength",
  },
  hyrox: {
    header: "border-hyrox/35 bg-[color-mix(in_srgb,var(--hyrox)_9%,var(--surface))]",
    avatar: "bg-[color-mix(in_srgb,var(--hyrox)_24%,var(--surface))]",
    edge: "border-l-[3px] border-l-hyrox",
    icon: "bg-hyrox-soft text-hyrox",
  },
  hybrid: {
    header: "border-hybrid/35 bg-[color-mix(in_srgb,var(--hybrid)_9%,var(--surface))]",
    avatar: "bg-[color-mix(in_srgb,var(--hybrid)_24%,var(--surface))]",
    edge: "border-l-[3px] border-l-hybrid",
    icon: "bg-hybrid-soft text-hybrid",
  },
} as const satisfies Record<Discipline, Record<"header" | "avatar" | "edge" | "icon", string>>;

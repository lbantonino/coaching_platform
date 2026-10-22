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
// teinte d'en-tête de fiche, fond d'avatar, cadre d'objectif, icône dans son cercle, texte coloré.
export const disciplineStyles = {
  running: {
    header: "border-run/35 bg-[color-mix(in_srgb,var(--run)_9%,var(--surface))]",
    avatar: "bg-[color-mix(in_srgb,var(--run)_24%,var(--surface))]",
    frame: "border-run",
    icon: "border border-run/50 bg-run-soft text-run",
    text: "text-run",
  },
  strength: {
    header: "border-strength/35 bg-[color-mix(in_srgb,var(--strength)_9%,var(--surface))]",
    avatar: "bg-[color-mix(in_srgb,var(--strength)_24%,var(--surface))]",
    frame: "border-strength",
    icon: "border border-strength/50 bg-strength-soft text-strength",
    text: "text-strength",
  },
  hyrox: {
    header: "border-hyrox/35 bg-[color-mix(in_srgb,var(--hyrox)_9%,var(--surface))]",
    avatar: "bg-[color-mix(in_srgb,var(--hyrox)_24%,var(--surface))]",
    frame: "border-hyrox",
    icon: "border border-hyrox/50 bg-hyrox-soft text-hyrox",
    text: "text-hyrox",
  },
  hybrid: {
    header: "border-hybrid/35 bg-[color-mix(in_srgb,var(--hybrid)_9%,var(--surface))]",
    avatar: "bg-[color-mix(in_srgb,var(--hybrid)_24%,var(--surface))]",
    frame: "border-hybrid",
    icon: "border border-hybrid/50 bg-hybrid-soft text-hybrid",
    text: "text-hybrid",
  },
} as const satisfies Record<
  Discipline,
  Record<"header" | "avatar" | "frame" | "icon" | "text", string>
>;

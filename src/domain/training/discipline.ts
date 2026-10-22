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

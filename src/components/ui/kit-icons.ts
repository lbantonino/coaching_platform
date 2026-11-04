import {
  Archive,
  CirclePause,
  CirclePlay,
  Dumbbell,
  Zap,
  createLucideIcon,
  type LucideIcon,
} from "lucide-react";

import type { Discipline } from "@/domain/training/discipline";

// Icônes du kit des boîtes (source-design-files/shared/icons) que Lucide n'a pas : la silhouette de
// course (Running) et les deux cercles (Hybride). Mêmes tracés, mêmes réglages que Lucide (24 × 24,
// trait arrondi) : elles s'utilisent comme n'importe quelle icône Lucide.
export const RunnerIcon = createLucideIcon("CooryRunner", [
  ["path", { d: "M13 4a2 2 0 1 0 4 0 2 2 0 0 0-4 0z", key: "head" }],
  ["path", { d: "M4 17l5 1 1.75-3.5", key: "leg-back" }],
  ["path", { d: "M13 21v-4l-3-3 1-6", key: "body" }],
  ["path", { d: "M7 9l3-1 4 2 3 3h3", key: "arms" }],
]);

export const HybridIcon = createLucideIcon("CooryHybrid", [
  ["path", { d: "M9 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z", key: "left" }],
  ["path", { d: "M15 21a6 6 0 1 0 0-12 6 6 0 0 0 0 12z", key: "right" }],
]);

// Programme d'un sportif dans les boîtes (08, 15) : icône et teinte de chaque discipline.
export const dialogDisciplineIcons: Record<Discipline, LucideIcon> = {
  running: RunnerIcon,
  strength: Dumbbell,
  hyrox: Zap,
  hybrid: HybridIcon,
};

// Statut d'un sportif dans les boîtes (07, 14) : Actif vert, En pause ambre, Archivé gris.
export const dialogStatusIcons = {
  active: CirclePlay,
  paused: CirclePause,
  archived: Archive,
} as const;

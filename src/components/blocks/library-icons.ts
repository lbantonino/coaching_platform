import { createLucideIcon, type LucideIcon } from "lucide-react";

import type { ExerciseCategory } from "@/domain/exercises/vocabulary";

// Icônes de la maquette « Bibliothèque » (06/11/2026, D-142) que Lucide ne dessine pas de la même façon :
// mêmes tracés que la maquette, mêmes réglages que Lucide (24 × 24, trait arrondi), elles s'utilisent
// comme n'importe quelle icône Lucide. La loupe, le chevron, le « + » et la flèche sont ceux de Lucide.
export const LibraryBookIcon = createLucideIcon("CooryLibraryBook", [
  [
    "path",
    {
      d: "M2 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H2zM22 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z",
      key: "book",
    },
  ],
]);
export const BarbellIcon = createLucideIcon("CooryBarbell", [
  ["path", { d: "M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12", key: "barbell" }],
]);
export const CardioIcon = createLucideIcon("CooryCardio", [
  [
    "path",
    {
      d: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z",
      key: "heart",
    },
  ],
]);
export const BoltIcon = createLucideIcon("CooryBolt", [
  ["path", { d: "M13 2L4 14h7l-1 8 9-12h-7z", key: "bolt" }],
]);
export const StretchIcon = createLucideIcon("CooryStretch", [
  [
    "path",
    { d: "M12 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM5 21l4-8 3 3 3-4 4 9M8 9l4-2 4 3", key: "stretch" },
  ],
]);
export const StarIcon = createLucideIcon("CooryStar", [
  [
    "path",
    { d: "M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z", key: "star" },
  ],
]);
export const PersonIcon = createLucideIcon("CooryPerson", [
  ["path", { d: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0", key: "person" }],
]);
export const TickIcon = createLucideIcon("CooryTick", [
  ["path", { d: "M5 12l5 5 9-10", key: "tick" }],
]);
export const VariantIcon = createLucideIcon("CooryVariant", [
  ["path", { d: "M8 8h12v12H8zM4 16V4h12", key: "variant" }],
]);
export const MoreDotsIcon = createLucideIcon("CooryMoreDots", [
  ["path", { d: "M12 6h.01M12 12h.01M12 18h.01", key: "dots" }],
]);
export const PictureIcon = createLucideIcon("CooryPicture", [
  ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "3", key: "frame" }],
  ["circle", { cx: "9", cy: "9", r: "2", key: "sun" }],
  ["path", { d: "M21 15l-5-5L5 21", key: "hill" }],
]);

// Rubriques de la bibliothèque : icône du menu « Catégorie ».
export const libraryCategoryIcons: Record<ExerciseCategory, LucideIcon> = {
  strength: BarbellIcon,
  cardio: CardioIcon,
  hyrox: BoltIcon,
  mobility: StretchIcon,
};

// Pastille de couleur de chaque rubrique : les couleurs officielles des disciplines (agenda).
export const libraryCategoryDots: Record<ExerciseCategory, string> = {
  strength: "bg-strength-fill",
  cardio: "bg-run-fill",
  hyrox: "bg-hyrox-fill",
  mobility: "bg-hybrid-fill",
};

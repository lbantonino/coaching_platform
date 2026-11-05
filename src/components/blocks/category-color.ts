import type { CategoryColor } from "@/domain/documents/documents";

// Pastille d'icône d'un document selon la couleur de sa catégorie (D-68). Uniquement des jetons du
// design system : « jaune » = l'or Coory, les autres teintes de la palette OKLCH (même luminosité) ;
// le texte prend la variante « -text » quand la teinte seule n'atteint pas 4,5:1 (D-135).
// Sans catégorie : gris.
export const categoryTileClass: Record<CategoryColor, string> = {
  gold: "bg-accent-soft text-accent-text",
  blue: "bg-run-soft text-run-text",
  violet: "bg-strength-soft text-strength-text",
  orange: "bg-hyrox-soft text-hyrox",
  teal: "bg-hybrid-soft text-hybrid",
  green: "bg-ok-soft text-ok",
  pink: "bg-female-soft text-female-text",
  sky: "bg-male-soft text-male-text",
  grey: "bg-chip text-muted",
};

// Rond plein de la couleur (choix de la couleur dans « Gérer les catégories »).
export const categoryDotClass: Record<CategoryColor, string> = {
  gold: "bg-accent",
  blue: "bg-run",
  violet: "bg-strength",
  orange: "bg-hyrox",
  teal: "bg-hybrid",
  green: "bg-ok",
  pink: "bg-female",
  sky: "bg-male",
  grey: "bg-muted",
};

export const tileClassFor = (color: CategoryColor | null | undefined) =>
  categoryTileClass[color ?? "grey"];

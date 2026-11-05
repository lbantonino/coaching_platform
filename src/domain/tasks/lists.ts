import { z } from "zod";

// Listes de tâches du coach (kit « Coory Pages », page 01, D-129 ; décisions 8 et 9 d'Antonino) :
// les siennes, nommées et colorées, aucune au départ. Mêmes règles que la base (migration
// 20261105130000).
export const LIST_COLORS = ["indigo", "amber", "teal", "rose", "violet", "ink"] as const;
export type ListColor = (typeof LIST_COLORS)[number];

export const listColorLabels: Record<ListColor, string> = {
  indigo: "Indigo",
  amber: "Ambre",
  teal: "Turquoise",
  rose: "Rose",
  violet: "Violet",
  ink: "Encre",
};

export const LIST_NAME_MAX = 40;

// Une nouvelle liste prend la couleur suivante de la palette (kit) : la première libre, sinon on
// recommence au début.
export function nextListColor(used: readonly string[]): ListColor {
  return (
    LIST_COLORS.find((color) => !used.includes(color)) ??
    LIST_COLORS[used.length % LIST_COLORS.length]
  );
}

export const listNameSchema = z
  .string()
  .trim()
  .min(1, { error: "Donne un nom à la liste." })
  .max(LIST_NAME_MAX, { error: `Nom trop long (${LIST_NAME_MAX} caractères maximum).` });

export const listColorSchema = z.enum(LIST_COLORS, { error: "Couleur invalide." });

export function isListColor(value: unknown): value is ListColor {
  return listColorSchema.safeParse(value).success;
}

import { z } from "zod";

// Notes du coach (P2-03 fin) : une privée, une visible par le sportif. Aligné sur *_notes_coach.sql.
export const NOTE_VISIBILITIES = ["coach", "athlete"] as const;
export type NoteVisibility = (typeof NOTE_VISIBILITIES)[number];
export const noteVisibilitySchema = z.enum(NOTE_VISIBILITIES);

export const NOTE_MAX_LENGTH = 2000;

// Texte de la note, sans espaces autour. Une note vidée est supprimée (pas de note vide en base).
export const noteBodySchema = z
  .string()
  .trim()
  .max(NOTE_MAX_LENGTH, { error: `La note est limitée à ${NOTE_MAX_LENGTH} caractères.` });

import { z } from "zod";

// Message du fil d'un sportif. Aligné sur *_messages_sportifs.sql (1 à 2000 caractères, sans espaces autour).
export const MESSAGE_MAX_LENGTH = 2000;

export const messageBodySchema = z
  .string()
  .trim()
  .min(1, { error: "Écris ton message avant de l'envoyer." })
  .max(MESSAGE_MAX_LENGTH, {
    error: `Un message est limité à ${MESSAGE_MAX_LENGTH} caractères.`,
  });

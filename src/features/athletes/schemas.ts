import { z } from "zod";

// Champ texte facultatif : une chaîne vide (champ laissé blanc) devient null.
const optionalText = (schema: z.ZodType<string, string>) =>
  z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .pipe(schema.nullable());

// Aligné sur les contraintes CHECK de supabase/migrations/*_fiches_sportifs.sql.
export const newAthleteSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, { error: "Le nom est obligatoire." })
    .max(120, { error: "Le nom est trop long (120 caractères maximum)." }),
  email: optionalText(z.email({ error: "Adresse e-mail invalide." }).max(254)),
  phone: optionalText(
    z.string().regex(/^\+?[0-9 ().-]{6,24}$/, {
      error: "Numéro de téléphone invalide (format international conseillé : +32 …).",
    }),
  ),
});

export type NewAthleteInput = z.infer<typeof newAthleteSchema>;

export const athleteStatusLabels = {
  active: "Actif",
  paused: "En pause",
  archived: "Archivé",
} as const;

export type AthleteStatus = keyof typeof athleteStatusLabels;

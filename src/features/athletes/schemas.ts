import { z } from "zod";

// Champ texte facultatif : une chaîne vide (champ laissé blanc) devient null.
const optionalText = (schema: z.ZodType<string, string>) =>
  z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .pipe(schema.nullable());

// Listes fermées de la fiche (OPEN-01, P2-02). Alignées sur les contraintes CHECK de
// supabase/migrations/*_fiche_identite_profil.sql : ajouter une valeur = migration + libellé ici.
export const CONTACT_CHANNELS = ["email", "phone", "sms", "whatsapp"] as const;
export type ContactChannel = (typeof CONTACT_CHANNELS)[number];
export const contactChannelLabels: Record<ContactChannel, string> = {
  email: "E-mail",
  phone: "Appel",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

export const ATHLETE_LEVELS = ["beginner", "intermediate", "advanced", "competitor"] as const;
export type AthleteLevel = (typeof ATHLETE_LEVELS)[number];
export const athleteLevelLabels: Record<AthleteLevel, string> = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Confirmé",
  competitor: "Compétiteur",
};

export const TRAINING_PLACES = ["gym", "outdoor", "track", "home", "box"] as const;
export type TrainingPlace = (typeof TRAINING_PLACES)[number];
export const trainingPlaceLabels: Record<TrainingPlace, string> = {
  gym: "Salle de sport",
  outdoor: "Extérieur (route, trail)",
  track: "Piste d'athlétisme",
  home: "Domicile",
  box: "Box Hyrox / CrossFit",
};

// Choix facultatif dans une liste fermée : « » (non précisé) devient null.
const optionalChoice = <T extends readonly [string, ...string[]]>(values: T, error: string) =>
  z.preprocess((value) => (value === "" ? null : value), z.enum(values, { error }).nullable());

// Identité et contact : création ET modification. Aligné sur les contraintes CHECK de la base.
export const newAthleteSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, { error: "Le prénom est obligatoire." })
    .max(80, { error: "Le prénom est trop long (80 caractères maximum)." }),
  lastName: optionalText(
    z.string().max(80, { error: "Le nom est trop long (80 caractères maximum)." }),
  ),
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

export const ATHLETE_STATUSES = ["active", "paused", "archived"] as const;

// Modification d'une fiche : identité et contact, statut, puis le profil sportif (P2-02 partie 1).
export const athleteUpdateSchema = newAthleteSchema.extend({
  status: z.enum(ATHLETE_STATUSES, { error: "Statut invalide." }),
  preferredContact: optionalChoice(CONTACT_CHANNELS, "Canal de contact invalide."),
  level: optionalChoice(ATHLETE_LEVELS, "Niveau invalide."),
  experience: optionalText(
    z.string().max(500, { error: "L'expérience est trop longue (500 caractères maximum)." }),
  ),
  // Cases à cocher : un lieu coché deux fois (formulaire bricolé) ne compte qu'une fois.
  trainingPlaces: z
    .array(z.enum(TRAINING_PLACES, { error: "Lieu d'entraînement invalide." }))
    .transform((places) => [...new Set(places)]),
  equipment: optionalText(
    z
      .string()
      .max(500, { error: "La description du matériel est trop longue (500 caractères maximum)." }),
  ),
});

export type AthleteUpdateInput = z.infer<typeof athleteUpdateSchema>;

// Filtres de la liste des sportifs (valeurs venant de l'URL, donc validées).
export const athleteListFilterSchema = z.object({
  status: z.enum([...ATHLETE_STATUSES, "all"]).catch("active"),
  q: z
    .string()
    .trim()
    .max(80)
    .catch("")
    .transform((value) => value.toLowerCase()),
});

export type AthleteListFilter = z.infer<typeof athleteListFilterSchema>;

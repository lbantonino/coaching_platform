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

// Sexe déclaré (D-25) : sert aux catégories Hyrox (Women / Men / Mixed) et au repère ♀ / ♂.
export const SEXES = ["female", "male", "unspecified"] as const;
export type Sex = (typeof SEXES)[number];
export const sexLabels: Record<Sex, string> = {
  female: "Femme",
  male: "Homme",
  unspecified: "Non précisé",
};

// Choix facultatif dans une liste fermée : « » (ou absent) devient null.
const optionalChoice = <T extends readonly [string, ...string[]]>(values: T, error: string) =>
  z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z.enum(values, { error }).nullable(),
  );

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
  sex: optionalChoice(SEXES, "Sexe invalide."),
});

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

// Disponibilités (P2-02 partie 3). Jours dans l'ordre de la semaine, alignés sur la contrainte CHECK.
export const WEEK_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];
export const weekDayLabels: Record<WeekDay, string> = {
  mon: "Lundi",
  tue: "Mardi",
  wed: "Mercredi",
  thu: "Jeudi",
  fri: "Vendredi",
  sat: "Samedi",
  sun: "Dimanche",
};

// Nombre entier facultatif saisi dans un champ texte : « » devient null.
const optionalInt = (min: number, max: number, error: string) =>
  z.preprocess(
    (value) => (typeof value === "string" ? (value.trim() === "" ? null : Number(value)) : value),
    z.number({ error }).int({ error }).min(min, { error }).max(max, { error }).nullable(),
  );

export const availabilitySchema = z.object({
  sessionsPerWeek: optionalInt(1, 14, "Séances par semaine : un nombre entre 1 et 14."),
  maxSessionMinutes: optionalInt(10, 300, "Durée maximale d'une séance : entre 10 et 300 minutes."),
  // Remis dans l'ordre de la semaine, sans doublon, quel que soit l'ordre reçu.
  availableDays: z
    .array(z.enum(WEEK_DAYS, { error: "Jour invalide." }))
    .transform((days) => WEEK_DAYS.filter((day) => days.includes(day))),
  scheduleConstraints: optionalText(
    z
      .string()
      .max(500, { error: "Les contraintes d'organisation sont limitées à 500 caractères." }),
  ),
  // Donnée de santé : courte et sans diagnostic. Acceptée seulement si un accord est en cours (serveur + base).
  healthConstraints: optionalText(
    z.string().max(300, { error: "Les contraintes physiques sont limitées à 300 caractères." }),
  ),
});

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

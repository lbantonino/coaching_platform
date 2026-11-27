import { z } from "zod";

import { formatMoney, type Currency } from "@/domain/billing/money";
import { PAYMENT_METHODS } from "@/domain/billing/payments";
import { DISCIPLINES } from "@/domain/training/discipline";
import { aimDefaultsSchema, programGoalSchema } from "@/domain/training/program-plan";
import { SESSION_MOMENTS, sessionBodySchema, WEEKDAYS } from "@/domain/training/session-v2";
import {
  EQUIPMENT_KEYS,
  EXERCISE_CATEGORIES,
  equipmentInfo,
  exerciseCategoryLabels,
  muscleGroupLabels,
  type ExerciseCategory,
  type MuscleGroup,
} from "@/domain/exercises/vocabulary";
import { COUNTRY_NAMES } from "@/domain/geo/country-names";
import {
  ATHLETE_LEVELS,
  CONTACT_CHANNELS,
  SEXES,
  TRAINING_PLACES,
  athleteLevelLabels,
  contactChannelLabels,
  sexLabels,
  trainingPlaceLabels,
  type AthleteLevel,
  type ContactChannel,
  type Sex,
  type TrainingPlace,
} from "@/features/athletes/schemas";
import { GOAL_TYPES, goalTypeLabels, type GoalType } from "@/features/goals/schemas";
import { SESSION_KINDS, SESSION_PAYMENT_METHODS } from "@/features/sessions/schemas";
import { brusselsDayOf } from "@/lib/format";

import { DAILY_ACTIONS, DAILY_PARAMS, summarizeDaily, type DailyKind } from "./daily";
import {
  PROFILE_LABELS,
  REGLAGES_ACTIONS,
  REGLAGES_PARAMS,
  summarizeReglages,
  type ReglagesKind,
} from "./reglages";
import {
  SPORTIFS_ACTIONS,
  SPORTIFS_PARAMS,
  summarizeSportifs,
  type SportifsKind,
} from "./sportifs";
import { placedSessions } from "./program";
import { MAX_PROGRAM_EDITS, programEditSchema } from "./program-edit";
import { dayInWords } from "./rules";
import { ALERTS_ERROR, alertsSchema, alertsText, parseAlerts } from "@/domain/sessions/alerts";

// Propositions de l'Assistant IA (lot 1 des actions, spec §5.2 et §5.3) : une action préparée par
// Claude, affichée en carte, exécutée seulement au clic « Valider » du coach. Les paramètres portent
// les noms des champs des formulaires de Coory ; chaque schéma est STRICT : jamais de santé, d'accord
// de santé, de note privée ni d'organisation (un champ inconnu fait refuser la proposition).

export type AssistantActionKind =
  | "creer_sportif"
  | "creer_seance"
  | "deplacer_seance"
  | "marquer_seance_payee"
  | "noter_paiement"
  | "noter_depense"
  | "creer_tache"
  | "creer_liste_de_taches"
  | "creer_programme"
  | "completer_fiche"
  | "creer_exercice"
  | "preparer_pdf"
  | "importer_document"
  | "modifier_programme"
  | "modifier_modele"
  | "publier_programme"
  | "archiver_programme"
  | "desarchiver_programme"
  | "dupliquer_programme"
  | "enregistrer_comme_modele"
  | "enregistrer_seance_comme_modele"
  | "dupliquer_modele"
  | "archiver_modele"
  | "creer_modele"
  // Lot 4 (D-183) : le quotidien (daily.ts).
  | DailyKind
  // Lot 5 (D-184) : les sportifs (sportifs.ts).
  | SportifsKind
  // Lot 6 (D-185) : les réglages (reglages.ts).
  | ReglagesKind;

export type AssistantAction = { kind: AssistantActionKind; params: Record<string, unknown> };

export type AssistantProposal = AssistantAction & {
  // Identifiant de la carte (une réponse peut en avoir plusieurs).
  id: string;
  // « Nouvelle séance ».
  title: string;
  // Lignes en clair : nom complet, date en toutes lettres, montant avec devise.
  summary: string[];
  // Carte dont celle-ci attend l'exécution (sportif créé par une autre carte), ou null.
  dependsOn: string | null;
  // Liens préparés par le serveur (lot 2 : le PDF d'un programme publié) : la carte les montre
  // à la place de « Valider », il n'y a rien à exécuter.
  links?: { label: string; href: string }[];
};

const isoDay = z.iso.date();
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: "Heure au format HH:MM." });
const quarter = z.string().regex(/^([01]\d|2[0-3]):(00|15|30|45)$/, {
  error: "Heure au quart d'heure (HH:00, 15, 30, 45).",
});
const amount = z.number().positive().max(1_000_000);
const vatRate = z.number().min(0).max(100);
const text = (max: number) => z.string().trim().min(1).max(max);
const availableDaysSchema = z.array(z.enum(WEEKDAYS)).max(7).optional();

const EDITS_LIMIT = `${MAX_PROGRAM_EDITS} changements au plus par carte : propose les suivants une fois celle-ci validée.`;

// Sportif existant (son id) ou fiche créée par une autre carte de la même réponse.
export const athleteRefSchema = z.union([
  z.strictObject({ athleteId: z.uuid() }),
  z.strictObject({ fromCard: z.string().min(1).max(64) }),
]);
export type AthleteRef = z.infer<typeof athleteRefSchema>;

export const PARAMS = {
  creer_sportif: z.strictObject({
    firstName: text(80),
    lastName: text(80).optional(),
    sex: z.enum(SEXES).optional(),
    email: z.email().optional(),
    phone: z.string().trim().max(24).optional(),
    level: z.enum(ATHLETE_LEVELS).optional(),
    programType: z.enum(DISCIPLINES).optional(),
    goalType: z.enum(GOAL_TYPES).optional(),
    goalDate: isoDay.optional(),
    competitionName: text(120).optional(),
  }),
  creer_seance: z
    .strictObject({
      kind: z.enum(SESSION_KINDS),
      title: text(120),
      discipline: z.enum(DISCIPLINES).optional(),
      location: text(120).optional(),
      startsOn: isoDay,
      startTime: time,
      durationMinutes: z.number().int().min(5).max(600),
      allDay: z.boolean().optional(),
      // Alertes (D-205, D-207) : minutes avant le début, deux au plus.
      alerts: alertsSchema.optional(),
      repeatsWeekly: z.boolean().optional(),
      endsOn: isoDay.optional(),
      athlete: athleteRefSchema.optional(),
      athleteIds: z.array(z.uuid()).max(100).optional(),
      price: z.number().min(0).max(1_000_000).optional(),
      vatRate: vatRate.optional(),
      vatIncluded: z.boolean().optional(),
      paymentMethod: z.enum(SESSION_PAYMENT_METHODS).optional(),
      notes: z.string().trim().max(1000).optional(),
    })
    .refine((params) => params.kind !== "individual" || params.athlete !== undefined, {
      error: "Une séance individuelle demande son sportif.",
    })
    .refine(
      (params) => parseAlerts((params.alerts ?? []).join(","), params.allDay === true) !== null,
      { error: ALERTS_ERROR },
    ),
  // Toute la série se décale de 3 jours au plus, comme au glisser dans l'agenda (relecture n°1) : au-delà,
  // l'agenda ramènerait l'écart dans cette fenêtre et la carte mentirait.
  deplacer_seance: z
    .strictObject({
      sessionId: z.uuid(),
      originalDate: isoDay,
      newDate: isoDay,
      newTime: quarter,
      scope: z.enum(["single", "series"]),
    })
    .refine(
      (p) =>
        p.scope !== "series" ||
        Math.abs(Date.parse(p.newDate) - Date.parse(p.originalDate)) <= 3 * 86_400_000,
      { error: "Toute la série se déplace de 3 jours au plus, comme dans l'agenda." },
    ),
  marquer_seance_payee: z.strictObject({ sessionId: z.uuid(), sessionDate: isoDay }),
  noter_paiement: z.strictObject({
    athlete: athleteRefSchema,
    receivedOn: isoDay,
    amount,
    vatRate: vatRate.optional(),
    method: z.enum(PAYMENT_METHODS),
    label: z.string().trim().max(120).optional(),
  }),
  noter_depense: z.strictObject({
    label: text(120),
    categoryId: z.uuid().optional(),
    amount,
    vatRate: vatRate.optional(),
    spentOn: isoDay,
    repeatsMonthly: z.boolean().optional(),
    endsOn: isoDay.optional(),
  }),
  creer_tache: z.strictObject({
    title: text(200),
    priority: z.enum(["high", "normal"]).optional(),
    dueOn: isoDay.optional(),
    listId: z.uuid().optional(),
    athlete: athleteRefSchema.optional(),
    notes: z.string().trim().max(1000).optional(),
  }),
  creer_liste_de_taches: z.strictObject({ name: text(40) }),
  // Lot 2 (D-181) : ranger le fichier JOINT par le coach dans ses Documents. Le fichier n'est jamais
  // dans la proposition (il reste dans le navigateur) : seulement son nom de document, sa catégorie et
  // son sportif.
  importer_document: z.strictObject({
    name: text(160),
    categoryId: z.uuid().optional(),
    athleteId: z.uuid().optional(),
    // D-213 : le fichier joint à ranger, parmi plusieurs (son nom).
    fichier: text(200).optional(),
  }),
  // Lot 2 (D-181) : les PDF d'un programme PUBLIÉ (dernière version), en liens ; jamais d'envoi.
  preparer_pdf: z.strictObject({ programId: z.uuid() }),
  // Lot 2 (D-181) : un exercice du coach dans sa Bibliothèque, sans photo (elle s'ajoute ensuite dans la
  // page de l'exercice). Muscles, matériel et lien vidéo passent par les règles du formulaire.
  creer_exercice: z.strictObject({
    name: text(80),
    category: z.enum(EXERCISE_CATEGORIES),
    muscleGroups: z.array(z.string().max(40)).max(13).optional(),
    equipment: z
      .enum(EQUIPMENT_KEYS, {
        error: `Matériel inconnu : choisis parmi ${EQUIPMENT_KEYS.join(", ")}.`,
      })
      .optional(),
    instructions: z.array(text(300)).max(15).optional(),
    videoUrl: z.string().trim().max(300).optional(),
  }),
  // Lot 2 (D-181) : compléter une fiche, seulement les champs manquants ou demandés. Jamais le statut
  // (archiver), la santé, les notes ni les accords : ils ne sont pas dans la liste.
  completer_fiche: z.strictObject({
    athleteId: z.uuid(),
    changes: z
      .strictObject({
        firstName: text(80).optional(),
        lastName: text(80).optional(),
        sex: z.enum(SEXES).optional(),
        email: z.email().max(254).optional(),
        phone: z.string().trim().min(6).max(24).optional(),
        preferredContact: z.enum(CONTACT_CHANNELS).optional(),
        level: z.enum(ATHLETE_LEVELS).optional(),
        experience: text(500).optional(),
        trainingPlaces: z.array(z.enum(TRAINING_PLACES)).min(1).max(5).optional(),
        equipment: text(500).optional(),
        addressLine: text(160).optional(),
        postalCode: text(10).optional(),
        city: text(80).optional(),
        country: z.string().length(2).optional(),
      })
      .refine((changes) => Object.keys(changes).length > 0, {
        error: "Indique au moins un champ à compléter.",
      }),
    // Noté par le SERVEUR à la proposition (relecture du lot 2, n°d) : la valeur de chaque champ changé.
    // Au clic, une fiche modifiée entre-temps refuse la carte au lieu d'écraser la saisie du coach.
    avant: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
  }),
  // Lot 3a : un BROUILLON de programme, depuis un modèle, une copie, vide, ou écrit par l'assistant
  // (séances décrites une fois avec une référence, puis placées semaine par semaine).
  creer_programme: z
    .strictObject({
      athlete: athleteRefSchema,
      title: text(120),
      discipline: z.enum(["running", "strength", "hyrox"]),
      startDate: isoDay,
      weeksCount: z.number().int().min(1).max(52),
      sessionsPerWeek: z.number().int().min(1).max(14),
      scheduling: z.enum(["ordered", "fixed"]),
      // Façon de viser : notée par le SERVEUR selon le sportif (relecture du lot 3a, n°7), comme
      // l'assistant de création ; la même au « Valider ».
      aimDefaults: aimDefaultsSchema.optional(),
      // Jours disponibles du sportif : notés par le SERVEUR (revue du 20/11, n°3), les mêmes au clic.
      joursDisponibles: availableDaysSchema,
      goal: programGoalSchema.optional(),
      phases: z
        .array(
          z.strictObject({
            name: text(40),
            weekFrom: z.number().int().min(1).max(52),
            weekTo: z.number().int().min(1).max(52),
          }),
        )
        .max(12)
        .optional(),
      start: z.discriminatedUnion("kind", [
        z.strictObject({ kind: z.literal("blank") }),
        z.strictObject({ kind: z.literal("template"), templateId: z.uuid() }),
        z.strictObject({ kind: z.literal("copy"), programId: z.uuid() }),
      ]),
      seances: z
        .array(
          sessionBodySchema.extend({
            ref: z.string().regex(/^[A-Za-z0-9_-]{1,20}$/),
            fixedDay: z.enum(WEEKDAYS).optional(),
            fixedTime: time.optional(),
            moment: z.enum(SESSION_MOMENTS).optional(),
          }),
        )
        .max(30)
        .optional(),
      semaines: z
        .array(
          z.strictObject({
            index: z.number().int().min(1).max(52),
            light: z.boolean().optional(),
            seances: z.array(z.string()).max(14),
          }),
        )
        .max(52)
        .optional(),
    })
    .refine(
      (p) => p.start.kind === "blank" || (p.seances === undefined && p.semaines === undefined),
      { error: "Des séances écrites seulement pour un programme parti de zéro (start blank)." },
    ),
  // Lot 3b (D-182) : chaque geste de l'éditeur sur le BROUILLON d'un programme, ou sur un de Mes
  // modèles. `revision` (ou `version`) : celle que Claude a lue ; le serveur la compare à la sienne à
  // la proposition, puis au « Valider » (rien n'écrase un brouillon modifié entre-temps).
  modifier_programme: z.strictObject({
    programId: z.uuid(),
    revision: z.number().int().min(0),
    operations: z.array(programEditSchema).min(1).max(MAX_PROGRAM_EDITS, { error: EDITS_LIMIT }),
    // Notés par le SERVEUR (revue du 20/11, n°4) : les jours proposés au clic sont ceux de la carte.
    joursDisponibles: availableDaysSchema,
  }),
  modifier_modele: z.strictObject({
    templateId: z.uuid(),
    version: z.number().int().min(1),
    operations: z.array(programEditSchema).min(1).max(MAX_PROGRAM_EDITS, { error: EDITS_LIMIT }),
  }),
  // Lot 3b (D-182) : les actions d'un programme, comme ses boutons. `revision` : notée par le SERVEUR
  // à la proposition (ce que la carte publie ou copie), revérifiée au « Valider ».
  publier_programme: z.strictObject({
    programId: z.uuid(),
    revision: z.number().int().min(1).optional(),
  }),
  archiver_programme: z.strictObject({ programId: z.uuid() }),
  desarchiver_programme: z.strictObject({ programId: z.uuid() }),
  dupliquer_programme: z.strictObject({ programId: z.uuid() }),
  enregistrer_comme_modele: z.strictObject({ programId: z.uuid(), titre: text(120) }),
  // Le titre devient celui de la séance du modèle (80 caractères, comme toute séance).
  enregistrer_seance_comme_modele: z.strictObject({
    programId: z.uuid(),
    cle: z.string().regex(/^[A-Za-z0-9_-]{1,80}$/),
    titre: text(80),
    revision: z.number().int().min(0).optional(),
  }),
  // Modèles : de programme (par défaut) ou de séance, comme les deux sortes de l'onglet Modèles.
  dupliquer_modele: z.strictObject({
    templateId: z.uuid(),
    sorte: z.enum(["programme", "seance"]).optional(),
  }),
  archiver_modele: z.strictObject({
    templateId: z.uuid(),
    sorte: z.enum(["programme", "seance"]).optional(),
  }),
  // « Créer un modèle » (assistant de création, mode modèle) : vide, ou repris d'un autre modèle.
  creer_modele: z.strictObject({
    titre: text(120),
    discipline: z.enum(DISCIPLINES),
    semaines: z.number().int().min(1).max(52),
    seancesParSemaine: z.number().int().min(1).max(14),
    organisation: z.enum(["ordered", "fixed"]).optional(),
    depuisModele: z.uuid().optional(),
    phases: z
      .array(
        z.strictObject({
          nom: text(40),
          de: z.number().int().min(1).max(52),
          a: z.number().int().min(1).max(52),
        }),
      )
      .max(12)
      .optional(),
  }),
  // Lot 4 (D-183) : agenda, comptabilité, tâches, documents (daily.ts).
  ...DAILY_PARAMS,
  // Lot 5 (D-184) : les sportifs (sportifs.ts).
  ...SPORTIFS_PARAMS,
  // Lot 6 (D-185) : les réglages (reglages.ts).
  ...REGLAGES_PARAMS,
} as const;

export const ACTION_KINDS = Object.keys(PARAMS) as AssistantActionKind[];

export const assistantActionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("creer_sportif"), params: PARAMS.creer_sportif }),
  z.object({ kind: z.literal("creer_seance"), params: PARAMS.creer_seance }),
  z.object({ kind: z.literal("deplacer_seance"), params: PARAMS.deplacer_seance }),
  z.object({ kind: z.literal("marquer_seance_payee"), params: PARAMS.marquer_seance_payee }),
  z.object({ kind: z.literal("noter_paiement"), params: PARAMS.noter_paiement }),
  z.object({ kind: z.literal("noter_depense"), params: PARAMS.noter_depense }),
  z.object({ kind: z.literal("creer_tache"), params: PARAMS.creer_tache }),
  z.object({ kind: z.literal("creer_liste_de_taches"), params: PARAMS.creer_liste_de_taches }),
  z.object({ kind: z.literal("creer_programme"), params: PARAMS.creer_programme }),
  z.object({ kind: z.literal("completer_fiche"), params: PARAMS.completer_fiche }),
  z.object({ kind: z.literal("creer_exercice"), params: PARAMS.creer_exercice }),
  z.object({ kind: z.literal("preparer_pdf"), params: PARAMS.preparer_pdf }),
  z.object({ kind: z.literal("importer_document"), params: PARAMS.importer_document }),
  z.object({ kind: z.literal("modifier_programme"), params: PARAMS.modifier_programme }),
  z.object({ kind: z.literal("modifier_modele"), params: PARAMS.modifier_modele }),
  z.object({ kind: z.literal("publier_programme"), params: PARAMS.publier_programme }),
  z.object({ kind: z.literal("archiver_programme"), params: PARAMS.archiver_programme }),
  z.object({ kind: z.literal("desarchiver_programme"), params: PARAMS.desarchiver_programme }),
  z.object({ kind: z.literal("dupliquer_programme"), params: PARAMS.dupliquer_programme }),
  z.object({
    kind: z.literal("enregistrer_comme_modele"),
    params: PARAMS.enregistrer_comme_modele,
  }),
  z.object({
    kind: z.literal("enregistrer_seance_comme_modele"),
    params: PARAMS.enregistrer_seance_comme_modele,
  }),
  z.object({ kind: z.literal("dupliquer_modele"), params: PARAMS.dupliquer_modele }),
  z.object({ kind: z.literal("archiver_modele"), params: PARAMS.archiver_modele }),
  z.object({ kind: z.literal("creer_modele"), params: PARAMS.creer_modele }),
  ...DAILY_ACTIONS,
  ...SPORTIFS_ACTIONS,
  ...REGLAGES_ACTIONS,
]);
export type ParsedAssistantAction = z.infer<typeof assistantActionSchema>;

// --- Résumés de carte --------------------------------------------------------------------------

// Lot 4 : le titre d'une carte du quotidien vient de summarizeDaily (il dépend de l'action).
const TITLES: Record<
  Exclude<AssistantActionKind, DailyKind | SportifsKind | ReglagesKind>,
  string
> = {
  creer_sportif: "Nouvelle fiche sportif",
  creer_seance: "Nouvelle séance",
  deplacer_seance: "Déplacer une séance",
  marquer_seance_payee: "Marquer une séance payée",
  noter_paiement: "Nouveau paiement",
  noter_depense: "Nouvelle dépense",
  creer_tache: "Nouvelle tâche",
  creer_liste_de_taches: "Nouvelle liste de tâches",
  creer_programme: "Nouveau programme",
  completer_fiche: "Compléter la fiche",
  creer_exercice: "Nouvel exercice",
  preparer_pdf: "PDF du programme",
  importer_document: "Importer un document",
  modifier_programme: "Modifier le programme",
  modifier_modele: "Modifier le modèle",
  publier_programme: "Publier le programme",
  archiver_programme: "Archiver le programme",
  desarchiver_programme: "Désarchiver le programme",
  dupliquer_programme: "Dupliquer le programme",
  enregistrer_comme_modele: "Enregistrer comme modèle",
  enregistrer_seance_comme_modele: "Enregistrer la séance comme modèle",
  dupliquer_modele: "Dupliquer dans Mes modèles",
  archiver_modele: "Archiver le modèle",
  creer_modele: "Nouveau modèle",
};

// Les PDF viennent de la version publiée : rien pour un programme introuvable ou jamais publié.
// Relecture du lot 2, n°a : la version publiée se date au jour de Bruxelles (pas en UTC : publiée à
// 0 h 30, elle aurait la date de la veille).
export const publicationLine = (number: number, publishedAt: string) =>
  `Version ${number} publiée le ${dayInWords(brusselsDayOf(publishedAt))}`;

// Relecture du lot 2, n°f : doublon d'exercice au nom près, sans casse ni espaces en trop ; comparé
// ici plutôt que par un motif de la base (où « * » devenait un joker).
const exerciseKey = (name: string) => name.trim().replace(/\s+/g, " ").toLocaleLowerCase("fr");
export const sameExerciseName = (a: string, b: string) => exerciseKey(a) === exerciseKey(b);

// Revue du 20/11, n°12 : TOUS les exercices du coach, lus page par page (la base rend 1 000 lignes au
// plus par lecture), pas seulement les premiers. null si une lecture échoue.
export const EXERCISE_PAGE = 1000;
export async function hasExerciseNamed(
  readPage: (from: number, to: number) => Promise<readonly { name_fr: string }[] | null>,
  name: string,
): Promise<boolean | null> {
  for (let from = 0; ; from += EXERCISE_PAGE) {
    const rows = await readPage(from, from + EXERCISE_PAGE - 1);
    if (rows === null) return null;
    if (rows.some((row) => sameExerciseName(row.name_fr, name))) return true;
    if (rows.length < EXERCISE_PAGE) return false;
  }
}

// Relecture du lot 2, n°e : seuls les champs qui changent vraiment vont sur la carte (jamais
// « Bruxelles → Bruxelles »).
const fieldValue = (value: unknown) => JSON.stringify(value ?? "");
export function changedAthleteFields(
  current: Record<string, unknown>,
  changes: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(changes).filter(
      ([field, value]) => fieldValue(current[field]) !== fieldValue(value),
    ),
  );
}

// « Compléter la fiche » : refus du serveur, en règle pure (relecture du lot 2, n°j : testés sans base).
export function athleteFicheRefusal(
  detail: { status: string; hasAccount: boolean } | null,
  changes: Record<string, unknown>,
): string | null {
  if (!detail || detail.status === "archived") {
    return "Sportif introuvable ou archivé : cherche-le avec chercher_sportifs.";
  }
  if (changes.email !== undefined && detail.hasAccount) {
    return "Le sportif a activé son compte : son adresse e-mail ne peut plus être modifiée ici.";
  }
  return null;
}

// Relecture du lot 2, n°d : un champ modifié entre la carte et le clic refuse la carte.
export function staleAthleteFields(
  before: Record<string, unknown> | undefined,
  current: Record<string, unknown>,
): string | null {
  if (!before) return null;
  const changed = Object.entries(before)
    .filter(([field, value]) => fieldValue(current[field]) !== fieldValue(value))
    .map(([field]) => ATHLETE_FIELD_LABELS[field] ?? field);
  return changed.length > 0
    ? `La fiche a changé depuis la carte (${changed.join(", ")}) : redemande à l'assistant pour ne rien écraser.`
    : null;
}

export function pdfRefusal(program: { published: boolean } | null): string | null {
  if (!program) return "Programme introuvable : regarde voir_programmes.";
  return program.published
    ? null
    : "Ce programme n'est pas encore publié : publie-le d'abord dans l'éditeur.";
}

// « Compléter la fiche » : nom de chaque champ et valeur lisible (« Niveau : Débutant → Confirmé »).
export const ATHLETE_FIELD_LABELS: Record<string, string> = {
  firstName: "Prénom",
  lastName: "Nom",
  sex: "Sexe",
  email: "E-mail",
  phone: "Téléphone",
  preferredContact: "Contact préféré",
  level: "Niveau",
  experience: "Expérience",
  trainingPlaces: "Lieux d'entraînement",
  equipment: "Matériel",
  addressLine: "Adresse",
  postalCode: "Code postal",
  city: "Ville",
  country: "Pays",
};
const countryNames = new Map(COUNTRY_NAMES);
export function athleteFieldText(field: string, value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((place) => trainingPlaceLabels[place as TrainingPlace] ?? place).join(", ");
  }
  const text = typeof value === "string" ? value : "";
  if (!text) return "";
  switch (field) {
    case "sex":
      return sexLabels[text as Sex] ?? text;
    case "level":
      return athleteLevelLabels[text as AthleteLevel] ?? text;
    case "preferredContact":
      return contactChannelLabels[text as ContactChannel] ?? text;
    case "country":
      return countryNames.get(text) ?? text;
    default:
      return text;
  }
}

// Coordonnées d'un sportif : voir_fiche dit seulement « rempli » ou « vide » (décision d'Antonino du
// 14/11/2026, confirmée le 20/11). La carte renvoyée à Claude (proposalToolResult) suit la même règle :
// le coach voit « ancien → nouveau », Claude lit « rempli → nouveau » (la nouvelle valeur vient de lui).
// Même règle pour le téléphone du coach (voir_parametres, carte « Modifier ton profil »).
const PRIVATE_FIELDS: Partial<
  Record<
    AssistantAction["kind"],
    {
      labels: Record<string, string>;
      fields: readonly string[];
      text: (field: string, value: unknown) => string;
    }
  >
> = {
  completer_fiche: {
    labels: ATHLETE_FIELD_LABELS,
    fields: ["email", "phone", "addressLine", "postalCode", "city"],
    text: athleteFieldText,
  },
  modifier_profil: {
    labels: PROFILE_LABELS,
    fields: ["phone"],
    text: (_field, value) => (value === null || value === "" ? "—" : String(value)),
  },
};

export function summaryForClaude(
  proposal: AssistantAction & { summary: readonly string[] },
): readonly string[] {
  const rule = PRIVATE_FIELDS[proposal.kind];
  if (!rule) return proposal.summary;
  const changes = ((proposal.params as { changes?: unknown }).changes ?? {}) as Record<
    string,
    unknown
  >;
  return proposal.summary.map((line) => {
    const field = rule.fields.find(
      (key) => key in changes && line.startsWith(`${rule.labels[key]} : `),
    );
    if (!field) return line;
    const label = rule.labels[field];
    const after = rule.text(field, changes[field]);
    const before = line.startsWith(`${label} : — → `) ? "vide" : "rempli";
    return `${label} : ${before} → ${after}`;
  });
}

const METHOD: Record<string, string> = {
  cash: "espèces",
  transfer: "virement",
  bancontact: "Bancontact",
  other: "autre moyen",
};
const LEVEL: Record<string, string> = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Confirmé",
  competitor: "Compétiteur",
};
const DISCIPLINE: Record<string, string> = {
  running: "Running",
  strength: "Musculation",
  hyrox: "Hyrox",
  hybrid: "Hybride",
};

const money = (value: number, currency: Currency) =>
  formatMoney(Math.round(value * 100), currency).replace(/\s/g, " ");
const rate = (value: number) => `${String(value).replace(".", ",")} %`;
const str = (value: unknown) => (typeof value === "string" ? value : "");
const num = (value: unknown) => (typeof value === "number" ? value : 0);

// Nom à afficher pour un sportif (existant : `names` ; à créer : le nom de sa carte, dans `names`
// sous l'identifiant de la carte).
function athleteName(ref: unknown, names: Record<string, string>): string | null {
  if (!ref || typeof ref !== "object") return null;
  const key = "athleteId" in ref ? str(ref.athleteId) : "fromCard" in ref ? str(ref.fromCard) : "";
  return names[key] ?? null;
}

// Ce que montre la carte. `names` : noms lisibles des identifiants (sportifs, séances, listes,
// catégories), résolus par le serveur ; `currency` : devise de l'organisation.
export function summarize(
  action: AssistantAction,
  names: Record<string, string>,
  currency: Currency,
): { title: string; summary: string[] } {
  const daily =
    summarizeDaily(action, names, currency) ??
    summarizeSportifs(action, names) ??
    summarizeReglages(action, names, currency);
  if (daily) return daily;
  const kind = action.kind as Exclude<AssistantActionKind, DailyKind | SportifsKind | ReglagesKind>;
  const p = action.params;
  const lines: (string | null | false)[] = [];
  switch (kind) {
    case "creer_sportif": {
      lines.push([str(p.firstName), str(p.lastName)].filter(Boolean).join(" "));
      const profile = [LEVEL[str(p.level)], DISCIPLINE[str(p.programType)]].filter(Boolean);
      lines.push(profile.length > 0 && profile.join(" · "));
      if (p.goalType || p.competitionName) {
        const goal =
          str(p.competitionName) || goalTypeLabels[str(p.goalType) as GoalType] || "Objectif";
        lines.push(p.goalDate ? `${goal} le ${dayInWords(str(p.goalDate))}` : goal);
      }
      lines.push(str(p.email) || null, str(p.phone) || null);
      break;
    }
    case "creer_seance": {
      lines.push(str(p.title));
      // Séance collective : les inscrits par leur nom complet (relecture n°4).
      const enrolled = (p.athleteIds as string[] | undefined) ?? [];
      lines.push(
        p.kind === "group"
          ? enrolled.length > 0
            ? `Inscrits : ${enrolled.map((id) => names[id] ?? "?").join(", ")}`
            : "Collective · aucun inscrit"
          : athleteName(p.athlete, names),
      );
      const when =
        p.allDay === true
          ? `${dayInWords(str(p.startsOn))} · toute la journée`
          : `${dayInWords(str(p.startsOn))} · ${str(p.startTime)} · ${num(p.durationMinutes)} min`;
      const until = p.endsOn ? ` jusqu'au ${dayInWords(str(p.endsOn))}` : "";
      lines.push(p.repeatsWeekly ? `${when} · chaque semaine${until}` : when);
      lines.push(
        Array.isArray(p.alerts) && p.alerts.length > 0
          ? `Alertes : ${alertsText(p.alerts as number[])}`
          : null,
      );
      lines.push(str(p.location) || null);
      if (typeof p.price === "number" && p.price > 0) {
        const vat = num(p.vatRate);
        const price =
          vat > 0
            ? p.vatIncluded
              ? `${money(p.price, currency)} TVA ${rate(vat)} comprise`
              : `${money(p.price, currency)} HTVA + TVA ${rate(vat)}`
            : money(p.price, currency);
        lines.push([price, METHOD[str(p.paymentMethod)]].filter(Boolean).join(" · "));
      }
      break;
    }
    case "deplacer_seance":
      lines.push(names[str(p.sessionId)] ?? null);
      lines.push(
        `Du ${dayInWords(str(p.originalDate))} au ${dayInWords(str(p.newDate))} à ${str(p.newTime)}`,
      );
      lines.push(p.scope === "series" ? "Toute la série" : "Cette date seulement");
      break;
    case "marquer_seance_payee":
      lines.push(names[str(p.sessionId)] ?? null);
      lines.push(`Séance du ${dayInWords(str(p.sessionDate))}`);
      lines.push(names[`${str(p.sessionId)}:montant`] ?? null);
      break;
    case "noter_paiement":
      lines.push(athleteName(p.athlete, names));
      const paidVat = num(p.vatRate) > 0 ? ` dont TVA ${rate(num(p.vatRate))}` : "";
      lines.push(`${money(num(p.amount), currency)}${paidVat} · ${METHOD[str(p.method)] ?? ""}`);
      lines.push(`Reçu le ${dayInWords(str(p.receivedOn))}`);
      lines.push(str(p.label) || null);
      break;
    case "noter_depense": {
      lines.push(str(p.label));
      const category = names[str(p.categoryId)];
      const spentVat = num(p.vatRate) > 0 ? ` dont TVA ${rate(num(p.vatRate))}` : "";
      lines.push(
        [`${money(num(p.amount), currency)}${spentVat}`, category].filter(Boolean).join(" · "),
      );
      const since = dayInWords(str(p.spentOn));
      lines.push(
        p.repeatsMonthly
          ? `Chaque mois depuis le ${since}${p.endsOn ? `, jusqu'au ${dayInWords(str(p.endsOn))}` : ""}`
          : `Le ${since}`,
      );
      break;
    }
    case "creer_tache": {
      lines.push(str(p.title));
      lines.push(p.dueOn ? `Pour le ${dayInWords(str(p.dueOn))}` : "Sans échéance");
      lines.push(p.priority === "high" && "Priorité haute");
      const list = names[str(p.listId)];
      lines.push(list ? `Liste : ${list}` : null);
      const athlete = athleteName(p.athlete, names);
      lines.push(athlete ? `Sportif : ${athlete}` : null);
      break;
    }
    case "creer_liste_de_taches":
      lines.push(str(p.name));
      break;
    case "importer_document":
      lines.push(str(p.name));
      lines.push(names.fichier ? `Fichier : ${names.fichier}` : null);
      lines.push(
        p.categoryId ? `Catégorie : ${names[str(p.categoryId)] ?? "?"}` : "Sans catégorie",
      );
      lines.push(p.athleteId ? `Sportif : ${names[str(p.athleteId)] ?? "?"}` : null);
      break;
    case "preparer_pdf":
      lines.push(
        names[str(p.programId)] ?? "Programme",
        names.sportif ?? null,
        names.version ?? null,
      );
      break;
    case "creer_exercice": {
      lines.push(str(p.name));
      const muscles = ((p.muscleGroups as string[] | undefined) ?? []).map(
        (group) => muscleGroupLabels[group as MuscleGroup] ?? group,
      );
      lines.push(
        [exerciseCategoryLabels[str(p.category) as ExerciseCategory], muscles.join(", ")]
          .filter(Boolean)
          .join(" · "),
      );
      lines.push(
        p.equipment
          ? `Matériel : ${equipmentInfo[str(p.equipment)]?.label ?? str(p.equipment)}`
          : "Poids du corps",
      );
      const steps = ((p.instructions as string[] | undefined) ?? []).length;
      lines.push(steps > 0 && `${steps} consigne${steps > 1 ? "s" : ""}`);
      lines.push(str(p.videoUrl) ? "Avec une vidéo" : null);
      // Mis par le serveur quand un exercice du coach porte déjà ce nom (doublon possible).
      lines.push(names.doublon ? "Un exercice porte déjà ce nom dans ta Bibliothèque" : null);
      break;
    }
    case "completer_fiche": {
      lines.push(names[str(p.athleteId)] ?? "Sportif");
      // Chaque changement « ancien → nouveau » (« — » pour un champ vide) : le coach voit ce qui
      // remplace une valeur déjà écrite.
      for (const [field, value] of Object.entries((p.changes ?? {}) as Record<string, unknown>)) {
        const before = athleteFieldText(field, names[`avant:${field}`]) || "—";
        lines.push(
          `${ATHLETE_FIELD_LABELS[field] ?? field} : ${before} → ${athleteFieldText(field, value)}`,
        );
      }
      break;
    }
    case "modifier_programme":
    case "modifier_modele": {
      // Lignes préparées par le serveur (editCardNames) : l'état lu au moment de la proposition.
      lines.push(names.titre ?? "Programme", names.sportif ?? null);
      for (let index = 0; names[`ligne:${index}`] !== undefined; index++) {
        lines.push(names[`ligne:${index}`] ?? null);
      }
      lines.push(names.statut ?? null);
      break;
    }
    // Lot 3b : lignes préparées par le serveur (actionCardNames), phrases des fenêtres de l'éditeur.
    case "publier_programme":
      lines.push(names.ligne ?? "Programme");
      for (let index = 0; names[`attention:${index}`] !== undefined; index++) {
        lines.push(names[`attention:${index}`] ?? null);
      }
      lines.push("Le PDF sera tiré de cette version.");
      break;
    case "archiver_programme":
      lines.push(
        names.ligne ?? "Programme",
        "Il quitte la liste des programmes et la fiche du sportif. Ses versions publiées restent conservées.",
      );
      break;
    case "desarchiver_programme":
      lines.push(names.ligne ?? "Programme", names.etat ?? null);
      break;
    case "dupliquer_programme":
      lines.push(
        names.ligne ?? "Programme",
        names.debut ?? null,
        "Les rendez-vous du coach ne se copient pas",
      );
      break;
    case "enregistrer_comme_modele":
      lines.push(`« ${str(p.titre)} » dans Mes modèles`, names.depuis ?? null);
      break;
    case "enregistrer_seance_comme_modele":
      lines.push(`« ${str(p.titre)} » dans Mes modèles (séances)`, names.depuis ?? null);
      break;
    case "dupliquer_modele":
      lines.push(
        names.ligne ?? "Modèle",
        "La copie va dans Mes modèles ; l'original ne change pas",
      );
      break;
    case "archiver_modele":
      lines.push(
        names.ligne ?? "Modèle",
        "Il ne sera plus proposé. Les programmes déjà créés avec lui ne changent pas.",
      );
      break;
    case "creer_modele": {
      lines.push(`« ${str(p.titre)} »`);
      const per = num(p.seancesParSemaine);
      lines.push(
        `${DISCIPLINE[str(p.discipline)]} · ${num(p.semaines)} semaines · ${per} séance${per > 1 ? "s" : ""} par semaine${p.organisation === "fixed" ? " · jours fixés" : ""}`,
      );
      const phases = (p.phases as { nom: string }[] | undefined) ?? [];
      lines.push(phases.length > 0 && `Phases : ${phases.map((phase) => phase.nom).join(", ")}`);
      lines.push(
        p.depuisModele
          ? `Depuis le modèle « ${names[str(p.depuisModele)] ?? "?"} »`
          : "Vide, à remplir dans l'éditeur",
      );
      break;
    }
    case "creer_programme": {
      lines.push(str(p.title));
      lines.push(athleteName(p.athlete, names));
      const per = num(p.sessionsPerWeek);
      lines.push(
        `${DISCIPLINE[str(p.discipline)]} · ${num(p.weeksCount)} semaines · ${per} séance${per > 1 ? "s" : ""} par semaine`,
      );
      lines.push(
        `Dès le ${dayInWords(str(p.startDate))}, ${p.scheduling === "fixed" ? "aux jours fixés" : "dans l'ordre"}`,
      );
      const start = p.start as { kind: string; templateId?: string; programId?: string };
      lines.push(
        start.kind === "template"
          ? `Depuis le modèle « ${names[str(start.templateId)] ?? "?"} »`
          : start.kind === "copy"
            ? `Copie de « ${names[str(start.programId)] ?? "?"} »`
            : p.semaines
              ? `Séances écrites par l'assistant : ${placedSessions(p)}`
              : "Programme vide, à remplir dans l'éditeur",
      );
      const goal = p.goal as { raceName?: string; raceDate?: string } | undefined;
      if (goal?.raceName || goal?.raceDate) {
        lines.push(
          [goal.raceName ?? "Objectif", goal.raceDate ? `le ${dayInWords(goal.raceDate)}` : null]
            .filter(Boolean)
            .join(" "),
        );
      }
      lines.push(names.chevauchement ?? null);
      lines.push("Brouillon : à relire et publier dans l'éditeur");
      break;
    }
  }
  return {
    title: TITLES[kind],
    summary: lines.filter((line): line is string => typeof line === "string" && line !== ""),
  };
}

// --- Cartes liées ------------------------------------------------------------------------------

const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();

// « Crée la fiche de Lucas Martin puis… » : le sportif à créer est désigné par son nom ; il doit être
// celui d'une carte « Nouvelle fiche sportif » de la même réponse.
export function linkNewAthlete(
  pending: AssistantProposal[],
  name: string,
): { ok: true; cardId: string } | { ok: false; error: string } {
  const wanted = fold(name);
  const card = pending.find(
    (proposal) =>
      proposal.kind === "creer_sportif" &&
      fold([str(proposal.params.firstName), str(proposal.params.lastName)].join(" ")) === wanted,
  );
  return card
    ? { ok: true, cardId: card.id }
    : {
        ok: false,
        error: `Aucune fiche à créer pour « ${name} » dans cette réponse : cherche le sportif (chercher_sportifs) ou propose d'abord sa fiche (creer_sportif).`,
      };
}

// Paramètres d'un outil d'écriture venant de Claude : jamais de renvoi brut à une carte (relecture
// n°11 : seul le serveur relie une carte, par le nom du sportif à créer), puis le schéma strict.
export function prepareToolInput(
  name: string,
  input: unknown,
  pending: AssistantProposal[],
):
  | {
      ok: true;
      action: ParsedAssistantAction;
      dependsOn: string | null;
      newAthleteName: string | null;
    }
  | { ok: false; error: string } {
  if (!(ACTION_KINDS as string[]).includes(name))
    return { ok: false, error: `Outil inconnu : ${name}` };
  if (!input || typeof input !== "object") return { ok: false, error: "Paramètres manquants." };
  const params: Record<string, unknown> = { ...(input as Record<string, unknown>) };
  let dependsOn: string | null = null;
  let newAthleteName: string | null = null;
  const ref = params.athlete;
  if (ref && typeof ref === "object") {
    if ("fromCard" in ref) {
      return {
        ok: false,
        error: 'Désigne le sportif par { athleteId } ou par { nouveauSportif: "Prénom Nom" }.',
      };
    }
    if ("nouveauSportif" in ref && typeof ref.nouveauSportif === "string") {
      const link = linkNewAthlete(pending, ref.nouveauSportif);
      if (!link.ok) return link;
      params.athlete = { fromCard: link.cardId };
      dependsOn = link.cardId;
      newAthleteName = ref.nouveauSportif.trim();
    }
  }
  const parsed = assistantActionSchema.safeParse({ kind: name, params });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: `Paramètres invalides (${issue?.path.join(".") ?? ""}) : ${issue?.message ?? ""}`,
    };
  }
  return { ok: true, action: parsed.data, dependsOn, newAthleteName };
}

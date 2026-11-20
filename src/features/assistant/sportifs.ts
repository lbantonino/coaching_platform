import { z } from "zod";

import { DOCUMENT_MAX_BYTES } from "@/domain/documents/documents";
import type { CoachExerciseInput } from "@/domain/exercises/coach-exercise";
import {
  EQUIPMENT_KEYS,
  EXERCISE_CATEGORIES,
  equipmentInfo,
  exerciseCategoryLabels,
  muscleGroupLabels,
  type ExerciseCategory,
  type MuscleGroup,
} from "@/domain/exercises/vocabulary";
import { DISCIPLINES, disciplineLabels, type Discipline } from "@/domain/training/discipline";
import { formatPace } from "@/domain/training/pace";
import {
  ATHLETE_STATUSES,
  WEEK_DAYS,
  athleteStatusLabels,
  weekDayLabels,
  type AthleteStatus,
  type WeekDay,
} from "@/features/athletes/schemas";
import {
  GOAL_PRIORITIES,
  GOAL_TYPES,
  HYROX_CATEGORIES,
  goalStatusLabels,
  goalTypeLabels,
  hyroxCategoryLabels,
  type GoalFormInput,
  type GoalStatus,
  type GoalType,
  type HyroxCategory,
} from "@/features/goals/schemas";
import { NOTE_MAX_LENGTH } from "@/features/notes/schemas";
import {
  RECORD_EVENTS,
  formatRaceTime,
  recordEventLabels,
  type RecordEvent,
} from "@/features/records/schemas";
import {
  referenceKindLabels,
  referenceSourceLabels,
  type ReferenceKind,
  type ReferenceSource,
} from "@/features/references/schemas";

import { dayInWords, type AssistantAttachment } from "./rules";

// Assistant IA, lot 5 (D-184) : les SPORTIFS (statut, discipline, disponibilités, objectifs, repères
// et records, Bibliothèque, photos, note privée), en cartes à valider. Règles PURES : schémas stricts,
// fusions dans les valeurs actuelles, refus, ce que dit chaque carte. Jamais de santé : aucun champ
// « blessures » nulle part ; la note privée s'AJOUTE (décision d'Antonino du 14/11), jamais lue.

const isoDay = z.iso.date();
const text = (max: number) => z.string().trim().min(1).max(max);
const short = (max: number) => z.string().trim().max(max);
const atLeastOne = { error: "Indique au moins un changement." };
const nonEmpty = (value: object) => Object.keys(value).length > 0;

const goalShape = {
  goalType: z.enum(GOAL_TYPES),
  priority: z.enum(GOAL_PRIORITIES).optional(),
  targetDate: isoDay.optional(),
  targetTime: short(10).optional(),
  isCompetition: z.boolean().optional(),
  competitionName: short(120).optional(),
  competitionLocation: short(120).optional(),
  hyroxCategory: z.enum(HYROX_CATEGORIES).optional(),
  description: short(500).optional(),
};

export const SPORTIFS_PARAMS = {
  statut_sportif: z.strictObject({ athleteId: z.uuid(), statut: z.enum(ATHLETE_STATUSES) }),
  discipline_sportif: z.strictObject({ athleteId: z.uuid(), discipline: z.enum(DISCIPLINES) }),
  // Disponibilités SANS les blessures (donnée de santé, jamais touchée par l'assistant).
  disponibilites: z.strictObject({
    athleteId: z.uuid(),
    changes: z
      .strictObject({
        sessionsPerWeek: z.number().int().min(1).max(14).nullable().optional(),
        maxSessionMinutes: z.number().int().min(10).max(300).nullable().optional(),
        availableDays: z.array(z.enum(WEEK_DAYS)).max(7).optional(),
        scheduleConstraints: short(500).nullable().optional(),
      })
      .refine(nonEmpty, atLeastOne),
  }),
  ajouter_objectif: z.strictObject({ athleteId: z.uuid(), objectif: z.strictObject(goalShape) }),
  modifier_objectif: z.strictObject({
    athleteId: z.uuid(),
    goalId: z.uuid(),
    changes: z
      .strictObject({
        goalType: z.enum(GOAL_TYPES).optional(),
        priority: z.enum(GOAL_PRIORITIES).optional(),
        targetDate: isoDay.nullable().optional(),
        targetTime: short(10).nullable().optional(),
        isCompetition: z.boolean().optional(),
        competitionName: short(120).nullable().optional(),
        competitionLocation: short(120).nullable().optional(),
        hyroxCategory: z.enum(HYROX_CATEGORIES).nullable().optional(),
        description: short(500).nullable().optional(),
      })
      .refine(nonEmpty, atLeastOne),
  }),
  statut_objectif: z.strictObject({
    athleteId: z.uuid(),
    goalId: z.uuid(),
    statut: z.enum(["atteint", "abandonne", "principal"]),
  }),
  supprimer_objectif: z.strictObject({ athleteId: z.uuid(), goalId: z.uuid() }),
  // Repère : les champs du formulaire « Ajouter un repère » (validés par parseReferenceForm).
  ajouter_repere: z.strictObject({
    athleteId: z.uuid(),
    repere: z.strictObject({
      kind: z.enum(Object.keys(referenceKindLabels) as [ReferenceKind, ...ReferenceKind[]]),
      pace: short(20).optional(),
      bpm: short(4).optional(),
      exercise: short(80).optional(),
      loadKg: short(10).optional(),
      reps: short(4).optional(),
      source: z.enum(Object.keys(referenceSourceLabels) as [ReferenceSource, ...ReferenceSource[]]),
      measuredOn: isoDay,
      note: short(300).optional(),
    }),
  }),
  reperes_depuis_test: z.strictObject({
    athleteId: z.uuid(),
    test: z.enum(["cooper", "5k"]),
    distance: short(10).optional(),
    time: short(10).optional(),
    measuredOn: isoDay,
    zones: z.array(short(40)).max(12).optional(),
  }),
  supprimer_repere: z.strictObject({ athleteId: z.uuid(), referenceId: z.uuid() }),
  ajouter_record: z.strictObject({
    athleteId: z.uuid(),
    record: z.strictObject({
      event: z.enum(RECORD_EVENTS),
      hyroxCategory: z.enum(HYROX_CATEGORIES).optional(),
      time: text(10),
      achievedOn: isoDay,
      raceName: short(120).optional(),
    }),
  }),
  supprimer_record: z.strictObject({ athleteId: z.uuid(), recordId: z.uuid() }),
  // Bibliothèque : favori (tout exercice) ; modifier ou supprimer (exercices du coach seulement).
  favori_exercice: z.strictObject({ exerciseId: z.uuid(), favori: z.boolean() }),
  modifier_exercice: z.strictObject({
    exerciseId: z.uuid(),
    changes: z
      .strictObject({
        name: text(80).optional(),
        category: z.enum(EXERCISE_CATEGORIES).optional(),
        muscleGroups: z.array(z.string().max(40)).max(13).optional(),
        equipment: z.enum(EQUIPMENT_KEYS).nullable().optional(),
        instructions: z.array(text(300)).max(15).optional(),
        videoUrl: short(300).nullable().optional(),
      })
      .refine(nonEmpty, atLeastOne),
  }),
  supprimer_exercice: z.strictObject({ exerciseId: z.uuid() }),
  // Photo d'un sportif, ou du coach (sans athleteId) : mettre (fichier JOINT) ou retirer.
  photo: z.strictObject({
    action: z.enum(["mettre", "retirer"]),
    athleteId: z.uuid().optional(),
  }),
  ajouter_note: z.strictObject({ athleteId: z.uuid(), texte: text(NOTE_MAX_LENGTH) }),
} as const;

export type SportifsKind = keyof typeof SPORTIFS_PARAMS;
export const SPORTIFS_KINDS = Object.keys(SPORTIFS_PARAMS) as SportifsKind[];
export const isSportifsKind = (kind: string): kind is SportifsKind =>
  (SPORTIFS_KINDS as string[]).includes(kind);

const entry = <K extends SportifsKind>(kind: K) =>
  z.object({ kind: z.literal(kind), params: SPORTIFS_PARAMS[kind] });
export const SPORTIFS_ACTIONS = [
  entry("statut_sportif"),
  entry("discipline_sportif"),
  entry("disponibilites"),
  entry("ajouter_objectif"),
  entry("modifier_objectif"),
  entry("statut_objectif"),
  entry("supprimer_objectif"),
  entry("ajouter_repere"),
  entry("reperes_depuis_test"),
  entry("supprimer_repere"),
  entry("ajouter_record"),
  entry("supprimer_record"),
  entry("favori_exercice"),
  entry("modifier_exercice"),
  entry("supprimer_exercice"),
  entry("photo"),
  entry("ajouter_note"),
] as const;

// --- Fusions dans les valeurs actuelles (relues au clic) ------------------------------------------

export type AvailabilityNow = {
  sessionsPerWeek: number | null;
  maxSessionMinutes: number | null;
  availableDays: readonly WeekDay[];
  scheduleConstraints: string | null;
  // Repris TEL QUEL (donnée de santé) : jamais modifié, jamais affiché, jamais envoyé à Claude.
  healthConstraints: string | null;
};
export type AvailabilityFormValues = {
  sessionsPerWeek: string;
  maxSessionMinutes: string;
  availableDays: WeekDay[];
  scheduleConstraints: string;
  healthConstraints: string;
};

export function mergeAvailability(
  current: AvailabilityNow,
  changes: Record<string, unknown>,
): AvailabilityFormValues {
  const values: AvailabilityFormValues = {
    sessionsPerWeek: current.sessionsPerWeek === null ? "" : String(current.sessionsPerWeek),
    maxSessionMinutes: current.maxSessionMinutes === null ? "" : String(current.maxSessionMinutes),
    availableDays: [...current.availableDays],
    scheduleConstraints: current.scheduleConstraints ?? "",
    healthConstraints: current.healthConstraints ?? "",
  };
  if ("sessionsPerWeek" in changes) {
    values.sessionsPerWeek =
      changes.sessionsPerWeek === null ? "" : String(changes.sessionsPerWeek);
  }
  if ("maxSessionMinutes" in changes) {
    values.maxSessionMinutes =
      changes.maxSessionMinutes === null ? "" : String(changes.maxSessionMinutes);
  }
  if (Array.isArray(changes.availableDays)) {
    values.availableDays = [...(changes.availableDays as WeekDay[])];
  }
  if ("scheduleConstraints" in changes) {
    values.scheduleConstraints =
      changes.scheduleConstraints === null ? "" : String(changes.scheduleConstraints);
  }
  return values;
}

// « Modifier l'objectif » : `current` vient de goalFormValues (la fenêtre de la fiche).
export function mergeGoal(current: GoalFormInput, changes: Record<string, unknown>): GoalFormInput {
  const next: GoalFormInput = { ...current };
  for (const [field, value] of Object.entries(changes)) {
    if (field === "isCompetition") next.isCompetition = value === true;
    else if (field in next) {
      (next as Record<string, unknown>)[field] = value === null ? "" : String(value);
    }
  }
  // Relecture n°3 : nommer une compétition, c'est cocher « Compétition » (sinon le nom serait
  // montré sur la carte, puis ignoré à l'enregistrement).
  if (
    !("isCompetition" in changes) &&
    typeof changes.competitionName === "string" &&
    changes.competitionName.trim() !== ""
  ) {
    next.isCompetition = true;
  }
  return next;
}

// « Modifier l'exercice » : les valeurs du formulaire du coach, puis les changements.
export function mergeCoachExercise(
  current: CoachExerciseInput,
  changes: Record<string, unknown>,
): CoachExerciseInput {
  const next: CoachExerciseInput = { ...current, muscleGroups: [...current.muscleGroups] };
  if (typeof changes.name === "string") next.name = changes.name;
  if (typeof changes.category === "string") next.category = changes.category;
  if (Array.isArray(changes.muscleGroups))
    next.muscleGroups = [...(changes.muscleGroups as string[])];
  if ("equipment" in changes)
    next.equipment = changes.equipment === null ? "" : String(changes.equipment);
  if (Array.isArray(changes.instructions))
    next.instructions = (changes.instructions as string[]).join("\n");
  if ("videoUrl" in changes)
    next.videoUrl = changes.videoUrl === null ? "" : String(changes.videoUrl);
  return next;
}

// La note privée : le texte ajouté, daté, sous la note existante (jamais remplacée).
export function appendNote(existing: string | null, texte: string, today: string): string {
  const [year, month, day] = today.split("-");
  const line = `${day}/${month}/${year} : ${texte.trim()}`;
  return existing && existing.trim() !== "" ? `${existing.trimEnd()}\n\n${line}` : line;
}

// --- Refus purs -----------------------------------------------------------------------------------

export function goalStatusRefusal(
  goal: { priority: string; status: GoalStatus },
  statut: "atteint" | "abandonne" | "principal",
): string | null {
  if (goal.status !== "active") {
    return `Cet objectif est déjà ${goalStatusLabels[goal.status].toLowerCase()} : il n'est plus en cours.`;
  }
  if (statut === "principal" && goal.priority === "main") {
    return "Cet objectif est déjà l'objectif principal.";
  }
  return null;
}

// Relecture du lot 5, n°5 : « Modifier l'objectif » comme la fiche. Un objectif clôturé ne se modifie
// plus (sinon la carte mènerait à « introuvable ») ; une carte sans effet est refusée.
export function goalEditRefusal(
  goal: { status: GoalStatus },
  values: GoalFormInput,
  changes: Record<string, unknown>,
): string | null {
  if (goal.status !== "active") {
    return `Cet objectif est déjà ${goalStatusLabels[goal.status].toLowerCase()} : il n'est plus en cours et ne se modifie plus.`;
  }
  const merged = mergeGoal(values, changes);
  const unchanged = (Object.keys(merged) as (keyof GoalFormInput)[]).every(
    (field) => merged[field] === values[field],
  );
  if (!unchanged) return null;
  return changes.priority === "main" && values.priority === "main"
    ? "Cet objectif est déjà l'objectif principal."
    : "Rien ne change : l'objectif a déjà ces valeurs.";
}

// Un objectif en retard garde sa date passée sans la changer, comme dans la fiche (updateGoal).
export const goalCheckDay = (targetDate: string | null, today: string) =>
  targetDate !== null && targetDate < today ? targetDate : today;

// Relecture du lot 5, n°8 : « Marathon : 3:05:00 », jamais « 185:00 ».
export function recordDeletionLine(record: {
  event: string;
  hyroxCategory: string | null;
  timeSeconds: number;
  achievedOn: string;
}): string {
  return `${recordLine({
    event: record.event,
    hyroxCategory: record.hyroxCategory ?? undefined,
    time: formatRaceTime(record.timeSeconds),
  })} (le ${dayInWords(record.achievedOn)})`;
}

// Comme la Bibliothèque : un exercice Coory se met en favori, ne se modifie ni ne se supprime.
export function coachExerciseRefusal(
  exercise: { organizationId: string | null } | null,
): string | null {
  if (!exercise) return "Exercice introuvable : cherche-le avec chercher_exercices.";
  if (exercise.organizationId === null) {
    return "C'est un exercice Coory : il se met en favori, mais ne se modifie ni ne se supprime. Crée plutôt ton propre exercice (creer_exercice).";
  }
  return null;
}

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export function photoRefusal(
  action: "mettre" | "retirer",
  attachment: AssistantAttachment | undefined,
  hasPhoto: boolean,
): string | null {
  if (action === "retirer") return hasPhoto ? null : "Il n'y a pas de photo à retirer.";
  if (!attachment) {
    return "Aucune image jointe : demande au coach de la joindre avec le bouton « Joindre », puis de redemander.";
  }
  if (!PHOTO_TYPES.includes(attachment.type)) {
    return "Ce fichier n'est pas une image (JPEG, PNG ou WebP).";
  }
  // Relecture n°2 : la photo est réduite dans le navigateur avant l'envoi (comme l'onglet Profil) ;
  // le serveur revérifie ses 2 Mo après réduction.
  if (attachment.size > DOCUMENT_MAX_BYTES) return "Photo trop lourde : 4 Mo maximum.";
  return null;
}

// Relecture n°4 : la note privée RELUE au clic ; si la lecture échoue, rien n'est écrit (sinon
// l'ancienne note serait remplacée par le seul texte ajouté).
export function appendToReadNote(
  read: { data: { body: string } | null; error: unknown },
  texte: string,
  today: string,
): { ok: true; body: string } | { ok: false; error: string } {
  if (read.error) {
    return {
      ok: false,
      error: "La note privée n'a pas pu être relue : rien n'a été modifié. Réessaie.",
    };
  }
  return { ok: true, body: appendNote(read.data?.body ?? null, texte, today) };
}

// La note privée resterait sous sa limite (2000 caractères) une fois le texte ajouté.
export function noteLengthRefusal(next: string): string | null {
  return next.length > NOTE_MAX_LENGTH
    ? `La note privée dépasserait ${NOTE_MAX_LENGTH} caractères : le coach doit d'abord la raccourcir dans la fiche (onglet Notes).`
    : null;
}

// --- Ce que dit la carte --------------------------------------------------------------------------

const dayList = (days: readonly string[]) =>
  days.length === 0
    ? "aucun"
    : days.map((day) => (weekDayLabels[day as WeekDay] ?? day).toLowerCase()).join(", ");

export const AVAILABILITY_LABELS: Record<string, string> = {
  sessionsPerWeek: "Séances par semaine",
  maxSessionMinutes: "Durée maximale",
  availableDays: "Jours",
  scheduleConstraints: "Contraintes d'organisation",
};
export function availabilityText(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (field === "availableDays") return dayList(value as string[]);
  if (field === "maxSessionMinutes") return `${String(value)} min`;
  return String(value);
}

export const GOAL_LABELS: Record<string, string> = {
  goalType: "Objectif",
  priority: "Priorité",
  targetDate: "Date",
  targetTime: "Temps visé",
  isCompetition: "Compétition",
  competitionName: "Nom de la compétition",
  competitionLocation: "Lieu",
  hyroxCategory: "Catégorie Hyrox",
  description: "Description",
};
export function goalText(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  switch (field) {
    case "goalType":
      return goalTypeLabels[value as GoalType] ?? String(value);
    case "priority":
      return value === "main" ? "principal" : "secondaire";
    case "targetDate":
      return dayInWords(String(value));
    case "isCompetition":
      return value ? "oui" : "non";
    case "hyroxCategory":
      return hyroxCategoryLabels[value as HyroxCategory] ?? String(value);
    default:
      return String(value);
  }
}

// « Course 10 km le dimanche 11 avril 2027 en 45:00 » (objectif en clair).
export function goalLine(goal: {
  goalType: string;
  targetDate?: string | null;
  targetTime?: string | null;
}): string {
  return [
    goalTypeLabels[goal.goalType as GoalType] ?? goal.goalType,
    goal.targetDate ? `le ${dayInWords(goal.targetDate)}` : null,
    goal.targetTime ? `en ${goal.targetTime}` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

// « FC max : 192 bpm » ; « Seuil : 4:30 /km » ; « Charge de référence : Squat 100 kg × 5 ».
export function referenceLine(repere: {
  kind: string;
  pace?: string;
  bpm?: string;
  exercise?: string;
  loadKg?: string;
  reps?: string;
}): string {
  const label = referenceKindLabels[repere.kind as ReferenceKind] ?? repere.kind;
  if (repere.kind.startsWith("hr_")) return `${label} : ${repere.bpm ?? "?"} bpm`;
  if (repere.kind === "strength_load") {
    return `${label} : ${repere.exercise ?? "?"} ${repere.loadKg ?? "?"} kg${repere.reps ? ` × ${repere.reps}` : ""}`;
  }
  return `${label} : ${repere.pace ?? "?"} /km`;
}

// La valeur d'un repère enregistré : « 192 bpm », « 4:20-4:40 /km », « Squat 100 kg × 5 ».
export function referenceValueText(row: {
  paceMin: number | null;
  paceMax: number | null;
  bpm: number | null;
  exercise: string | null;
  loadKg: number | null;
  reps: number | null;
}): string {
  if (row.bpm !== null) return `${row.bpm} bpm`;
  if (row.loadKg !== null) {
    return `${row.exercise ?? "?"} ${row.loadKg} kg${row.reps ? ` × ${row.reps}` : ""}`;
  }
  if (row.paceMin === null) return "?";
  return row.paceMax !== null && row.paceMax !== row.paceMin
    ? `${formatPace(row.paceMin)}-${formatPace(row.paceMax)} /km`
    : `${formatPace(row.paceMin)} /km`;
}

export function recordLine(record: {
  event: string;
  hyroxCategory?: string;
  time: string;
}): string {
  const event =
    record.event === "hyrox" && record.hyroxCategory
      ? `Hyrox ${hyroxCategoryLabels[record.hyroxCategory as HyroxCategory] ?? record.hyroxCategory}`
      : (recordEventLabels[record.event as RecordEvent] ?? record.event);
  return `${event} : ${record.time}`;
}

export const EXERCISE_LABELS: Record<string, string> = {
  name: "Nom",
  category: "Catégorie",
  muscleGroups: "Muscles",
  equipment: "Matériel",
  instructions: "Consignes",
  videoUrl: "Vidéo",
};
export function exerciseText(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  switch (field) {
    case "category":
      return exerciseCategoryLabels[value as ExerciseCategory] ?? String(value);
    case "muscleGroups":
      return (
        (value as string[])
          .map((group) => muscleGroupLabels[group as MuscleGroup] ?? group)
          .join(", ") || "—"
      );
    case "equipment":
      return equipmentInfo[String(value)]?.label ?? String(value);
    case "instructions": {
      const count = Array.isArray(value)
        ? value.length
        : String(value).split("\n").filter(Boolean).length;
      return `${count} consigne${count > 1 ? "s" : ""}`;
    }
    default:
      return String(value);
  }
}

const changeLines = (
  changes: Record<string, unknown>,
  labels: Record<string, string>,
  names: Record<string, string>,
  after: (field: string, value: unknown) => string,
) =>
  Object.entries(changes).map(
    ([field, value]) =>
      `${labels[field] ?? field} : ${names[`avant:${field}`] || "—"} → ${after(field, value)}`,
  );

const ARCHIVE_TEXT =
  "Il quitte la liste active sans rien effacer ; tu peux le restaurer à tout moment";

const GOAL_STATUS_TITLES = {
  atteint: "Objectif atteint",
  abandonne: "Objectif abandonné",
  principal: "Objectif principal",
} as const;

// Relecture du lot 5, n°6 : devenir principal fait passer l'actuel en secondaire ; la carte le dit.
function mainDemotedLine(names: Record<string, string>): string | null {
  return names.principalActuel
    ? `L'objectif principal actuel (${names.principalActuel}) passe en secondaire`
    : null;
}

export function summarizeSportifs(
  action: { kind: string; params: Record<string, unknown> },
  names: Record<string, string>,
): { title: string; summary: string[] } | null {
  if (!isSportifsKind(action.kind)) return null;
  const p = action.params;
  const who = names.sportif ?? "Sportif";
  let title = "";
  const lines: (string | null)[] = [];
  switch (action.kind) {
    case "statut_sportif": {
      title = "Statut du sportif";
      const statut = p.statut as AthleteStatus;
      lines.push(who, `Statut : ${names["avant:statut"] ?? "?"} → ${athleteStatusLabels[statut]}`);
      lines.push(
        statut === "archived"
          ? ARCHIVE_TEXT
          : names["avant:statut"] === athleteStatusLabels.archived
            ? "Il revient dans la liste active"
            : null,
      );
      break;
    }
    case "discipline_sportif":
      title = "Discipline du sportif";
      lines.push(
        who,
        `Discipline : ${names["avant:discipline"] || "—"} → ${disciplineLabels[p.discipline as Discipline]}`,
      );
      break;
    case "disponibilites":
      title = "Disponibilités";
      lines.push(
        who,
        ...changeLines(
          (p.changes ?? {}) as Record<string, unknown>,
          AVAILABILITY_LABELS,
          names,
          availabilityText,
        ),
      );
      break;
    case "ajouter_objectif": {
      title = "Nouvel objectif";
      const goal = p.objectif as Record<string, string | boolean | undefined>;
      lines.push(
        who,
        goalLine({
          goalType: String(goal.goalType),
          targetDate: goal.targetDate as string | undefined,
          targetTime: goal.targetTime as string | undefined,
        }),
        typeof goal.competitionName === "string" && goal.competitionName
          ? `Compétition : ${goal.competitionName}`
          : null,
        // Relecture n°7 : tout ce qui sera enregistré est sur la carte.
        typeof goal.competitionLocation === "string" && goal.competitionLocation
          ? `Lieu : ${goal.competitionLocation}`
          : null,
        typeof goal.hyroxCategory === "string" && goal.hyroxCategory
          ? `Catégorie Hyrox : ${goalText("hyroxCategory", goal.hyroxCategory)}`
          : null,
        typeof goal.description === "string" && goal.description
          ? `Description : ${goal.description}`
          : null,
        goal.priority === "main" ? "Objectif principal" : null,
        goal.priority === "main" ? mainDemotedLine(names) : null,
      );
      break;
    }
    case "modifier_objectif":
      title = "Modifier l'objectif";
      lines.push(
        who,
        names.objectif ?? "Objectif",
        ...changeLines((p.changes ?? {}) as Record<string, unknown>, GOAL_LABELS, names, goalText),
        (p.changes as Record<string, unknown> | undefined)?.priority === "main"
          ? mainDemotedLine(names)
          : null,
      );
      break;
    case "statut_objectif":
      title = GOAL_STATUS_TITLES[p.statut as keyof typeof GOAL_STATUS_TITLES];
      lines.push(
        who,
        names.objectif ?? "Objectif",
        p.statut === "principal" ? mainDemotedLine(names) : null,
      );
      break;
    case "supprimer_objectif":
      title = "Supprimer l'objectif";
      lines.push(who, names.objectif ?? "Objectif", "Supprimé (définitif)");
      break;
    case "ajouter_repere": {
      title = "Nouveau repère";
      const repere = p.repere as { kind: string; measuredOn: string; source: string } & Record<
        string,
        string
      >;
      lines.push(
        who,
        referenceLine(repere),
        `Mesuré le ${dayInWords(repere.measuredOn ?? "")} · ${referenceSourceLabels[repere.source as ReferenceSource] ?? repere.source}`,
        repere.note ? `Note : ${repere.note}` : null,
      );
      break;
    }
    case "reperes_depuis_test": {
      title = "Repères depuis un test";
      lines.push(
        who,
        `${p.test === "cooper" ? "Test de Cooper" : "5 km"} du ${dayInWords(String(p.measuredOn))}`,
      );
      for (let index = 0; names[`repere:${index}`] !== undefined; index++) {
        lines.push(names[`repere:${index}`] ?? null);
      }
      break;
    }
    case "supprimer_repere":
      title = "Supprimer le repère";
      lines.push(who, names.repere ?? "Repère", "Supprimé (définitif)");
      break;
    case "ajouter_record": {
      title = "Nouveau record";
      const record = p.record as Record<string, string>;
      lines.push(
        who,
        recordLine({
          event: record.event ?? "",
          hyroxCategory: record.hyroxCategory,
          time: record.time ?? "",
        }),
        `Le ${dayInWords(record.achievedOn ?? "")}${record.raceName ? ` · ${record.raceName}` : ""}`,
      );
      break;
    }
    case "supprimer_record":
      title = "Supprimer le record";
      lines.push(who, names.record ?? "Record", "Supprimé (définitif)");
      break;
    case "favori_exercice":
      title = p.favori ? "Favori" : "Retirer des favoris";
      lines.push(names.exercice ?? "Exercice");
      break;
    case "modifier_exercice":
      title = "Modifier l'exercice";
      lines.push(
        names.exercice ?? "Exercice",
        ...changeLines(
          (p.changes ?? {}) as Record<string, unknown>,
          EXERCISE_LABELS,
          names,
          exerciseText,
        ),
      );
      break;
    case "supprimer_exercice":
      title = "Supprimer l'exercice";
      lines.push(names.exercice ?? "Exercice", "Il disparaît de ta Bibliothèque (définitif)");
      break;
    case "photo": {
      title = p.athleteId ? "Photo du sportif" : "Photo du coach";
      const target = p.athleteId ? who : "Ta photo de profil";
      lines.push(
        target,
        p.action === "mettre"
          ? `Nouvelle photo : ${names.fichier ?? "fichier joint"}`
          : "Photo retirée",
        p.action === "mettre" && names.remplace === "oui" ? "Remplace la photo actuelle" : null,
      );
      break;
    }
    case "ajouter_note":
      title = "Ajouter à la note privée";
      lines.push(who, `« ${String(p.texte)} »`, "S'ajoute sous la note existante, datée du jour");
      break;
  }
  return {
    title,
    summary: lines.filter((line): line is string => typeof line === "string" && line !== ""),
  };
}

import { pickAttachment } from "@/features/assistant/attachment-rules";
import "server-only";

import type Anthropic from "@anthropic-ai/sdk";

import { formatBytes } from "@/domain/documents/documents";
import { parseCoachExerciseForm } from "@/domain/exercises/coach-exercise";
import { EQUIPMENT_KEYS, EXERCISE_CATEGORIES } from "@/domain/exercises/vocabulary";
import { disciplineLabels } from "@/domain/training/discipline";
import { DEFAULT_PACE_ZONES } from "@/domain/training/vma";
import { getAthlete } from "@/features/athletes/queries";
import { athleteStatusLabels, availabilitySchema, WEEK_DAYS } from "@/features/athletes/schemas";
import { getCoachExercise } from "@/features/exercises/queries";
import { goalFormValues } from "@/features/goals/form-values";
import { listGoals } from "@/features/goals/queries";
import {
  GOAL_PRIORITIES,
  GOAL_TYPES,
  HYROX_CATEGORIES,
  parseGoalForm,
} from "@/features/goals/schemas";
import { listRecords } from "@/features/records/queries";
import { parseRecordForm, RECORD_EVENTS } from "@/features/records/schemas";
import { listReferences } from "@/features/references/queries";
import {
  parseReferenceForm,
  referenceKindLabels,
  referenceSourceLabels,
  type ReferenceKind,
} from "@/features/references/schemas";
import { parseTestForm } from "@/features/references/test-form";
import { todayIsoInBrussels } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

import type { AssistantAttachment } from "../rules";
import {
  appendNote,
  availabilityText,
  coachExerciseRefusal,
  exerciseText,
  goalCheckDay,
  goalEditRefusal,
  goalLine,
  goalStatusRefusal,
  goalText,
  mergeAvailability,
  mergeCoachExercise,
  mergeGoal,
  noteLengthRefusal,
  photoRefusal,
  recordDeletionLine,
  referenceValueText,
  type SportifsKind,
} from "../sportifs";

// Assistant IA, lot 5 (D-184) : outils et contrôles des SPORTIFS. Rien n'est exécuté : chaque appel
// devient une carte après vérification (sportif, objectif, repère, record, exercice de
// l'organisation ; formulaire habituel validé sur les valeurs fusionnées). JAMAIS de santé : les
// blessures restent hors des paramètres, des cartes et des lectures ; la note privée n'est jamais lue
// pour Claude (seulement mesurée, pour sa limite de longueur).

const athleteIdField = { athleteId: { type: "string", description: "Id de chercher_sportifs." } };
const date = { type: "string", description: "AAAA-MM-JJ" } as const;
const nullable = (schema: Record<string, unknown>) => ({
  ...schema,
  description: `${String(schema.description ?? "")} null efface.`.trim(),
});
const goalProperties = {
  goalType: { type: "string", enum: [...GOAL_TYPES] },
  priority: { type: "string", enum: [...GOAL_PRIORITIES] },
  targetDate: date,
  targetTime: { type: "string", description: "Temps visé, 45:00 ou 1:15:00." },
  isCompetition: { type: "boolean" },
  competitionName: { type: "string" },
  competitionLocation: { type: "string" },
  hyroxCategory: { type: "string", enum: [...HYROX_CATEGORIES] },
  description: { type: "string" },
};

export const SPORTIFS_TOOLS: Anthropic.Tool[] = [
  {
    name: "statut_sportif",
    description:
      "Propose de changer le statut d'un sportif : active (actif), paused (en pause) ou archived (archivé : il quitte la liste active, rien n'est effacé, il se restaure).",
    input_schema: {
      type: "object",
      properties: {
        ...athleteIdField,
        statut: { type: "string", enum: ["active", "paused", "archived"] },
      },
      required: ["athleteId", "statut"],
    },
  },
  {
    name: "discipline_sportif",
    description: "Propose de changer la discipline principale d'un sportif.",
    input_schema: {
      type: "object",
      properties: {
        ...athleteIdField,
        discipline: { type: "string", enum: ["running", "strength", "hyrox", "hybrid"] },
      },
      required: ["athleteId", "discipline"],
    },
  },
  {
    name: "disponibilites",
    description:
      "Propose de modifier les disponibilités d'un sportif (voir_fiche) : séances par semaine, durée maximale, jours, contraintes d'organisation. Jamais les blessures ni la santé.",
    input_schema: {
      type: "object",
      properties: {
        ...athleteIdField,
        changes: {
          type: "object",
          properties: {
            sessionsPerWeek: nullable({ type: "integer", description: "1 à 14." }),
            maxSessionMinutes: nullable({ type: "integer", description: "10 à 300." }),
            availableDays: {
              type: "array",
              items: { type: "string", enum: [...WEEK_DAYS] },
              description: "TOUS les jours disponibles (la liste remplace l'ancienne).",
            },
            scheduleConstraints: nullable({ type: "string", description: "500 caractères." }),
          },
        },
      },
      required: ["athleteId", "changes"],
    },
  },
  {
    name: "ajouter_objectif",
    description: "Propose un nouvel objectif pour un sportif (voir_objectifs avant).",
    input_schema: {
      type: "object",
      properties: {
        ...athleteIdField,
        objectif: { type: "object", properties: goalProperties, required: ["goalType"] },
      },
      required: ["athleteId", "objectif"],
    },
  },
  {
    name: "modifier_objectif",
    description:
      "Propose de modifier un objectif (id de voir_objectifs) : seulement les champs à changer ; null efface.",
    input_schema: {
      type: "object",
      properties: {
        ...athleteIdField,
        goalId: { type: "string" },
        changes: { type: "object", properties: goalProperties },
      },
      required: ["athleteId", "goalId", "changes"],
    },
  },
  {
    name: "statut_objectif",
    description:
      "Propose de marquer un objectif en cours atteint, abandonné, ou d'en faire l'objectif principal.",
    input_schema: {
      type: "object",
      properties: {
        ...athleteIdField,
        goalId: { type: "string" },
        statut: { type: "string", enum: ["atteint", "abandonne", "principal"] },
      },
      required: ["athleteId", "goalId", "statut"],
    },
  },
  {
    name: "supprimer_objectif",
    description: "Propose de supprimer un objectif (définitif).",
    input_schema: {
      type: "object",
      properties: { ...athleteIdField, goalId: { type: "string" } },
      required: ["athleteId", "goalId"],
    },
  },
  {
    name: "ajouter_repere",
    description:
      "Propose un repère d'entraînement (voir_reperes) : allure (pace « 4:30 » ou « 4:20-4:40 » min/km), FC (bpm) ou charge (exercise, loadKg, reps). Seulement des valeurs que le coach donne.",
    input_schema: {
      type: "object",
      properties: {
        ...athleteIdField,
        repere: {
          type: "object",
          properties: {
            kind: { type: "string", enum: Object.keys(referenceKindLabels) },
            pace: { type: "string" },
            bpm: { type: "string" },
            exercise: { type: "string" },
            loadKg: { type: "string" },
            reps: { type: "string" },
            source: { type: "string", enum: Object.keys(referenceSourceLabels) },
            measuredOn: date,
            note: { type: "string" },
          },
          required: ["kind", "source", "measuredOn"],
        },
      },
      required: ["athleteId", "repere"],
    },
  },
  {
    name: "reperes_depuis_test",
    description:
      "Propose les allures calculées depuis un test : cooper (distance en mètres sur 12 min) ou 5k (temps). Toutes les zones par défaut.",
    input_schema: {
      type: "object",
      properties: {
        ...athleteIdField,
        test: { type: "string", enum: ["cooper", "5k"] },
        distance: { type: "string" },
        time: { type: "string", description: "mm:ss ou h:mm:ss (5k)." },
        measuredOn: date,
        zones: {
          type: "array",
          items: { type: "string", enum: DEFAULT_PACE_ZONES.map((zone) => zone.kind) },
        },
      },
      required: ["athleteId", "test", "measuredOn"],
    },
  },
  {
    name: "supprimer_repere",
    description: "Propose de supprimer un repère (id de voir_reperes), définitivement.",
    input_schema: {
      type: "object",
      properties: { ...athleteIdField, referenceId: { type: "string" } },
      required: ["athleteId", "referenceId"],
    },
  },
  {
    name: "ajouter_record",
    description: "Propose un record personnel (temps réalisé sur une épreuve).",
    input_schema: {
      type: "object",
      properties: {
        ...athleteIdField,
        record: {
          type: "object",
          properties: {
            event: { type: "string", enum: [...RECORD_EVENTS] },
            hyroxCategory: { type: "string", enum: [...HYROX_CATEGORIES] },
            time: { type: "string", description: "mm:ss ou h:mm:ss." },
            achievedOn: date,
            raceName: { type: "string" },
          },
          required: ["event", "time", "achievedOn"],
        },
      },
      required: ["athleteId", "record"],
    },
  },
  {
    name: "supprimer_record",
    description: "Propose de supprimer un record (id de voir_reperes), définitivement.",
    input_schema: {
      type: "object",
      properties: { ...athleteIdField, recordId: { type: "string" } },
      required: ["athleteId", "recordId"],
    },
  },
  {
    name: "favori_exercice",
    description: "Propose de mettre un exercice en favori (favori: true) ou de l'en retirer.",
    input_schema: {
      type: "object",
      properties: { exerciseId: { type: "string" }, favori: { type: "boolean" } },
      required: ["exerciseId", "favori"],
    },
  },
  {
    name: "modifier_exercice",
    description:
      "Propose de modifier un exercice DU COACH (jamais un exercice Coory) : seulement les champs à changer.",
    input_schema: {
      type: "object",
      properties: {
        exerciseId: { type: "string" },
        changes: {
          type: "object",
          properties: {
            name: { type: "string" },
            category: { type: "string", enum: [...EXERCISE_CATEGORIES] },
            muscleGroups: { type: "array", items: { type: "string" } },
            equipment: nullable({ type: "string", enum: [...EQUIPMENT_KEYS] }),
            instructions: { type: "array", items: { type: "string" } },
            videoUrl: nullable({ type: "string" }),
          },
        },
      },
      required: ["exerciseId", "changes"],
    },
  },
  {
    name: "supprimer_exercice",
    description: "Propose de supprimer un exercice DU COACH de sa Bibliothèque (définitif).",
    input_schema: {
      type: "object",
      properties: { exerciseId: { type: "string" } },
      required: ["exerciseId"],
    },
  },
  {
    name: "photo",
    description:
      "Propose de mettre (image JOINTE avec le bouton « Joindre ») ou de retirer la photo d'un sportif (athleteId), ou celle du coach (sans athleteId). Plusieurs fichiers joints : précise l'image avec fichier.",
    input_schema: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["mettre", "retirer"] },
        athleteId: { type: "string", description: "Sans lui : la photo du coach." },
        fichier: {
          type: "string",
          description: "Nom exact de l'image jointe, si plusieurs fichiers.",
        },
      },
      required: ["action"],
    },
  },
  {
    name: "ajouter_note",
    description:
      "Propose d'AJOUTER un texte à la note privée d'un sportif (sous la note existante, datée). Tu ne lis jamais les notes. Jamais de santé.",
    input_schema: {
      type: "object",
      properties: { ...athleteIdField, texte: { type: "string" } },
      required: ["athleteId", "texte"],
    },
  },
];

type Checked = { ok: true; params?: Record<string, unknown> } | { ok: false; error: string };
const refuse = (error: string): Checked => ({ ok: false, error });
const NO_ATHLETE = "Sportif introuvable ou archivé : cherche-le avec chercher_sportifs.";

// « Seuil : 4:20-4:40 /km » ; « FC max : 192 bpm » ; « Charge de référence : Squat 100 kg × 5 ».
const referenceText = (row: Parameters<typeof referenceValueText>[0] & { kind: ReferenceKind }) =>
  `${referenceKindLabels[row.kind]} : ${referenceValueText(row)}`;

export async function proposeSportifs(
  orgId: string,
  kind: SportifsKind,
  p: Record<string, unknown>,
  names: Record<string, string>,
  context: { attachments?: AssistantAttachment[] } = {},
): Promise<Checked> {
  // « Photo » (D-213) : l'image jointe nommée par « fichier », ou la seule jointe ; refus expliqué.
  const photoFile = (): { file?: AssistantAttachment; error?: string } => {
    if (p.action !== "mettre") return {};
    const picked = pickAttachment(
      context.attachments ?? [],
      typeof p.fichier === "string" ? p.fichier : undefined,
    );
    return picked.ok ? { file: picked.file } : { error: picked.error };
  };
  const today = todayIsoInBrussels();
  const supabase = await createClient();

  // Bibliothèque : l'exercice visible (catalogue Coory ou du coach) ; modifier ou supprimer : du coach.
  if (kind === "favori_exercice" || kind === "modifier_exercice" || kind === "supprimer_exercice") {
    const { data: exercise } = await supabase
      .from("exercises")
      .select("id, name_fr, organization_id")
      .eq("id", String(p.exerciseId))
      .maybeSingle();
    if (!exercise) return refuse("Exercice introuvable : cherche-le avec chercher_exercices.");
    names.exercice = exercise.name_fr;
    if (kind === "favori_exercice") return { ok: true };
    if (exercise.organization_id !== null && exercise.organization_id !== orgId) {
      return refuse("Exercice introuvable : cherche-le avec chercher_exercices.");
    }
    const refusal = coachExerciseRefusal({ organizationId: exercise.organization_id });
    if (refusal) return refuse(refusal);
    if (kind === "supprimer_exercice") return { ok: true };
    const current = await getCoachExercise(exercise.id);
    if (!current) return refuse("Exercice introuvable : cherche-le avec chercher_exercices.");
    const input = {
      name: current.nameFr,
      category: current.category,
      muscleGroups: current.muscleGroups,
      equipment: current.equipment,
      instructions: current.instructions,
      videoUrl: current.videoUrl,
    };
    const changes = p.changes as Record<string, unknown>;
    const parsed = parseCoachExerciseForm(mergeCoachExercise(input, changes));
    if (!parsed.ok) return refuse(parsed.error);
    const before: Record<string, unknown> = { ...input, instructions: input.instructions };
    for (const field of Object.keys(changes)) {
      names[`avant:${field}`] = exerciseText(field, field === "name" ? input.name : before[field]);
    }
    return { ok: true };
  }

  // Photo du coach (sans sportif) : sa photo de profil.
  if (kind === "photo" && !p.athleteId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = user
      ? await supabase
          .from("coach_profiles")
          .select("photo_path")
          .eq("user_id", user.id)
          .maybeSingle()
      : { data: null };
    const hasPhoto = Boolean(profile?.photo_path);
    const chosen = photoFile();
    if (chosen.error && (context.attachments ?? []).length > 0) return refuse(chosen.error);
    const refusal = photoRefusal(p.action as "mettre" | "retirer", chosen.file, hasPhoto);
    if (refusal) return refuse(refusal);
    if (chosen.file) {
      names.fichier = `${chosen.file.name} (${formatBytes(chosen.file.size)})`;
    }
    if (hasPhoto) names.remplace = "oui";
    return { ok: true };
  }

  // Toutes les autres cartes portent sur un sportif de l'organisation (actif ; archivé seulement pour
  // changer son statut).
  const athlete = await getAthlete(orgId, String(p.athleteId));
  if (!athlete) return refuse(NO_ATHLETE);
  if (athlete.status === "archived" && kind !== "statut_sportif") return refuse(NO_ATHLETE);
  names.sportif = athlete.displayName;

  switch (kind) {
    case "statut_sportif": {
      if (athlete.status === p.statut) {
        return refuse(`Ce sportif est déjà « ${athleteStatusLabels[athlete.status]} ».`);
      }
      names["avant:statut"] = athleteStatusLabels[athlete.status];
      return { ok: true };
    }
    case "discipline_sportif": {
      if (athlete.programType === p.discipline) return refuse("C'est déjà sa discipline.");
      names["avant:discipline"] = athlete.programType ? disciplineLabels[athlete.programType] : "";
      return { ok: true };
    }
    case "disponibilites": {
      const changes = p.changes as Record<string, unknown>;
      const merged = mergeAvailability(athlete, changes);
      const parsed = availabilitySchema.safeParse(merged);
      if (!parsed.success)
        return refuse(parsed.error.issues[0]?.message ?? "Disponibilités invalides.");
      const before: Record<string, unknown> = {
        sessionsPerWeek: athlete.sessionsPerWeek,
        maxSessionMinutes: athlete.maxSessionMinutes,
        availableDays: athlete.availableDays,
        scheduleConstraints: athlete.scheduleConstraints,
      };
      for (const field of Object.keys(changes)) {
        names[`avant:${field}`] = availabilityText(field, before[field]);
      }
      return { ok: true };
    }
    case "ajouter_objectif": {
      // Priorité notée par le serveur (montrée sur la carte) : principal s'il n'y en a pas encore.
      const goals = await listGoals(orgId, athlete.id);
      const objectif = { ...(p.objectif as Record<string, unknown>) };
      if (!objectif.priority) {
        objectif.priority = goals.current.some((goal) => goal.priority === "main")
          ? "secondary"
          : "main";
      }
      // L'actuel principal passera en secondaire : la carte le nomme (relecture n°6).
      const currentMain = goals.current.find((goal) => goal.priority === "main");
      if (objectif.priority === "main" && currentMain) {
        names.principalActuel = goalLine(goalFormValues(currentMain));
      }
      const input = mergeGoal(
        {
          goalType: "",
          priority: "",
          targetDate: "",
          targetTime: "",
          isCompetition: false,
          competitionName: "",
          competitionLocation: "",
          hyroxCategory: "",
          description: "",
        },
        objectif,
      );
      const parsed = parseGoalForm(input, today);
      if (!parsed.ok) return refuse(parsed.error);
      return { ok: true, params: { objectif } };
    }
    case "modifier_objectif":
    case "statut_objectif":
    case "supprimer_objectif": {
      const goals = await listGoals(orgId, athlete.id);
      const goal = [...goals.current, ...goals.past].find((item) => item.id === p.goalId);
      if (!goal) return refuse("Objectif introuvable : regarde voir_objectifs.");
      const values = goalFormValues(goal);
      names.objectif = goalLine(values);
      const otherMain = goals.current.find(
        (item) => item.priority === "main" && item.id !== goal.id,
      );
      if (otherMain) names.principalActuel = goalLine(goalFormValues(otherMain));
      if (kind === "statut_objectif") {
        const refusal = goalStatusRefusal(goal, p.statut as "atteint" | "abandonne" | "principal");
        return refusal ? refuse(refusal) : { ok: true };
      }
      if (kind === "supprimer_objectif") return { ok: true };
      const changes = p.changes as Record<string, unknown>;
      // Clôturé ou sans effet : refusé ; en retard : sa date passée reste permise (relecture n°5).
      const editRefusal = goalEditRefusal(goal, values, changes);
      if (editRefusal) return refuse(editRefusal);
      const parsed = parseGoalForm(
        mergeGoal(values, changes),
        goalCheckDay(goal.targetDate, today),
      );
      if (!parsed.ok) return refuse(parsed.error);
      for (const field of Object.keys(changes)) {
        names[`avant:${field}`] = goalText(field, values[field as keyof typeof values]);
      }
      return { ok: true };
    }
    case "ajouter_repere": {
      const repere = p.repere as Record<string, string>;
      const parsed = parseReferenceForm(
        {
          kind: repere.kind ?? "",
          pace: repere.pace ?? "",
          bpm: repere.bpm ?? "",
          exercise: repere.exercise ?? "",
          loadKg: repere.loadKg ?? "",
          reps: repere.reps ?? "",
          source: repere.source ?? "",
          measuredOn: repere.measuredOn ?? "",
          note: repere.note ?? "",
        },
        today,
      );
      return parsed.ok ? { ok: true } : refuse(parsed.error);
    }
    case "reperes_depuis_test": {
      // Toutes les zones par défaut (comme la fenêtre « Calculer les allures »), notées par le serveur.
      const zones =
        (p.zones as string[] | undefined) ?? DEFAULT_PACE_ZONES.map((zone) => zone.kind);
      const parsed = parseTestForm(
        {
          test: String(p.test),
          distance: String(p.distance ?? ""),
          time: String(p.time ?? ""),
          measuredOn: String(p.measuredOn),
          zones,
        },
        today,
      );
      if (!parsed.ok) return refuse(parsed.error);
      parsed.rows.forEach((row, index) => {
        names[`repere:${index}`] = referenceText({
          kind: row.kind,
          paceMin: row.pace_min_sec_per_km,
          paceMax: row.pace_max_sec_per_km,
          bpm: row.bpm,
          exercise: row.exercise_label,
          loadKg: row.load_kg,
          reps: row.reps,
        });
      });
      return { ok: true, params: { zones } };
    }
    case "supprimer_repere": {
      const references = await listReferences(orgId, athlete.id);
      const reference = [...references.current, ...references.history].find(
        (item) => item.id === p.referenceId,
      );
      if (!reference) return refuse("Repère introuvable : regarde voir_reperes.");
      names.repere = `${referenceText(reference)} (mesuré le ${reference.measuredOn})`;
      return { ok: true };
    }
    case "ajouter_record": {
      const record = p.record as Record<string, string>;
      const parsed = parseRecordForm(
        {
          event: record.event ?? "",
          hyroxCategory: record.hyroxCategory ?? "",
          time: record.time ?? "",
          achievedOn: record.achievedOn ?? "",
          raceName: record.raceName ?? "",
        },
        today,
      );
      return parsed.ok ? { ok: true } : refuse(parsed.error);
    }
    case "supprimer_record": {
      const records = await listRecords(orgId, athlete.id);
      const record = records.history.find((item) => item.id === p.recordId);
      if (!record) return refuse("Record introuvable : regarde voir_reperes.");
      names.record = recordDeletionLine(record);
      return { ok: true };
    }
    case "photo": {
      const chosen = photoFile();
      if (chosen.error && (context.attachments ?? []).length > 0) return refuse(chosen.error);
      const refusal = photoRefusal(
        p.action as "mettre" | "retirer",
        chosen.file,
        Boolean(athlete.photoPath),
      );
      if (refusal) return refuse(refusal);
      if (chosen.file) {
        names.fichier = `${chosen.file.name} (${formatBytes(chosen.file.size)})`;
      }
      if (athlete.photoPath) names.remplace = "oui";
      return { ok: true };
    }
    case "ajouter_note": {
      // La note privée est MESURÉE (sa limite de longueur), jamais montrée ni envoyée à Claude.
      const { data: note } = await supabase
        .from("athlete_notes")
        .select("body")
        .eq("organization_id", orgId)
        .eq("athlete_id", athlete.id)
        .eq("visibility", "coach")
        .maybeSingle();
      const refusal = noteLengthRefusal(appendNote(note?.body ?? null, String(p.texte), today));
      return refusal ? refuse(refusal) : { ok: true };
    }
  }
  return { ok: true };
}

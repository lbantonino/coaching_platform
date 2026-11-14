import "server-only";

import {
  setAthletesProgramType,
  setAthletesStatus,
  updateAvailability,
} from "@/features/athletes/actions";
import { getAthlete } from "@/features/athletes/queries";
import { setExerciseFavorite } from "@/features/exercises/actions";
import { deleteCoachExercise } from "@/features/exercises/coach-actions";
import { saveCoachExercise } from "@/features/exercises/exercise-core";
import { getCoachExercise } from "@/features/exercises/queries";
import {
  addGoal,
  deleteGoal,
  makeGoalMain,
  setGoalStatus,
  updateGoal,
} from "@/features/goals/actions";
import { goalFormValues } from "@/features/goals/form-values";
import { listGoals } from "@/features/goals/queries";
import type { GoalFormInput } from "@/features/goals/schemas";
import { saveNote } from "@/features/notes/actions";
import { removeAthletePhoto, removeCoachPhoto } from "@/features/photos/actions";
import { addRecord, deleteRecord } from "@/features/records/actions";
import { listRecords } from "@/features/records/queries";
import {
  addReference,
  addReferencesFromTest,
  deleteReference,
} from "@/features/references/actions";
import { listReferences } from "@/features/references/queries";
import { todayIsoInBrussels } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

import type { ExecuteResult } from "./execute";
import type { ParsedAssistantAction } from "./proposals";
import {
  appendToReadNote,
  coachExerciseRefusal,
  goalStatusRefusal,
  mergeAvailability,
  mergeCoachExercise,
  mergeGoal,
  noteLengthRefusal,
  type SportifsKind,
} from "./sportifs";

// « Valider » une carte des SPORTIFS (lot 5, D-184). Appelé par executeAssistantAction APRÈS
// requireOrgAccess et le schéma strict ; jamais depuis le navigateur (server-only). L'état est RELU ;
// les changements sont fusionnés dans les valeurs actuelles, puis l'action du formulaire habituel
// fait le travail. Les blessures (santé) sont reprises TELLES QUELLES, jamais modifiées.

type SportifsAction = Extract<ParsedAssistantAction, { kind: SportifsKind }>;
const fail = (error: string): ExecuteResult => ({ ok: false, error });
const NO_ATHLETE = "Sportif introuvable ou archivé.";

function goalFormData(values: GoalFormInput): FormData {
  const form = new FormData();
  for (const [field, value] of Object.entries(values)) {
    if (field === "isCompetition") {
      if (value === true) form.set(field, "on");
    } else form.set(field, String(value));
  }
  return form;
}

function fields(values: Record<string, string | undefined>): FormData {
  const form = new FormData();
  for (const [field, value] of Object.entries(values)) form.set(field, value ?? "");
  return form;
}

export async function executeSportifs(
  orgId: string,
  action: SportifsAction,
): Promise<ExecuteResult> {
  const base = `/coach/o/${orgId}`;
  const sheet = (athleteId: string, tab: string) => `${base}/sportifs/${athleteId}?onglet=${tab}`;

  // Bibliothèque.
  if (action.kind === "favori_exercice") {
    const done = await setExerciseFavorite(action.params.exerciseId, action.params.favori);
    if (!done.ok) return fail("Le favori n'a pas pu changer.");
    return { ok: true, href: `/coach/bibliotheque/${action.params.exerciseId}` };
  }
  if (action.kind === "modifier_exercice" || action.kind === "supprimer_exercice") {
    const { exerciseId } = action.params;
    const current = await getCoachExercise(exerciseId);
    const { data: row } = await (
      await createClient()
    )
      .from("exercises")
      .select("organization_id")
      .eq("id", exerciseId)
      .maybeSingle();
    const refusal = coachExerciseRefusal(row ? { organizationId: row.organization_id } : null);
    if (refusal) return fail(refusal);
    if (!current || row?.organization_id !== orgId) return fail("Exercice introuvable.");
    if (action.kind === "supprimer_exercice") {
      const removed = await deleteCoachExercise(orgId, exerciseId);
      if (!removed.ok) return fail("L'exercice n'a pas pu être supprimé.");
      return { ok: true, href: "/coach/bibliotheque" };
    }
    const merged = mergeCoachExercise(
      {
        name: current.nameFr,
        category: current.category,
        muscleGroups: current.muscleGroups,
        equipment: current.equipment,
        instructions: current.instructions,
        videoUrl: current.videoUrl,
      },
      action.params.changes,
    );
    const form = fields({
      name: merged.name,
      category: merged.category,
      equipment: merged.equipment,
      instructions: merged.instructions,
      videoUrl: merged.videoUrl,
    });
    for (const group of merged.muscleGroups) form.append("muscles", group);
    const saved = await saveCoachExercise(orgId, exerciseId, form);
    if (!saved.ok) return fail(saved.error);
    return { ok: true, href: `/coach/bibliotheque/${exerciseId}` };
  }

  // Photo du coach (sans sportif) : retirer ici ; mettre passe par executeWithFile (fichier joint).
  if (action.kind === "photo" && !action.params.athleteId) {
    if (action.params.action === "mettre") {
      return fail("Joins à nouveau l'image, puis redemande à l'assistant.");
    }
    await removeCoachPhoto();
    return { ok: true, href: "/coach" };
  }

  // Toutes les autres cartes : un sportif de l'organisation, relu.
  const athleteId = (action.params as { athleteId: string }).athleteId;
  const athlete = await getAthlete(orgId, athleteId);
  if (!athlete) return fail(NO_ATHLETE);
  if (athlete.status === "archived" && action.kind !== "statut_sportif") return fail(NO_ATHLETE);
  const today = todayIsoInBrussels();

  switch (action.kind) {
    case "statut_sportif": {
      const done = await setAthletesStatus(orgId, [athlete.id], action.params.statut);
      if (!done.ok) return fail(done.error ?? "Le statut n'a pas pu changer.");
      return { ok: true, href: sheet(athlete.id, "profil") };
    }
    case "discipline_sportif": {
      const done = await setAthletesProgramType(orgId, [athlete.id], action.params.discipline);
      if (!done.ok) return fail(done.error ?? "La discipline n'a pas pu changer.");
      return { ok: true, href: sheet(athlete.id, "profil") };
    }
    case "disponibilites": {
      // Les blessures (santé) repartent telles quelles : seule la carte change le reste.
      const merged = mergeAvailability(athlete, action.params.changes);
      const form = fields({
        sessionsPerWeek: merged.sessionsPerWeek,
        maxSessionMinutes: merged.maxSessionMinutes,
        scheduleConstraints: merged.scheduleConstraints,
        healthConstraints: merged.healthConstraints,
      });
      for (const day of merged.availableDays) form.append("availableDays", day);
      const state = await updateAvailability(
        orgId,
        athlete.id,
        { error: null, saved: false, attempt: 0, values: null },
        form,
      );
      if (!state.saved)
        return fail(state.error ?? "Les disponibilités n'ont pas pu être enregistrées.");
      return { ok: true, href: sheet(athlete.id, "disponibilites") };
    }
    case "ajouter_objectif": {
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
        action.params.objectif,
      );
      const state = await addGoal(
        orgId,
        athlete.id,
        { error: null, saved: 0, attempt: 0, values: null },
        goalFormData(input),
      );
      if (state.error) return fail(state.error);
      return { ok: true, href: sheet(athlete.id, "objectifs") };
    }
    case "modifier_objectif":
    case "statut_objectif":
    case "supprimer_objectif": {
      const goals = await listGoals(orgId, athlete.id);
      const goal = [...goals.current, ...goals.past].find(
        (item) => item.id === action.params.goalId,
      );
      if (!goal) return fail("Objectif introuvable : il a peut-être été supprimé.");
      if (action.kind === "supprimer_objectif") {
        await deleteGoal(orgId, athlete.id, goal.id);
        return { ok: true, href: sheet(athlete.id, "objectifs") };
      }
      if (action.kind === "statut_objectif") {
        const refusal = goalStatusRefusal(goal, action.params.statut);
        if (refusal) return fail(refusal);
        if (action.params.statut === "principal") await makeGoalMain(orgId, athlete.id, goal.id);
        else {
          await setGoalStatus(
            orgId,
            athlete.id,
            goal.id,
            action.params.statut === "atteint" ? "achieved" : "dropped",
          );
        }
        return { ok: true, href: sheet(athlete.id, "objectifs") };
      }
      const state = await updateGoal(
        orgId,
        athlete.id,
        goal.id,
        { error: null, saved: 0, attempt: 0, values: null },
        goalFormData(mergeGoal(goalFormValues(goal), action.params.changes)),
      );
      if (state.error) return fail(state.error);
      return { ok: true, href: sheet(athlete.id, "objectifs") };
    }
    case "ajouter_repere": {
      const repere = action.params.repere;
      const state = await addReference(
        orgId,
        athlete.id,
        { error: null, saved: 0, attempt: 0, values: null },
        fields({ ...repere }),
      );
      if (state.error) return fail(state.error);
      return { ok: true, href: sheet(athlete.id, "reperes") };
    }
    case "reperes_depuis_test": {
      const { test, distance, time, measuredOn, zones } = action.params;
      const form = fields({ test, distance, time, measuredOn });
      for (const zone of zones ?? []) form.append("zones", zone);
      const state = await addReferencesFromTest(orgId, athlete.id, { error: null, saved: 0 }, form);
      if (state.error) return fail(state.error);
      return { ok: true, href: sheet(athlete.id, "reperes") };
    }
    case "supprimer_repere": {
      const references = await listReferences(orgId, athlete.id);
      const found = [...references.current, ...references.history].some(
        (item) => item.id === action.params.referenceId,
      );
      if (!found) return fail("Repère introuvable : il a peut-être été supprimé.");
      await deleteReference(orgId, athlete.id, action.params.referenceId);
      return { ok: true, href: sheet(athlete.id, "reperes") };
    }
    case "ajouter_record": {
      const state = await addRecord(
        orgId,
        athlete.id,
        { error: null, saved: 0, attempt: 0, values: null },
        fields({ ...action.params.record }),
      );
      if (state.error) return fail(state.error);
      return { ok: true, href: sheet(athlete.id, "reperes") };
    }
    case "supprimer_record": {
      const records = await listRecords(orgId, athlete.id);
      if (!records.history.some((item) => item.id === action.params.recordId)) {
        return fail("Record introuvable : il a peut-être été supprimé.");
      }
      await deleteRecord(orgId, athlete.id, action.params.recordId);
      return { ok: true, href: sheet(athlete.id, "reperes") };
    }
    case "photo": {
      if (action.params.action === "mettre") {
        return fail("Joins à nouveau l'image, puis redemande à l'assistant.");
      }
      if (!athlete.photoPath) return fail("Il n'y a pas de photo à retirer.");
      await removeAthletePhoto(orgId, athlete.id);
      return { ok: true, href: sheet(athlete.id, "profil") };
    }
    case "ajouter_note": {
      // La note privée relue ICI (jamais envoyée à Claude), le texte ajouté dessous, daté ; une
      // relecture en échec n'écrit rien (relecture n°4).
      const read = await (
        await createClient()
      )
        .from("athlete_notes")
        .select("body")
        .eq("organization_id", orgId)
        .eq("athlete_id", athlete.id)
        .eq("visibility", "coach")
        .maybeSingle();
      const appended = appendToReadNote(read, action.params.texte, today);
      if (!appended.ok) return fail(appended.error);
      const body = appended.body;
      const refusal = noteLengthRefusal(body);
      if (refusal) return fail(refusal);
      const state = await saveNote(
        orgId,
        athlete.id,
        "coach",
        { error: null, saved: false, attempt: 0, body: null },
        fields({ body }),
      );
      if (!state.saved) return fail(state.error ?? "La note n'a pas pu être enregistrée.");
      return { ok: true, href: sheet(athlete.id, "notes") };
    }
  }
  return fail("Cette action n'est pas valable. Redemande-la à l'assistant.");
}

"use server";

import { revalidatePath } from "next/cache";

import { updateAthlete } from "@/features/athletes/actions";
import { insertAthlete } from "@/features/athletes/create-athlete";
import { getAthlete } from "@/features/athletes/queries";
import { requireOrgAccess } from "@/features/auth/guards";
import { parseCoachExerciseForm } from "@/domain/exercises/coach-exercise";
import { insertCoachExercise } from "@/features/exercises/create-exercise";
import { createExpense } from "@/features/billing/expense-actions";
import { createPayment } from "@/features/billing/payment-actions";
import { createSession, markSessionPaid, moveSession } from "@/features/sessions/actions";
import { archiveProgram, createProgram, saveDraft } from "@/features/programs/actions";
import { loadDraft } from "@/features/programs/drafts";
import { uploadDocument } from "@/features/documents/actions";
import { createTask, createTaskList } from "@/features/tasks/actions";
import { createClient } from "@/lib/supabase/server";

import {
  athleteFormValues,
  athleteUpdateFormData,
  requireResolved,
  toCoachExerciseInput,
  toFormData,
  toNewAthleteValues,
} from "./form-data";
import { customDraftFrom, toCreateProgramInput } from "./program";
import { assistantActionSchema } from "./proposals";

// Clic « Valider » sur une carte de l'Assistant IA (lot 1 des actions, spec §5.2). N'appelle JAMAIS
// Claude (aucun coût, aucune demande décomptée). Ne fait aucune confiance à la carte : accès à
// l'organisation, schéma strict, puis la MÊME logique que le formulaire habituel, qui revérifie elle
// aussi l'appartenance de chaque identifiant (sportif, séance, liste, catégorie) et ses règles.
export type ExecuteResult =
  { ok: true; href: string; createdAthleteId?: string } | { ok: false; error: string };

const fail = (error: string): ExecuteResult => ({ ok: false, error });
const blank = { error: null, attempt: 0, values: null } as const;

export async function executeAssistantAction(
  organizationId: string,
  input: unknown,
): Promise<ExecuteResult> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const parsed = assistantActionSchema.safeParse(input);
  if (!parsed.success) return fail("Cette action n'est pas valable. Redemande-la à l'assistant.");
  const action = parsed.data;
  if (!requireResolved(action)) {
    return fail("Le sportif de cette carte n'est pas encore créé : valide d'abord sa fiche.");
  }
  const base = `/coach/o/${orgId}`;

  switch (action.kind) {
    case "creer_sportif": {
      const created = await insertAthlete(orgId, user.id, toNewAthleteValues(action.params));
      if (!created.ok) return fail(created.error);
      revalidatePath(`${base}/sportifs`, "layout");
      return {
        ok: true,
        href: `${base}/sportifs/${created.id}${created.incomplete ? "?creation=incomplete" : ""}`,
        createdAthleteId: created.id,
      };
    }
    case "creer_seance": {
      const state = await createSession(orgId, blank, toFormData(action));
      if (state.error || !state.created)
        return fail(state.error ?? "La séance n'a pas pu être créée.");
      return {
        ok: true,
        href: `${base}/agenda/seances/${state.created.id}?date=${action.params.startsOn}`,
      };
    }
    case "deplacer_seance": {
      const { sessionId, originalDate, newDate, newTime, scope } = action.params;
      const moved = await moveSession(orgId, { sessionId, originalDate, newDate, newTime, scope });
      if (!moved.ok) return fail(moved.error ?? "La séance n'a pas pu être déplacée.");
      return { ok: true, href: `${base}/agenda/seances/${sessionId}?date=${newDate}` };
    }
    case "marquer_seance_payee": {
      const { sessionId, sessionDate } = action.params;
      const paid = await markSessionPaid(orgId, sessionId, sessionDate);
      if (!paid.ok) return fail("Cette date n'a pas pu être marquée payée.");
      return { ok: true, href: `${base}/agenda/seances/${sessionId}?date=${sessionDate}` };
    }
    case "noter_paiement": {
      const state = await createPayment(orgId, { ...blank, saved: false }, toFormData(action));
      if (!state.saved) return fail(state.error ?? "Le paiement n'a pas pu être enregistré.");
      return { ok: true, href: "/coach/comptabilite" };
    }
    case "noter_depense": {
      const state = await createExpense(orgId, { ...blank, saved: false }, toFormData(action));
      if (!state.saved) return fail(state.error ?? "La dépense n'a pas pu être enregistrée.");
      return { ok: true, href: "/coach/comptabilite" };
    }
    case "creer_tache": {
      const state = await createTask(orgId, { ...blank, saved: false }, toFormData(action));
      if (!state.saved) return fail(state.error ?? "La tâche n'a pas pu être créée.");
      return { ok: true, href: "/coach/taches" };
    }
    case "importer_document":
      // Lot 2 : le fichier vient du navigateur, par executeDocumentImport (ci-dessous).
      return fail("Joins à nouveau le fichier, puis redemande à l'assistant.");
    case "preparer_pdf":
      // Lot 2 : la carte donne les liens des PDF ; il n'y a rien à exécuter.
      return fail("Rien à valider : ouvre les PDF depuis la carte.");
    case "creer_exercice": {
      // Lot 2 : les MÊMES règles et le MÊME enregistrement que « Créer un exercice » (sans photo).
      const parsedForm = parseCoachExerciseForm(toCoachExerciseInput(action.params));
      if (!parsedForm.ok) return fail(parsedForm.error);
      const created = await insertCoachExercise(orgId, user.id, parsedForm.values);
      if (!created.ok) return fail(created.error);
      revalidatePath("/coach/bibliotheque", "layout");
      return { ok: true, href: `/coach/bibliotheque/${created.id}` };
    }
    case "completer_fiche": {
      // Lot 2 : le formulaire Profil COMPLET (fiche actuelle + champs de la carte), par updateAthlete.
      const current = await getAthlete(orgId, action.params.athleteId);
      if (!current || current.status === "archived") return fail("Sportif introuvable ou archivé.");
      const state = await updateAthlete(
        orgId,
        current.id,
        { error: null, saved: false, attempt: 0, values: null },
        athleteUpdateFormData(athleteFormValues(current), action.params.changes),
      );
      if (!state.saved) return fail(state.error ?? "La fiche n'a pas pu être complétée.");
      return { ok: true, href: `${base}/sportifs/${current.id}?onglet=profil` };
    }
    case "creer_liste_de_taches": {
      const list = await createTaskList(orgId, action.params.name);
      if (!list.ok) return fail(list.error ?? "La liste n'a pas pu être créée.");
      return { ok: true, href: "/coach/taches" };
    }
    case "creer_programme": {
      // Lot 3a : la MÊME création que l'assistant « Créer un programme » (brouillon, jamais publié),
      // puis, pour un programme écrit, le MÊME enregistrement que l'éditeur.
      const params = action.params as Record<string, unknown>;
      const athleteId = String((params.athlete as { athleteId: string }).athleteId);
      const created = await createProgram(orgId, toCreateProgramInput(params, athleteId));
      if (!created.ok) return fail(created.message);
      const href = `${base}/programmes/${created.programId}`;
      if (!params.seances) return { ok: true, href };
      const loaded = await loadDraft(await createClient(), orgId, created.programId);
      const custom = loaded?.draft ? customDraftFrom(loaded.draft, params) : null;
      const saved =
        loaded && custom?.ok
          ? await saveDraft(orgId, created.programId, loaded.revision, custom.draft)
          : null;
      if (!saved?.ok) {
        // Pas de programme vide laissé en plan : le brouillon à peine créé est archivé.
        await archiveProgram(orgId, created.programId);
        return fail(
          saved?.message ??
            (custom && !custom.ok ? custom.error : "Les séances n'ont pas pu être enregistrées."),
        );
      }
      return { ok: true, href };
    }
  }
}

// « Valider » une carte « Importer un document » (lot 2, D-181) : le fichier, resté dans le navigateur,
// arrive ici avec les paramètres de la carte (champ `params`, en JSON). Aucune confiance : accès,
// schéma strict, puis le MÊME dépôt que la page Documents (taille, format, sportif de l'organisation,
// compte de démonstration refusé).
export async function executeDocumentImport(
  organizationId: string,
  formData: FormData,
): Promise<ExecuteResult> {
  const { membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  let raw: unknown = null;
  try {
    raw = JSON.parse(String(formData.get("params") ?? "null"));
  } catch {
    raw = null;
  }
  const parsed = assistantActionSchema.safeParse({ kind: "importer_document", params: raw });
  if (!parsed.success || parsed.data.kind !== "importer_document") {
    return fail("Cette action n'est pas valable. Redemande-la à l'assistant.");
  }
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return fail("Joins à nouveau le fichier, puis redemande à l'assistant.");
  }
  const form = new FormData();
  form.set("name", parsed.data.params.name);
  form.set("categoryId", parsed.data.params.categoryId ?? "");
  form.set("athleteId", parsed.data.params.athleteId ?? "");
  form.set("file", file);
  const state = await uploadDocument(
    orgId,
    { error: null, attempt: 0, values: null, saved: false },
    form,
  );
  if (!state.saved) return fail(state.error ?? "Le document n'a pas pu être enregistré.");
  return {
    ok: true,
    href: parsed.data.params.athleteId
      ? `/coach/o/${orgId}/sportifs/${parsed.data.params.athleteId}?onglet=documents`
      : "/coach/documents",
  };
}

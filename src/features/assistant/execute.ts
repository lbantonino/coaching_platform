"use server";

import { revalidatePath } from "next/cache";

import { insertAthlete } from "@/features/athletes/create-athlete";
import { requireOrgAccess } from "@/features/auth/guards";
import { createExpense } from "@/features/billing/expense-actions";
import { createPayment } from "@/features/billing/payment-actions";
import { createSession, markSessionPaid, moveSession } from "@/features/sessions/actions";
import { archiveProgram, createProgram, saveDraft } from "@/features/programs/actions";
import { loadDraft } from "@/features/programs/drafts";
import { createTask, createTaskList } from "@/features/tasks/actions";
import { createClient } from "@/lib/supabase/server";

import { requireResolved, toFormData, toNewAthleteValues } from "./form-data";
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

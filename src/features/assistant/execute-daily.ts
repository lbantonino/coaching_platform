import "server-only";

import { endExpense, removeExpense, removePayment } from "@/features/billing/billing-core";
import {
  createExpenseCategory,
  deleteExpenseCategory,
  renameExpenseCategory,
  setExpenseCategoryColor,
} from "@/features/billing/expense-actions";
import {
  createDocumentCategory,
  deleteDocument,
  deleteDocumentCategory,
  renameDocumentCategory,
  setDocumentCategoryColor,
  updateDocument,
} from "@/features/documents/actions";
import { getDocument } from "@/features/documents/queries";
import { unmarkSessionPaid } from "@/features/sessions/actions";
import { getSession } from "@/features/sessions/queries";
import { removeCoachSession, saveSessionChanges } from "@/features/sessions/session-core";
import { sessionFormInitial } from "@/features/sessions/schemas";
import {
  deleteTask,
  deleteTaskList,
  setTaskDone,
  updateTask,
  updateTaskList,
} from "@/features/tasks/actions";
import { getTask } from "@/features/tasks/queries";
import { removeDoneTasks } from "@/features/tasks/tasks-core";
import { todayIsoInBrussels } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

import {
  individualAthleteRefusal,
  seriesStartRefusal,
  stopExpenseRefusal,
  type DailyKind,
} from "./daily";
import type { ExecuteResult } from "./execute";
import {
  documentFormData,
  mergeDocumentChanges,
  mergeSessionChanges,
  mergeTaskChanges,
  sessionInputFormData,
  taskFormData,
} from "./form-data";
import type { ParsedAssistantAction } from "./proposals";

// « Valider » une carte du QUOTIDIEN (lot 4, D-183). Appelé par executeAssistantAction APRÈS
// requireOrgAccess et le schéma strict ; jamais depuis le navigateur (fichier server-only, pas « use
// server »). L'état est RELU ici ; les changements de la carte sont fusionnés dans les valeurs
// actuelles, puis l'action (ou son cœur) du formulaire habituel fait le travail, avec ses contrôles.

type DailyAction = Extract<ParsedAssistantAction, { kind: DailyKind }>;
const fail = (error: string): ExecuteResult => ({ ok: false, error });
const state = { error: null, attempt: 0, values: null, saved: false } as const;

async function category(
  orgId: string,
  domain: "depenses" | "documents",
  p: Extract<DailyAction, { kind: "categorie_depenses" }>["params"],
): Promise<ExecuteResult> {
  const href = domain === "depenses" ? "/coach/comptabilite" : "/coach/documents";
  const actions =
    domain === "depenses"
      ? {
          create: createExpenseCategory,
          rename: renameExpenseCategory,
          color: setExpenseCategoryColor,
          remove: deleteExpenseCategory,
        }
      : {
          create: createDocumentCategory,
          rename: renameDocumentCategory,
          color: setDocumentCategoryColor,
          remove: deleteDocumentCategory,
        };
  const result =
    p.action === "creer"
      ? await actions.create(orgId, p.nom)
      : p.action === "renommer"
        ? await actions.rename(orgId, p.categoryId, p.nom)
        : p.action === "couleur"
          ? await actions.color(orgId, p.categoryId, p.couleur)
          : await actions.remove(orgId, p.categoryId);
  return result.ok ? { ok: true, href } : fail(result.error ?? "La catégorie n'a pas pu changer.");
}

export async function executeDaily(
  orgId: string,
  userId: string,
  action: DailyAction,
): Promise<ExecuteResult> {
  const base = `/coach/o/${orgId}`;
  switch (action.kind) {
    case "modifier_seance_agenda": {
      const { sessionId, changes } = action.params;
      const session = await getSession(orgId, sessionId);
      if (!session) return fail("Séance introuvable : elle a peut-être été supprimée.");
      const refusal =
        individualAthleteRefusal(session, changes) ??
        seriesStartRefusal(session, changes, todayIsoInBrussels());
      if (refusal) return fail(refusal);
      const merged = mergeSessionChanges(
        sessionFormInitial(
          session,
          session.athletes.map((athlete) => athlete.id),
        ),
        changes,
      );
      const saved = await saveSessionChanges(orgId, userId, session, sessionInputFormData(merged));
      if (!saved.ok) return fail(saved.error);
      return { ok: true, href: `${base}/agenda/seances/${session.id}` };
    }
    case "supprimer_seance_agenda": {
      const removed = await removeCoachSession(orgId, action.params.sessionId);
      if (!removed.ok) return fail("Séance introuvable : elle a peut-être déjà été supprimée.");
      return { ok: true, href: `${base}/agenda` };
    }
    case "marquer_seance_non_payee": {
      const { sessionId, sessionDate } = action.params;
      const unpaid = await unmarkSessionPaid(orgId, sessionId, sessionDate);
      if (!unpaid.ok) return fail("Cette date n'a pas pu redevenir à encaisser.");
      return { ok: true, href: `${base}/agenda/seances/${sessionId}?date=${sessionDate}` };
    }
    case "supprimer_paiement": {
      const removed = await removePayment(orgId, action.params.paymentId);
      if (!removed.ok) return fail("Paiement introuvable : il a peut-être déjà été supprimé.");
      return { ok: true, href: "/coach/comptabilite" };
    }
    case "supprimer_depense": {
      const removed = await removeExpense(orgId, action.params.expenseId);
      if (!removed.ok) return fail("Dépense introuvable : elle a peut-être déjà été supprimée.");
      return { ok: true, href: "/coach/comptabilite" };
    }
    case "arreter_depense": {
      // La même règle qu'à la proposition, sur la dépense relue (jamais rallonger une dépense finie).
      const supabase = await createClient();
      const { data } = await supabase
        .from("coach_expenses")
        .select("spent_on, repeats_monthly, ends_on")
        .eq("organization_id", orgId)
        .eq("id", action.params.expenseId)
        .maybeSingle();
      const refusal = stopExpenseRefusal(
        data
          ? { repeatsMonthly: data.repeats_monthly, spentOn: data.spent_on, endsOn: data.ends_on }
          : null,
        todayIsoInBrussels(),
      );
      if (refusal) return fail(refusal);
      const ended = await endExpense(orgId, action.params.expenseId);
      if (!ended.ok) return fail("La dépense n'a pas pu être arrêtée.");
      return { ok: true, href: "/coach/comptabilite" };
    }
    case "categorie_depenses":
      return category(orgId, "depenses", action.params);
    case "categorie_documents":
      return category(orgId, "documents", action.params);
    case "cocher_tache": {
      const done = await setTaskDone(orgId, action.params.taskId, action.params.faite);
      if (!done.ok) return fail("Tâche introuvable : elle a peut-être été supprimée.");
      return { ok: true, href: "/coach/taches" };
    }
    case "modifier_tache": {
      const task = await getTask(orgId, action.params.taskId);
      if (!task) return fail("Tâche introuvable : elle a peut-être été supprimée.");
      const saved = await updateTask(
        orgId,
        task.id,
        state,
        taskFormData(mergeTaskChanges(task, action.params.changes)),
      );
      if (!saved.saved) return fail(saved.error ?? "La tâche n'a pas pu être enregistrée.");
      return { ok: true, href: "/coach/taches" };
    }
    case "supprimer_tache": {
      const removed = await deleteTask(orgId, action.params.taskId);
      if (!removed.ok) return fail("Tâche introuvable : elle a peut-être déjà été supprimée.");
      return { ok: true, href: "/coach/taches" };
    }
    case "supprimer_taches_terminees": {
      // Seulement les tâches comptées sur la carte (relecture n°2).
      const { taskIds } = action.params;
      if (!taskIds) return fail("Cette action n'est pas valable. Redemande-la à l'assistant.");
      const removed = await removeDoneTasks(orgId, taskIds);
      if (!removed.ok) return fail("Les tâches terminées n'ont pas pu être supprimées.");
      return { ok: true, href: "/coach/taches" };
    }
    case "modifier_liste_de_taches": {
      const { listId, nom, couleur } = action.params;
      const changed = await updateTaskList(orgId, listId, {
        ...(nom !== undefined ? { name: nom } : {}),
        ...(couleur !== undefined ? { color: couleur } : {}),
      });
      if (!changed.ok) return fail(changed.error ?? "La liste n'a pas pu être modifiée.");
      return { ok: true, href: "/coach/taches" };
    }
    case "supprimer_liste_de_taches": {
      const removed = await deleteTaskList(orgId, action.params.listId);
      if (!removed.ok) return fail(removed.error ?? "La liste n'a pas pu être supprimée.");
      return { ok: true, href: "/coach/taches" };
    }
    case "modifier_document": {
      const document = await getDocument(orgId, action.params.documentId);
      if (!document) return fail("Document introuvable : il a peut-être été supprimé.");
      const values = mergeDocumentChanges(document, action.params.changes);
      const saved = await updateDocument(orgId, document.id, state, documentFormData(values));
      if (!saved.saved) return fail(saved.error ?? "Le document n'a pas pu être enregistré.");
      return {
        ok: true,
        href: values.athleteId
          ? `${base}/sportifs/${values.athleteId}?onglet=documents`
          : "/coach/documents",
      };
    }
    case "supprimer_document": {
      const removed = await deleteDocument(orgId, action.params.documentId);
      if (!removed.ok) return fail("Document introuvable : il a peut-être déjà été supprimé.");
      return { ok: true, href: "/coach/documents" };
    }
  }
}

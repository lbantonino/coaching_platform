import "server-only";

import type Anthropic from "@anthropic-ai/sdk";

import { currencyOf, formatMoney, type Currency } from "@/domain/billing/money";
import { paymentMethodLabels, type PaymentMethod } from "@/domain/billing/payments";
import {
  CATEGORY_COLORS,
  categoryColorLabels,
  formatBytes,
  isCategoryColor,
  parseDocumentForm,
} from "@/domain/documents/documents";
import { LIST_COLORS, listColorLabels, type ListColor } from "@/domain/tasks/lists";
import { parseTaskForm } from "@/domain/tasks/task-form";
import { listPackageCovers } from "@/features/billing/payment-queries";
import { getDocument } from "@/features/documents/queries";
import { getSession, listSessionPayments } from "@/features/sessions/queries";
import {
  newlyAddedAthletes,
  parseSessionForm,
  sessionFormInitial,
} from "@/features/sessions/schemas";
import { getTask } from "@/features/tasks/queries";
import { nowTimeInBrussels, todayIsoInBrussels } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

import {
  ignoredSessionFieldsRefusal,
  individualAthleteRefusal,
  seriesStartRefusal,
  sessionFieldText,
  withPaymentMethodVat,
  stopExpenseRefusal,
  taskFieldText,
  unpaidAgainStatus,
  unpaidRefusal,
  type DailyKind,
} from "../daily";
import { mergeDocumentChanges, mergeSessionChanges, mergeTaskChanges } from "../form-data";
import { dayInWords } from "../rules";

// Assistant IA, lot 4 (D-183) : outils et contrôles du QUOTIDIEN. Rien n'est exécuté : chaque appel
// devient une carte après vérification (chaque identifiant dans l'organisation, refus purs de
// daily.ts, formulaire habituel validé sur les valeurs fusionnées) ; `names` reçoit ce que la carte
// affiche (valeurs « avant », noms, nombres de lignes touchées).

const date = { type: "string", description: "AAAA-MM-JJ" } as const;
const id = (description: string) => ({ type: "string", description }) as const;
const nullable = (schema: Record<string, unknown>, description: string) => ({
  ...schema,
  description: `${description} null efface.`,
});
const categoryTool = (domain: "depenses" | "documents"): Anthropic.Tool => ({
  name: `categorie_${domain}`,
  description: `Propose de créer, renommer, recolorer ou supprimer une catégorie de ${domain === "depenses" ? "dépenses (voir_categories_de_depenses)" : "documents (voir_categories_de_documents)"}. Supprimer : ses ${domain === "depenses" ? "dépenses" : "documents"} restent, sans catégorie.`,
  input_schema: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["creer", "renommer", "couleur", "supprimer"] },
      categoryId: id("Pour renommer, couleur, supprimer."),
      nom: { type: "string", description: "Pour creer et renommer." },
      couleur: { type: "string", enum: [...CATEGORY_COLORS] },
    },
    required: ["action"],
  },
});

export const DAILY_TOOLS: Anthropic.Tool[] = [
  {
    name: "modifier_seance_agenda",
    description:
      "Propose de modifier une séance de l'AGENDA (pas d'un programme), comme « Modifier la séance » : TOUTE la série si elle se répète. Pour une seule date, ou pour décaler une série déjà commencée, utilise deplacer_seance. Seulement les champs à changer. Le sportif d'une séance individuelle ne change pas.",
    input_schema: {
      type: "object",
      properties: {
        sessionId: id("seance_id de voir_agenda."),
        changes: {
          type: "object",
          properties: {
            title: { type: "string" },
            discipline: nullable(
              { type: "string", enum: ["running", "strength", "hyrox", "hybrid"] },
              "Discipline.",
            ),
            location: nullable({ type: "string" }, "Lieu."),
            startsOn: { ...date, description: "Première date de la série." },
            startTime: { type: "string", description: "HH:MM" },
            durationMinutes: { type: "integer" },
            repeatsWeekly: { type: "boolean" },
            endsOn: nullable(date, "Dernière date d'une série."),
            athleteIds: {
              type: "array",
              items: { type: "string" },
              description: "Séance collective : TOUS les inscrits (la liste remplace l'ancienne).",
            },
            price: nullable({ type: "number" }, "Prix en unités de la devise (65 = 65 €)."),
            vatRate: { type: "number", description: "Taux de TVA en % (0 = sans TVA)." },
            vatIncluded: { type: "boolean" },
            paymentMethod: { type: "string", enum: ["transfer", "cash"] },
            notes: nullable({ type: "string" }, "Notes de la séance."),
          },
        },
      },
      required: ["sessionId", "changes"],
    },
  },
  {
    name: "supprimer_seance_agenda",
    description:
      "Propose de supprimer une séance de l'agenda : toutes ses dates si elle se répète (pour l'arrêter à une date, modifie plutôt endsOn). Les paiements déjà notés restent.",
    input_schema: {
      type: "object",
      properties: { sessionId: id("seance_id de voir_agenda.") },
      required: ["sessionId"],
    },
  },
  {
    name: "marquer_seance_non_payee",
    description: "Propose d'annuler le « payé » d'une date de séance (elle redevient à encaisser).",
    input_schema: {
      type: "object",
      properties: { sessionId: id("seance_id."), sessionDate: date },
      required: ["sessionId", "sessionDate"],
    },
  },
  {
    name: "supprimer_paiement",
    description:
      "Propose de supprimer un paiement noté par erreur (voir_paiements) : il disparaît des chiffres ; une date de séance payée redevient à encaisser.",
    input_schema: {
      type: "object",
      properties: { paymentId: id("id de voir_paiements.") },
      required: ["paymentId"],
    },
  },
  {
    name: "supprimer_depense",
    description:
      "Propose de supprimer une dépense (voir_depenses). Une dépense mensuelle disparaît de TOUS les mois : si elle prend fin, préfère arreter_depense.",
    input_schema: {
      type: "object",
      properties: { expenseId: id("id de voir_depenses.") },
      required: ["expenseId"],
    },
  },
  {
    name: "arreter_depense",
    description:
      "Propose d'arrêter une dépense mensuelle aujourd'hui : elle ne compte plus après, le passé reste.",
    input_schema: {
      type: "object",
      properties: { expenseId: id("id de voir_depenses.") },
      required: ["expenseId"],
    },
  },
  categoryTool("depenses"),
  {
    name: "cocher_tache",
    description: "Propose de marquer une tâche faite (faite: true) ou à refaire (faite: false).",
    input_schema: {
      type: "object",
      properties: { taskId: id("id de voir_taches."), faite: { type: "boolean" } },
      required: ["taskId", "faite"],
    },
  },
  {
    name: "modifier_tache",
    description:
      "Propose de modifier une tâche (voir_taches) : seulement les champs à changer ; null efface l'échéance, la liste, le sportif ou la note.",
    input_schema: {
      type: "object",
      properties: {
        taskId: id("id de voir_taches."),
        changes: {
          type: "object",
          properties: {
            title: { type: "string" },
            priority: { type: "string", enum: ["high", "normal"] },
            dueOn: nullable(date, "Échéance."),
            listId: nullable({ type: "string" }, "Id de voir_listes_de_taches."),
            athleteId: nullable({ type: "string" }, "Id de chercher_sportifs."),
            notes: nullable({ type: "string" }, "Note de la tâche."),
          },
        },
      },
      required: ["taskId", "changes"],
    },
  },
  {
    name: "supprimer_tache",
    description: "Propose de supprimer une tâche (voir_taches), définitivement.",
    input_schema: {
      type: "object",
      properties: { taskId: id("id de voir_taches.") },
      required: ["taskId"],
    },
  },
  {
    name: "supprimer_taches_terminees",
    description: "Propose de supprimer définitivement TOUTES les tâches terminées.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "modifier_liste_de_taches",
    description: "Propose de renommer ou recolorer une liste de tâches (voir_listes_de_taches).",
    input_schema: {
      type: "object",
      properties: {
        listId: id("id de voir_listes_de_taches."),
        nom: { type: "string", description: "40 caractères au plus." },
        couleur: { type: "string", enum: [...LIST_COLORS] },
      },
      required: ["listId"],
    },
  },
  {
    name: "supprimer_liste_de_taches",
    description: "Propose de supprimer une liste de tâches : ses tâches restent, sans liste.",
    input_schema: {
      type: "object",
      properties: { listId: id("id de voir_listes_de_taches.") },
      required: ["listId"],
    },
  },
  {
    name: "modifier_document",
    description:
      "Propose de modifier la fiche d'un document (voir_documents) : nom, catégorie ou sportif (null retire). Jamais son contenu.",
    input_schema: {
      type: "object",
      properties: {
        documentId: id("id de voir_documents."),
        changes: {
          type: "object",
          properties: {
            name: { type: "string" },
            categoryId: nullable({ type: "string" }, "Id de voir_categories_de_documents."),
            athleteId: nullable({ type: "string" }, "Id de chercher_sportifs."),
          },
        },
      },
      required: ["documentId", "changes"],
    },
  },
  {
    name: "supprimer_document",
    description:
      "Propose de supprimer un document (voir_documents) et son fichier, définitivement.",
    input_schema: {
      type: "object",
      properties: { documentId: id("id de voir_documents.") },
      required: ["documentId"],
    },
  },
  categoryTool("documents"),
];

type Supabase = Awaited<ReturnType<typeof createClient>>;
// `params` : les paramètres complétés par le serveur (tâches comptées), à mettre sur la carte.
type Checked = { ok: true; params?: Record<string, unknown> } | { ok: false; error: string };
const refuse = (error: string): Checked => ({ ok: false, error });
const money = (cents: number, currency: Currency) =>
  formatMoney(cents, currency).replace(/\s/g, " ");

// Les sportifs (non archivés) de l'organisation, par id → nom ; null si l'un manque.
async function athleteNames(
  supabase: Supabase,
  orgId: string,
  ids: string[],
): Promise<Record<string, string> | null> {
  if (ids.length === 0) return {};
  const { data } = await supabase
    .from("athlete_profiles")
    .select("id, display_name, status")
    .eq("organization_id", orgId)
    .in("id", ids);
  const found = (data ?? []).filter((row) => row.status !== "archived");
  if (found.length !== new Set(ids).size) return null;
  return Object.fromEntries(found.map((row) => [row.id, row.display_name ?? ""]));
}

// Combien de lignes une catégorie ou une liste porte encore (« Ses 3 dépenses restent… »).
async function countRows(
  supabase: Supabase,
  orgId: string,
  what: "expenses" | "documents" | "tasks",
  value: string,
): Promise<number> {
  const query =
    what === "expenses"
      ? supabase
          .from("coach_expenses")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .eq("category_id", value)
      : what === "documents"
        ? supabase
            .from("coach_documents")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", orgId)
            .eq("category_id", value)
        : supabase
            .from("coach_tasks")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", orgId)
            .eq("list_id", value);
  const { count } = await query;
  return count ?? 0;
}

async function checkCategory(
  supabase: Supabase,
  orgId: string,
  domain: "depenses" | "documents",
  p: Record<string, unknown>,
  names: Record<string, string>,
): Promise<Checked> {
  const table = domain === "depenses" ? "expense_categories" : "document_categories";
  const { data: categories } = await supabase
    .from(table)
    .select("id, name, color")
    .eq("organization_id", orgId);
  const all = categories ?? [];
  const sameName = (name: string, except?: string) =>
    all.some(
      (row) => row.id !== except && row.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );
  if (p.action === "creer") {
    return sameName(String(p.nom)) ? refuse("Une catégorie porte déjà ce nom.") : { ok: true };
  }
  const category = all.find((row) => row.id === p.categoryId);
  if (!category) {
    return refuse(
      `Catégorie introuvable : regarde voir_categories_de_${domain === "depenses" ? "depenses" : "documents"}.`,
    );
  }
  names.categorie = category.name;
  names.couleur = isCategoryColor(category.color)
    ? categoryColorLabels[category.color]
    : category.color;
  if (p.action === "renommer" && sameName(String(p.nom), category.id)) {
    return refuse("Une catégorie porte déjà ce nom.");
  }
  if (p.action === "supprimer") {
    names.lignes = String(
      await countRows(
        supabase,
        orgId,
        domain === "depenses" ? "expenses" : "documents",
        category.id,
      ),
    );
  }
  return { ok: true };
}

// Valeur d'une séance enregistrée pour un champ de la carte (« avant »).
function sessionValue(
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>,
  field: string,
): unknown {
  switch (field) {
    case "athleteIds":
      return session.athletes.map((athlete) => athlete.id);
    case "price":
      return session.priceCents === null ? null : session.priceCents / 100;
    case "vatIncluded":
      return session.priceVatIncluded;
    default:
      return (session as Record<string, unknown>)[field];
  }
}

export async function proposeDaily(
  orgId: string,
  kind: DailyKind,
  p: Record<string, unknown>,
  names: Record<string, string>,
): Promise<Checked> {
  const supabase = await createClient();
  const { data: organization } = await supabase
    .from("organizations")
    .select("currency")
    .eq("id", orgId)
    .maybeSingle();
  const currency = currencyOf(organization?.currency ?? "EUR");

  switch (kind) {
    case "modifier_seance_agenda":
    case "supprimer_seance_agenda":
    case "marquer_seance_non_payee": {
      const session = await getSession(orgId, String(p.sessionId));
      if (!session) return refuse("Séance introuvable : regarde l'agenda avec voir_agenda.");
      const who =
        session.kind === "group" ? "collective" : (session.athletes[0]?.name ?? "sans sportif");
      names.seance = `${session.title} · ${who}`;
      if (session.repeatsWeekly) names.serie = "oui";
      if (kind === "supprimer_seance_agenda") return { ok: true };
      if (kind === "marquer_seance_non_payee") {
        const payments = await listSessionPayments(orgId, session.id);
        const refusal = unpaidRefusal(payments, String(p.sessionDate));
        if (refusal) return refuse(refusal);
        const paid = payments.find((payment) => payment.sessionDate === p.sessionDate);
        if (paid) names.montant = money(paid.amountCents, paid.currency);
        // La règle de la page « À encaisser » (revue du 20/11, n°6).
        names.seanceStatut = unpaidAgainStatus(session, String(p.sessionDate), {
          today: todayIsoInBrussels(),
          now: nowTimeInBrussels(),
          covers: await listPackageCovers(orgId),
        });
        return { ok: true };
      }
      // Moyen de paiement changé : « TVA comprise » suit, comme dans le formulaire (relecture n°4).
      const changes = withPaymentMethodVat(session, p.changes as Record<string, unknown>);
      const refusal =
        individualAthleteRefusal(session, changes) ??
        seriesStartRefusal(session, changes, todayIsoInBrussels()) ??
        ignoredSessionFieldsRefusal(session, changes);
      if (refusal) return refuse(refusal);
      // Inscrits : ceux déjà inscrits gardent leur place (même archivés) ; les AJOUTÉS doivent être des
      // fiches actives de l'organisation (relecture n°1).
      const enrolled = session.athletes.map((athlete) => athlete.id);
      for (const athlete of session.athletes) names[athlete.id] = athlete.name;
      if (Array.isArray(changes.athleteIds)) {
        const found = await athleteNames(
          supabase,
          orgId,
          newlyAddedAthletes(enrolled, changes.athleteIds as string[]),
        );
        if (!found)
          return refuse("Sportif introuvable ou archivé : cherche-le avec chercher_sportifs.");
        Object.assign(names, found);
      }
      // Les règles du formulaire, sur la séance complète après changements.
      const merged = mergeSessionChanges(sessionFormInitial(session, enrolled), changes);
      const parsed = parseSessionForm(merged);
      if (!parsed.ok) return refuse(parsed.error);
      for (const field of Object.keys(changes)) {
        names[`avant:${field}`] = sessionFieldText(
          field,
          sessionValue(session, field),
          names,
          currency,
        );
      }
      // Paiement ou TVA changés sans toucher au prix : la carte rappelle le prix (relecture n°4).
      const paymentChange = ["paymentMethod", "vatRate", "vatIncluded"].some(
        (field) => changes[field] !== undefined,
      );
      if (paymentChange && changes.price === undefined && session.priceCents !== null) {
        names.prix = money(session.priceCents, session.currency ?? currency);
      }
      return { ok: true, params: { changes } };
    }
    case "supprimer_paiement": {
      const { data } = await supabase
        .from("athlete_payments")
        .select(
          "received_on, amount_cents, currency, method, label, session_id, session_date, covers_from, covers_to, athlete_id, athlete:athlete_profiles ( display_name )",
        )
        .eq("organization_id", orgId)
        .eq("id", String(p.paymentId))
        .maybeSingle();
      if (!data) return refuse("Paiement introuvable : regarde voir_paiements.");
      names.paiement = [
        data.athlete?.display_name ?? data.label ?? "Paiement",
        money(data.amount_cents, currencyOf(data.currency)),
        paymentMethodLabels[data.method as PaymentMethod] ?? data.method,
        `reçu le ${dayInWords(data.received_on)}`,
      ].join(" · ");
      if (data.session_id && data.session_date) {
        names.seanceDate = data.session_date;
        // La règle de la page « À encaisser » (revue du 20/11, n°6), sans le forfait de ce paiement
        // s'il en couvre un.
        const covers = [...(await listPackageCovers(orgId))];
        const own = covers.findIndex(
          (cover) =>
            cover.athleteId === data.athlete_id &&
            cover.coversFrom === data.covers_from &&
            cover.coversTo === data.covers_to,
        );
        if (own !== -1) covers.splice(own, 1);
        names.seanceStatut = unpaidAgainStatus(
          await getSession(orgId, data.session_id),
          data.session_date,
          { today: todayIsoInBrussels(), now: nowTimeInBrussels(), covers },
        );
      }
      // Un forfait couvre une période : la carte le dit (relecture n°5).
      if (data.covers_from && data.covers_to) {
        names.forfaitDu = data.covers_from;
        names.forfaitAu = data.covers_to;
      }
      return { ok: true };
    }
    case "supprimer_depense":
    case "arreter_depense": {
      const { data } = await supabase
        .from("coach_expenses")
        .select("label, amount_cents, currency, spent_on, repeats_monthly, ends_on")
        .eq("organization_id", orgId)
        .eq("id", String(p.expenseId))
        .maybeSingle();
      const today = todayIsoInBrussels();
      if (kind === "arreter_depense") {
        const refusal = stopExpenseRefusal(
          data
            ? { repeatsMonthly: data.repeats_monthly, spentOn: data.spent_on, endsOn: data.ends_on }
            : null,
          today,
        );
        if (refusal) return refuse(refusal);
      }
      if (!data) return refuse("Dépense introuvable : regarde voir_depenses.");
      names.depense = [
        data.label,
        money(data.amount_cents, currencyOf(data.currency)),
        data.repeats_monthly ? "chaque mois" : `le ${dayInWords(data.spent_on)}`,
      ].join(" · ");
      if (data.repeats_monthly) names.mensuelle = "oui";
      names.aujourdhui = today;
      return { ok: true };
    }
    case "categorie_depenses":
      return checkCategory(supabase, orgId, "depenses", p, names);
    case "categorie_documents":
      return checkCategory(supabase, orgId, "documents", p, names);
    case "cocher_tache":
    case "modifier_tache":
    case "supprimer_tache": {
      const task = await getTask(orgId, String(p.taskId));
      if (!task) return refuse("Tâche introuvable : regarde voir_taches.");
      names.tache = task.title;
      if (kind === "cocher_tache") {
        if (task.done === p.faite) {
          return refuse(p.faite ? "Cette tâche est déjà faite." : "Cette tâche est déjà à faire.");
        }
        return { ok: true };
      }
      if (kind === "supprimer_tache") return { ok: true };
      const changes = p.changes as Record<string, unknown>;
      if (task.list) names[task.list.id] = task.list.name;
      if (task.athleteId) names[task.athleteId] = task.athleteName ?? "";
      if (typeof changes.listId === "string") {
        const { data } = await supabase
          .from("coach_task_lists")
          .select("name")
          .eq("organization_id", orgId)
          .eq("id", changes.listId)
          .maybeSingle();
        if (!data) return refuse("Liste introuvable : regarde voir_listes_de_taches.");
        names[changes.listId] = data.name;
      }
      if (typeof changes.athleteId === "string") {
        const found = await athleteNames(supabase, orgId, [changes.athleteId]);
        if (!found)
          return refuse("Sportif introuvable ou archivé : cherche-le avec chercher_sportifs.");
        Object.assign(names, found);
      }
      const parsed = parseTaskForm(mergeTaskChanges(task, changes));
      if (!parsed.ok) return refuse(parsed.error);
      const before: Record<string, unknown> = {
        title: task.title,
        priority: task.priority,
        dueOn: task.dueOn,
        listId: task.list?.id ?? null,
        athleteId: task.athleteId,
        notes: task.notes,
      };
      for (const field of Object.keys(changes)) {
        names[`avant:${field}`] = taskFieldText(field, before[field], names);
      }
      return { ok: true };
    }
    case "supprimer_taches_terminees": {
      // Les tâches terminées MAINTENANT : la carte les compte, le clic ne supprime qu'elles.
      const { data } = await supabase
        .from("coach_tasks")
        .select("id")
        .eq("organization_id", orgId)
        .not("done_at", "is", null)
        .limit(500);
      const taskIds = (data ?? []).map((row) => row.id);
      if (taskIds.length === 0) return refuse("Aucune tâche terminée à supprimer.");
      names.lignes = String(taskIds.length);
      return { ok: true, params: { taskIds } };
    }
    case "modifier_liste_de_taches":
    case "supprimer_liste_de_taches": {
      const { data } = await supabase
        .from("coach_task_lists")
        .select("id, name, color")
        .eq("organization_id", orgId)
        .eq("id", String(p.listId))
        .maybeSingle();
      if (!data) return refuse("Liste introuvable : regarde voir_listes_de_taches.");
      names.liste = data.name;
      names.couleur = listColorLabels[data.color as ListColor] ?? data.color;
      if (kind === "supprimer_liste_de_taches") {
        names.lignes = String(await countRows(supabase, orgId, "tasks", data.id));
      }
      return { ok: true };
    }
    case "modifier_document":
    case "supprimer_document": {
      const document = await getDocument(orgId, String(p.documentId));
      if (!document) return refuse("Document introuvable : regarde voir_documents.");
      names.document = [document.name, formatBytes(document.sizeBytes), document.athleteName]
        .filter(Boolean)
        .join(" · ");
      if (kind === "supprimer_document") return { ok: true };
      const changes = p.changes as Record<string, unknown>;
      if (document.categoryId) names[document.categoryId] = document.categoryName ?? "";
      if (document.athleteId) names[document.athleteId] = document.athleteName ?? "";
      if (typeof changes.categoryId === "string") {
        const { data } = await supabase
          .from("document_categories")
          .select("name")
          .eq("organization_id", orgId)
          .eq("id", changes.categoryId)
          .maybeSingle();
        if (!data) return refuse("Catégorie introuvable : regarde voir_categories_de_documents.");
        names[changes.categoryId] = data.name;
      }
      if (typeof changes.athleteId === "string") {
        const found = await athleteNames(supabase, orgId, [changes.athleteId]);
        if (!found)
          return refuse("Sportif introuvable ou archivé : cherche-le avec chercher_sportifs.");
        Object.assign(names, found);
      }
      const parsed = parseDocumentForm(mergeDocumentChanges(document, changes));
      if (!parsed.ok) return refuse(parsed.error);
      const before: Record<string, string | null> = {
        name: document.name,
        categoryId: document.categoryId ? (document.categoryName ?? "?") : null,
        athleteId: document.athleteId ? (document.athleteName ?? "?") : null,
      };
      for (const field of Object.keys(changes)) names[`avant:${field}`] = before[field] ?? "";
      return { ok: true };
    }
  }
}

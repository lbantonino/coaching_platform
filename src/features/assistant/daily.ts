import { z } from "zod";

import { formatMoney, type Currency } from "@/domain/billing/money";
import {
  CATEGORY_COLORS,
  CATEGORY_NAME_MAX,
  categoryColorLabels,
  type CategoryColor,
} from "@/domain/documents/documents";
import { LIST_COLORS, LIST_NAME_MAX, listColorLabels, type ListColor } from "@/domain/tasks/lists";
import { DISCIPLINES, disciplineLabels, type Discipline } from "@/domain/training/discipline";
import { COLLECT_WEEKS, coveredByPackage, type PackageCoverLike } from "@/domain/billing/payments";
import { addDays } from "@/features/agenda/items";
import {
  SESSION_PAYMENT_METHODS,
  defaultVatIncluded,
  type SessionPaymentMethod,
} from "@/features/sessions/schemas";
import { datesToCollect, type PricedSessionLike } from "@/features/sessions/prices";

import { dayInWords } from "./rules";

// Assistant IA, lot 4 (D-183) : le QUOTIDIEN (agenda, comptabilité, tâches, documents), en cartes à
// valider. Règles PURES : schémas stricts, refus (rien que l'action habituelle ne ferait pas) et ce
// que dit chaque carte, avec les phrases de l'interface. Le serveur (tools/daily.ts) remplit `names`
// avec les valeurs lues (« avant », noms, nombres de lignes touchées).

const isoDay = z.iso.date();
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: "Heure au format HH:MM." });
const text = (max: number) => z.string().trim().min(1).max(max);
const atLeastOne = { error: "Indique au moins un changement." };
const nonEmpty = (value: object) => Object.keys(value).length > 0;

// Catégories de dépenses ou de documents : les quatre gestes de la fenêtre « Catégories ».
const categoryAction = z.discriminatedUnion("action", [
  z.strictObject({ action: z.literal("creer"), nom: text(CATEGORY_NAME_MAX) }),
  z.strictObject({
    action: z.literal("renommer"),
    categoryId: z.uuid(),
    nom: text(CATEGORY_NAME_MAX),
  }),
  z.strictObject({
    action: z.literal("couleur"),
    categoryId: z.uuid(),
    couleur: z.enum(CATEGORY_COLORS),
  }),
  z.strictObject({ action: z.literal("supprimer"), categoryId: z.uuid() }),
]);

export const DAILY_PARAMS = {
  // Agenda : « Modifier la séance » (toute la série si elle se répète), « Supprimer », date « plus
  // payée ». Le type et le sportif d'une séance individuelle ne changent pas.
  modifier_seance_agenda: z.strictObject({
    sessionId: z.uuid(),
    changes: z
      .strictObject({
        title: text(120).optional(),
        discipline: z.enum(DISCIPLINES).nullable().optional(),
        location: z.string().trim().max(120).nullable().optional(),
        startsOn: isoDay.optional(),
        startTime: time.optional(),
        durationMinutes: z.number().int().min(5).max(600).optional(),
        repeatsWeekly: z.boolean().optional(),
        endsOn: isoDay.nullable().optional(),
        athleteIds: z.array(z.uuid()).max(100).optional(),
        price: z.number().min(0).max(1_000_000).nullable().optional(),
        vatRate: z.number().min(0).max(100).optional(),
        vatIncluded: z.boolean().optional(),
        paymentMethod: z.enum(SESSION_PAYMENT_METHODS).optional(),
        notes: z.string().trim().max(1000).nullable().optional(),
      })
      .refine(nonEmpty, atLeastOne),
  }),
  supprimer_seance_agenda: z.strictObject({ sessionId: z.uuid() }),
  marquer_seance_non_payee: z.strictObject({ sessionId: z.uuid(), sessionDate: isoDay }),
  // Comptabilité.
  supprimer_paiement: z.strictObject({ paymentId: z.uuid() }),
  supprimer_depense: z.strictObject({ expenseId: z.uuid() }),
  arreter_depense: z.strictObject({ expenseId: z.uuid() }),
  categorie_depenses: categoryAction,
  // Tâches.
  cocher_tache: z.strictObject({ taskId: z.uuid(), faite: z.boolean() }),
  modifier_tache: z.strictObject({
    taskId: z.uuid(),
    changes: z
      .strictObject({
        title: text(200).optional(),
        priority: z.enum(["high", "normal"]).optional(),
        dueOn: isoDay.nullable().optional(),
        listId: z.uuid().nullable().optional(),
        athleteId: z.uuid().nullable().optional(),
        notes: z.string().trim().max(1000).nullable().optional(),
      })
      .refine(nonEmpty, atLeastOne),
  }),
  supprimer_tache: z.strictObject({ taskId: z.uuid() }),
  // Les tâches comptées à la proposition, notées par le SERVEUR : le clic ne supprime qu'elles
  // (relecture du lot 4, n°2), jamais une tâche cochée entre-temps.
  supprimer_taches_terminees: z.strictObject({ taskIds: z.array(z.uuid()).max(500).optional() }),
  modifier_liste_de_taches: z
    .strictObject({
      listId: z.uuid(),
      nom: text(LIST_NAME_MAX).optional(),
      couleur: z.enum(LIST_COLORS).optional(),
    })
    .refine((p) => p.nom !== undefined || p.couleur !== undefined, atLeastOne),
  supprimer_liste_de_taches: z.strictObject({ listId: z.uuid() }),
  // Documents : la fiche du document (jamais son fichier).
  modifier_document: z.strictObject({
    documentId: z.uuid(),
    changes: z
      .strictObject({
        name: text(160).optional(),
        categoryId: z.uuid().nullable().optional(),
        athleteId: z.uuid().nullable().optional(),
      })
      .refine(nonEmpty, atLeastOne),
  }),
  supprimer_document: z.strictObject({ documentId: z.uuid() }),
  categorie_documents: categoryAction,
} as const;

export type DailyKind = keyof typeof DAILY_PARAMS;
export const DAILY_KINDS = Object.keys(DAILY_PARAMS) as DailyKind[];
export const isDailyKind = (kind: string): kind is DailyKind =>
  (DAILY_KINDS as string[]).includes(kind);

const entry = <K extends DailyKind>(kind: K) =>
  z.object({ kind: z.literal(kind), params: DAILY_PARAMS[kind] });
export const DAILY_ACTIONS = [
  entry("modifier_seance_agenda"),
  entry("supprimer_seance_agenda"),
  entry("marquer_seance_non_payee"),
  entry("supprimer_paiement"),
  entry("supprimer_depense"),
  entry("arreter_depense"),
  entry("categorie_depenses"),
  entry("cocher_tache"),
  entry("modifier_tache"),
  entry("supprimer_tache"),
  entry("supprimer_taches_terminees"),
  entry("modifier_liste_de_taches"),
  entry("supprimer_liste_de_taches"),
  entry("modifier_document"),
  entry("supprimer_document"),
  entry("categorie_documents"),
] as const;

// --- Refus purs -----------------------------------------------------------------------------------

// « Arrêter » ne touche qu'une dépense mensuelle déjà commencée (comme l'action) ; une dépense déjà
// finie serait PROLONGÉE jusqu'à aujourd'hui : refus aussi.
export function stopExpenseRefusal(
  expense: { repeatsMonthly: boolean; spentOn: string; endsOn: string | null } | null,
  today: string,
): string | null {
  if (!expense) return "Dépense introuvable : regarde voir_depenses.";
  if (!expense.repeatsMonthly) {
    return "Cette dépense n'est pas mensuelle : il n'y a rien à arrêter (supprimer_depense pour l'effacer).";
  }
  if (expense.spentOn > today) {
    return `Cette dépense mensuelle commence le ${dayInWords(expense.spentOn)} : rien à arrêter avant (supprime-la si elle n'a plus lieu d'être).`;
  }
  if (expense.endsOn !== null && expense.endsOn <= today) {
    return `Cette dépense est déjà arrêtée (dernier mois : ${dayInWords(expense.endsOn)}).`;
  }
  return null;
}

// Relecture du lot 4, n°6 : le début d'une série DÉJÀ commencée ne change pas par « Modifier » (ses
// dates passées, dates déplacées et paiements liés perdraient leur correspondance) ; le bon geste est
// deplacer_seance (toute la série, comme le glisser dans l'agenda) ou une fin puis une nouvelle série.
export function seriesStartRefusal(
  session: { repeatsWeekly: boolean; startsOn: string },
  changes: Record<string, unknown>,
  today: string,
): string | null {
  if (!session.repeatsWeekly || typeof changes.startsOn !== "string") return null;
  if (changes.startsOn === session.startsOn || session.startsOn > today) return null;
  return `Cette série a déjà commencé (le ${dayInWords(session.startsOn)}) : pour la décaler, utilise deplacer_seance avec scope series (3 jours au plus, comme le glisser dans l'agenda) ; sinon arrête-la (endsOn) et crée-en une nouvelle.`;
}

// Relecture du lot 4, n°3 : jamais une carte pour un changement que le formulaire ignorerait (« Fait »
// sans effet). Paiement et TVA n'existent qu'avec un prix ; une date de fin, qu'avec une série.
export function ignoredSessionFieldsRefusal(
  session: { priceCents: number | null; repeatsWeekly: boolean },
  changes: Record<string, unknown>,
): string | null {
  const price = "price" in changes ? changes.price : session.priceCents;
  const paymentChange = ["paymentMethod", "vatRate", "vatIncluded"].some(
    (field) => changes[field] !== undefined,
  );
  if (paymentChange && (price === null || price === undefined)) {
    return "Cette séance n'a pas de prix : le paiement et la TVA ne comptent qu'avec un prix. Ajoute un prix (price) dans la même demande, ou retire ces changements.";
  }
  const repeats =
    typeof changes.repeatsWeekly === "boolean" ? changes.repeatsWeekly : session.repeatsWeekly;
  if (!repeats && typeof changes.endsOn === "string") {
    return "Une séance unique n'a pas de date de fin : endsOn sert seulement à une séance qui se répète chaque semaine (repeatsWeekly).";
  }
  return null;
}

// Relecture du lot 4, n°4 : changer le moyen de paiement remet « TVA comprise » à la valeur du moyen,
// comme le formulaire (sauf si le coach la choisit lui-même) ; la carte le montre.
export function withPaymentMethodVat(
  session: { paymentMethod: string | null; priceVatIncluded: boolean },
  changes: Record<string, unknown>,
): Record<string, unknown> {
  const method = changes.paymentMethod;
  if (typeof method !== "string" || changes.vatIncluded !== undefined) return changes;
  if (method === session.paymentMethod) return changes;
  const included = defaultVatIncluded(method as SessionPaymentMethod);
  return included === session.priceVatIncluded ? changes : { ...changes, vatIncluded: included };
}

// Relecture du lot 4, n°5 : ce que devient une date dont le paiement est retiré. « À encaisser » ne
// liste que les séances passées des COLLECT_WEEKS dernières semaines.
export function sessionDateStatus(date: string, today: string): "futur" | "a_encaisser" | "ancien" {
  if (date > today) return "futur";
  return date < addDays(today, -7 * COLLECT_WEEKS) ? "ancien" : "a_encaisser";
}

// Revue du 20/11, n°6 : la MÊME règle que la page « À encaisser » (listUnpaidDates, datesToCollect) :
// une séance avec un prix ET un moyen de paiement, déjà commencée (aujourd'hui : à son heure, à sa
// date déplacée s'il y a lieu), pas couverte par un forfait. `covers` : les forfaits restants (sans
// celui du paiement retiré). `session` null (séance supprimée) : la date seule.
export type UnpaidAgainStatus = "futur" | "a_encaisser" | "ancien" | "forfait" | "sans_suivi";
export function unpaidAgainStatus(
  session:
    | (PricedSessionLike & {
        paymentMethod: string | null;
        kind: string;
        athletes: readonly { id: string }[];
      })
    | null,
  originalDate: string,
  { today, now, covers }: { today: string; now: string; covers: readonly PackageCoverLike[] },
): UnpaidAgainStatus {
  if (!session) return sessionDateStatus(originalDate, today);
  if (session.paymentMethod === null || session.priceCents === null) return "sans_suivi";
  if (
    session.kind === "individual" &&
    coveredByPackage([...covers], session.athletes[0]?.id, originalDate)
  ) {
    return "forfait";
  }
  const from = addDays(today, -7 * COLLECT_WEEKS);
  const collected = datesToCollect([session], from, today, now.slice(0, 5), () => false);
  if (collected.some((item) => item.originalDate === originalDate)) return "a_encaisser";
  const moved = session.exceptions?.find((item) => item.originalDate === originalDate);
  const date = moved?.newDate ?? originalDate;
  const start = (moved?.newStartTime ?? session.startTime).slice(0, 5);
  return date > today || (date === today && start > now.slice(0, 5)) ? "futur" : "ancien";
}

function unpaidAgainLine(date: string, status: string | undefined): string {
  const day = `La séance du ${dayInWords(date)}`;
  const away = "elle ne revient pas dans « À encaisser »";
  if (status === "futur") return `${day} n'est plus marquée payée`;
  if (status === "ancien")
    return `${day} n'est plus marquée payée (trop ancienne pour « À encaisser »)`;
  if (status === "forfait")
    return `${day} n'est plus marquée payée (couverte par un forfait : ${away})`;
  if (status === "sans_suivi")
    return `${day} n'est plus marquée payée (sans prix ou sans moyen de paiement : ${away})`;
  return `${day} redevient à encaisser`;
}

// Le sportif d'une séance individuelle ne change pas (droit refusé en base aussi).
export function individualAthleteRefusal(
  session: { kind: string },
  changes: Record<string, unknown>,
): string | null {
  return session.kind === "individual" && changes.athleteIds !== undefined
    ? "Le sportif d'une séance individuelle ne change pas : supprime-la et crée-en une autre."
    : null;
}

// « Plus payée » : seulement une date marquée payée.
export function unpaidRefusal(
  payments: readonly { sessionDate: string | null }[],
  sessionDate: string,
): string | null {
  return payments.some((payment) => payment.sessionDate === sessionDate)
    ? null
    : "Cette date n'est pas marquée payée : rien à annuler.";
}

// --- Ce que dit la carte --------------------------------------------------------------------------
const yesNo = (value: unknown) => (value ? "oui" : "non");
const money = (cents: number, currency: Currency) =>
  formatMoney(Math.round(cents), currency).replace(/\s/g, " ");
const METHOD: Record<string, string> = { transfer: "virement", cash: "espèces" };

export const SESSION_FIELD_LABELS: Record<string, string> = {
  title: "Titre",
  discipline: "Discipline",
  location: "Lieu",
  startsOn: "Début",
  startTime: "Heure",
  durationMinutes: "Durée",
  repeatsWeekly: "Chaque semaine",
  endsOn: "Jusqu'au",
  athleteIds: "Inscrits",
  price: "Prix",
  vatRate: "TVA",
  vatIncluded: "TVA comprise",
  paymentMethod: "Paiement",
  notes: "Notes",
};

// Une valeur de séance en clair (« mardi 10 novembre 2026 », « 60 min », « 65,00 € »…) ; « — » vide.
// `names` : noms des sportifs inscrits ; prix en unités de la devise (65 = 65 €).
export function sessionFieldText(
  field: string,
  value: unknown,
  names: Record<string, string>,
  currency: Currency,
): string {
  if (value === null || value === undefined || value === "") return "—";
  switch (field) {
    case "discipline":
      return disciplineLabels[value as Discipline] ?? String(value);
    case "startsOn":
    case "endsOn":
      return dayInWords(String(value));
    case "durationMinutes":
      return `${String(value)} min`;
    case "repeatsWeekly":
    case "vatIncluded":
      return yesNo(value);
    case "athleteIds": {
      const ids = value as string[];
      return ids.length === 0
        ? "aucun"
        : ids.map((athleteId) => names[athleteId] ?? "?").join(", ");
    }
    case "price":
      return money(Number(value) * 100, currency);
    case "vatRate":
      return `${String(value).replace(".", ",")} %`;
    case "paymentMethod":
      return METHOD[String(value)] ?? String(value);
    default:
      return String(value);
  }
}

export const TASK_FIELD_LABELS: Record<string, string> = {
  title: "Titre",
  priority: "Priorité",
  dueOn: "Échéance",
  listId: "Liste",
  athleteId: "Sportif",
  notes: "Note",
};

// Une valeur de tâche en clair ; liste et sportif par leur nom (`names`).
export function taskFieldText(
  field: string,
  value: unknown,
  names: Record<string, string>,
): string {
  if (value === null || value === undefined || value === "") return "—";
  switch (field) {
    case "priority":
      return value === "high" ? "haute" : "normale";
    case "dueOn":
      return dayInWords(String(value));
    case "listId":
    case "athleteId":
      return names[String(value)] ?? "?";
    default:
      return String(value);
  }
}

export const DOCUMENT_FIELD_LABELS: Record<string, string> = {
  name: "Nom",
  categoryId: "Catégorie",
  athleteId: "Sportif",
};

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

// « Ses 3 dépenses restent, sans catégorie (définitif) » ; « Son document reste… » ; « Aucune… ».
function stillThere(
  count: number,
  noun: { one: string; many: string; possessive: string },
  without: string,
): string {
  if (count === 0)
    return `Aucun${noun.possessive === "Sa" ? "e" : ""} ${noun.one} concerné${noun.possessive === "Sa" ? "e" : ""} (définitif)`;
  if (count === 1) return `${noun.possessive} ${noun.one} reste, ${without} (définitif)`;
  return `Ses ${count} ${noun.many} restent, ${without} (définitif)`;
}
const EXPENSES = { one: "dépense", many: "dépenses", possessive: "Sa" };
const DOCUMENTS = { one: "document", many: "documents", possessive: "Son" };
const TASKS = { one: "tâche", many: "tâches", possessive: "Sa" };

const CATEGORY_TITLES: Record<string, string> = {
  creer: "Nouvelle catégorie",
  renommer: "Renommer la catégorie",
  couleur: "Couleur de la catégorie",
  supprimer: "Supprimer la catégorie",
};

function categoryCard(
  p: Record<string, unknown>,
  names: Record<string, string>,
  domain: "depenses" | "documents",
): { title: string; summary: (string | null)[] } {
  const current = names.categorie ?? "?";
  const action = String(p.action);
  const lines: (string | null)[] = [];
  switch (action) {
    case "creer":
      lines.push(
        `« ${String(p.nom)} »`,
        domain === "depenses" ? "Catégorie de dépenses" : "Catégorie de documents",
      );
      break;
    case "renommer":
      lines.push(`« ${current} » → « ${String(p.nom)} »`);
      break;
    case "couleur":
      lines.push(
        `« ${current} »`,
        `Couleur : ${names.couleur ?? "?"} → ${categoryColorLabels[p.couleur as CategoryColor] ?? String(p.couleur)}`,
      );
      break;
    case "supprimer":
      lines.push(
        `« ${current} »`,
        stillThere(
          Number(names.lignes ?? 0),
          domain === "depenses" ? EXPENSES : DOCUMENTS,
          "sans catégorie",
        ),
      );
      break;
  }
  return { title: CATEGORY_TITLES[action] ?? "Catégorie", summary: lines };
}

// La carte d'une action du lot 4, ou null pour une autre action.
export function summarizeDaily(
  action: { kind: string; params: Record<string, unknown> },
  names: Record<string, string>,
  currency: Currency,
): { title: string; summary: string[] } | null {
  if (!isDailyKind(action.kind)) return null;
  const p = action.params;
  let title = "";
  const lines: (string | null)[] = [];
  switch (action.kind) {
    case "modifier_seance_agenda":
      title = "Modifier la séance";
      lines.push(names.seance ?? "Séance");
      lines.push(
        ...changeLines(
          (p.changes ?? {}) as Record<string, unknown>,
          SESSION_FIELD_LABELS,
          names,
          (field, value) => sessionFieldText(field, value, names, currency),
        ),
      );
      lines.push(names.serie === "oui" ? "Toute la série (chaque semaine)" : null);
      lines.push(names.prix ? `Prix : ${names.prix}` : null);
      break;
    case "supprimer_seance_agenda":
      title = "Supprimer la séance";
      lines.push(
        names.seance ?? "Séance",
        names.serie === "oui"
          ? "Toutes ses dates seront supprimées (définitif)"
          : "Elle disparaîtra de l'agenda et des sportifs inscrits (définitif)",
        "Les paiements déjà notés restent",
      );
      break;
    case "marquer_seance_non_payee":
      title = "Séance plus payée";
      lines.push(
        names.seance ?? "Séance",
        `Séance du ${dayInWords(String(p.sessionDate))}`,
        names.montant ?? null,
        names.seanceStatut === "futur"
          ? "Elle n'est plus marquée payée"
          : names.seanceStatut === "ancien"
            ? "Elle n'est plus marquée payée (trop ancienne pour « À encaisser »)"
            : "Elle redevient à encaisser",
      );
      break;
    case "supprimer_paiement":
      title = "Supprimer le paiement";
      lines.push(
        names.paiement ?? "Paiement",
        names.seanceDate ? unpaidAgainLine(names.seanceDate, names.seanceStatut) : null,
        names.forfaitDu && names.forfaitAu
          ? `Forfait du ${dayInWords(names.forfaitDu)} au ${dayInWords(names.forfaitAu)} : ses séances ne sont plus couvertes`
          : null,
        "Il disparaît des chiffres (définitif)",
      );
      break;
    case "supprimer_depense":
      title = "Supprimer la dépense";
      lines.push(
        names.depense ?? "Dépense",
        names.mensuelle === "oui"
          ? "Elle disparaît de TOUS les mois (définitif)"
          : "Elle disparaît des chiffres (définitif)",
      );
      break;
    case "arreter_depense":
      title = "Arrêter la dépense";
      lines.push(
        names.depense ?? "Dépense",
        `Ne compte plus après aujourd'hui (${dayInWords(names.aujourdhui ?? "")}) ; le passé reste`,
      );
      break;
    case "categorie_depenses":
    case "categorie_documents": {
      const card = categoryCard(
        p,
        names,
        action.kind === "categorie_depenses" ? "depenses" : "documents",
      );
      title = card.title;
      lines.push(...card.summary);
      break;
    }
    case "cocher_tache":
      title = p.faite ? "Tâche faite" : "Tâche à refaire";
      lines.push(names.tache ?? "Tâche");
      break;
    case "modifier_tache":
      title = "Modifier la tâche";
      lines.push(names.tache ?? "Tâche");
      lines.push(
        ...changeLines(
          (p.changes ?? {}) as Record<string, unknown>,
          TASK_FIELD_LABELS,
          names,
          (field, value) => taskFieldText(field, value, names),
        ),
      );
      break;
    case "supprimer_tache":
      title = "Supprimer la tâche";
      lines.push(names.tache ?? "Tâche", "Supprimée (définitif)");
      break;
    case "supprimer_taches_terminees": {
      title = "Vider les tâches terminées";
      const count = Number(names.lignes ?? 0);
      lines.push(
        count === 0
          ? "Aucune tâche terminée"
          : `${count} tâche${count > 1 ? "s" : ""} terminée${count > 1 ? "s" : ""} (définitif)`,
      );
      break;
    }
    case "modifier_liste_de_taches":
      title = "Modifier la liste";
      lines.push(`« ${names.liste ?? "?"} »`);
      if (p.nom !== undefined) lines.push(`Nom : ${names.liste ?? "?"} → ${String(p.nom)}`);
      if (p.couleur !== undefined) {
        lines.push(
          `Couleur : ${names.couleur ?? "?"} → ${listColorLabels[p.couleur as ListColor] ?? String(p.couleur)}`,
        );
      }
      break;
    case "supprimer_liste_de_taches":
      title = "Supprimer la liste";
      lines.push(
        `« ${names.liste ?? "?"} »`,
        stillThere(Number(names.lignes ?? 0), TASKS, "sans liste"),
      );
      break;
    case "modifier_document":
      title = "Modifier le document";
      lines.push(names.document ?? "Document");
      lines.push(
        ...changeLines(
          (p.changes ?? {}) as Record<string, unknown>,
          DOCUMENT_FIELD_LABELS,
          names,
          (field, value) =>
            value === null || value === undefined
              ? "—"
              : field === "name"
                ? String(value)
                : (names[String(value)] ?? "?"),
        ),
      );
      break;
    case "supprimer_document":
      title = "Supprimer le document";
      lines.push(
        names.document ?? "Document",
        "Le document et son fichier disparaissent (définitif)",
      );
      break;
  }
  return {
    title,
    summary: lines.filter((line): line is string => typeof line === "string" && line !== ""),
  };
}

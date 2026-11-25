import { parseExpenseForm } from "@/domain/billing/expenses";
import { parseCoachExerciseForm, type CoachExerciseInput } from "@/domain/exercises/coach-exercise";
import { parseVatRate } from "@/domain/billing/money";
import { parseAmount } from "@/domain/billing/payments";
import type { DocumentFormValues } from "@/domain/documents/documents";
import { parseTaskForm, readTaskForm, type TaskFormValues } from "@/domain/tasks/task-form";
import { parseNewAthleteForm, type NewAthleteFormInput } from "@/features/athletes/new-athlete";
import type { AddressFormValues, AthleteFormValues } from "@/features/athletes/actions";
import type { AthleteDetail } from "@/features/athletes/queries";
import type { PaymentFormValues } from "@/features/billing/payment-actions";
import type { CoachDocument } from "@/features/documents/queries";
import type { CoachTask } from "@/features/tasks/queries";
import {
  occursOn,
  scheduleRule,
  parseSessionForm,
  type ScheduleLike,
  type SessionFormInput,
} from "@/features/sessions/schemas";

import { programRuleError } from "./program";
import type { ParsedAssistantAction } from "./proposals";
import { dayInWords } from "./rules";

// Une carte validée de l'Assistant IA (lot 1 des actions) passe par le MÊME formulaire que la saisie à
// la main : ces fonctions PURES traduisent la proposition dans les champs exacts de chaque formulaire
// (lus par readForm des séances, createPayment, createExpense, readTaskForm, parseNewAthleteForm).
// Jamais de santé, d'accord ni de note privée : ces champs restent vides.

// 65 -> « 65,00 » (format accepté par parseAmount, comme une saisie à la main).
const amountText = (value: number) => value.toFixed(2).replace(".", ",");
const text = (value: unknown) => (typeof value === "string" ? value : "");
const athleteIdOf = (ref: unknown) =>
  ref && typeof ref === "object" && "athleteId" in ref ? String(ref.athleteId) : "";

export function toNewAthleteValues(params: Record<string, unknown>): NewAthleteFormInput {
  return {
    firstName: text(params.firstName),
    lastName: text(params.lastName),
    sex: text(params.sex),
    email: text(params.email),
    phone: text(params.phone),
    status: "active",
    preferredContact: "",
    level: text(params.level),
    experience: "",
    trainingPlaces: [],
    equipment: "",
    programType: text(params.programType),
    sessionsPerWeek: "",
    maxSessionMinutes: "",
    availableDays: [],
    scheduleConstraints: "",
    healthConstraints: "",
    goalType: text(params.goalType),
    goalDate: text(params.goalDate),
    competitionName: text(params.competitionName),
    healthConsent: false,
    consentProof: "",
    coachNote: "",
  };
}

export function toFormData(action: ParsedAssistantAction): FormData {
  const form = new FormData();
  const set = (name: string, value: string) => form.set(name, value);
  const check = (name: string, on: unknown) => {
    if (on === true) form.set(name, "on");
  };
  switch (action.kind) {
    case "creer_seance": {
      const p = action.params;
      set("kind", p.kind);
      set("title", p.title);
      set("discipline", p.discipline ?? "");
      set("location", p.location ?? "");
      set("startsOn", p.startsOn);
      set("startTime", p.startTime);
      set("durationMinutes", String(p.durationMinutes));
      check("allDay", p.allDay);
      set("alerts", (p.alerts ?? []).join(","));
      check("repeatsWeekly", p.repeatsWeekly);
      set("endsOn", p.endsOn ?? "");
      if (p.kind === "individual") set("athleteId", athleteIdOf(p.athlete));
      for (const id of p.athleteIds ?? []) form.append("athleteIds", id);
      set("notes", p.notes ?? "");
      set("price", p.price === undefined ? "" : amountText(p.price));
      check("applyVat", (p.vatRate ?? 0) > 0);
      set("vatRate", String(p.vatRate ?? 0));
      check("vatIncluded", p.vatIncluded);
      if (p.paymentMethod) set("paymentMethod", p.paymentMethod);
      // Comme la fenêtre « Nouvelle séance » : on reste sur la page, la séance créée est renvoyée.
      set("stay", "1");
      break;
    }
    case "noter_paiement": {
      const p = action.params;
      set("athleteId", athleteIdOf(p.athlete));
      set("receivedOn", p.receivedOn);
      set("amount", amountText(p.amount));
      set("vatRate", String(p.vatRate ?? 0));
      set("method", p.method);
      set("label", p.label ?? "");
      break;
    }
    case "noter_depense": {
      const p = action.params;
      set("label", p.label);
      set("categoryId", p.categoryId ?? "");
      set("amount", amountText(p.amount));
      set("vatRate", String(p.vatRate ?? 0));
      set("spentOn", p.spentOn);
      check("repeatsMonthly", p.repeatsMonthly);
      set("endsOn", p.endsOn ?? "");
      break;
    }
    case "creer_tache": {
      const p = action.params;
      set("title", p.title);
      set("priority", p.priority ?? "normal");
      set("dueOn", p.dueOn ?? "");
      set("listId", p.listId ?? "");
      set("athleteId", athleteIdOf(p.athlete));
      set("notes", p.notes ?? "");
      break;
    }
    default:
      break;
  }
  return form;
}

// « Nouvel exercice » (lot 2, D-181) : les champs du formulaire « Créer un exercice » (consignes une par
// ligne, matériel principal ou rien pour le poids du corps).
export function toCoachExerciseInput(params: Record<string, unknown>): CoachExerciseInput {
  return {
    name: text(params.name),
    category: text(params.category),
    muscleGroups: (params.muscleGroups as string[] | undefined) ?? [],
    equipment: text(params.equipment),
    instructions: ((params.instructions as string[] | undefined) ?? []).join("\n"),
    videoUrl: text(params.videoUrl),
  };
}

// « Compléter la fiche » (lot 2, D-181) : la fiche actuelle telle que le formulaire Profil l'enverrait.
export type AthleteEditValues = AthleteFormValues & AddressFormValues;
export function athleteFormValues(detail: AthleteDetail): AthleteEditValues {
  return {
    firstName: detail.firstName,
    lastName: detail.lastName ?? "",
    sex: detail.sex ?? "",
    email: detail.email ?? "",
    phone: detail.phone ?? "",
    status: detail.status,
    preferredContact: detail.preferredContact ?? "",
    level: detail.level ?? "",
    experience: detail.experience ?? "",
    trainingPlaces: [...detail.trainingPlaces],
    equipment: detail.equipment ?? "",
    addressLine: detail.addressLine ?? "",
    postalCode: detail.postalCode ?? "",
    city: detail.city ?? "",
    country: detail.country,
  };
}

// Le formulaire Profil COMPLET : chaque champ actuel, puis ceux de la carte par-dessus. updateAthlete
// enregistre tous les champs reçus : un champ absent serait vidé, d'où ce départ de la fiche actuelle.
export function athleteUpdateFormData(
  current: AthleteEditValues,
  changes: Partial<Record<keyof AthleteEditValues, string | string[]>>,
): FormData {
  const merged = { ...current, ...changes } as AthleteEditValues;
  const form = new FormData();
  for (const [name, value] of Object.entries(merged)) {
    if (Array.isArray(value)) value.forEach((item) => form.append(name, item));
    else form.set(name, value);
  }
  return form;
}

// Une carte liée ne s'exécute qu'une fois le sportif créé : le navigateur remplace alors
// { fromCard } par { athleteId }. Sinon, refus.
export function requireResolved(action: {
  kind?: string;
  params: Record<string, unknown>;
}): boolean {
  const ref = action.params.athlete;
  return !(ref && typeof ref === "object" && "fromCard" in ref);
}

// « Modifier » une carte : la fenêtre habituelle s'ouvre pré-remplie avec la proposition (seuls les
// champs donnés ; le reste garde les valeurs par défaut de la fenêtre).
const defined = <T extends object>(values: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
const maybe = <T>(value: T | undefined, map: (value: T) => string) =>
  value === undefined ? undefined : map(value);

export function toSessionPrefill(params: Record<string, unknown>): Partial<SessionFormInput> {
  const athleteId = athleteIdOf(params.athlete);
  return defined({
    kind: params.kind as string | undefined,
    title: params.title as string | undefined,
    discipline: params.discipline as string | undefined,
    location: params.location as string | undefined,
    startsOn: params.startsOn as string | undefined,
    startTime: params.startTime as string | undefined,
    durationMinutes: maybe(params.durationMinutes as number | undefined, String),
    allDay: params.allDay as boolean | undefined,
    alerts: Array.isArray(params.alerts) ? params.alerts.join(",") : undefined,
    repeatsWeekly: params.repeatsWeekly as boolean | undefined,
    endsOn: params.endsOn as string | undefined,
    athleteId: athleteId || undefined,
    athleteIds: params.athleteIds as string[] | undefined,
    notes: params.notes as string | undefined,
    price: maybe(params.price as number | undefined, amountText),
    applyVat: typeof params.vatRate === "number" ? params.vatRate > 0 : undefined,
    vatRate: maybe(params.vatRate as number | undefined, String),
    vatIncluded: params.vatIncluded as boolean | undefined,
    paymentMethod: params.paymentMethod as string | undefined,
  });
}

export function toPaymentPrefill(params: Record<string, unknown>): Partial<PaymentFormValues> {
  const athleteId = athleteIdOf(params.athlete);
  return defined({
    athleteId: athleteId || undefined,
    receivedOn: params.receivedOn as string | undefined,
    amount: maybe(params.amount as number | undefined, amountText),
    vatRate: maybe(params.vatRate as number | undefined, String),
    method: params.method as string | undefined,
    label: params.label as string | undefined,
  });
}

export function toTaskPrefill(params: Record<string, unknown>): Partial<TaskFormValues> {
  const athleteId = athleteIdOf(params.athlete);
  return defined({
    title: params.title as string | undefined,
    priority: params.priority as string | undefined,
    dueOn: params.dueOn as string | undefined,
    listId: params.listId as string | undefined,
    athleteId: athleteId || undefined,
    notes: params.notes as string | undefined,
  });
}

// --- Les règles du formulaire dès la proposition (relecture n°2) -------------------------------

// Sportif d'une carte liée, encore à créer : un identifiant de forme valide, le temps de vérifier
// les autres champs (le vrai est vérifié au clic « Valider »).
const PENDING_ATHLETE = "00000000-0000-4000-8000-000000000000";

// La séance telle que la fenêtre « Nouvelle séance » l'enverrait.
export function toSessionInput(params: Record<string, unknown>): SessionFormInput {
  const vat = typeof params.vatRate === "number" ? params.vatRate : 0;
  const ref = params.athlete;
  const athleteId =
    ref && typeof ref === "object" && "fromCard" in ref ? PENDING_ATHLETE : athleteIdOf(ref);
  return {
    kind: text(params.kind),
    title: text(params.title),
    discipline: text(params.discipline),
    location: text(params.location),
    startsOn: text(params.startsOn),
    startTime: text(params.startTime),
    durationMinutes:
      typeof params.durationMinutes === "number" ? String(params.durationMinutes) : "",
    allDay: params.allDay === true,
    alerts: Array.isArray(params.alerts) ? params.alerts.join(",") : "",
    repeatsWeekly: params.repeatsWeekly === true,
    endsOn: text(params.endsOn),
    athleteId: params.kind === "individual" ? athleteId : "",
    athleteIds: Array.isArray(params.athleteIds) ? params.athleteIds.map(String) : [],
    newClient: false,
    newAthleteName: "",
    notes: text(params.notes),
    price: typeof params.price === "number" ? amountText(params.price) : "",
    applyVat: vat > 0,
    vatRate: String(vat),
    vatIncluded: params.vatIncluded === true,
    paymentMethod: text(params.paymentMethod),
  };
}

// Erreur que le formulaire habituel renverrait pour cette action, ou null : passée par les MÊMES
// règles pures (parseSessionForm, parseExpenseForm, parseTaskForm, parseNewAthleteForm, parseAmount,
// parseVatRate), sans en recopier aucune. L'erreur repart à Claude, aucune carte n'apparaît.
export function formRuleError(action: ParsedAssistantAction, todayIso: string): string | null {
  switch (action.kind) {
    case "creer_seance": {
      const parsed = parseSessionForm(toSessionInput(action.params));
      return parsed.ok ? null : parsed.error;
    }
    case "noter_paiement": {
      if (parseAmount(amountText(action.params.amount)) === null) return "Montant invalide.";
      if (
        action.params.vatRate !== undefined &&
        parseVatRate(String(action.params.vatRate)) === null
      ) {
        return "Taux de TVA invalide : un nombre entre 0 et 100 (ex. 21 ou 8,1).";
      }
      return null;
    }
    case "noter_depense": {
      const p = action.params;
      const parsed = parseExpenseForm({
        label: p.label,
        categoryId: p.categoryId ?? "",
        amount: amountText(p.amount),
        vatRate: String(p.vatRate ?? 0),
        spentOn: p.spentOn,
        repeatsMonthly: p.repeatsMonthly === true,
        endsOn: p.endsOn ?? "",
      });
      return parsed.ok ? null : parsed.error;
    }
    case "creer_tache": {
      const parsed = parseTaskForm(readTaskForm(toFormData(action)));
      return parsed.ok ? null : parsed.error;
    }
    case "creer_sportif": {
      const parsed = parseNewAthleteForm(toNewAthleteValues(action.params), todayIso);
      return parsed.ok ? null : parsed.error;
    }
    case "creer_programme":
      return programRuleError(action.params);
    case "creer_exercice": {
      const parsed = parseCoachExerciseForm(toCoachExerciseInput(action.params));
      return parsed.ok ? null : parsed.error;
    }
    default:
      return null;
  }
}

type SessionFacts = ScheduleLike & {
  startTime: string;
  durationMinutes: number;
  priceCents: number | null;
};

// Vérifications sur la séance elle-même (déplacer, marquer payée), comme le fait l'agenda
// (relecture n°1) : la date d'origine existe, la séance ne finit pas après minuit, une séance unique
// ne se déplace qu'à cette date, une séance sans prix n'a rien à encaisser.
export function checkAgainstSession(
  action: ParsedAssistantAction,
  session: SessionFacts,
): { ok: true; params: Record<string, unknown> } | { ok: false; error: string } {
  if (action.kind === "deplacer_seance") {
    const p = { ...action.params };
    if (!session.repeatsWeekly) {
      if (p.originalDate !== session.startsOn) {
        return {
          ok: false,
          error: `Cette séance n'a lieu que le ${dayInWords(session.startsOn)}.`,
        };
      }
      p.scope = "single";
    } else if (!occursOn(session, p.originalDate)) {
      return {
        ok: false,
        error: `La séance n'a pas lieu le ${dayInWords(p.originalDate)} : prends la date_originale de voir_agenda.`,
      };
    } else if (
      p.scope === "series" &&
      !["daily", "weekly"].includes(scheduleRule(session)?.freq ?? "")
    ) {
      // Une série mensuelle ou annuelle se déplace date par date (D-203), comme dans l'agenda.
      return {
        ok: false,
        error:
          "Cette série se déplace date par date : propose seulement cette date (scope « single »).",
      };
    }
    const [hours, minutes] = p.newTime.split(":").map(Number);
    if (hours * 60 + minutes + session.durationMinutes > 24 * 60) {
      return { ok: false, error: "La séance finirait après minuit." };
    }
    return { ok: true, params: p };
  }
  if (action.kind === "marquer_seance_payee") {
    if (session.priceCents === null) {
      return { ok: false, error: "Cette séance n'a pas de prix : rien à encaisser." };
    }
    if (!occursOn(session, action.params.sessionDate)) {
      return {
        ok: false,
        error: `La séance n'a pas lieu le ${dayInWords(action.params.sessionDate)}.`,
      };
    }
  }
  return { ok: true, params: action.params };
}

// --- Lot 4 (D-183) : au « Valider », les changements d'une carte dans les valeurs ACTUELLES ---------
// (relues au clic), puis le formulaire habituel : seuls les champs de la carte changent.

// « Modifier la séance » : `initial` vient de sessionFormInitial (la page du formulaire).
export function mergeSessionChanges(
  initial: SessionFormInput,
  changes: Record<string, unknown>,
): SessionFormInput {
  const next: SessionFormInput = { ...initial };
  for (const [field, value] of Object.entries(changes)) {
    switch (field) {
      case "title":
      case "startsOn":
      case "startTime":
      case "paymentMethod":
        next[field] = String(value);
        break;
      case "discipline":
      case "location":
      case "endsOn":
      case "notes":
        next[field] = value === null ? "" : String(value);
        break;
      case "durationMinutes":
        next.durationMinutes = String(value);
        break;
      case "repeatsWeekly":
      case "vatIncluded":
      case "allDay":
        next[field] = value === true;
        break;
      case "alerts":
        next.alerts = (value as number[]).join(",");
        break;
      case "athleteIds":
        next.athleteIds = [...(value as string[])];
        break;
      case "price":
        next.price = value === null ? "" : amountText(Number(value));
        break;
      case "vatRate": {
        const rate = Number(value);
        next.applyVat = rate > 0;
        next.vatRate = rate > 0 ? String(rate).replace(".", ",") : "";
        break;
      }
    }
  }
  // « Jour entier » change les choix d'alerte : sans nouvelles alertes, les anciennes partent.
  if ("allDay" in changes && !("alerts" in changes)) next.alerts = "";
  return next;
}

// Les noms des champs que lit readForm (sessions/session-core.ts).
export function sessionInputFormData(input: SessionFormInput): FormData {
  const form = new FormData();
  const check = (name: string, on: boolean) => {
    if (on) form.set(name, "on");
  };
  form.set("title", input.title);
  form.set("discipline", input.discipline);
  form.set("location", input.location);
  form.set("startsOn", input.startsOn);
  form.set("startTime", input.startTime);
  form.set("durationMinutes", input.durationMinutes);
  check("repeatsWeekly", input.repeatsWeekly);
  form.set("endsOn", input.endsOn);
  // La règle de récurrence (D-203) : gardée telle quelle quand l'assistant change autre chose.
  form.set("recurrence", input.recurrence ?? "");
  form.set("athleteId", input.athleteId);
  for (const id of input.athleteIds) form.append("athleteIds", id);
  check("newClient", input.newClient);
  form.set("newAthleteName", input.newAthleteName);
  form.set("notes", input.notes);
  form.set("price", input.price);
  check("applyVat", input.applyVat);
  form.set("vatRate", input.vatRate);
  check("vatIncluded", input.vatIncluded);
  form.set("paymentMethod", input.paymentMethod);
  return form;
}

// « Modifier la tâche » : les valeurs de la fenêtre (editableTask), puis les changements ; null efface.
export function mergeTaskChanges(
  task: CoachTask,
  changes: Record<string, unknown>,
): TaskFormValues {
  const current: TaskFormValues = {
    title: task.title,
    priority: task.priority,
    dueOn: task.dueOn ?? "",
    listId: task.list?.id ?? "",
    athleteId: task.athleteId ?? "",
    notes: task.notes ?? "",
  };
  for (const [field, value] of Object.entries(changes)) {
    if (field in current) {
      current[field as keyof TaskFormValues] = value === null ? "" : String(value);
    }
  }
  return current;
}

export function taskFormData(values: TaskFormValues): FormData {
  const form = new FormData();
  for (const [field, value] of Object.entries(values)) form.set(field, value);
  return form;
}

// « Modifier le document » : nom, catégorie et sportif (jamais le fichier).
export function mergeDocumentChanges(
  document: Pick<CoachDocument, "name" | "categoryId" | "athleteId">,
  changes: Record<string, unknown>,
): DocumentFormValues {
  const current: DocumentFormValues = {
    name: document.name,
    categoryId: document.categoryId ?? "",
    athleteId: document.athleteId ?? "",
  };
  for (const [field, value] of Object.entries(changes)) {
    if (field in current) {
      current[field as keyof DocumentFormValues] = value === null ? "" : String(value);
    }
  }
  return current;
}

export function documentFormData(values: DocumentFormValues): FormData {
  const form = new FormData();
  for (const [field, value] of Object.entries(values)) form.set(field, value);
  return form;
}

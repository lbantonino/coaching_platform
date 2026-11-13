import { parseExpenseForm } from "@/domain/billing/expenses";
import { parseVatRate } from "@/domain/billing/money";
import { parseAmount } from "@/domain/billing/payments";
import { parseTaskForm, readTaskForm, type TaskFormValues } from "@/domain/tasks/task-form";
import { parseNewAthleteForm, type NewAthleteFormInput } from "@/features/athletes/new-athlete";
import type { PaymentFormValues } from "@/features/billing/payment-actions";
import {
  occursOn,
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

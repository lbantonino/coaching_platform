import { z } from "zod";

import { formatMoney, type Currency } from "@/domain/billing/money";
import { PAYMENT_METHODS } from "@/domain/billing/payments";
import { DISCIPLINES } from "@/domain/training/discipline";
import { programGoalSchema } from "@/domain/training/program-plan";
import { SESSION_MOMENTS, sessionBodySchema, WEEKDAYS } from "@/domain/training/session-v2";
import { ATHLETE_LEVELS, SEXES } from "@/features/athletes/schemas";
import { GOAL_TYPES, goalTypeLabels, type GoalType } from "@/features/goals/schemas";
import { SESSION_KINDS, SESSION_PAYMENT_METHODS } from "@/features/sessions/schemas";

import { placedSessions } from "./program";
import { dayInWords } from "./rules";

// Propositions de l'Assistant IA (lot 1 des actions, spec §5.2 et §5.3) : une action préparée par
// Claude, affichée en carte, exécutée seulement au clic « Valider » du coach. Les paramètres portent
// les noms des champs des formulaires de Coory ; chaque schéma est STRICT : jamais de santé, d'accord
// de santé, de note privée ni d'organisation (un champ inconnu fait refuser la proposition).

export type AssistantActionKind =
  | "creer_sportif"
  | "creer_seance"
  | "deplacer_seance"
  | "marquer_seance_payee"
  | "noter_paiement"
  | "noter_depense"
  | "creer_tache"
  | "creer_liste_de_taches"
  | "creer_programme";

export type AssistantAction = { kind: AssistantActionKind; params: Record<string, unknown> };

export type AssistantProposal = AssistantAction & {
  // Identifiant de la carte (une réponse peut en avoir plusieurs).
  id: string;
  // « Nouvelle séance ».
  title: string;
  // Lignes en clair : nom complet, date en toutes lettres, montant avec devise.
  summary: string[];
  // Carte dont celle-ci attend l'exécution (sportif créé par une autre carte), ou null.
  dependsOn: string | null;
};

const isoDay = z.iso.date();
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: "Heure au format HH:MM." });
const quarter = z.string().regex(/^([01]\d|2[0-3]):(00|15|30|45)$/, {
  error: "Heure au quart d'heure (HH:00, 15, 30, 45).",
});
const amount = z.number().positive().max(1_000_000);
const vatRate = z.number().min(0).max(100);
const text = (max: number) => z.string().trim().min(1).max(max);

// Sportif existant (son id) ou fiche créée par une autre carte de la même réponse.
export const athleteRefSchema = z.union([
  z.strictObject({ athleteId: z.uuid() }),
  z.strictObject({ fromCard: z.string().min(1).max(64) }),
]);
export type AthleteRef = z.infer<typeof athleteRefSchema>;

export const PARAMS = {
  creer_sportif: z.strictObject({
    firstName: text(80),
    lastName: text(80).optional(),
    sex: z.enum(SEXES).optional(),
    email: z.email().optional(),
    phone: z.string().trim().max(24).optional(),
    level: z.enum(ATHLETE_LEVELS).optional(),
    programType: z.enum(DISCIPLINES).optional(),
    goalType: z.enum(GOAL_TYPES).optional(),
    goalDate: isoDay.optional(),
    competitionName: text(120).optional(),
  }),
  creer_seance: z
    .strictObject({
      kind: z.enum(SESSION_KINDS),
      title: text(120),
      discipline: z.enum(DISCIPLINES).optional(),
      location: text(120).optional(),
      startsOn: isoDay,
      startTime: time,
      durationMinutes: z.number().int().min(5).max(600),
      repeatsWeekly: z.boolean().optional(),
      endsOn: isoDay.optional(),
      athlete: athleteRefSchema.optional(),
      athleteIds: z.array(z.uuid()).max(100).optional(),
      price: z.number().min(0).max(1_000_000).optional(),
      vatRate: vatRate.optional(),
      vatIncluded: z.boolean().optional(),
      paymentMethod: z.enum(SESSION_PAYMENT_METHODS).optional(),
      notes: z.string().trim().max(1000).optional(),
    })
    .refine((params) => params.kind !== "individual" || params.athlete !== undefined, {
      error: "Une séance individuelle demande son sportif.",
    }),
  // Toute la série se décale de 3 jours au plus, comme au glisser dans l'agenda (relecture n°1) : au-delà,
  // l'agenda ramènerait l'écart dans cette fenêtre et la carte mentirait.
  deplacer_seance: z
    .strictObject({
      sessionId: z.uuid(),
      originalDate: isoDay,
      newDate: isoDay,
      newTime: quarter,
      scope: z.enum(["single", "series"]),
    })
    .refine(
      (p) =>
        p.scope !== "series" ||
        Math.abs(Date.parse(p.newDate) - Date.parse(p.originalDate)) <= 3 * 86_400_000,
      { error: "Toute la série se déplace de 3 jours au plus, comme dans l'agenda." },
    ),
  marquer_seance_payee: z.strictObject({ sessionId: z.uuid(), sessionDate: isoDay }),
  noter_paiement: z.strictObject({
    athlete: athleteRefSchema,
    receivedOn: isoDay,
    amount,
    vatRate: vatRate.optional(),
    method: z.enum(PAYMENT_METHODS),
    label: z.string().trim().max(120).optional(),
  }),
  noter_depense: z.strictObject({
    label: text(120),
    categoryId: z.uuid().optional(),
    amount,
    vatRate: vatRate.optional(),
    spentOn: isoDay,
    repeatsMonthly: z.boolean().optional(),
    endsOn: isoDay.optional(),
  }),
  creer_tache: z.strictObject({
    title: text(200),
    priority: z.enum(["high", "normal"]).optional(),
    dueOn: isoDay.optional(),
    listId: z.uuid().optional(),
    athlete: athleteRefSchema.optional(),
    notes: z.string().trim().max(1000).optional(),
  }),
  creer_liste_de_taches: z.strictObject({ name: text(40) }),
  // Lot 3a : un BROUILLON de programme, depuis un modèle, une copie, vide, ou écrit par l'assistant
  // (séances décrites une fois avec une référence, puis placées semaine par semaine).
  creer_programme: z
    .strictObject({
      athlete: athleteRefSchema,
      title: text(120),
      discipline: z.enum(["running", "strength", "hyrox"]),
      startDate: isoDay,
      weeksCount: z.number().int().min(1).max(52),
      sessionsPerWeek: z.number().int().min(1).max(14),
      scheduling: z.enum(["ordered", "fixed"]),
      goal: programGoalSchema.optional(),
      phases: z
        .array(
          z.strictObject({
            name: text(40),
            weekFrom: z.number().int().min(1).max(52),
            weekTo: z.number().int().min(1).max(52),
          }),
        )
        .max(12)
        .optional(),
      start: z.discriminatedUnion("kind", [
        z.strictObject({ kind: z.literal("blank") }),
        z.strictObject({ kind: z.literal("template"), templateId: z.uuid() }),
        z.strictObject({ kind: z.literal("copy"), programId: z.uuid() }),
      ]),
      seances: z
        .array(
          sessionBodySchema.extend({
            ref: z.string().regex(/^[A-Za-z0-9_-]{1,20}$/),
            fixedDay: z.enum(WEEKDAYS).optional(),
            fixedTime: time.optional(),
            moment: z.enum(SESSION_MOMENTS).optional(),
          }),
        )
        .max(30)
        .optional(),
      semaines: z
        .array(
          z.strictObject({
            index: z.number().int().min(1).max(52),
            light: z.boolean().optional(),
            seances: z.array(z.string()).max(14),
          }),
        )
        .max(52)
        .optional(),
    })
    .refine(
      (p) => p.start.kind === "blank" || (p.seances === undefined && p.semaines === undefined),
      { error: "Des séances écrites seulement pour un programme parti de zéro (start blank)." },
    ),
} as const;

export const ACTION_KINDS = Object.keys(PARAMS) as AssistantActionKind[];

export const assistantActionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("creer_sportif"), params: PARAMS.creer_sportif }),
  z.object({ kind: z.literal("creer_seance"), params: PARAMS.creer_seance }),
  z.object({ kind: z.literal("deplacer_seance"), params: PARAMS.deplacer_seance }),
  z.object({ kind: z.literal("marquer_seance_payee"), params: PARAMS.marquer_seance_payee }),
  z.object({ kind: z.literal("noter_paiement"), params: PARAMS.noter_paiement }),
  z.object({ kind: z.literal("noter_depense"), params: PARAMS.noter_depense }),
  z.object({ kind: z.literal("creer_tache"), params: PARAMS.creer_tache }),
  z.object({ kind: z.literal("creer_liste_de_taches"), params: PARAMS.creer_liste_de_taches }),
  z.object({ kind: z.literal("creer_programme"), params: PARAMS.creer_programme }),
]);
export type ParsedAssistantAction = z.infer<typeof assistantActionSchema>;

// --- Résumés de carte --------------------------------------------------------------------------

const TITLES: Record<AssistantActionKind, string> = {
  creer_sportif: "Nouvelle fiche sportif",
  creer_seance: "Nouvelle séance",
  deplacer_seance: "Déplacer une séance",
  marquer_seance_payee: "Marquer une séance payée",
  noter_paiement: "Nouveau paiement",
  noter_depense: "Nouvelle dépense",
  creer_tache: "Nouvelle tâche",
  creer_liste_de_taches: "Nouvelle liste de tâches",
  creer_programme: "Nouveau programme",
};

const METHOD: Record<string, string> = {
  cash: "espèces",
  transfer: "virement",
  bancontact: "Bancontact",
  other: "autre moyen",
};
const LEVEL: Record<string, string> = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Confirmé",
  competitor: "Compétiteur",
};
const DISCIPLINE: Record<string, string> = {
  running: "Running",
  strength: "Musculation",
  hyrox: "Hyrox",
  hybrid: "Hybride",
};

const money = (value: number, currency: Currency) =>
  formatMoney(Math.round(value * 100), currency).replace(/\s/g, " ");
const rate = (value: number) => `${String(value).replace(".", ",")} %`;
const str = (value: unknown) => (typeof value === "string" ? value : "");
const num = (value: unknown) => (typeof value === "number" ? value : 0);

// Nom à afficher pour un sportif (existant : `names` ; à créer : le nom de sa carte, dans `names`
// sous l'identifiant de la carte).
function athleteName(ref: unknown, names: Record<string, string>): string | null {
  if (!ref || typeof ref !== "object") return null;
  const key = "athleteId" in ref ? str(ref.athleteId) : "fromCard" in ref ? str(ref.fromCard) : "";
  return names[key] ?? null;
}

// Ce que montre la carte. `names` : noms lisibles des identifiants (sportifs, séances, listes,
// catégories), résolus par le serveur ; `currency` : devise de l'organisation.
export function summarize(
  action: AssistantAction,
  names: Record<string, string>,
  currency: Currency,
): { title: string; summary: string[] } {
  const p = action.params;
  const lines: (string | null | false)[] = [];
  switch (action.kind) {
    case "creer_sportif": {
      lines.push([str(p.firstName), str(p.lastName)].filter(Boolean).join(" "));
      const profile = [LEVEL[str(p.level)], DISCIPLINE[str(p.programType)]].filter(Boolean);
      lines.push(profile.length > 0 && profile.join(" · "));
      if (p.goalType || p.competitionName) {
        const goal =
          str(p.competitionName) || goalTypeLabels[str(p.goalType) as GoalType] || "Objectif";
        lines.push(p.goalDate ? `${goal} le ${dayInWords(str(p.goalDate))}` : goal);
      }
      lines.push(str(p.email) || null, str(p.phone) || null);
      break;
    }
    case "creer_seance": {
      lines.push(str(p.title));
      // Séance collective : les inscrits par leur nom complet (relecture n°4).
      const enrolled = (p.athleteIds as string[] | undefined) ?? [];
      lines.push(
        p.kind === "group"
          ? enrolled.length > 0
            ? `Inscrits : ${enrolled.map((id) => names[id] ?? "?").join(", ")}`
            : "Collective · aucun inscrit"
          : athleteName(p.athlete, names),
      );
      const when = `${dayInWords(str(p.startsOn))} · ${str(p.startTime)} · ${num(p.durationMinutes)} min`;
      const until = p.endsOn ? ` jusqu'au ${dayInWords(str(p.endsOn))}` : "";
      lines.push(p.repeatsWeekly ? `${when} · chaque semaine${until}` : when);
      lines.push(str(p.location) || null);
      if (typeof p.price === "number" && p.price > 0) {
        const vat = num(p.vatRate);
        const price =
          vat > 0
            ? p.vatIncluded
              ? `${money(p.price, currency)} TVA ${rate(vat)} comprise`
              : `${money(p.price, currency)} HTVA + TVA ${rate(vat)}`
            : money(p.price, currency);
        lines.push([price, METHOD[str(p.paymentMethod)]].filter(Boolean).join(" · "));
      }
      break;
    }
    case "deplacer_seance":
      lines.push(names[str(p.sessionId)] ?? null);
      lines.push(
        `Du ${dayInWords(str(p.originalDate))} au ${dayInWords(str(p.newDate))} à ${str(p.newTime)}`,
      );
      lines.push(p.scope === "series" ? "Toute la série" : "Cette date seulement");
      break;
    case "marquer_seance_payee":
      lines.push(names[str(p.sessionId)] ?? null);
      lines.push(`Séance du ${dayInWords(str(p.sessionDate))}`);
      lines.push(names[`${str(p.sessionId)}:montant`] ?? null);
      break;
    case "noter_paiement":
      lines.push(athleteName(p.athlete, names));
      const paidVat = num(p.vatRate) > 0 ? ` dont TVA ${rate(num(p.vatRate))}` : "";
      lines.push(`${money(num(p.amount), currency)}${paidVat} · ${METHOD[str(p.method)] ?? ""}`);
      lines.push(`Reçu le ${dayInWords(str(p.receivedOn))}`);
      lines.push(str(p.label) || null);
      break;
    case "noter_depense": {
      lines.push(str(p.label));
      const category = names[str(p.categoryId)];
      const spentVat = num(p.vatRate) > 0 ? ` dont TVA ${rate(num(p.vatRate))}` : "";
      lines.push(
        [`${money(num(p.amount), currency)}${spentVat}`, category].filter(Boolean).join(" · "),
      );
      const since = dayInWords(str(p.spentOn));
      lines.push(
        p.repeatsMonthly
          ? `Chaque mois depuis le ${since}${p.endsOn ? `, jusqu'au ${dayInWords(str(p.endsOn))}` : ""}`
          : `Le ${since}`,
      );
      break;
    }
    case "creer_tache": {
      lines.push(str(p.title));
      lines.push(p.dueOn ? `Pour le ${dayInWords(str(p.dueOn))}` : "Sans échéance");
      lines.push(p.priority === "high" && "Priorité haute");
      const list = names[str(p.listId)];
      lines.push(list ? `Liste : ${list}` : null);
      const athlete = athleteName(p.athlete, names);
      lines.push(athlete ? `Sportif : ${athlete}` : null);
      break;
    }
    case "creer_liste_de_taches":
      lines.push(str(p.name));
      break;
    case "creer_programme": {
      lines.push(str(p.title));
      lines.push(athleteName(p.athlete, names));
      const per = num(p.sessionsPerWeek);
      lines.push(
        `${DISCIPLINE[str(p.discipline)]} · ${num(p.weeksCount)} semaines · ${per} séance${per > 1 ? "s" : ""} par semaine`,
      );
      lines.push(
        `Dès le ${dayInWords(str(p.startDate))}, ${p.scheduling === "fixed" ? "aux jours fixés" : "dans l'ordre"}`,
      );
      const start = p.start as { kind: string; templateId?: string; programId?: string };
      lines.push(
        start.kind === "template"
          ? `Depuis le modèle « ${names[str(start.templateId)] ?? "?"} »`
          : start.kind === "copy"
            ? `Copie de « ${names[str(start.programId)] ?? "?"} »`
            : p.semaines
              ? `Séances écrites par l'assistant : ${placedSessions(p)}`
              : "Programme vide, à remplir dans l'éditeur",
      );
      const goal = p.goal as { raceName?: string; raceDate?: string } | undefined;
      if (goal?.raceName || goal?.raceDate) {
        lines.push(
          [goal.raceName ?? "Objectif", goal.raceDate ? `le ${dayInWords(goal.raceDate)}` : null]
            .filter(Boolean)
            .join(" "),
        );
      }
      lines.push(names.chevauchement ?? null);
      lines.push("Brouillon : à relire et publier dans l'éditeur");
      break;
    }
  }
  return {
    title: TITLES[action.kind],
    summary: lines.filter((line): line is string => typeof line === "string" && line !== ""),
  };
}

// --- Cartes liées ------------------------------------------------------------------------------

const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();

// « Crée la fiche de Lucas Martin puis… » : le sportif à créer est désigné par son nom ; il doit être
// celui d'une carte « Nouvelle fiche sportif » de la même réponse.
export function linkNewAthlete(
  pending: AssistantProposal[],
  name: string,
): { ok: true; cardId: string } | { ok: false; error: string } {
  const wanted = fold(name);
  const card = pending.find(
    (proposal) =>
      proposal.kind === "creer_sportif" &&
      fold([str(proposal.params.firstName), str(proposal.params.lastName)].join(" ")) === wanted,
  );
  return card
    ? { ok: true, cardId: card.id }
    : {
        ok: false,
        error: `Aucune fiche à créer pour « ${name} » dans cette réponse : cherche le sportif (chercher_sportifs) ou propose d'abord sa fiche (creer_sportif).`,
      };
}

// Paramètres d'un outil d'écriture venant de Claude : jamais de renvoi brut à une carte (relecture
// n°11 : seul le serveur relie une carte, par le nom du sportif à créer), puis le schéma strict.
export function prepareToolInput(
  name: string,
  input: unknown,
  pending: AssistantProposal[],
):
  | {
      ok: true;
      action: ParsedAssistantAction;
      dependsOn: string | null;
      newAthleteName: string | null;
    }
  | { ok: false; error: string } {
  if (!(ACTION_KINDS as string[]).includes(name))
    return { ok: false, error: `Outil inconnu : ${name}` };
  if (!input || typeof input !== "object") return { ok: false, error: "Paramètres manquants." };
  const params: Record<string, unknown> = { ...(input as Record<string, unknown>) };
  let dependsOn: string | null = null;
  let newAthleteName: string | null = null;
  const ref = params.athlete;
  if (ref && typeof ref === "object") {
    if ("fromCard" in ref) {
      return {
        ok: false,
        error: 'Désigne le sportif par { athleteId } ou par { nouveauSportif: "Prénom Nom" }.',
      };
    }
    if ("nouveauSportif" in ref && typeof ref.nouveauSportif === "string") {
      const link = linkNewAthlete(pending, ref.nouveauSportif);
      if (!link.ok) return link;
      params.athlete = { fromCard: link.cardId };
      dependsOn = link.cardId;
      newAthleteName = ref.nouveauSportif.trim();
    }
  }
  const parsed = assistantActionSchema.safeParse({ kind: name, params });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: `Paramètres invalides (${issue?.path.join(".") ?? ""}) : ${issue?.message ?? ""}`,
    };
  }
  return { ok: true, action: parsed.data, dependsOn, newAthleteName };
}

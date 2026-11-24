import { formatMoney } from "@/domain/billing/money";
import { paymentMethodLabels } from "@/domain/billing/payments";
import { formatBytes } from "@/domain/documents/documents";
import { describeRule } from "@/domain/sessions/recurrence";
import type { LibraryExercise } from "@/domain/exercises/library";
import type { AthleteDetail, AthleteListItem } from "@/features/athletes/queries";
import type { UnpaidDate } from "@/features/billing/collect-queries";
import type { CoachExpense } from "@/features/billing/expense-queries";
import type { AthletePayment } from "@/features/billing/payment-queries";
import type { CoachDocument } from "@/features/documents/queries";
import type { AthleteProgramRow } from "@/features/programs/queries";
import type { TemplateCard } from "@/features/programs/templates";
import type { CoachSession } from "@/features/sessions/queries";
import { scheduleRule, sessionOccurrences } from "@/features/sessions/schemas";
import type { CoachTask } from "@/features/tasks/queries";
import type { AthleteGoals } from "@/features/goals/queries";
import { NOTIFICATION_KINDS } from "@/features/coach/settings";
import type { SettingsData } from "@/features/coach/settings-data";
import type { NotifyPreferences } from "@/features/notifications/filter";
import type { Notifications } from "@/features/notifications/queries";
import { goalStatusLabels, goalTypeLabels } from "@/features/goals/schemas";
import type { AthleteRecords } from "@/features/records/queries";
import { formatRaceTime, recordEventLabels } from "@/features/records/schemas";
import type { AthleteReferences } from "@/features/references/queries";
import { referenceKindLabels } from "@/features/references/schemas";

import { referenceValueText } from "../sportifs";

// Mise en forme des outils de lecture de l'Assistant IA (lot 1 des actions) : ce qui part chez
// Anthropic. Court, utile à l'action, jamais d'e-mail, de téléphone, de note ni de donnée de santé.

const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

const STATUS: Record<AthleteListItem["status"], string> = {
  active: "actif",
  paused: "en pause",
  archived: "archivé",
};

export type AthleteRow = {
  id: string;
  nom: string;
  statut: string;
  discipline: AthleteListItem["programType"];
  manque: string[];
};

// Sportifs dont un mot du nom commence par la recherche (« luc » : Lucas, Lucie), sans accent ni
// majuscule ; les archivés seulement sur demande ; 10 au plus.
export function shapeAthletes(
  items: AthleteListItem[],
  nom: string,
  withArchived = false,
): AthleteRow[] {
  const query = fold(nom);
  return items
    .filter((item) => withArchived || item.status !== "archived")
    .filter((item) => {
      const name = fold(item.displayName);
      return (
        query === "" || name.startsWith(query) || name.split(/\s+/).some((w) => w.startsWith(query))
      );
    })
    .slice(0, 10)
    .map((item) => ({
      id: item.id,
      nom: item.displayName,
      statut: STATUS[item.status],
      discipline: item.programType,
      manque: item.missingInfo,
    }));
}

export type AgendaRow = {
  seance_id: string;
  date: string;
  date_originale: string;
  heure: string;
  // null : séance « Jour entier » (D-204).
  duree_min: number | null;
  titre: string;
  sportif: string;
  repetee: boolean;
  // La règle en clair (D-203) : « toutes les 2 semaines le mardi et le jeudi ».
  repetition?: string;
};

const who = (session: CoachSession) =>
  session.kind === "group"
    ? `collective (${session.athletes.length} inscrit${session.athletes.length > 1 ? "s" : ""})`
    : (session.athletes[0]?.name ?? "sans sportif");

// Une ligne par date entre `du` et `au` (dates déplacées comprises, avec leur date d'origine).
const repetitionOf = (session: CoachSession) => {
  const rule = scheduleRule(session);
  if (!rule) return {};
  const text = describeRule(rule, session.startsOn, session.endsOn);
  return { repetition: text.charAt(0).toLowerCase() + text.slice(1) };
};

export function shapeAgenda(sessions: CoachSession[], du: string, au: string): AgendaRow[] {
  return sessions
    .flatMap((session) =>
      sessionOccurrences(session, du, au).map((occurrence) => ({
        seance_id: session.id,
        date: occurrence.date,
        date_originale: occurrence.originalDate,
        // « Jour entier » (D-204) : pas d'heure.
        heure: session.allDay ? "toute la journée" : occurrence.startTime,
        duree_min: session.allDay ? null : session.durationMinutes,
        titre: session.title,
        sportif: who(session),
        repetee: session.repeatsWeekly,
        ...repetitionOf(session),
      })),
    )
    .sort((a, b) => `${a.date} ${a.heure}`.localeCompare(`${b.date} ${b.heure}`));
}

export type UnpaidRow = {
  seance_id: string;
  date: string;
  date_originale: string;
  heure: string;
  titre: string;
  sportif: string;
  montant: string;
  en_retard: boolean;
};

// Dates de séances à encaisser, d'un sportif si demandé (sa séance individuelle ou une collective
// où il est inscrit).
export function shapeUnpaid(
  dates: UnpaidDate[],
  sessions: CoachSession[],
  sportifId?: string,
): UnpaidRow[] {
  const byId = new Map(sessions.map((session) => [session.id, session]));
  return dates
    .filter((date) => {
      if (!sportifId) return true;
      return byId.get(date.sessionId)?.athletes.some((athlete) => athlete.id === sportifId);
    })
    .map((date) => ({
      seance_id: date.sessionId,
      date: date.date,
      date_originale: date.originalDate,
      heure: date.startTime || "toute la journée",
      titre: date.title,
      sportif: date.athleteName ?? "collective",
      montant: formatMoney(date.amountCents, date.currency).replace(/\s/g, " "),
      en_retard: date.late,
    }));
}

// --- Lot 3a : créer un programme --------------------------------------------------------------

// Modèles de PROGRAMME (Coory et du coach), pour partir d'un modèle qui convient.
export function shapeTemplates(cards: TemplateCard[]) {
  return cards
    .filter((card) => card.kind === "program")
    .map((card) => ({
      id: card.id,
      titre: card.title,
      discipline: card.discipline,
      semaines: card.weeksCount,
      seances_par_semaine: card.sessionsPerWeek,
      origine: card.source,
    }));
}

// Lot 3b : les modèles de SÉANCE (Coory et Mes modèles), pour dupliquer_modele / archiver_modele
// avec sorte « seance ».
export function shapeSessionTemplates(cards: TemplateCard[]) {
  return cards
    .filter((card) => card.kind === "session")
    .map((card) => ({
      id: card.id,
      titre: card.title,
      discipline: card.discipline,
      detail: card.detail,
      origine: card.source,
    }));
}

const addDaysIso = (day: string, days: number) =>
  new Date(Date.parse(`${day}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

// Programmes d'un sportif avec leurs dates : pour choisir un début qui ne chevauche rien, ou copier.
export function shapePrograms(rows: AthleteProgramRow[]) {
  return rows.map((row) => ({
    id: row.id,
    titre: row.title,
    statut: row.status,
    debut: row.startDate,
    fin: addDaysIso(row.startDate, row.weeksCount * 7 - 1),
  }));
}

// Exercices de la Bibliothèque dont le nom ou un alias contient, pour chaque mot cherché, un mot qui
// commence par lui (« développé couché », « dev », « bench press » ; relecture n°4).
const words = (text: string) =>
  fold(text)
    .split(/[\s/()-]+/)
    .filter(Boolean);

export function shapeExercises(items: LibraryExercise[], nom: string) {
  const query = words(nom);
  const matches = (text: string) => {
    const own = words(text);
    return query.every((part) => own.some((word) => word.startsWith(part)));
  };
  return items
    .filter((item) => [item.nameFr, ...item.aliasesFr].some(matches))
    .slice(0, 15)
    .map((item) => ({
      id: item.id,
      nom: item.nameFr,
      mesure: item.timed ? ("secondes" as const) : ("repetitions" as const),
    }));
}

// « voir_fiche » (lot 2, décision d'Antonino du 14/11/2026) : ce que Claude sait d'une fiche pour la
// compléter. L'e-mail, le téléphone et l'adresse ne disent que « rempli » ou « vide » : leur valeur ne
// part jamais chez Claude (la carte « ancien → nouveau » est calculée par le serveur).
type SheetSource = Pick<
  AthleteDetail,
  | "id"
  | "firstName"
  | "lastName"
  | "sex"
  | "email"
  | "phone"
  | "preferredContact"
  | "level"
  | "experience"
  | "trainingPlaces"
  | "equipment"
  | "addressLine"
  | "postalCode"
  | "city"
  | "country"
  | "status"
  | "hasAccount"
  | "programType"
  | "sessionsPerWeek"
  | "maxSessionMinutes"
  | "availableDays"
  | "scheduleConstraints"
>;
const filled = (value: string | null) => (value?.trim() ? "rempli" : "vide");

export function shapeAthleteSheet(fiche: SheetSource) {
  return {
    id: fiche.id,
    prenom: fiche.firstName,
    nom: fiche.lastName,
    sexe: fiche.sex,
    email: filled(fiche.email),
    telephone: filled(fiche.phone),
    contact_prefere: fiche.preferredContact,
    niveau: fiche.level,
    experience: fiche.experience,
    lieux: fiche.trainingPlaces,
    materiel: fiche.equipment,
    adresse: filled(fiche.addressLine),
    code_postal: filled(fiche.postalCode),
    ville: filled(fiche.city),
    pays: fiche.country,
    statut: fiche.status,
    compte_active: fiche.hasAccount,
    // Lot 5 (D-184) : discipline et disponibilités, JAMAIS les blessures (donnée de santé).
    discipline: fiche.programType,
    disponibilites: {
      seances_par_semaine: fiche.sessionsPerWeek,
      duree_max_min: fiche.maxSessionMinutes,
      jours: fiche.availableDays,
      contraintes: fiche.scheduleConstraints,
    },
  };
}

// --- Lot 4 (D-183) : le quotidien. 100 lignes au plus par lecture ; jamais le fichier d'un document.
export const MAX_ROWS = 100;

// Liste coupée (mineur n°7 du lot 4, n°3 du lot 6) : l'assistant doit savoir qu'il en manque, sinon il
// conclut à tort (« pas de paiement de Sarah en mars »). Sous la limite, la liste reste telle quelle.
export function withTotal<T>(rows: readonly T[], total: number, hint: string) {
  if (total <= rows.length) return rows;
  return {
    lignes: rows,
    total,
    note: `Seules les ${rows.length} premières lignes sur ${total} sont montrées : ${hint}`,
  };
}
const amountText = (cents: number, currency: Parameters<typeof formatMoney>[1]) =>
  formatMoney(cents, currency).replace(/\s/g, " ");

export function shapeTasks(tasks: readonly CoachTask[]) {
  return tasks.slice(0, MAX_ROWS).map((task) => ({
    id: task.id,
    titre: task.title,
    echeance: task.dueOn,
    priorite: task.priority === "high" ? "haute" : "normale",
    liste: task.list?.name ?? null,
    sportif: task.athleteName,
    faite: task.done,
    note: task.notes ? task.notes.slice(0, 200) : null,
  }));
}

export function shapePayments(payments: readonly AthletePayment[]) {
  return payments.slice(0, MAX_ROWS).map((payment) => ({
    id: payment.id,
    date: payment.receivedOn,
    montant: amountText(payment.amountCents, payment.currency ?? "EUR"),
    sportif: payment.athleteName,
    moyen: paymentMethodLabels[payment.method],
    libelle: payment.label,
  }));
}

export function shapeExpenses(expenses: readonly CoachExpense[]) {
  return expenses.slice(0, MAX_ROWS).map((expense) => ({
    id: expense.id,
    libelle: expense.label,
    montant: amountText(expense.amountCents, expense.currency),
    date: expense.spentOn,
    mensuelle: expense.repeatsMonthly,
    jusqu_au: expense.endsOn,
    categorie: expense.categoryName,
  }));
}

export function shapeDocuments(documents: readonly CoachDocument[]) {
  return documents.slice(0, MAX_ROWS).map((document) => ({
    id: document.id,
    nom: document.name,
    categorie: document.categoryName,
    sportif: document.athleteName,
    taille: formatBytes(document.sizeBytes),
    modifie_le: document.updatedAt.slice(0, 10),
  }));
}

// --- Lot 5 (D-184) : objectifs, repères et records d'un sportif (jamais de santé).
export function shapeGoals(goals: AthleteGoals) {
  return [...goals.current, ...goals.past].slice(0, MAX_ROWS).map((goal) => ({
    id: goal.id,
    objectif: goalTypeLabels[goal.type],
    date: goal.targetDate,
    temps_vise: goal.targetTimeSeconds ? formatRaceTime(goal.targetTimeSeconds) : null,
    priorite: goal.priority === "main" ? "principal" : "secondaire",
    statut: goalStatusLabels[goal.status],
    competition: goal.competitionName,
  }));
}

export function shapeReferences(references: AthleteReferences, records: AthleteRecords) {
  const seen = new Set<string>();
  const all = [...references.current, ...references.history].filter((reference) => {
    if (seen.has(reference.id)) return false;
    seen.add(reference.id);
    return true;
  });
  return {
    reperes: all.slice(0, MAX_ROWS).map((reference) => ({
      id: reference.id,
      repere: referenceKindLabels[reference.kind],
      valeur: referenceValueText(reference),
      mesure_le: reference.measuredOn,
    })),
    records: records.history.slice(0, MAX_ROWS).map((record) => ({
      id: record.id,
      epreuve: recordEventLabels[record.event],
      temps: formatRaceTime(record.timeSeconds),
      le: record.achievedOn,
    })),
  };
}

// --- Lot 6 (D-185) : réglages. Jamais l'e-mail de connexion ni le numéro du coach (« rempli »/« vide »).
export function shapeSettings(data: SettingsData) {
  return {
    profil: {
      prenom: data.profile.firstName,
      nom: data.profile.lastName,
      entreprise: data.profile.companyName,
      telephone: filled(data.profile.phone),
    },
    organisation: {
      nom: data.organization.name,
      pays: data.organization.country,
      devise: data.organization.currency,
      proprietaire: data.organization.isOwner,
    },
    preferences: {
      duree_par_defaut_min: data.preferences.defaultSessionMinutes,
      lieu_par_defaut: data.preferences.defaultLocation,
      prix_par_defaut: data.preferences.defaultPrice,
      paiement_par_defaut: data.preferences.defaultPaymentMethod,
      agenda_debut_h: data.preferences.agendaFirstHour,
      agenda_fin_h: data.preferences.agendaLastHour,
    },
    notifications: Object.fromEntries(NOTIFICATION_KINDS.map((kind) => [kind, data.notify[kind]])),
  };
}

// Une ligne par notification (clé pour agir dessus), dans l'ordre des sortes visibles.
// `notify` : les sortes que le coach a coupées ne sont pas lues (mineur n°3 du lot 6), comme dans la
// cloche et la page Notifications. Toutes les lignes : la lecture les coupe à 100 avec withTotal.
export function shapeNotifications(notifications: Notifications, notify?: NotifyPreferences) {
  const rows: { cle: string; sorte: string; texte: string; lue: boolean; masquee: boolean }[] = [];
  const push = (sorte: string, key: string, texte: string, read: boolean, dismissed: boolean) =>
    rows.push({ cle: key, sorte, texte, lue: read, masquee: dismissed });
  for (const kind of NOTIFICATION_KINDS) {
    if (notify && !notify[kind]) continue;
    switch (kind) {
      case "competitions":
        for (const event of notifications.competitions) {
          push(
            kind,
            event.key,
            `Compétition : ${event.athleteName} · ${event.title} (${event.date})`,
            event.read,
            event.dismissed,
          );
        }
        break;
      case "messages":
        for (const conversation of notifications.messages) {
          push(
            kind,
            conversation.key,
            `Message : ${conversation.athlete.name}`,
            conversation.read,
            conversation.dismissed,
          );
        }
        break;
      case "tasks":
        for (const task of notifications.tasks) {
          push(kind, task.key, `Tâche : ${task.title} (${task.dueOn})`, task.read, task.dismissed);
        }
        break;
      case "unpaid":
        for (const date of notifications.unpaid) {
          push(
            kind,
            date.key,
            `À encaisser : ${date.title}${date.athleteName ? ` · ${date.athleteName}` : ""} (${date.date})`,
            date.read,
            date.dismissed,
          );
        }
        break;
      case "profiles":
        for (const profile of notifications.profiles) {
          push(
            kind,
            profile.key,
            `Fiche à compléter : ${profile.name}`,
            profile.read,
            profile.dismissed,
          );
        }
        break;
    }
  }
  return rows;
}

// Revue du 20/11, n°5 : une liste coupée se lit par morceaux, une sorte à la fois ou seulement les
// notifications à traiter (ni lues ni masquées). Marquer ou masquer ne servait à rien : les lignes
// restent dans la liste, avec leur état.
export type NotificationFilter = { sorte?: string; etat?: "toutes" | "a_traiter" };
export function pickNotifications<T extends { sorte: string; lue: boolean; masquee: boolean }>(
  rows: readonly T[],
  { sorte, etat }: NotificationFilter,
): T[] {
  return rows.filter(
    (row) =>
      (!sorte || row.sorte === sorte) && (etat !== "a_traiter" || (!row.lue && !row.masquee)),
  );
}
export const NOTIFICATIONS_CUT_HINT =
  "relis une sorte à la fois (sorte), ou seulement celles à traiter (etat « a_traiter »).";

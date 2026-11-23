import "server-only";

import { z } from "zod";

import { getAthlete, listAthletes } from "@/features/athletes/queries";
import { listUnpaidDates } from "@/features/billing/collect-queries";
import { listExpenseCategories, listExpensesWithTotal } from "@/features/billing/expense-queries";
import { listPaymentsWithTotal } from "@/features/billing/payment-queries";
import { listDocumentCategories, listDocuments } from "@/features/documents/queries";
import { listLibraryExercises } from "@/features/exercises/queries";
import { loadDraft } from "@/features/programs/drafts";
import { listAthleteProgramRows } from "@/features/programs/queries";
import { getProgramTemplate, listTemplates } from "@/features/programs/templates";
import { createClient } from "@/lib/supabase/server";

import { draftReading, draftReadInput, templateReadInput } from "../program-edit";
import { listSessions } from "@/features/sessions/queries";
import { listTaskLists, listTasks } from "@/features/tasks/queries";
import { listGoals } from "@/features/goals/queries";
import { NOTIFICATION_KINDS, type NotificationKind } from "@/features/coach/settings";
import { loadSettings } from "@/features/coach/settings-actions";
import { getNotifications } from "@/features/notifications/queries";
import { todayIsoInBrussels } from "@/lib/format";
import { listRecords } from "@/features/records/queries";
import { listReferences } from "@/features/references/queries";

import {
  shapeAgenda,
  shapeAthleteSheet,
  shapeAthletes,
  shapeExercises,
  shapePrograms,
  shapeDocuments,
  shapeExpenses,
  shapeGoals,
  NOTIFICATIONS_CUT_HINT,
  pickNotifications,
  shapeNotifications,
  shapeReferences,
  shapeSettings,
  shapePayments,
  shapeSessionTemplates,
  shapeTasks,
  shapeTemplates,
  shapeUnpaid,
  MAX_ROWS,
  withTotal,
} from "./shape";

// Exécution des outils de lecture de l'Assistant IA (lot 1 des actions), pour l'organisation du
// coach connecté (vérifiée par l'action serveur ; la RLS limite aussi chaque lecture). Résultat : du
// JSON compact pour Claude, ou une phrase d'erreur qu'il peut corriger.

const isoDay = z.iso.date();
const DAY_MS = 86_400_000;

const inputs = {
  chercher_sportifs: z.object({ nom: z.string().max(80), avec_archives: z.boolean().optional() }),
  voir_agenda: z
    .object({ du: isoDay, au: isoDay })
    .refine(({ du, au }) => au >= du, { message: "La date de fin est avant la date de début." })
    .refine(({ du, au }) => (Date.parse(au) - Date.parse(du)) / DAY_MS <= 31, {
      message: "31 jours au plus.",
    }),
  voir_a_encaisser: z.object({ sportif_id: z.uuid().optional() }),
  voir_listes_de_taches: z.object({}),
  voir_categories_de_depenses: z.object({}),
  voir_modeles: z.object({}),
  voir_modeles_de_seance: z.object({}),
  // Lot 4 (D-183) : le quotidien, 100 lignes au plus.
  voir_taches: z.object({
    statut: z.enum(["a_faire", "terminees", "toutes"]).optional(),
    sportif_id: z.uuid().optional(),
    liste_id: z.uuid().optional(),
  }),
  voir_paiements: z.object({
    sportif_id: z.uuid().optional(),
    du: isoDay.optional(),
    au: isoDay.optional(),
  }),
  voir_depenses: z.object({ du: isoDay.optional(), au: isoDay.optional() }),
  voir_documents: z.object({ sportif_id: z.uuid().optional(), categorie_id: z.uuid().optional() }),
  // Lot 5 (D-184) : objectifs, repères et records d'un sportif.
  voir_objectifs: z.object({ sportif_id: z.uuid() }),
  voir_reperes: z.object({ sportif_id: z.uuid() }),
  // Lot 6 (D-185) : les réglages (jamais l'e-mail de connexion ni le numéro du coach).
  voir_parametres: z.object({}),
  voir_notifications: z.object({
    sorte: z.enum(NOTIFICATION_KINDS as [NotificationKind, ...NotificationKind[]]).optional(),
    etat: z.enum(["toutes", "a_traiter"]).optional(),
  }),
  voir_programmes: z.object({ sportif_id: z.uuid() }),
  voir_fiche: z.object({ sportif_id: z.uuid() }),
  voir_brouillon: draftReadInput,
  voir_modele: templateReadInput,
  voir_categories_de_documents: z.object({}),
  chercher_exercices: z.object({ nom: z.string().trim().min(1).max(60) }),
};

export type ReadToolName = keyof typeof inputs;

export async function runReadTool(
  organizationId: string,
  name: ReadToolName,
  input: unknown,
  userId = "",
): Promise<{ ok: true; content: string } | { ok: false; content: string }> {
  const parsed = inputs[name].safeParse(input ?? {});
  if (!parsed.success) {
    return {
      ok: false,
      content: `Paramètres invalides : ${parsed.error.issues[0]?.message ?? ""}`,
    };
  }
  const json = (value: unknown) => ({ ok: true as const, content: JSON.stringify(value) });
  switch (name) {
    case "chercher_sportifs": {
      const { nom, avec_archives } = inputs.chercher_sportifs.parse(input);
      const items = await listAthletes(organizationId, { status: "all", q: "" });
      return json(shapeAthletes(items, nom, avec_archives ?? false));
    }
    case "voir_agenda": {
      const { du, au } = inputs.voir_agenda.parse(input);
      return json(shapeAgenda(await listSessions(organizationId), du, au));
    }
    case "voir_a_encaisser": {
      const { sportif_id } = inputs.voir_a_encaisser.parse(input ?? {});
      const [dates, sessions] = await Promise.all([
        listUnpaidDates(organizationId),
        listSessions(organizationId),
      ]);
      return json(shapeUnpaid(dates, sessions, sportif_id));
    }
    case "voir_listes_de_taches":
      return json(
        (await listTaskLists(organizationId)).map((list) => ({ id: list.id, nom: list.name })),
      );
    case "voir_modeles":
      return json(shapeTemplates(await listTemplates(organizationId, { kind: "program" })));
    case "voir_modeles_de_seance":
      return json(shapeSessionTemplates(await listTemplates(organizationId, { kind: "session" })));
    case "voir_taches": {
      const { statut, sportif_id, liste_id } = inputs.voir_taches.parse(input ?? {});
      const { open, done } = await listTasks(organizationId);
      const tasks = (
        statut === "terminees" ? done : statut === "toutes" ? [...open, ...done] : open
      )
        .filter((task) => !sportif_id || task.athleteId === sportif_id)
        .filter((task) => !liste_id || task.list?.id === liste_id);
      // « toutes » : les tâches à faire d'abord ; coupée, la liste le dit (mineur n°7 du lot 4).
      return json(
        withTotal(
          shapeTasks(tasks),
          tasks.length,
          statut === "toutes"
            ? "demande les tâches terminées à part (statut « terminees »), ou précise un sportif ou une liste."
            : "précise un sportif ou une liste.",
        ),
      );
    }
    case "voir_paiements": {
      const { sportif_id, du, au } = inputs.voir_paiements.parse(input ?? {});
      // Sportif et dates filtrés PAR LA BASE, avant la limite de 500 lignes (mineur n°7 du lot 4) ;
      // le total est celui de la base (revue du 20/11, n°8).
      const { payments, total } = await listPaymentsWithTotal(organizationId, du, {
        to: au,
        athleteId: sportif_id,
      });
      return json(withTotal(shapePayments(payments), total, "précise un sportif ou des dates."));
    }
    case "voir_depenses": {
      // Une dépense mensuelle compte tant qu'elle n'est pas finie : elle reste dans la période. Début
      // et fin filtrés PAR LA BASE, total compris (revue du 20/11, n°8).
      const { du, au } = inputs.voir_depenses.parse(input ?? {});
      const { expenses, total } = await listExpensesWithTotal(organizationId, { from: du, to: au });
      return json(withTotal(shapeExpenses(expenses), total, "précise des dates."));
    }
    case "voir_parametres":
      return json(shapeSettings(await loadSettings(organizationId)));
    case "voir_notifications": {
      // Sans les sortes coupées par le coach, comme la cloche (mineur n°3 du lot 6).
      const [notifications, settings] = await Promise.all([
        getNotifications(organizationId, todayIsoInBrussels()),
        loadSettings(organizationId),
      ]);
      const filter = inputs.voir_notifications.parse(input ?? {});
      const rows = pickNotifications(shapeNotifications(notifications, settings.notify), filter);
      return json(withTotal(rows.slice(0, MAX_ROWS), rows.length, NOTIFICATIONS_CUT_HINT));
    }
    case "voir_objectifs":
    case "voir_reperes": {
      const { sportif_id } = inputs[name].parse(input ?? {});
      const athlete = await getAthlete(organizationId, sportif_id);
      if (!athlete)
        return { ok: false, content: "Sportif introuvable : cherche-le avec chercher_sportifs." };
      if (name === "voir_objectifs")
        return json(shapeGoals(await listGoals(organizationId, athlete.id)));
      const [references, records] = await Promise.all([
        listReferences(organizationId, athlete.id),
        listRecords(organizationId, athlete.id),
      ]);
      return json(shapeReferences(references, records));
    }
    case "voir_documents": {
      const { sportif_id, categorie_id } = inputs.voir_documents.parse(input ?? {});
      const documents = (await listDocuments(organizationId, sportif_id)).filter(
        (document) => !categorie_id || document.categoryId === categorie_id,
      );
      return json(
        withTotal(
          shapeDocuments(documents),
          documents.length,
          "précise un sportif ou une catégorie.",
        ),
      );
    }
    case "voir_programmes": {
      const { sportif_id } = inputs.voir_programmes.parse(input);
      return json(shapePrograms(await listAthleteProgramRows(organizationId, sportif_id)));
    }
    case "voir_brouillon": {
      // Lot 3b : le brouillon (ce que l'éditeur montre), sommaire ou 2 semaines détaillées.
      const { programme_id, semaines } = inputs.voir_brouillon.parse(input);
      const loaded = await loadDraft(await createClient(), organizationId, programme_id);
      if (!loaded?.draft) {
        return { ok: false, content: "Programme introuvable : regarde voir_programmes." };
      }
      return json(
        draftReading(
          loaded.draft,
          { revision: loaded.revision, status: loaded.program.status },
          semaines,
        ),
      );
    }
    case "voir_modele": {
      const { modele_id, semaines } = inputs.voir_modele.parse(input);
      const template = await getProgramTemplate(organizationId, modele_id);
      if (!template?.plan) {
        return { ok: false, content: "Modèle introuvable : regarde voir_modeles." };
      }
      return json(
        draftReading(
          template.plan,
          {
            revision: template.version,
            status: template.source === "coory" ? "modèle Coory (lecture seule)" : "modèle",
          },
          semaines,
        ),
      );
    }
    case "voir_fiche": {
      // Lot 2 : ce qui est rempli ou vide, sans santé, notes, accords ni historique.
      const { sportif_id } = inputs.voir_fiche.parse(input);
      const fiche = await getAthlete(organizationId, sportif_id);
      if (!fiche)
        return { ok: false, content: "Sportif introuvable : cherche-le avec chercher_sportifs." };
      return json(shapeAthleteSheet(fiche));
    }
    case "chercher_exercices": {
      const { nom } = inputs.chercher_exercices.parse(input);
      return json(shapeExercises(await listLibraryExercises(userId, organizationId), nom));
    }
    case "voir_categories_de_documents":
      return json(
        (await listDocumentCategories(organizationId)).map((category) => ({
          id: category.id,
          nom: category.name,
        })),
      );
    case "voir_categories_de_depenses":
      return json(
        (await listExpenseCategories(organizationId)).map((category) => ({
          id: category.id,
          nom: category.name,
        })),
      );
  }
}

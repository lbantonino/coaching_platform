import "server-only";

import { z } from "zod";

import { getAthlete, listAthletes } from "@/features/athletes/queries";
import { listUnpaidDates } from "@/features/billing/collect-queries";
import { listExpenseCategories, listExpenses } from "@/features/billing/expense-queries";
import { listPayments } from "@/features/billing/payment-queries";
import { listDocumentCategories, listDocuments } from "@/features/documents/queries";
import { listLibraryExercises } from "@/features/exercises/queries";
import { loadDraft } from "@/features/programs/drafts";
import { listAthleteProgramRows } from "@/features/programs/queries";
import { getProgramTemplate, listTemplates } from "@/features/programs/templates";
import { createClient } from "@/lib/supabase/server";

import { draftReading, draftReadInput, templateReadInput } from "../program-edit";
import { listSessions } from "@/features/sessions/queries";
import { listTaskLists, listTasks } from "@/features/tasks/queries";

import {
  shapeAgenda,
  shapeAthleteSheet,
  shapeAthletes,
  shapeExercises,
  shapePrograms,
  shapeDocuments,
  shapeExpenses,
  shapePayments,
  shapeSessionTemplates,
  shapeTasks,
  shapeTemplates,
  shapeUnpaid,
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
      return json(shapeTasks(tasks));
    }
    case "voir_paiements": {
      const { sportif_id, du, au } = inputs.voir_paiements.parse(input ?? {});
      const payments = (await listPayments(organizationId, du))
        .filter((payment) => !au || payment.receivedOn <= au)
        .filter((payment) => !sportif_id || payment.athleteId === sportif_id);
      return json(shapePayments(payments));
    }
    case "voir_depenses": {
      // Une dépense mensuelle compte tant qu'elle n'est pas finie : elle reste dans la période.
      const { du, au } = inputs.voir_depenses.parse(input ?? {});
      const expenses = (await listExpenses(organizationId)).filter(
        (expense) =>
          (!au || expense.spentOn <= au) &&
          (!du ||
            (expense.repeatsMonthly
              ? expense.endsOn === null || expense.endsOn >= du
              : expense.spentOn >= du)),
      );
      return json(shapeExpenses(expenses));
    }
    case "voir_documents": {
      const { sportif_id, categorie_id } = inputs.voir_documents.parse(input ?? {});
      const documents = (await listDocuments(organizationId, sportif_id)).filter(
        (document) => !categorie_id || document.categoryId === categorie_id,
      );
      return json(shapeDocuments(documents));
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

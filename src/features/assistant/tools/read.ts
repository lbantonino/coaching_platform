import "server-only";

import { z } from "zod";

import { listAthletes } from "@/features/athletes/queries";
import { listUnpaidDates } from "@/features/billing/collect-queries";
import { listExpenseCategories } from "@/features/billing/expense-queries";
import { listLibraryExercises } from "@/features/exercises/queries";
import { listAthleteProgramRows } from "@/features/programs/queries";
import { listTemplates } from "@/features/programs/templates";
import { listSessions } from "@/features/sessions/queries";
import { listTaskLists } from "@/features/tasks/queries";

import {
  shapeAgenda,
  shapeAthletes,
  shapeExercises,
  shapePrograms,
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
  voir_programmes: z.object({ sportif_id: z.uuid() }),
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
    case "voir_programmes": {
      const { sportif_id } = inputs.voir_programmes.parse(input);
      return json(shapePrograms(await listAthleteProgramRows(organizationId, sportif_id)));
    }
    case "chercher_exercices": {
      const { nom } = inputs.chercher_exercices.parse(input);
      return json(shapeExercises(await listLibraryExercises(userId, organizationId), nom));
    }
    case "voir_categories_de_depenses":
      return json(
        (await listExpenseCategories(organizationId)).map((category) => ({
          id: category.id,
          nom: category.name,
        })),
      );
  }
}

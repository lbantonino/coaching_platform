import { describe, expect, it } from "vitest";

import { expenseFromFilter } from "@/domain/billing/expenses";
import type { ProgramDraft, Week } from "@/domain/training/program-plan";
import { sessionDay, sessionMoment } from "@/domain/training/scheduling";
import type { Weekday } from "@/domain/training/session-v2";
import { summarizeDaily, unpaidAgainStatus } from "@/features/assistant/daily";
import { athletePlanFacts, hasUnknownExercise } from "@/features/assistant/exercise-check";
import {
  buildCustomWeeks,
  cardAvailableDays,
  programRuleError,
} from "@/features/assistant/program";
import { applyProgramEdits, type ProgramEdit } from "@/features/assistant/program-edit";
import { assistantActionSchema, hasExerciseNamed } from "@/features/assistant/proposals";
import { attachmentProblem } from "@/features/assistant/attachment-rules";
import {
  NOTIFICATIONS_CUT_HINT,
  pickNotifications,
  shapeNotifications,
  withTotal,
} from "@/features/assistant/tools/shape";

import { GENERATED_TEMPLATES } from "../../scripts/modeles-coory/modeles";

// Revue de code du 20/11/2026 (commit e845ba2, dossier src/features/assistant) : un bloc par point,
// numéroté comme dans la revue. Le n°1 (téléphone du coach) est dans assistant-mineurs.test.ts.
const hybrid = GENERATED_TEMPLATES[6]!.plan;
const draft: ProgramDraft = { ...hybrid, startDate: "2026-11-16" };
const today = { today: "2026-11-14" };
const ok = (edits: ProgramEdit[], plan: ProgramDraft = draft, options = {}) => {
  const result = applyProgramEdits(plan, edits, { ...today, ...options });
  if (!result.ok) throw new Error(result.error);
  return result;
};
const patchSession = (
  plan: ProgramDraft,
  week: number,
  slot: number,
  patch: Record<string, unknown>,
): ProgramDraft => ({
  ...plan,
  weeks: plan.weeks.map((item) =>
    item.index !== week
      ? item
      : {
          ...item,
          sessions: item.sessions.map((session, i) =>
            i === slot ? { ...session, ...patch } : session,
          ),
        },
  ),
});
const daysOf = (week: Week) => week.sessions.map((session) => sessionDay(session));
const {
  key: _k,
  athleteCanMove: _m,
  fixedDay: _d,
  fixedTime: _t,
  moment: _mo,
  withCoach: _c,
  ...seance
} = hybrid.weeks[0]!.sessions[0]!;
void [_k, _m, _d, _t, _mo, _c];

describe("n°2 : un jour proposé ne tombe pas sur un jour déjà pris", () => {
  const count = hybrid.weeks[0]!.sessions.length;
  const free: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].slice(
    0,
    count + 1,
  ) as Weekday[];

  // Semaine 1 en jours fixes, chaque séance posée à la main (dans l'ordre inverse des jours).
  const fixed = ok([{ op: "organisation_semaine", semaine: 1, mode: "fixed" }]).plan;
  const placed = (days: Weekday[], skip?: number): ProgramDraft =>
    hybrid.weeks[0]!.sessions.reduce(
      (plan, _session, slot) =>
        patchSession(plan, 1, slot, {
          fixedDay: slot === skip ? undefined : days[days.length - 1 - slot],
          fixedTime: undefined,
          moment: undefined,
        }),
      fixed,
    );

  it("ajouter_seance sans jour : le seul jour encore libre parmi ses jours disponibles", () => {
    // Les séances sur free[1..], le lundi (free[0]) reste libre.
    const plan = placed(free.slice(1));
    const result = ok([{ op: "ajouter_seance", semaine: 1, seance }], plan, {
      availableDays: free,
    });
    expect(result.plan.weeks[0]!.sessions.at(-1)!.fixedDay).toBe("mon");
  });

  it("organisation_semaine : une séance sans jour prend le jour libre, les autres gardent le leur", () => {
    const days = free.slice(0, count);
    // La 1re séance n'a pas de jour ; le jour libre est le dernier de la liste.
    const plan = placed(days, 0);
    const before = daysOf(plan.weeks[0]!);
    const result = ok([{ op: "organisation_semaine", semaine: 1, mode: "fixed" }], plan, {
      availableDays: days,
    });
    expect(daysOf(result.plan.weeks[0]!)).toEqual([days[count - 1], ...before.slice(1)]);
  });

  it("creer_programme : une séance sans jour évite le jour donné à une autre", () => {
    const written = (ref: string, fixedDay?: Weekday) => ({ ...seance, ref, fixedDay });
    const built = buildCustomWeeks(
      {
        weeksCount: 1,
        sessionsPerWeek: 2,
        scheduling: "fixed",
        seances: [written("b"), written("a", "tue")],
        semaines: [{ index: 1, seances: ["b", "a"] }],
      },
      ["tue", "thu"],
    );
    expect(built.ok && daysOf(built.weeks[0]!)).toEqual(["thu", "tue"]);
  });
});

describe("n°3 : la carte « Nouveau programme » se vérifie avec les jours du clic", () => {
  // 5 séances avec une heure sur le seul lundi disponible : la 5e n'a pas de jour, et une heure sans
  // jour est refusée par l'éditeur. La carte le dit tout de suite, au lieu d'échouer au clic.
  const params = {
    athlete: { athleteId: "db000000-0000-4000-8000-000000000001" },
    title: "Bloc lundi",
    discipline: "running",
    startDate: "2026-11-16",
    weeksCount: 1,
    sessionsPerWeek: 5,
    scheduling: "fixed",
    start: { kind: "blank" },
    seances: ["a", "b", "c", "d", "e"].map((ref) => ({
      ref,
      title: `Footing ${ref}`,
      sessionType: "Endurance",
      durationMinutes: 40,
      content: {
        discipline: "running",
        items: [{ id: "t1", kind: "text", title: "Footing", lines: ["40 min"] }],
      },
      fixedTime: "07:00",
    })),
    semaines: [{ index: 1, seances: ["a", "b", "c", "d", "e"] }],
  };

  it("avec les 7 jours : valide", () => {
    expect(programRuleError(params)).toBeNull();
  });

  it("avec les jours notés sur la carte (le seul lundi) : refusé dès la proposition", () => {
    expect(programRuleError({ ...params, joursDisponibles: ["mon"] })).not.toBeNull();
  });
});

describe("n°3 et n°4 : « Valider » reprend les jours notés sur la carte", () => {
  it("les jours de la carte gagnent sur ceux relus au clic", () => {
    expect(cardAvailableDays({ joursDisponibles: ["tue"] }, ["mon", "wed"])).toEqual(["tue"]);
    expect(cardAvailableDays({ joursDisponibles: [] }, ["mon"])).toEqual([]);
  });

  it("une carte d'avant (sans jours notés) relit les jours du sportif", () => {
    expect(cardAvailableDays({}, ["mon"])).toEqual(["mon"]);
  });

  it("les deux cartes acceptent les jours notés par le serveur", () => {
    const programId = "aa000000-0000-4000-8000-000000000001";
    expect(
      assistantActionSchema.safeParse({
        kind: "modifier_programme",
        params: {
          programId,
          revision: 1,
          operations: [{ op: "organisation_semaine", semaine: 1, mode: "fixed" }],
          joursDisponibles: ["tue", "thu"],
        },
      }).success,
    ).toBe(true);
  });
});

describe("n°7 : un déplacement ne double pas un moment déduit de l'heure", () => {
  const twoFixed = ok([
    { op: "organisation_semaine", semaine: 1, mode: "fixed" },
    { op: "organisation_semaine", semaine: 2, mode: "fixed" },
  ]).plan;
  let plan = patchSession(twoFixed, 1, 0, {
    fixedDay: "tue",
    fixedTime: "07:30",
    moment: undefined,
  });
  plan = patchSession(plan, 2, 0, { fixedDay: "tue", fixedTime: "08:00", moment: undefined });
  const moved = plan.weeks[0]!.sessions[0]!;

  it("le matin du mardi est déjà pris : l'heure est retirée, un autre moment est proposé", () => {
    const result = ok([{ op: "deplacer_seance", cle: moved.key, semaine: 2 }], plan);
    const tuesday = result.plan.weeks[1]!.sessions.filter(
      (session) => sessionDay(session) === "tue",
    );
    const moments = tuesday.map(sessionMoment);
    expect(new Set(moments).size).toBe(moments.length);
    const arrived = tuesday.find((session) => session.key === moved.key)!;
    expect(arrived.fixedTime).toBeUndefined();
    expect(result.lines[0]).toContain("déjà une séance le mardi (matin)");
  });
});

// Un faux client Supabase : chaque table renvoie la réponse donnée, quelle que soit la requête.
const fakeSupabase = (tables: Record<string, { data: unknown; error: unknown }>) =>
  ({
    from: (table: string) => {
      const result = tables[table] ?? { data: null, error: null };
      const chain: Record<string, unknown> = {};
      for (const method of ["select", "eq", "in"]) chain[method] = () => chain;
      chain.maybeSingle = () => Promise.resolve(result);
      chain.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
        Promise.resolve(result).then(resolve, reject);
      return chain;
    },
  }) as never;

describe("n°9 : une lecture du sportif en erreur ne devine rien", () => {
  it("jours et façon de viser lus : rendus", async () => {
    const facts = await athletePlanFacts(
      fakeSupabase({
        athlete_profiles: { data: { available_days: ["tue"] }, error: null },
        athlete_reference_metrics: { data: [], error: null },
      }),
      "org-1",
      "ath-1",
    );
    expect(facts?.availableDays).toEqual(["tue"]);
  });

  it("une lecture en erreur : null (la carte est refusée, rien n'est deviné)", async () => {
    const failed = { data: null, error: { message: "timeout" } };
    expect(
      await athletePlanFacts(
        fakeSupabase({
          athlete_profiles: failed,
          athlete_reference_metrics: { data: [], error: null },
        }),
        "org-1",
        "ath-1",
      ),
    ).toBeNull();
    expect(
      await athletePlanFacts(
        fakeSupabase({
          athlete_profiles: { data: { available_days: [] }, error: null },
          athlete_reference_metrics: failed,
        }),
        "org-1",
        "ath-1",
      ),
    ).toBeNull();
  });
});

describe("n°10 : un exercice déjà dans le programme, masqué depuis, ne bloque pas la séance", () => {
  const hidden = "ee000000-0000-4000-8000-000000000001";
  const fresh = "ee000000-0000-4000-8000-000000000002";
  const supabase = fakeSupabase({
    exercises: {
      data: [
        { id: hidden, organization_id: null, visibility: "hidden", archived_at: null },
        { id: fresh, organization_id: null, visibility: "active", archived_at: null },
      ],
      error: null,
    },
  });
  const operations = [{ seance: { items: [{ exerciseId: hidden }, { exerciseId: fresh }] } }];

  it("déjà dans le brouillon : accepté", async () => {
    const already = { weeks: [{ sessions: [{ items: [{ exerciseId: hidden }] }] }] };
    expect(await hasUnknownExercise(supabase, "org-1", operations, already)).toBe(false);
  });

  it("ajouté par l'assistant : toujours refusé", async () => {
    expect(await hasUnknownExercise(supabase, "org-1", operations)).toBe(true);
  });
});

describe("n°5 : voir_notifications coupée dit comment voir la suite", () => {
  const many = Array.from({ length: 120 }, (_, i) => ({
    ...{ read: i % 2 === 0, dismissed: i % 3 === 0 },
    key: `t:${i}`,
    title: `Tâche ${i}`,
    dueOn: "2026-11-14",
  }));
  const notifications = {
    competitions: [],
    messages: [],
    tasks: many as never[],
    unpaid: [
      { read: false, dismissed: false, key: "u:1", title: "Coaching", date: "2026-11-10" } as never,
    ],
    profiles: [],
    assistant: [],
  };
  const rows = shapeNotifications(notifications);

  it("filtrer par sorte : seulement celle-là", () => {
    expect(pickNotifications(rows, { sorte: "unpaid" }).map((row) => row.cle)).toEqual(["u:1"]);
  });

  it("« a_traiter » : ni lues ni masquées", () => {
    const picked = pickNotifications(rows, { etat: "a_traiter" });
    expect(picked.length).toBeGreaterThan(0);
    expect(picked.every((row) => !row.lue && !row.masquee)).toBe(true);
  });

  it("la note ne demande plus de marquer ou masquer (les lignes resteraient dans la liste)", () => {
    expect(NOTIFICATIONS_CUT_HINT).not.toMatch(/marque|masque-les/);
    expect(NOTIFICATIONS_CUT_HINT).toContain("sorte");
    expect(NOTIFICATIONS_CUT_HINT).toContain("a_traiter");
  });
});

describe("n°6 : supprimer un paiement dit ce que la page « À encaisser » montrera", () => {
  const session = {
    startsOn: "2026-11-02",
    repeatsWeekly: true,
    endsOn: null,
    startTime: "18:00:00",
    exceptions: [],
    priceCents: 4000,
    priceVatIncluded: true,
    vatRate: 0,
    paymentMethod: "cash",
    kind: "individual",
    athletes: [{ id: "ath-1" }],
  };
  const at = { today: "2026-11-20", now: "12:00", covers: [] };

  it("une séance passée avec prix et moyen de paiement : redevient à encaisser", () => {
    expect(unpaidAgainStatus(session, "2026-11-16", at)).toBe("a_encaisser");
  });

  it("aujourd'hui, pas encore commencée : pas encore à encaisser", () => {
    expect(
      unpaidAgainStatus(
        { ...session, startsOn: "2026-11-20", repeatsWeekly: false },
        "2026-11-20",
        at,
      ),
    ).toBe("futur");
  });

  it("couverte par un forfait : ne revient pas dans « À encaisser »", () => {
    const covers = [{ athleteId: "ath-1", coversFrom: "2026-11-01", coversTo: "2026-11-30" }];
    expect(unpaidAgainStatus(session, "2026-11-16", { ...at, covers })).toBe("forfait");
  });

  it("sans moyen de paiement ou sans prix : ne revient pas dans « À encaisser »", () => {
    expect(unpaidAgainStatus({ ...session, paymentMethod: null }, "2026-11-16", at)).toBe(
      "sans_suivi",
    );
    expect(unpaidAgainStatus({ ...session, priceCents: null }, "2026-11-16", at)).toBe(
      "sans_suivi",
    );
  });

  it("déplacée à demain : pas encore à encaisser", () => {
    const moved = {
      ...session,
      exceptions: [{ originalDate: "2026-11-16", newDate: "2026-11-21", newStartTime: "09:00" }],
    };
    expect(unpaidAgainStatus(moved, "2026-11-16", at)).toBe("futur");
  });

  it("la carte le dit en clair", () => {
    const card = (seanceStatut: string) =>
      summarizeDaily(
        { kind: "supprimer_paiement", params: { paymentId: "p" } },
        { seanceDate: "2026-11-16", seanceStatut },
        "EUR",
      )?.summary;
    expect(card("forfait")).toContain(
      "La séance du lundi 16 novembre 2026 n'est plus marquée payée (couverte par un forfait : elle ne revient pas dans « À encaisser »)",
    );
    expect(card("sans_suivi")).toContain(
      "La séance du lundi 16 novembre 2026 n'est plus marquée payée (sans prix ou sans moyen de paiement : elle ne revient pas dans « À encaisser »)",
    );
  });
});

describe("n°8 : dépenses d'une période filtrées par la base, total exact", () => {
  it("le filtre de début garde les dépenses mensuelles encore en cours", () => {
    expect(expenseFromFilter("2026-11-01")).toBe(
      "spent_on.gte.2026-11-01,and(repeats_monthly.is.true,or(ends_on.is.null,ends_on.gte.2026-11-01))",
    );
  });

  it("le total vient du compte de la base, pas des 500 lignes lues", () => {
    const rows = Array.from({ length: 500 }, (_, i) => i);
    expect(withTotal(rows.slice(0, 100), 1200, "précise des dates.")).toMatchObject({
      total: 1200,
    });
  });
});

describe("n°11 : un fichier au nom vide dit qu'il n'a pas de nom", () => {
  it("nom vide ou fait d'espaces", () => {
    expect(attachmentProblem({ name: "   ", type: "", size: 10 }, 0)).toBe(
      "Fichier sans nom : renomme-le, puis joins-le à nouveau.",
    );
  });
});

describe("n°12 : le doublon d'exercice se cherche dans TOUS les exercices du coach", () => {
  const names = Array.from({ length: 2500 }, (_, i) => ({ name_fr: `Exercice ${i}` }));
  names[2300] = { name_fr: "Squat  Bulgare " };
  const pages = (size: number) => async (from: number, to: number) => {
    expect(to - from + 1).toBe(size);
    return names.slice(from, to + 1);
  };

  it("trouvé au-delà des 2 000 premiers (lu page par page)", async () => {
    expect(await hasExerciseNamed(pages(1000), "squat bulgare")).toBe(true);
  });

  it("absent : faux ; lecture en erreur : null", async () => {
    expect(await hasExerciseNamed(pages(1000), "Fente")).toBe(false);
    expect(await hasExerciseNamed(async () => null, "Fente")).toBeNull();
  });
});

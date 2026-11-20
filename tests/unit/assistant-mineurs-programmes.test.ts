import { describe, expect, it } from "vitest";

import type { ProgramDraft } from "@/domain/training/program-plan";
import { proposalToolResult } from "@/features/assistant/loop";
import {
  buildCustomWeeks,
  copySourceRefusal,
  isUsableExercise,
  overlapWarning,
  programRuleError,
} from "@/features/assistant/program";
import { applyProgramEdits, type ProgramEdit } from "@/features/assistant/program-edit";

import { GENERATED_TEMPLATES } from "../../scripts/modeles-coory/modeles";

// Petits défauts reportés pendant les lots 3a et 3b de l'Assistant IA (programmes), corrigés le
// 20/11/2026. Mêmes données que tests/unit/assistant-lot3b.test.ts (modèle hybride généré).
const hybrid = GENERATED_TEMPLATES[6]!.plan;
const draft: ProgramDraft = { ...hybrid, startDate: "2026-11-16" };
const at = (week: number, slot: number) => hybrid.weeks[week - 1]!.sessions[slot]!;
const today = { today: "2026-11-14" };
const run = (edits: ProgramEdit[], plan: ProgramDraft = draft, options = {}) =>
  applyProgramEdits(plan, edits, { ...today, ...options });
const ok = (edits: ProgramEdit[], plan: ProgramDraft = draft, options = {}) => {
  const result = run(edits, plan, options);
  if (!result.ok) throw new Error(result.error);
  return result;
};

// Une séance écrite par l'assistant (creer_programme), reprise du modèle.
const written = (ref: string, slot = 0) => {
  const {
    key: _key,
    athleteCanMove: _move,
    fixedDay: _day,
    fixedTime: _time,
    moment: _moment,
    withCoach: _coach,
    ...body
  } = at(1, slot);
  void [_key, _move, _day, _time, _moment, _coach];
  return { ...body, ref };
};

describe("lot 3a n°6 : seuls les exercices de la Bibliothèque de l'organisation", () => {
  const row = { organization_id: null, visibility: "active", archived_at: null };

  it("catalogue Coory actif ou exercice de l'organisation : accepté", () => {
    expect(isUsableExercise(row, "org-1")).toBe(true);
    expect(isUsableExercise({ ...row, organization_id: "org-1" }, "org-1")).toBe(true);
  });

  it("archivé, masqué ou d'une autre organisation du même coach : refusé", () => {
    expect(isUsableExercise({ ...row, archived_at: "2026-11-01" }, "org-1")).toBe(false);
    expect(isUsableExercise({ ...row, visibility: "hidden" }, "org-1")).toBe(false);
    expect(isUsableExercise({ ...row, organization_id: "org-2" }, "org-1")).toBe(false);
  });
});

describe("lot 3a n°9 et lot 3b n°8 : jours fixes, chaque séance a un jour", () => {
  it("creer_programme en jours fixes sans jour : un jour proposé, comme l'éditeur", () => {
    const built = buildCustomWeeks(
      {
        weeksCount: 1,
        sessionsPerWeek: 2,
        scheduling: "fixed",
        seances: [written("a", 0), written("b", 1)],
        semaines: [{ index: 1, seances: ["a", "b"] }],
      },
      ["tue", "thu"],
    );
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const days = built.weeks[0]!.sessions.map((session) => session.fixedDay);
    expect(days.every((day) => day === "tue" || day === "thu")).toBe(true);
  });

  it("organisation_semaine en jours fixes : un jour pour chaque séance, dit sur la carte", () => {
    const result = ok([{ op: "organisation_semaine", semaine: 1, mode: "fixed" }]);
    expect(result.plan.weeks[0]!.sessions.every((session) => session.fixedDay)).toBe(true);
    expect(result.lines[0]).toMatch(/^Semaine 1 : jours fixes \(.+\)$/);
  });
});

describe("lot 3a n°12 : un début hors lundi propose les lundis voisins", () => {
  it("mercredi 25 novembre 2026", () => {
    expect(programRuleError({ startDate: "2026-11-25" })).toBe(
      "Un programme commence un lundi : prends le lundi 30 novembre 2026 (ou le lundi 23 novembre 2026).",
    );
  });
});

describe("lot 3a n°13 : les séances placées suivent le rythme annoncé", () => {
  it("plus de séances dans une semaine que sessionsPerWeek : refusé", () => {
    const built = buildCustomWeeks({
      weeksCount: 1,
      sessionsPerWeek: 1,
      scheduling: "ordered",
      seances: [written("a", 0), written("b", 1)],
      semaines: [{ index: 1, seances: ["a", "b"] }],
    });
    expect(built).toEqual({
      ok: false,
      error:
        "Semaine 1 : 2 séances placées pour 1 par semaine (sessionsPerWeek) : mets sessionsPerWeek à 2 ou retire des séances.",
    });
  });
});

describe("lot 3a n°15 : les refus du serveur, testés hors de la base", () => {
  it("copie : seulement un programme de ce sportif", () => {
    expect(copySourceRefusal(null, "ath-1")).toBe(
      "Programme à copier introuvable parmi ceux de ce sportif.",
    );
    expect(copySourceRefusal({ athleteId: "ath-2" }, "ath-1")).not.toBeNull();
    expect(copySourceRefusal({ athleteId: "ath-1" }, "ath-1")).toBeNull();
  });

  it("chevauchement d'un programme PUBLIÉ seulement", () => {
    const rows = [
      { title: "Bloc d'hiver", status: "published", startDate: "2026-11-02", weeksCount: 6 },
      { title: "Brouillon", status: "draft", startDate: "2026-11-30", weeksCount: 4 },
    ];
    expect(overlapWarning(rows, "2026-11-30", 4)).toBe(
      "Attention : chevauche « Bloc d'hiver », publié jusqu'au dimanche 13 décembre 2026.",
    );
    expect(overlapWarning(rows, "2026-12-14", 4)).toBeNull();
  });
});

describe("lot 3a n°11 : Claude apprend ce que dit la carte", () => {
  it("le résultat de l'outil reprend le titre et les avertissements de la carte", () => {
    const result = proposalToolResult({
      kind: "creer_programme",
      params: {},
      title: "Nouveau programme",
      summary: ["Bloc 10 km", "Attention : chevauche « Bloc d'hiver »."],
    });
    expect(result).toContain("en attente de sa validation");
    expect(result).toContain("Attention : chevauche « Bloc d'hiver »");
  });
});

describe("lot 3b n°7 : déplacer une séance dit tout ce qui change", () => {
  const fixedPlan = ok([{ op: "organisation_semaine", semaine: 1, mode: "fixed" }]).plan;

  it("réordonner dans une semaine à jours fixes ne change rien : refusé", () => {
    const result = run(
      [{ op: "deplacer_seance", cle: at(1, 0).key, semaine: 1, position: 3 }],
      fixedPlan,
    );
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining("jours fixes") });
  });

  it("vers une semaine dans l'ordre : le jour retiré est annoncé", () => {
    const result = ok([{ op: "deplacer_seance", cle: at(1, 0).key, semaine: 2 }], fixedPlan);
    expect(result.lines[0]).toContain("jour retiré");
  });

  it("une séance avec le coach : le rendez-vous reste dans l'agenda, la carte le dit", () => {
    const withCoach: ProgramDraft = {
      ...draft,
      weeks: draft.weeks.map((week) =>
        week.index !== 1
          ? week
          : {
              ...week,
              sessions: week.sessions.map((session, slot) =>
                slot === 0
                  ? {
                      ...session,
                      withCoach: {
                        coachSessionId: "cb000000-0000-4000-8000-000000000001",
                        date: "2026-11-17",
                      },
                    }
                  : session,
              ),
            },
      ),
    };
    const result = ok([{ op: "deplacer_seance", cle: at(1, 0).key, semaine: 2 }], withCoach);
    expect(result.lines[0]).toContain("n'est plus liée au rendez-vous du coach");
  });
});

describe("lot 3b n°10 : ajouter une séance avec son jour, son heure et son moment", () => {
  const fixedPlan = ok([{ op: "organisation_semaine", semaine: 1, mode: "fixed" }]).plan;
  const {
    key: _k,
    athleteCanMove: _m,
    fixedDay: _d,
    fixedTime: _t,
    moment: _mo,
    withCoach: _c,
    ...seance
  } = at(1, 0);
  void [_k, _m, _d, _t, _mo, _c];

  it("dans une semaine à jours fixes : le jour donné", () => {
    const result = ok(
      [{ op: "ajouter_seance", semaine: 1, seance, jour: "sun", heure: "07:30" }],
      fixedPlan,
    );
    const added = result.plan.weeks[0]!.sessions.at(-1)!;
    expect(added.fixedDay).toBe("sun");
    expect(added.fixedTime).toBe("07:30");
  });

  it("sans jour dans une semaine à jours fixes : un jour proposé", () => {
    const result = ok([{ op: "ajouter_seance", semaine: 1, seance }], fixedPlan);
    expect(result.plan.weeks[0]!.sessions.at(-1)!.fixedDay).toBeTruthy();
  });

  it("un jour dans une semaine dans l'ordre : refusé, comme jour_seance", () => {
    expect(run([{ op: "ajouter_seance", semaine: 1, seance, jour: "sun" }])).toMatchObject({
      ok: false,
      error: expect.stringContaining("dans l'ordre"),
    });
  });
});

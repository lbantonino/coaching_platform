import { describe, expect, it } from "vitest";

import {
  buildCustomWeeks,
  customDraftFrom,
  placedSessions,
  programRuleError,
  toCreateProgramInput,
  withSourceRhythm,
} from "@/features/assistant/program";
import { assistantActionSchema, summarize } from "@/features/assistant/proposals";
import {
  ASSISTANT_ERRORS,
  ASSISTANT_MAX_RETRIES,
  ASSISTANT_MAX_TOKENS,
  ASSISTANT_TIMEOUT_MS,
  systemPrompt,
} from "@/features/assistant/rules";
import type { ProgramDraft } from "@/domain/training/program-plan";

// Lot 3a : l'Assistant IA crée un BROUILLON de programme (jamais publié). Un programme écrit par
// l'assistant décrit chaque séance une fois (référence) et la place semaine par semaine.
const SARAH = "db000000-0000-4000-8000-000000000001";
const MODELE = "7a000000-0000-4000-8000-000000000002";

const footing = {
  ref: "A",
  title: "Footing",
  sessionType: "Endurance",
  durationMinutes: 40,
  content: {
    discipline: "running",
    items: [{ id: "t1", kind: "text", title: "Footing", lines: ["40 min en endurance"] }],
  },
  fixedDay: "tue",
};
const base = {
  athlete: { athleteId: SARAH },
  title: "Reprise 2 semaines",
  discipline: "running",
  startDate: "2026-11-16",
  weeksCount: 2,
  sessionsPerWeek: 2,
  scheduling: "ordered",
  start: { kind: "blank" },
};
const custom = {
  ...base,
  seances: [footing, { ...footing, ref: "B", title: "Sortie longue", durationMinutes: 60 }],
  semaines: [
    { index: 1, seances: ["A", "B"] },
    { index: 2, light: true, seances: ["A"] },
  ],
};

describe("buildCustomWeeks", () => {
  it("place les séances par référence, avec des clés stables, sans jour en mode « dans l'ordre »", () => {
    const built = buildCustomWeeks(custom);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.weeks.map((week) => week.sessions.map((s) => s.key))).toEqual([
      ["w1-s1", "w1-s2"],
      ["w2-s1"],
    ]);
    expect(built.weeks[1].light).toBe(true);
    expect(built.weeks[0].sessions[1].title).toBe("Sortie longue");
    expect(built.weeks[0].sessions[0]).not.toHaveProperty("ref");
    expect(built.weeks[0].sessions[0].fixedDay).toBeUndefined();
    expect(built.weeks[0].sessions[0].athleteCanMove).toBe(false);
  });

  it("garde le jour en mode « jours fixés »", () => {
    const built = buildCustomWeeks({ ...custom, scheduling: "fixed" });
    expect(built.ok && built.weeks[0].sessions[0].fixedDay).toBe("tue");
  });

  it("refuse une référence inconnue", () => {
    expect(buildCustomWeeks({ ...custom, semaines: [{ index: 1, seances: ["Z"] }] })).toEqual({
      ok: false,
      error: "Semaine 1 : la séance « Z » n'est pas décrite dans seances.",
    });
  });
});

describe("programRuleError", () => {
  it("accepte un programme écrit valide", () => {
    expect(programRuleError(custom)).toBeNull();
  });

  it("refuse un début qui n'est pas un lundi, en proposant les lundis voisins", () => {
    expect(programRuleError({ ...base, startDate: "2026-11-17" })).toBe(
      "Un programme commence un lundi : prends le lundi 23 novembre 2026 (ou le lundi 16 novembre 2026).",
    );
  });

  it("refuse des séances écrites avec un départ « modèle »", () => {
    expect(
      assistantActionSchema.safeParse({
        kind: "creer_programme",
        params: { ...custom, start: { kind: "template", templateId: MODELE } },
      }).success,
    ).toBe(false);
  });
});

describe("toCreateProgramInput", () => {
  it("reprend les choix de l'assistant de création", () => {
    expect(
      toCreateProgramInput({ ...base, start: { kind: "template", templateId: MODELE } }, SARAH),
    ).toEqual({
      athleteId: SARAH,
      title: "Reprise 2 semaines",
      discipline: "running",
      aimDefaults: { running: "pace", strength: "kg" },
      startDate: "2026-11-16",
      weeksCount: 2,
      sessionsPerWeek: 2,
      phases: [],
      scheduling: "ordered",
      start: { kind: "template", templateId: MODELE },
    });
  });
});

describe("carte « Nouveau programme »", () => {
  it("dit d'où part le brouillon et qu'il reste à publier", () => {
    expect(
      summarize({ kind: "creer_programme", params: custom }, { [SARAH]: "Sarah Vermeulen" }, "EUR"),
    ).toEqual({
      title: "Nouveau programme",
      summary: [
        "Reprise 2 semaines",
        "Sarah Vermeulen",
        "Running · 2 semaines · 2 séances par semaine",
        "Dès le lundi 16 novembre 2026, dans l'ordre",
        "Séances écrites par l'assistant : 3",
        "Brouillon : à relire et publier dans l'éditeur",
      ],
    });
    expect(
      summarize(
        {
          kind: "creer_programme",
          params: { ...base, start: { kind: "template", templateId: MODELE } },
        },
        {
          [SARAH]: "Sarah Vermeulen",
          [MODELE]: "Premier 10 km · 8 semaines",
          chevauchement:
            "Attention : chevauche « Bloc 1 », publié jusqu'au dimanche 17 janvier 2027.",
        },
        "EUR",
      ).summary,
    ).toEqual([
      "Reprise 2 semaines",
      "Sarah Vermeulen",
      "Running · 2 semaines · 2 séances par semaine",
      "Dès le lundi 16 novembre 2026, dans l'ordre",
      "Depuis le modèle « Premier 10 km · 8 semaines »",
      "Attention : chevauche « Bloc 1 », publié jusqu'au dimanche 17 janvier 2027.",
      "Brouillon : à relire et publier dans l'éditeur",
    ]);
  });
});

describe("customDraftFrom (exécution d'un programme écrit)", () => {
  // Le brouillon que createProgram vient d'enregistrer (départ vide) : semaines vides, phases avec
  // leurs identifiants. Les séances écrites le complètent sans rien changer d'autre.
  const created = {
    schemaVersion: 2,
    title: "Reprise 2 semaines",
    discipline: "running",
    aimDefaults: { running: "pace", strength: "kg" },
    sessionsPerWeek: 2,
    phases: [{ id: "p-1a2b3c4d", name: "Reprise", weekFrom: 1, weekTo: 2 }],
    weeks: [
      { index: 1, light: false, scheduling: "ordered", sessions: [] },
      { index: 2, light: false, scheduling: "ordered", sessions: [] },
    ],
    startDate: "2026-11-16",
  } as unknown as ProgramDraft;

  it("remplace seulement les semaines, en gardant phases, titre et date", () => {
    const result = customDraftFrom(created, custom);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.draft.phases).toEqual(created.phases);
    expect(result.draft.title).toBe("Reprise 2 semaines");
    expect(result.draft.startDate).toBe("2026-11-16");
    expect(result.draft.weeks.map((week) => week.sessions.length)).toEqual([2, 1]);
  });

  it("refuse une référence inconnue (rien n'est écrit)", () => {
    expect(
      customDraftFrom(created, { ...custom, semaines: [{ index: 1, seances: ["Z"] }] }).ok,
    ).toBe(false);
  });
});

describe("consigne et taille de réponse pour les programmes", () => {
  // 27/11 : 8 000 jetons ne suffisaient pas pour 3 semaines de séances tirées d'un PDF de 7 pages
  // (réflexion comprise) : trois demandes coupées à 8 000.
  it("laisse la place d'écrire un programme détaillé (20 000 jetons par étape)", () => {
    expect(ASSISTANT_MAX_TOKENS).toBe(20_000);
  });

  it("dit comment créer un programme : modèle d'abord, lundi, exercices de la Bibliothèque, brouillon", () => {
    const prompt = systemPrompt("Gianluca", "2026-11-13");
    expect(prompt).toContain("voir_modeles");
    expect(prompt).toContain("lundi");
    expect(prompt).toContain("chercher_exercices");
    expect(prompt).toContain("brouillon");
  });
});

// Relecture finale du lot 3a : une carte ne promet jamais autre chose que ce que « Valider » crée.
describe("relecture du lot 3a", () => {
  it("n°1 : refuse des phases incohérentes avant la carte, même sans séances écrites", () => {
    const template = { kind: "template", templateId: MODELE };
    expect(
      programRuleError({
        ...base,
        weeksCount: 4,
        start: template,
        phases: [
          { name: "Base", weekFrom: 1, weekTo: 1 },
          { name: "Affûtage", weekFrom: 3, weekTo: 4 },
        ],
      }),
    ).not.toBeNull();
    expect(programRuleError({ ...base, start: template })).toBeNull();
  });

  it("n°2 : refuse une semaine hors du programme, une semaine ou une séance décrite deux fois", () => {
    expect(buildCustomWeeks({ ...custom, semaines: [{ index: 3, seances: ["A"] }] })).toEqual({
      ok: false,
      error: "Semaine 3 : le programme n'a que 2 semaines.",
    });
    expect(
      buildCustomWeeks({
        ...custom,
        semaines: [
          { index: 1, seances: ["A"] },
          { index: 1, seances: ["A", "B"] },
        ],
      }),
    ).toEqual({ ok: false, error: "Semaine 1 : décrite deux fois dans semaines." });
    expect(buildCustomWeeks({ ...custom, seances: [footing, footing] })).toEqual({
      ok: false,
      error: "Séance « A » : décrite deux fois dans seances.",
    });
  });

  it("n°2 : la carte compte les séances réellement placées", () => {
    expect(placedSessions(custom)).toBe(3);
  });

  it("n°3 : depuis un modèle ou une copie, le rythme affiché est celui de la source", () => {
    const params = { ...base, sessionsPerWeek: 4, start: { kind: "template", templateId: MODELE } };
    expect(withSourceRhythm(params, { sessionsPerWeek: 3 }).sessionsPerWeek).toBe(3);
    expect(withSourceRhythm(params, null).sessionsPerWeek).toBe(4);
  });

  it("n°5 : laisse le temps d'écrire une réponse complète, sans second essai facturé, sous les 300 s de Vercel", () => {
    // Mesuré en production le 27/11 : plus de 90 jetons par seconde. 80 au pire : 250 s pour
    // 20 000 jetons ; 30 s restent pour la base et le démarrage de la fonction.
    expect(ASSISTANT_TIMEOUT_MS).toBeGreaterThanOrEqual((ASSISTANT_MAX_TOKENS / 80) * 1000);
    expect(ASSISTANT_TIMEOUT_MS).toBeLessThanOrEqual(270_000);
    expect(ASSISTANT_MAX_RETRIES).toBe(0);
  });

  it("une réponse coupée dit quoi faire : demander en plusieurs fois", () => {
    expect(ASSISTANT_ERRORS.truncated).toContain("en plusieurs fois");
  });
});

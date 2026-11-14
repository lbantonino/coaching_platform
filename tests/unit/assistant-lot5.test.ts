import { describe, expect, it } from "vitest";

import { assistantActionSchema, summarize } from "@/features/assistant/proposals";
import { systemPrompt } from "@/features/assistant/rules";
import {
  appendNote,
  appendToReadNote,
  coachExerciseRefusal,
  goalStatusRefusal,
  mergeAvailability,
  mergeGoal,
  photoRefusal,
} from "@/features/assistant/sportifs";
import { shapeAthleteSheet, shapeGoals, shapeReferences } from "@/features/assistant/tools/shape";
import { goalFormValues } from "@/features/goals/form-values";

// Assistant IA, lot 5 (D-184) : les sportifs. Règle d'Antonino du 14/11 : l'assistant fait tout ce que
// le coach fait à la main, sauf la santé et la sécurité du compte ; les notes : ajouter, jamais lire.

const athleteId = "e5000000-0000-4000-8000-000000000001";
const id = "e5000000-0000-4000-8000-000000000011";
const ok = (kind: string, params: unknown) =>
  assistantActionSchema.safeParse({ kind, params }).success;
const card = (kind: string, params: object, names: Record<string, string> = {}) =>
  summarize(
    { kind: kind as "ajouter_note", params: params as Record<string, unknown> },
    names,
    "EUR",
  );

describe("Task 1 : schémas stricts du lot 5", () => {
  it("chaque carte accepte ses champs ; jamais de santé", () => {
    expect(ok("statut_sportif", { athleteId, statut: "archived" })).toBe(true);
    expect(ok("statut_sportif", { athleteId, statut: "supprime" })).toBe(false);
    expect(ok("discipline_sportif", { athleteId, discipline: "hybrid" })).toBe(true);
    expect(
      ok("disponibilites", { athleteId, changes: { sessionsPerWeek: 3, availableDays: ["mon"] } }),
    ).toBe(true);
    expect(ok("disponibilites", { athleteId, changes: { healthConstraints: "Genou droit" } })).toBe(
      false,
    );
    expect(ok("disponibilites", { athleteId, changes: {} })).toBe(false);
    expect(
      ok("ajouter_objectif", {
        athleteId,
        objectif: { goalType: "run_10k", targetDate: "2027-04-11" },
      }),
    ).toBe(true);
    expect(ok("modifier_objectif", { athleteId, goalId: id, changes: { targetDate: null } })).toBe(
      true,
    );
    expect(ok("statut_objectif", { athleteId, goalId: id, statut: "principal" })).toBe(true);
    expect(ok("supprimer_objectif", { athleteId, goalId: id })).toBe(true);
    expect(
      ok("ajouter_repere", {
        athleteId,
        repere: { kind: "hr_max", bpm: "192", source: "test", measuredOn: "2026-11-10" },
      }),
    ).toBe(true);
    expect(
      ok("reperes_depuis_test", {
        athleteId,
        test: "cooper",
        distance: "3100",
        measuredOn: "2026-11-10",
      }),
    ).toBe(true);
    expect(ok("supprimer_repere", { athleteId, referenceId: id })).toBe(true);
    expect(
      ok("ajouter_record", {
        athleteId,
        record: { event: "run_10k", time: "42:30", achievedOn: "2026-10-04" },
      }),
    ).toBe(true);
    expect(ok("supprimer_record", { athleteId, recordId: id })).toBe(true);
    expect(ok("favori_exercice", { exerciseId: id, favori: true })).toBe(true);
    expect(ok("modifier_exercice", { exerciseId: id, changes: { name: "Squat goblet" } })).toBe(
      true,
    );
    expect(ok("supprimer_exercice", { exerciseId: id })).toBe(true);
    expect(ok("photo", { action: "mettre", athleteId })).toBe(true);
    expect(ok("photo", { action: "retirer" })).toBe(true);
    expect(ok("ajouter_note", { athleteId, texte: "Préfère courir le matin" })).toBe(true);
    expect(ok("ajouter_note", { athleteId, texte: "" })).toBe(false);
  });
});

describe("Task 1 : la note s'ajoute, jamais n'écrase", () => {
  it("datée, sous l'ancienne note", () => {
    expect(appendNote(null, "Préfère le matin", "2026-11-14")).toBe(
      "14/11/2026 : Préfère le matin",
    );
    expect(appendNote("Ancienne note", "Préfère le matin", "2026-11-14")).toBe(
      "Ancienne note\n\n14/11/2026 : Préfère le matin",
    );
  });

  it("la carte ne montre que le texte ajouté", () => {
    const result = card(
      "ajouter_note",
      { athleteId, texte: "Préfère le matin" },
      { sportif: "Léa Test" },
    );
    expect(result.title).toBe("Ajouter à la note privée");
    expect(result.summary).toEqual([
      "Léa Test",
      "« Préfère le matin »",
      "S'ajoute sous la note existante, datée du jour",
    ]);
  });
});

describe("Task 1 : disponibilités, sans jamais toucher aux blessures", () => {
  const current = {
    sessionsPerWeek: 2,
    maxSessionMinutes: 60,
    availableDays: ["mon", "thu"] as ("mon" | "thu")[],
    scheduleConstraints: null,
    healthConstraints: "Genou droit fragile",
  };

  it("la fusion garde la blessure telle quelle", () => {
    expect(mergeAvailability(current, { sessionsPerWeek: 3, maxSessionMinutes: null })).toEqual({
      sessionsPerWeek: "3",
      maxSessionMinutes: "",
      availableDays: ["mon", "thu"],
      scheduleConstraints: "",
      healthConstraints: "Genou droit fragile",
    });
  });

  it("la carte : ancien → nouveau, jours en toutes lettres", () => {
    const result = card(
      "disponibilites",
      { athleteId, changes: { sessionsPerWeek: 3, availableDays: ["mon", "wed", "fri"] } },
      { sportif: "Léa Test", "avant:sessionsPerWeek": "2", "avant:availableDays": "lundi, jeudi" },
    );
    expect(result.title).toBe("Disponibilités");
    expect(result.summary).toEqual([
      "Léa Test",
      "Séances par semaine : 2 → 3",
      "Jours : lundi, jeudi → lundi, mercredi, vendredi",
    ]);
  });

  it("voir_fiche donne discipline et disponibilités, rien sur la santé", () => {
    const sheet = shapeAthleteSheet({
      id: athleteId,
      firstName: "Léa",
      lastName: "Test",
      sex: "female",
      email: null,
      phone: null,
      preferredContact: null,
      level: null,
      experience: null,
      trainingPlaces: [],
      equipment: null,
      addressLine: null,
      postalCode: null,
      city: null,
      country: null,
      status: "active",
      hasAccount: false,
      programType: "running",
      ...current,
    } as never);
    expect(sheet).toMatchObject({
      discipline: "running",
      disponibilites: { seances_par_semaine: 2, duree_max_min: 60, jours: ["mon", "thu"] },
    });
    expect(JSON.stringify(sheet)).not.toMatch(/sant|bless|Genou/i);
  });
});

describe("Task 1 : statut, objectifs, exercices, photos", () => {
  it("archiver : la phrase de l'interface", () => {
    const result = card(
      "statut_sportif",
      { athleteId, statut: "archived" },
      { sportif: "Léa Test", "avant:statut": "Actif" },
    );
    expect(result.title).toBe("Statut du sportif");
    expect(result.summary).toEqual([
      "Léa Test",
      "Statut : Actif → Archivé",
      "Il quitte la liste active sans rien effacer ; tu peux le restaurer à tout moment",
    ]);
  });

  it("modifier un objectif : la fenêtre « Modifier l'objectif », puis les changements", () => {
    const goal = {
      id,
      type: "run_10k" as const,
      description: null,
      targetDate: "2027-04-11",
      targetTimeSeconds: 2700,
      priority: "main" as const,
      status: "active" as const,
      competitionName: "10 km de Bruxelles",
      competitionLocation: null,
      hyroxCategory: null,
    };
    expect(goalFormValues(goal)).toMatchObject({
      goalType: "run_10k",
      targetTime: "45:00",
      isCompetition: true,
      competitionName: "10 km de Bruxelles",
    });
    expect(
      mergeGoal(goalFormValues(goal), { targetDate: null, targetTime: "44:00" }),
    ).toMatchObject({
      targetDate: "",
      targetTime: "44:00",
      competitionName: "10 km de Bruxelles",
    });
    expect(goalStatusRefusal(goal, "principal")).toContain("déjà");
    expect(goalStatusRefusal({ ...goal, priority: "secondary" }, "principal")).toBeNull();
    expect(goalStatusRefusal({ ...goal, status: "achieved" }, "atteint")).toContain("déjà");
  });

  it("un exercice Coory se met en favori, mais ne se modifie ni ne se supprime", () => {
    expect(coachExerciseRefusal(null)).toContain("introuvable");
    expect(coachExerciseRefusal({ organizationId: null })).toContain("Coory");
    expect(
      coachExerciseRefusal({ organizationId: "0b000000-0000-4000-8000-0000000000b1" }),
    ).toBeNull();
  });

  it("photo : une image jointe de 2 Mo au plus ; retirer seulement une photo qui existe", () => {
    const image = { name: "lea.jpg", type: "image/jpeg", size: 300_000 };
    expect(photoRefusal("mettre", image, false)).toBeNull();
    expect(photoRefusal("mettre", undefined, false)).toContain("Joindre");
    expect(photoRefusal("mettre", { ...image, type: "application/pdf" }, false)).toContain("image");
    // Relecture n°2 : réduite dans le navigateur avant l'envoi, comme l'onglet Profil.
    expect(photoRefusal("mettre", { ...image, size: 3_000_000 }, false)).toBeNull();
    expect(photoRefusal("mettre", { ...image, size: 5_000_000 }, false)).toContain("4 Mo");
    expect(photoRefusal("retirer", undefined, false)).toContain("pas de photo");
    expect(photoRefusal("retirer", undefined, true)).toBeNull();
  });
});

describe("Task 2 : voir_objectifs et voir_reperes", () => {
  it("les objectifs en cours puis passés, en clair", () => {
    const goal = {
      id,
      type: "run_10k" as const,
      description: null,
      targetDate: "2027-04-11",
      targetTimeSeconds: 2700,
      priority: "main" as const,
      status: "active" as const,
      competitionName: null,
      competitionLocation: null,
      hyroxCategory: null,
    };
    expect(
      shapeGoals({ current: [goal], past: [{ ...goal, id: "g2", status: "achieved" }] }),
    ).toEqual([
      {
        id,
        objectif: "Course 10 km",
        date: "2027-04-11",
        temps_vise: "45:00",
        priorite: "principal",
        statut: "En cours",
        competition: null,
      },
      {
        id: "g2",
        objectif: "Course 10 km",
        date: "2027-04-11",
        temps_vise: "45:00",
        priorite: "principal",
        statut: "Atteint",
        competition: null,
      },
    ]);
  });

  it("les repères (toutes les mesures) et les records", () => {
    const reference = {
      id: "r1",
      kind: "hr_max" as const,
      paceMin: null,
      paceMax: null,
      bpm: 192,
      exercise: null,
      loadKg: null,
      reps: null,
      source: "test" as const,
      measuredOn: "2026-11-10",
      note: null,
    };
    const record = {
      id: "p1",
      event: "run_10k" as const,
      hyroxCategory: null,
      timeSeconds: 2550,
      achievedOn: "2026-10-04",
      raceName: null,
      createdAt: "",
    };
    expect(
      shapeReferences(
        { current: [reference], history: [reference] },
        { best: [record], history: [record] },
      ),
    ).toEqual({
      reperes: [{ id: "r1", repere: "FC max", valeur: "192 bpm", mesure_le: "2026-11-10" }],
      records: [{ id: "p1", epreuve: "10 km", temps: "42:30", le: "2026-10-04" }],
    });
  });
});

// --- Relecture indépendante du lot 5 -------------------------------------------------------------
describe("relecture n°1 : la consigne ne contredit plus « ajouter_note »", () => {
  it("une note privée s'ajoute par ajouter_note, jamais de santé dedans", () => {
    const prompt = systemPrompt("Gianluca", "2026-11-14");
    expect(prompt).not.toContain("ni de note privée");
    expect(prompt).toContain("une note privée seulement avec ajouter_note");
  });
});

describe("relecture n°3 : une compétition nommée est une compétition", () => {
  it("donner son nom suffit, comme cocher « Compétition »", () => {
    const empty = {
      goalType: "",
      priority: "",
      targetDate: "",
      targetTime: "",
      isCompetition: false,
      competitionName: "",
      competitionLocation: "",
      hyroxCategory: "",
      description: "",
    };
    expect(
      mergeGoal(empty, { goalType: "run_half", competitionName: "Semi de Bruxelles" })
        .isCompetition,
    ).toBe(true);
    expect(mergeGoal(empty, { goalType: "run_half" }).isCompetition).toBe(false);
  });
});

describe("relecture n°4 : une note illisible n'est jamais écrasée", () => {
  it("relecture en échec : refus ; sinon le texte s'ajoute sous l'ancienne note", () => {
    expect(
      appendToReadNote({ data: null, error: { message: "boom" } }, "Texte", "2026-11-14"),
    ).toEqual({
      ok: false,
      error: "La note privée n'a pas pu être relue : rien n'a été modifié. Réessaie.",
    });
    expect(
      appendToReadNote({ data: { body: "Ancienne" }, error: null }, "Texte", "2026-11-14"),
    ).toEqual({ ok: true, body: "Ancienne\n\n14/11/2026 : Texte" });
    expect(appendToReadNote({ data: null, error: null }, "Texte", "2026-11-14")).toEqual({
      ok: true,
      body: "14/11/2026 : Texte",
    });
  });
});

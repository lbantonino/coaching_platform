import { describe, expect, it } from "vitest";

import { programDraftSchema } from "@/domain/training/program-plan";
import { pickCurrentProgram, programListStatus } from "@/domain/training/program-status";
import { adaptSession, draftFromPublication, resizePlan } from "@/domain/training/program-upgrade";

import { draft, runningSession } from "./fixtures/program-v2";

const COACH = "ca000000-0000-4000-8000-000000000206";

const v1Session = (
  title: string,
  discipline: "running" | "strength" | "hybrid",
  withCoach = false,
) => ({
  title,
  discipline,
  sessionType: "Force",
  durationMinutes: 60,
  steps: [{ title: "Bloc", badge: "45 min", lines: ["A1 Back squat · 4 × 6"] }],
  ...(withCoach ? { withCoach: { sessionId: COACH } } : {}),
});

describe("draftFromPublication (programme publié avant l'éditeur)", () => {
  const source = {
    program: {
      title: "Prépa · bloc 1",
      goal: "Hyrox Bruxelles · Pro",
      discipline: null,
      startDate: "2026-10-26",
      weeksCount: 3,
    },
    snapshot: {
      title: "Prépa · bloc 1",
      weeks: [
        { index: 1, label: "Préparation" },
        { index: 2, label: "Préparation" },
        { index: 3, label: "Allègement" },
      ],
    },
    sessions: [
      { key: "s1-1", weekIndex: 1, slotIndex: 1, json: v1Session("Renfo", "strength", true) },
      { key: "s1-2", weekIndex: 1, slotIndex: 2, json: v1Session("Course", "running") },
      { key: "s2-1", weekIndex: 2, slotIndex: 1, json: v1Session("Renfo", "strength", true) },
      { key: "s3-1", weekIndex: 3, slotIndex: 1, json: v1Session("Mixte", "hybrid") },
    ],
    // Le coaching du mardi 7 h (récurrent depuis le 20 octobre).
    coachSessions: [{ id: COACH, startsOn: "2026-10-20", startTime: "07:00:00" }],
  };

  it("reprend toutes les séances, sans perte, dans un brouillon valide", () => {
    const result = draftFromPublication(source);
    expect(result).not.toBeNull();
    expect(programDraftSchema.safeParse(result).success).toBe(true);
    expect(result?.weeks.map((week) => week.sessions.map((s) => s.key))).toEqual([
      ["s1-1", "s1-2"],
      ["s2-1"],
      ["s3-1"],
    ]);
    expect(result?.weeks[0]?.sessions[0]?.content).toMatchObject({
      discipline: "strength",
      items: [{ kind: "text", title: "Bloc", badge: "45 min", lines: ["A1 Back squat · 4 × 6"] }],
    });
  });
  it("tire les phases des étiquettes de semaine, la discipline et les façons de viser d'avant", () => {
    const result = draftFromPublication(source);
    expect(result?.phases).toEqual([
      { id: "p1", name: "Préparation", weekFrom: 1, weekTo: 2 },
      { id: "p2", name: "Allègement", weekFrom: 3, weekTo: 3 },
    ]);
    expect(result?.discipline).toBe("strength");
    expect(result?.aimDefaults).toEqual({ running: "pace", strength: "kg" });
    expect(result?.goal).toEqual({ note: "Hyrox Bruxelles · Pro" });
    expect(result?.sessionsPerWeek).toBe(2);
  });
  it("date la séance avec le coach au rendez-vous de SA semaine", () => {
    const result = draftFromPublication(source);
    expect(result?.weeks[0]?.sessions[0]?.withCoach).toEqual({
      coachSessionId: COACH,
      date: "2026-10-27",
      time: "07:00",
    });
    expect(result?.weeks[1]?.sessions[0]?.withCoach?.date).toBe("2026-11-03");
  });
  it("renvoie null plutôt que de perdre une séance illisible", () => {
    expect(
      draftFromPublication({
        ...source,
        sessions: [{ key: "x", weekIndex: 1, slotIndex: 1, json: { title: "?" } }],
      }),
    ).toBeNull();
  });
});

describe("resizePlan et adaptSession (copier un modèle pour un sportif)", () => {
  it("ajoute des semaines vides ou retire celles en trop, et coupe les phases", () => {
    const longer = resizePlan(draft(), 5, { vmaKmh: null, hrMax: null });
    expect(longer.weeks.map((week) => week.sessions.length)).toEqual([2, 1, 0, 0, 0]);
    const shorter = resizePlan(draft(), 2, { vmaKmh: null, hrMax: null });
    expect(shorter.weeks).toHaveLength(2);
    expect(shorter.phases).toEqual([{ id: "p1", name: "Base", weekFrom: 1, weekTo: 2 }]);
  });
  it("recalcule l'allure depuis la VMA du sportif et la plage de FC depuis sa FC max ; retire le rendez-vous", () => {
    const template = runningSession({ withCoach: { coachSessionId: COACH, date: "2026-10-27" } });
    const first = template.content.discipline === "running" ? template.content.items[0] : undefined;
    if (first?.kind === "step")
      first.target = {
        kind: "pace",
        fromSecPerKm: 300,
        toSecPerKm: 300,
        vmaPercent: { from: 95, to: 95 },
      };
    const adapted = adaptSession(template, { vmaKmh: 16, hrMax: 192 });
    expect(adapted.withCoach).toBeUndefined();
    const items = adapted.content.discipline === "running" ? adapted.content.items : [];
    expect(items[0]?.kind === "step" ? items[0].target : null).toMatchObject({
      fromSecPerKm: 237,
      toSecPerKm: 237,
    });
    expect(items[2]?.kind === "step" ? items[2].target : null).toEqual({
      kind: "hr",
      zone: 2,
      bpmFrom: 129,
      bpmTo: 142,
    });
  });
});

describe("statut et programme à montrer (C-8)", () => {
  const program = { status: "published" as const, startDate: "2026-10-26", weeksCount: 12 };
  it("En cours, À venir, Terminé, Brouillon, Archivé", () => {
    expect(programListStatus(program, "2026-11-09")).toBe("current");
    expect(programListStatus(program, "2026-10-25")).toBe("upcoming");
    expect(programListStatus(program, "2027-01-18")).toBe("finished");
    expect(programListStatus({ ...program, status: "draft" }, "2026-11-09")).toBe("draft");
    expect(programListStatus({ ...program, status: "archived" }, "2026-11-09")).toBe("archived");
  });
  it("montre celui en cours, sinon le prochain, sinon le dernier terminé", () => {
    const current = { id: "a", startDate: "2026-10-26", weeksCount: 12 };
    const next = { id: "b", startDate: "2027-01-18", weeksCount: 8 };
    expect(pickCurrentProgram([next, current], "2026-11-09")?.id).toBe("a");
    expect(pickCurrentProgram([next], "2026-11-09")?.id).toBe("b");
    expect(pickCurrentProgram([current], "2027-06-01")?.id).toBe("a");
    expect(pickCurrentProgram([], "2026-11-09")).toBeNull();
  });
});

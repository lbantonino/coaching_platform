import { describe, expect, it } from "vitest";

import { inTab } from "@/domain/tasks/buckets";

const TODAY = "2026-10-23";

describe("onglets de la page Tâches", () => {
  it("met dans « Aujourd'hui » les tâches dues aujourd'hui ou en retard", () => {
    expect(inTab({ dueOn: TODAY, done: false }, "aujourdhui", TODAY)).toBe(true);
    expect(inTab({ dueOn: "2026-10-20", done: false }, "aujourdhui", TODAY)).toBe(true);
    expect(inTab({ dueOn: "2026-10-24", done: false }, "aujourdhui", TODAY)).toBe(false);
  });
  it("met dans « À venir » les tâches plus tardives ou sans échéance", () => {
    expect(inTab({ dueOn: "2026-10-24", done: false }, "avenir", TODAY)).toBe(true);
    expect(inTab({ dueOn: null, done: false }, "avenir", TODAY)).toBe(true);
    expect(inTab({ dueOn: TODAY, done: false }, "avenir", TODAY)).toBe(false);
  });
  it("sépare les tâches terminées, toutes visibles dans « Toutes »", () => {
    const done = { dueOn: TODAY, done: true };
    expect(inTab(done, "terminees", TODAY)).toBe(true);
    expect(inTab(done, "aujourdhui", TODAY)).toBe(false);
    expect(inTab(done, "toutes", TODAY)).toBe(true);
  });
});

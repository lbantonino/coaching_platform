import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { programDraftSchema } from "@/domain/training/program-plan";

// Compte de démonstration (OPEN-24) : le programme de la démo est écrit dans la migration
// (private.demo_program_plan) ; il doit s'ouvrir dans l'éditeur comme n'importe quel brouillon.
const migration = readFileSync("supabase/migrations/20261114150000_compte_demo.sql", "utf8");
const plan = JSON.parse(migration.split("$plan$")[1]) as Record<string, unknown>;

describe("programme de la démo", () => {
  it("est un brouillon valide pour l'éditeur, une fois sa date de début posée", () => {
    const draft = programDraftSchema.safeParse({ ...plan, startDate: "2026-11-23" });
    expect(draft.success).toBe(true);
  });

  it("dure 4 semaines, avec ses deux phases", () => {
    expect(plan.title).toBe("Objectif 10 km · 4 semaines");
    expect((plan.weeks as unknown[]).length).toBe(4);
    expect((plan.phases as { name: string }[]).map((phase) => phase.name)).toEqual([
      "Base",
      "Développement",
    ]);
  });
});

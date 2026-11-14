import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { programDraftSchema, programPlanSchema } from "@/domain/training/program-plan";
import { resizePlan } from "@/domain/training/program-upgrade";
import type { RunStep, SessionDraft } from "@/domain/training/session-v2";

import {
  GENERATED_TEMPLATES,
  SECTION_END,
  SECTION_START,
  generatedSection,
} from "../../scripts/modeles-coory/modeles";

// Les 7 modèles Coory générés (D-177, liste validée par Antonino le 14/11/2026). Ce test les valide
// avec les règles de l'app, et vérifie que leur partie de supabase/content/modeles_coory.sql est à
// jour. Après une modification de scripts/modeles-coory/ : « npm run content:modeles » la réécrit.

const root = path.resolve(import.meta.dirname, "../..");
const sqlPath = path.join(root, "supabase/content/modeles_coory.sql");
// Le catalogue commun : une ligne JSON par exercice dans sa migration.
const catalog = new Map(
  readFileSync(
    path.join(root, "supabase/migrations/20261030100100_catalogue_exercices.sql"),
    "utf8",
  )
    .split("\n")
    .filter((line) => line.startsWith('{"id":'))
    .map(
      (line) =>
        JSON.parse(line.replace(/,$/, "")) as { id: string; name_fr: string; visibility: string },
    )
    .map((row) => [row.id, row]),
);

const sessions = (template: (typeof GENERATED_TEMPLATES)[number]) =>
  template.plan.weeks.flatMap((week) => week.sessions);
const runSteps = (session: SessionDraft): RunStep[] =>
  session.content.discipline === "running"
    ? session.content.items.flatMap((item) =>
        item.kind === "step" ? [item] : item.kind === "repeat" ? item.steps : [],
      )
    : [];
const weekMinutes = (template: (typeof GENERATED_TEMPLATES)[number], index: number) =>
  template.plan.weeks[index]?.sessions.reduce((sum, s) => sum + s.durationMinutes, 0) ?? 0;

describe("modèles Coory générés", () => {
  it("sont les 7 modèles de la liste validée, dans l'ordre", () => {
    expect(
      GENERATED_TEMPLATES.map(({ plan }) => [
        plan.title,
        plan.discipline,
        plan.weeks.length,
        plan.sessionsPerWeek,
      ]),
    ).toEqual([
      ["Réussir son 5 km", "running", 6, 3],
      ["Améliorer son seuil", "running", 6, 3],
      ["Améliorer sa vitesse (VMA)", "running", 6, 3],
      ["Développer sa force", "strength", 8, 3],
      ["Renforcement musculaire et hypertrophie", "strength", 8, 4],
      ["Hybride : 2 running + 2 musculation", "hybrid", 8, 4],
      ["Hybride : 3 running + 2 musculation", "hybrid", 8, 5],
    ]);
    // Identifiants fixes : modèle n° 5 = …105 (…001 à …004 : les modèles écrits à la main).
    expect(GENERATED_TEMPLATES.map(({ id }) => id.slice(-3))).toEqual([
      "105",
      "106",
      "107",
      "108",
      "109",
      "110",
      "111",
    ]);
  });

  it("leurs identifiants ne servent pas déjà dans la graine (un modèle de coach y serait écrasé)", () => {
    const seed = readFileSync(path.join(root, "supabase/seed.sql"), "utf8");
    for (const { id, plan } of GENERATED_TEMPLATES)
      expect(seed.includes(id), plan.title).toBe(false);
  });

  it("chaque modèle est valide pour l'app, avec le bon nombre de séances chaque semaine", () => {
    for (const { plan } of GENERATED_TEMPLATES) {
      expect(programPlanSchema.safeParse(plan).error, plan.title).toBeUndefined();
      for (const week of plan.weeks) expect(week.sessions).toHaveLength(plan.sessionsPerWeek);
    }
  });

  it("chaque séance dure entre 15 min et 2 h 15, estimée d'après son contenu", () => {
    for (const template of GENERATED_TEMPLATES) {
      for (const s of sessions(template)) {
        expect(s.durationMinutes, `${template.plan.title} · ${s.key}`).toBeGreaterThanOrEqual(15);
        expect(s.durationMinutes, `${template.plan.title} · ${s.key}`).toBeLessThanOrEqual(135);
      }
    }
  });

  it("une semaine allégée est plus courte que la semaine qui la précède", () => {
    for (const template of GENERATED_TEMPLATES) {
      template.plan.weeks.forEach((week, i) => {
        if (week.light && i > 0)
          expect(weekMinutes(template, i), `${template.plan.title} · S${week.index}`).toBeLessThan(
            weekMinutes(template, i - 1),
          );
      });
    }
  });

  it("chaque allure est en % de VMA, pour être recalculée pour chaque sportif", () => {
    for (const template of GENERATED_TEMPLATES)
      for (const s of sessions(template))
        for (const step of runSteps(s))
          if (step.target?.kind === "pace") expect(step.target.vmaPercent, s.key).toBeDefined();
  });

  it("chaque exercice vient du catalogue commun", () => {
    for (const template of GENERATED_TEMPLATES)
      for (const s of sessions(template)) {
        if (s.content.discipline !== "strength") continue;
        const exercises = s.content.items.flatMap((item) =>
          item.kind === "exercise" ? [item] : item.kind === "superset" ? item.exercises : [],
        );
        for (const exercise of exercises)
          expect(catalog.get(exercise.exerciseId ?? ""), exercise.name).toMatchObject({
            name_fr: exercise.name,
            visibility: "active",
          });
      }
  });

  it("« Utiliser ce modèle » donne un brouillon valide, aux allures du sportif", () => {
    const aims = { vmaKmh: 13, hrMax: 186 };
    for (const { plan } of GENERATED_TEMPLATES) {
      const base = resizePlan(plan, plan.weeks.length, aims);
      const draft = programDraftSchema.safeParse({ ...plan, ...base, startDate: "2026-11-16" });
      expect(draft.error, plan.title).toBeUndefined();
    }
    // 5 km, semaine 1 : 95 % d'une VMA de 13 km/h = 4:51/km (au lieu de 4:00 pour 15,8 km/h).
    const fiveK = resizePlan(GENERATED_TEMPLATES[0]!.plan, 6, aims);
    const step = runSteps(fiveK.weeks[0]!.sessions[1]!).find((s) => s.target?.kind === "pace");
    expect(step?.target).toMatchObject({ fromSecPerKm: 291, toSecPerKm: 291 });
  });

  it("leur partie de modeles_coory.sql est à jour (sinon : npm run content:modeles)", () => {
    const sql = readFileSync(sqlPath, "utf8");
    const start = sql.indexOf(SECTION_START);
    const end = sql.indexOf(SECTION_END);
    const expected = generatedSection();
    if (process.env.ECRIRE_MODELES === "1") {
      const next =
        start >= 0 && end > start
          ? sql.slice(0, start) + expected + sql.slice(end + SECTION_END.length)
          : `${sql.trimEnd()}\n\n${expected}\n`;
      writeFileSync(sqlPath, next);
      return;
    }
    expect(start, "partie générée absente de modeles_coory.sql").toBeGreaterThanOrEqual(0);
    expect(sql.slice(start, end + SECTION_END.length)).toBe(expected);
  });
});

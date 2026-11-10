import { describe, expect, it } from "vitest";

import {
  fichesPdf,
  loadText,
  paceRows,
  paginate,
  sectionHeight,
  weeksText,
  type FichePage,
  type FicheSection,
} from "@/domain/training/pdf-fiches";

import { demoProgram, hyrox, running, strength } from "./pdf-fixtures";

// PDF 2 « Fiches et repères » (phase 5) : fiches de musculation (charges semaine par semaine),
// workload Hyrox, allures.
const fiches = (pages: ReturnType<typeof fichesPdf>["pages"]) =>
  pages.filter((page): page is FichePage => page.kind === "fiche");

describe("PDF Fiches et repères", () => {
  it("les semaines d'une fiche se disent simplement", () => {
    expect(weeksText([1, 2, 3, 4], 4)).toBe("Toutes les semaines");
    expect(weeksText([1, 3, 5], 6)).toBe("Semaines impaires");
    expect(weeksText([2, 4, 6], 6)).toBe("Semaines paires");
    expect(weeksText([2, 3, 4], 8)).toBe("Semaines 2 à 4");
    expect(weeksText([11], 12)).toBe("Semaine 11");
    expect(weeksText([1, 5, 9], 12)).toBe("Semaines 1, 5, 9");
  });

  it("sommaire : une fiche par séance (musculation, Hyrox), puis les allures", () => {
    const pdf = fichesPdf(demoProgram(6));
    const toc = pdf.pages[0]!;
    if (toc.kind !== "toc") throw new Error("sommaire attendu");
    expect(toc.rows.map((row) => [row.title, row.tone])).toEqual([
      ["Force bas du corps", "strength"],
      ["Circuit stations", "hyrox"],
      ["Allures", "paces"],
    ]);
    expect(toc.rows[0]!.subtitle).toBe("Musculation · toutes les semaines · 5 exercices");
    expect(toc.rows.every((row) => row.page > 1)).toBe(true);
  });

  it("fiche de musculation : tableau (A1/A2, repos après le dernier, EMOM) et charges par semaine", () => {
    const [page] = fiches(fichesPdf(demoProgram(6)).pages);
    expect(page).toMatchObject({
      kicker: "Musculation · Force",
      title: "Force bas du corps",
      subtitle: "Toutes les semaines · ≈ 60 min · mercredi",
    });
    const table = page!.sections.find((section) => section.kind === "table");
    if (table?.kind !== "table") throw new Error("tableau attendu");
    expect(table.rows[0]).toEqual({
      kind: "exercise",
      tag: null,
      name: "Back squat",
      sets: "4",
      reps: "6",
      rest: "2:30",
      comment: "RIR 2",
    });
    expect(table.rows[2]).toMatchObject({ tag: "A1", sets: "3", rest: "—" });
    expect(table.rows[3]).toMatchObject({ tag: "A2", rest: "1:30" });
    expect(table.rows[4]).toEqual({
      kind: "span",
      tag: null,
      name: "Kettlebell swing",
      text: "EMOM 10 min · 15 répét. · 20 s de travail · 40 s de repos",
    });
    const sections = fiches(fichesPdf(demoProgram(6)).pages)
      .filter((p) => p.tone === "strength")
      .flatMap((p) => p.sections);
    const charges = sections.filter((section) => section.kind === "charges");
    const rows = charges.flatMap((section) => (section.kind === "charges" ? section.rows : []));
    expect(charges[0]).toMatchObject({
      columns: ["Back squat", "SDT roumain", "Fentes marchées", "Hip thrust barre", "KB swing"],
    });
    expect(rows[0]).toEqual({
      week: "Semaine 1 · 11 nov.",
      cells: ["40 kg", "35 kg", "8 kg", "40 kg", "16 kg"],
    });
    // Semaine allégée : le schéma qui change s'écrit devant la charge.
    expect(rows[3]!.cells[0]).toBe("3 × 6 · 47,5 kg");
    const tip = sections.find((section) => section.kind === "tip");
    expect(tip).toMatchObject({ label: "Conseil" });
  });

  it("workload Hyrox : une carte par semaine, blocs numérotés, cette semaine en avant", () => {
    const pages = fiches(fichesPdf(demoProgram(6)).pages).filter((p) => p.tone === "hyrox");
    expect(pages[0]).toMatchObject({
      kicker: "Hyrox · Circuit",
      subtitle: "La séance du mardi évolue chaque semaine · ≈ 43 min",
    });
    const cards = pages.flatMap((p) => p.sections);
    expect(cards).toHaveLength(6);
    expect(cards[0]).toMatchObject({ week: "Semaine 1", current: true, tag: "cette semaine" });
    expect(cards[1]).toMatchObject({ tag: "à venir" });
    if (cards[0]!.kind !== "workload") throw new Error("workload attendu");
    expect(cards[0]!.blocks.map((block) => block.title)).toEqual(["Échauffement", "3 tours"]);
    expect(cards[0]!.blocks[1]!.lines).toContain("BBJ 40 m");
  });

  it("allures : course de la plus lente à la plus rapide, puis les ergomètres", () => {
    expect(paceRows([hyrox(3), running(50)])).toEqual([
      { label: "Run Hyrox", pace: "6:00", speed: "10 km/h", usedFor: "Circuit stations" },
      { label: "Run Hyrox", pace: "5:30", speed: "10,9 km/h", usedFor: "Circuit stations" },
      { label: "Course", pace: "4:30 – 4:40", speed: "12,9 – 13,3 km/h", usedFor: "Fractionné" },
      { label: "SkiErg", pace: "2:10 /500 m", speed: "—", usedFor: "Circuit stations" },
    ]);
  });

  it("charge d'un exercice : kg, plage, % sans max, rien", () => {
    const content = strength(40).content;
    if (content.discipline !== "strength" || content.items[0]?.kind !== "exercise")
      throw new Error();
    const squat = content.items[0];
    expect(loadText(squat)).toBe("40 kg");
    expect(loadText({ ...squat, sets: [squat.sets[0]!, { ...squat.sets[0]!, kg: 45 }] })).toBe(
      "40-45 kg",
    );
    expect(
      loadText({ ...squat, loadMode: "pct", sets: [{ type: "normal", repsMin: 5, pct: 75 }] }),
    ).toBe("75 %");
    expect(loadText({ ...squat, sets: [{ type: "normal", repsMin: 10 }] })).toBe("—");
  });

  it("une fiche trop longue continue sur la page suivante, « (suite) », jamais au-delà d'une page", () => {
    const long: FicheSection = {
      kind: "charges",
      title: "Charges semaine par semaine",
      columns: ["Back squat"],
      rows: Array.from({ length: 40 }, (_, i) => ({ week: `Semaine ${i + 1}`, cells: ["40 kg"] })),
    };
    const pages = paginate([{ kind: "text", label: "Échauffement", text: "Mobilité" }, long]);
    expect(pages.length).toBeGreaterThan(1);
    for (const page of pages) {
      const height = page.reduce((sum, section) => sum + sectionHeight(section), 0);
      expect(height + 12 * (page.length - 1)).toBeLessThanOrEqual(600);
    }
    const rows = pages
      .flat()
      .flatMap((section) => (section.kind === "charges" ? section.rows : []));
    expect(rows).toHaveLength(40);
    const pdf = fichesPdf(demoProgram(12));
    expect(pdf.pages.some((page) => page.kind === "fiche" && page.title.endsWith("(suite)"))).toBe(
      true,
    );
  });
});

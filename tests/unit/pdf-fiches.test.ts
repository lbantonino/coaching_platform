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

  it("fiche de musculation : tableau (charge, sans RIR), superset et EMOM en cadres, charges par semaine", () => {
    const [page] = fiches(fichesPdf(demoProgram(6)).pages);
    expect(page).toMatchObject({
      kicker: "Musculation · Force",
      title: "Force bas du corps",
      subtitle: "Toutes les semaines · ≈ 60 min · mercredi",
    });
    // Décisions d'Antonino du 16/11 : plus de RIR, une colonne Charge, le superset et l'EMOM dans un
    // cadre comme leur carte dans l'app, à leur place dans la séance.
    const shown = page!.sections.filter(
      (section) => section.kind === "table" || section.kind === "group",
    );
    expect(shown.map((section) => section.kind)).toEqual(["table", "group", "group"]);
    const table = shown[0];
    if (table?.kind !== "table") throw new Error("tableau attendu");
    expect(table.rows).toHaveLength(2);
    expect(table.rows[0]).toEqual({
      kind: "exercise",
      name: "Back squat",
      sets: "4",
      reps: "6",
      load: "40 kg",
      rest: "2:30",
      comment: "—",
    });
    const [superset, emom] = shown.slice(1);
    if (superset?.kind !== "group" || emom?.kind !== "group") throw new Error("cadres attendus");
    expect(superset).toMatchObject({
      title: "Superset",
      aside: "3 tours",
      footer: "Repos 1:30 après chaque tour",
    });
    expect(superset.rows.map((row) => [row.tag, row.name, row.load])).toEqual([
      ["A1", "Fentes marchées", "8 kg"],
      ["A2", "Hip thrust barre", "40 kg"],
    ]);
    expect(emom).toMatchObject({
      title: "EMOM",
      aside: "10 min",
      footer: "Chaque minute : 20 s de travail, puis repos",
    });
    // Dans un cadre, pas d'en-tête de colonnes : l'unité est écrite (« 15 répét. », 16/11).
    expect(emom.rows).toEqual([
      { tag: null, name: "Kettlebell swing", reps: "15 répét.", load: "16 kg", comment: "—" },
    ]);
    expect(superset.rows.map((row) => row.reps)).toEqual(["10 répét.", "12 répét."]);
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
    // Le conseil du coach reste ; l'explication « A1 + A2 = superset » n'a plus lieu d'être.
    const tip = sections.find((section) => section.kind === "tip");
    expect(tip).toEqual({ kind: "tip", label: "Conseil", text: "Garde 2 répétitions en réserve." });
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
      { label: "Run Hyrox", pace: "6:00 /km", speed: "10 km/h", usedFor: "Circuit stations" },
      { label: "Run Hyrox", pace: "5:30 /km", speed: "10,9 km/h", usedFor: "Circuit stations" },
      {
        label: "Course",
        pace: "4:30 – 4:40 /km",
        speed: "12,9 – 13,3 km/h",
        usedFor: "Fractionné",
      },
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
    ).toBe("75 % du max");
    expect(loadText({ ...squat, sets: [{ type: "normal", repsMin: 10 }] })).toBe("—");
    // Relecture du 16/11 : une montée en % s'écrit en plage, comme les kg ; version courte pour le
    // tableau des charges (sa mention « % du max » est dans le titre).
    const climb = {
      ...squat,
      loadMode: "pct" as const,
      sets: [70, 75, 80].map((pct) => ({ type: "normal" as const, repsMin: 5, pct })),
    };
    expect(loadText(climb)).toBe("70-80 % du max");
    expect(loadText(climb, { short: true })).toBe("70-80 %");
  });

  it("superset en premier, d'un seul tour, deux supersets : chacun son cadre, à sa place", () => {
    const program = demoProgram(1);
    const published = program.weeks[0]!.sessions[1]!.published!;
    if (published.content.discipline !== "strength") throw new Error("musculation attendue");
    const [squat, , superset] = published.content.items;
    if (superset?.kind !== "superset" || !squat) throw new Error("superset attendu");
    published.content.items = [
      { ...superset, id: "a", rounds: 1 },
      squat,
      { ...superset, id: "b", restSec: 45 },
    ];
    const page = fiches(fichesPdf(program).pages).find((p) => p.tone === "strength");
    const shown = (page?.sections ?? []).filter(
      (section) => section.kind === "table" || section.kind === "group",
    );
    expect(
      shown.map((section) =>
        section.kind === "group" ? `${section.title} · ${section.aside}` : section.kind,
      ),
    ).toEqual(["Superset · 1 tour", "table", "Superset · 3 tours"]);
    const last = shown[2];
    if (last?.kind !== "group") throw new Error("cadre attendu");
    expect(last.rows.map((row) => row.tag)).toEqual(["B1", "B2"]);
    // Écrit comme la carte de l'app (formatClock) : « Repos 0:45 », jamais « Repos 45 s » (relecture).
    expect(last.footer).toBe("Repos 0:45 après chaque tour");
  });

  it("un bloc texte répété garde ses lignes dans la fiche (« Gainage » : 4 tours…)", () => {
    const program = demoProgram(1);
    const published = program.weeks[0]!.sessions[1]!.published!;
    if (published.content.discipline !== "strength") throw new Error("musculation attendue");
    published.content.items = [
      {
        id: "gainage",
        kind: "text",
        title: "Gainage",
        lines: [],
        repeat: { times: 4, lines: ["Planche 45 s", "Dead bug 10"] },
      },
    ];
    const page = fiches(fichesPdf(program).pages).find((p) => p.tone === "strength");
    const table = page?.sections.find((section) => section.kind === "table");
    if (table?.kind !== "table") throw new Error("tableau attendu");
    expect(table.rows[0]).toEqual({
      kind: "span",
      name: "Gainage",
      text: "4 tours : Planche 45 s · Dead bug 10",
    });
  });

  it("charges en % du max : « 70 % » dans les cellules, « (en % du max) » dans le titre", () => {
    const program = demoProgram(2);
    for (const week of program.weeks) {
      const published = week.sessions[1]!.published!;
      if (published.content.discipline !== "strength") continue;
      published.content.items = [
        {
          id: "p1",
          kind: "exercise",
          name: "Back squat",
          loadMode: "pct",
          sets: [{ type: "normal", repsMin: 5, pct: 70 }],
          restSec: 120,
        },
      ];
    }
    const page = fiches(fichesPdf(program).pages).find((p) => p.tone === "strength");
    const charges = page?.sections.find((section) => section.kind === "charges");
    if (charges?.kind !== "charges") throw new Error("charges attendues");
    expect(charges.title).toBe("Charges semaine par semaine (en % du max)");
    expect(charges.rows[0]!.cells).toEqual(["70 %"]);
  });

  it("allures : l'unité est dans la colonne, plus de note « min/km » en bas", () => {
    const page = fiches(fichesPdf(demoProgram(6)).pages).find((p) => p.tone === "paces");
    expect(page?.sections.some((section) => section.kind === "tip")).toBe(false);
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

// D-180 : la discipline du programme dans l'en-tête des fiches.
describe("PDF Fiches : discipline du programme", () => {
  it("« Programme hybride · Fiches et repères », ou les textes d'avant sans discipline", () => {
    expect(fichesPdf(demoProgram(6)).headerSubtitle).toBe("Programme hybride · Fiches et repères");
    expect(fichesPdf({ ...demoProgram(6), discipline: null }).headerSubtitle).toBe(
      "Fiches et repères",
    );
  });
});

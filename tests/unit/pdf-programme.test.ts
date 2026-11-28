import { describe, expect, it } from "vitest";

import { type AgendaTocPage, type AgendaWeekPage } from "@/domain/training/pdf-agenda";
import { fichesPdf } from "@/domain/training/pdf-fiches";
import { programPdf } from "@/domain/training/pdf-programme";

import { card, demoProgram, programWithoutFiches, strength } from "./pdf-fixtures";

// Un seul PDF par programme (D-211, 27/11), puis un seul sommaire (demande d'Antonino du 28/11) :
// le sommaire liste les semaines puis les fiches ; les pages des fiches suivent la dernière semaine ;
// sur chaque page, ‹ › mène aux pages voisines et le bouton du milieu, « Sommaire », au sommaire.
const pagesOf = (model: ReturnType<typeof programPdf>) => [
  ...model.agenda.pages,
  ...(model.fiches?.pages ?? []),
];
const tocPages = (model: ReturnType<typeof programPdf>) =>
  model.agenda.pages.filter((page): page is AgendaTocPage => page.kind === "toc");

// Le programme d'Antonino du 28/11 : 10 semaines et 4 fiches (2 musculations, 1 Hyrox, les allures).
function tenWeeksFourFiches() {
  const program = demoProgram(10);
  const renfo = { ...strength(30, 3), title: "Renfo full body A", fixedDay: "sat" as const };
  for (const week of program.weeks) week.sessions.push(card(renfo));
  return program;
}

describe("PDF unique du programme : un seul sommaire", () => {
  it("le sommaire, les semaines, puis les fiches, numérotés de 1 à N sans trou", () => {
    const input = demoProgram(6);
    const model = programPdf(input);
    // Plus de page « sommaire des fiches » : une page de moins que l'agenda et les fiches d'avant.
    expect(model.totalPages).toBe(model.agenda.pages.length + fichesPdf(input).pages.length - 1);
    expect(pagesOf(model).map((page) => page.pageNumber)).toEqual(
      Array.from({ length: model.totalPages }, (_, i) => i + 1),
    );
    expect(model.fiches!.pages.every((page) => page.kind === "fiche")).toBe(true);
    expect(model.fiches!.pages[0]!.pageNumber).toBe(model.agenda.pages.at(-1)!.pageNumber + 1);
    expect(model.fileName).toBe("Programme - Prépa test - Anaïs Test - v1.pdf");
    expect(model.documentTitle).toBe("Prépa test · Anaïs Test · Programme");
  });

  it("le sommaire liste les semaines, puis « Fiches et repères » et chaque fiche à sa page", () => {
    const model = programPdf(demoProgram(6));
    const tocs = tocPages(model);
    expect(tocs).toHaveLength(1);
    const toc = tocs[0]!;
    expect(toc.rows.map((row) => row.title)).toEqual(
      Array.from({ length: 6 }, (_, i) => `Semaine ${i + 1}`),
    );
    expect(toc.fichesHeading).toBe("Fiches et repères");
    expect(toc.fiches.map((row) => [row.title, row.tone])).toEqual([
      ["Force bas du corps", "strength"],
      ["Circuit stations", "hyrox"],
      ["Allures", "paces"],
    ]);
    for (const row of toc.fiches) {
      const target = model.fiches!.pages.find((page) => page.anchor === row.anchor);
      expect(target?.pageNumber, row.title).toBe(row.page);
    }
    for (const row of toc.rows) {
      const target = model.agenda.pages.find((page) => page.anchor === row.anchor);
      expect(target?.pageNumber, row.title).toBe(row.page);
    }
  });

  it("une seule ancre par page, et plus de page « fiches » à part", () => {
    const model = programPdf(demoProgram(6));
    const anchors = pagesOf(model).map((page) => page.anchor);
    expect(new Set(anchors).size).toBe(anchors.length);
    expect(anchors).not.toContain("fiches");
    expect(anchors.filter((anchor) => anchor === "toc")).toHaveLength(1);
  });

  it("sur chaque page, le bouton du milieu dit « Sommaire » et mène à la première page du sommaire", () => {
    for (const weeks of [6, 20]) {
      const model = programPdf(demoProgram(weeks));
      for (const page of pagesOf(model))
        expect(page.nav.current, page.anchor).toEqual({ label: "Sommaire", anchor: "toc" });
    }
  });

  it("‹ › suit tout le fichier, de la dernière semaine à la première fiche, et retour", () => {
    const model = programPdf(demoProgram(6));
    const all = pagesOf(model);
    all.forEach((page, i) => {
      expect(page.nav.prev?.anchor ?? null, page.anchor).toBe(all[i - 1]?.anchor ?? null);
      expect(page.nav.next?.anchor ?? null, page.anchor).toBe(all[i + 1]?.anchor ?? null);
    });
    const lastWeek = model.agenda.pages.at(-1)!;
    const firstFiche = model.fiches!.pages[0]!;
    expect(lastWeek.nav.next).toEqual({ label: "Force bas du corps", anchor: firstFiche.anchor });
    expect(firstFiche.nav.prev).toEqual({ label: "Semaine 6", anchor: "week-6" });
  });

  it("une séance qui a sa fiche y renvoie : la musculation sans ses exercices, les runs détaillés", () => {
    const model = programPdf(demoProgram(6));
    const week = model.agenda.pages.find((page) => page.anchor === "week-1") as AgendaWeekPage;
    const [hyroxDay, strengthDay, runDay] = [week.days[1]!, week.days[2]!, week.days[3]!];
    const fichePage = (anchor: string) =>
      model.fiches!.pages.find((page) => page.anchor === anchor)!.pageNumber;

    const strengthCard = strengthDay.sessions[0]!;
    expect(strengthCard.lines).toEqual([]);
    expect(strengthCard.fiche).toEqual({
      summary: null,
      anchor: "sheet-force-bas-du-corps",
      page: fichePage("sheet-force-bas-du-corps"),
    });

    const hyroxCard = hyroxDay.sessions[0]!;
    expect(hyroxCard.fiche).toEqual({
      summary: "3 tours · 43 min",
      anchor: "sheet-circuit-stations",
      page: fichePage("sheet-circuit-stations"),
    });

    const runCard = runDay.sessions[0]!;
    expect(runCard.fiche).toBeNull();
    expect(runCard.lines.length).toBeGreaterThan(0);
  });

  it("10 semaines et 4 fiches : tout le sommaire tient sur une page", () => {
    const model = programPdf(tenWeeksFourFiches());
    const tocs = tocPages(model);
    expect(tocs).toHaveLength(1);
    expect(tocs[0]!.rows).toHaveLength(10);
    expect(tocs[0]!.fiches.map((row) => row.title)).toEqual([
      "Force bas du corps",
      "Renfo full body A",
      "Circuit stations",
      "Allures",
    ]);
  });

  it("un sommaire plus long continue sur une autre page, sans intertitre seul en bas", () => {
    for (const weeks of [12, 14, 24]) {
      const model = programPdf(demoProgram(weeks));
      const tocs = tocPages(model);
      expect(tocs.flatMap((toc) => toc.rows)).toHaveLength(weeks);
      expect(tocs.flatMap((toc) => toc.fiches)).toHaveLength(3);
      expect(tocs.filter((toc) => toc.fichesHeading !== null)).toHaveLength(1);
      for (const toc of tocs) if (toc.fichesHeading) expect(toc.fiches.length).toBeGreaterThan(0);
      // Chaque page du sommaire garde ses lignes, et la note n'est que sur la dernière.
      for (const toc of tocs.slice(0, -1)) expect(toc.note).toBeNull();
      expect(tocs.at(-1)!.note).not.toBeNull();
      expect(pagesOf(model).map((page) => page.pageNumber)).toEqual(
        Array.from({ length: model.totalPages }, (_, i) => i + 1),
      );
    }
  });

  it("sans fiche ni allure : l'agenda seul, sans intertitre ni fiche", () => {
    const model = programPdf(programWithoutFiches());
    expect(model.fiches).toBeNull();
    expect(model.totalPages).toBe(model.agenda.pages.length);
    for (const toc of tocPages(model)) {
      expect(toc.fichesHeading).toBeNull();
      expect(toc.fiches).toEqual([]);
    }
    expect(model.agenda.pages.at(-1)!.nav.next).toBeNull();
  });

  it("depuis une séance, la semaine garde son ancre (#nameddest=week-N)", () => {
    const model = programPdf(demoProgram(6));
    expect(model.agenda.pages.map((page) => page.anchor)).toContain("week-3");
  });
});

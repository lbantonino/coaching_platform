import { describe, expect, it } from "vitest";

import { agendaPdf, type AgendaTocPage } from "@/domain/training/pdf-agenda";
import { fichesPdf } from "@/domain/training/pdf-fiches";
import { programPdf } from "@/domain/training/pdf-programme";

import { demoProgram, programWithoutFiches } from "./pdf-fixtures";

// Un seul PDF par programme (D-211, demande d'Antonino du 27/11) : l'agenda, puis « Fiches et
// repères », dans un même fichier. Ancres uniques, pages numérotées d'un bout à l'autre, ‹ › qui passe
// d'une partie à l'autre.
const pagesOf = (model: ReturnType<typeof programPdf>) => [
  ...model.agenda.pages,
  ...(model.fiches?.pages ?? []),
];
const tocPages = (model: ReturnType<typeof programPdf>) =>
  model.agenda.pages.filter((page): page is AgendaTocPage => page.kind === "toc");

describe("PDF unique du programme", () => {
  it("l'agenda puis les fiches, numérotés de 1 à N sans trou", () => {
    const input = demoProgram(6);
    const model = programPdf(input);
    const agenda = agendaPdf(input);
    const fiches = fichesPdf(input);
    expect(model.totalPages).toBe(agenda.pages.length + fiches.pages.length);
    expect(pagesOf(model).map((page) => page.pageNumber)).toEqual(
      Array.from({ length: model.totalPages }, (_, i) => i + 1),
    );
    expect(model.fileName).toBe("Programme - Prépa test - Anaïs Test - v1.pdf");
    expect(model.documentTitle).toBe("Prépa test · Anaïs Test · Programme");
  });

  it("une seule ancre par page : le sommaire des fiches devient « fiches »", () => {
    const model = programPdf(demoProgram(6));
    const anchors = pagesOf(model).map((page) => page.anchor);
    expect(new Set(anchors).size).toBe(anchors.length);
    expect(anchors.filter((anchor) => anchor === "toc")).toHaveLength(1);
    expect(model.fiches!.pages[0]!.anchor).toBe("fiches");
    // Le bouton noir d'une fiche ramène au sommaire des fiches, pas à celui de l'agenda.
    for (const page of model.fiches!.pages) expect(page.nav.current.anchor).toBe("fiches");
  });

  it("le sommaire des fiches donne les pages du fichier complet", () => {
    const input = demoProgram(6);
    const model = programPdf(input);
    const offset = model.agenda.pages.length;
    const toc = model.fiches!.pages[0]!;
    if (toc.kind !== "toc") throw new Error("sommaire attendu");
    const before = fichesPdf(input).pages[0]!;
    if (before.kind !== "toc") throw new Error("sommaire attendu");
    expect(toc.rows.map((row) => row.page)).toEqual(before.rows.map((row) => row.page + offset));
    for (const row of toc.rows) {
      const target = model.fiches!.pages.find((page) => page.anchor === row.anchor);
      expect(target?.pageNumber).toBe(row.page);
    }
  });

  it("‹ › passe de la dernière semaine aux fiches, et revient", () => {
    const model = programPdf(demoProgram(6));
    const lastWeek = model.agenda.pages.at(-1)!;
    const fichesToc = model.fiches!.pages[0]!;
    expect(lastWeek.nav.next).toEqual({ label: "Fiches et repères", anchor: "fiches" });
    expect(fichesToc.nav.prev).toEqual({ label: "Semaine 6", anchor: "week-6" });
    expect(fichesToc.nav.current).toEqual({ label: "Fiches et repères", anchor: "fiches" });
    expect(fichesToc.bookmark).toBe("Fiches et repères");
    expect(model.fiches!.pages[1]!.nav.prev).toEqual({
      label: "Fiches et repères",
      anchor: "fiches",
    });
  });

  it("le sommaire de l'agenda mène aux fiches, sur sa dernière page seulement", () => {
    for (const weeks of [12, 14]) {
      const model = programPdf(demoProgram(weeks));
      const tocs = tocPages(model);
      const firstFiche = model.fiches!.pages[0]!.pageNumber;
      expect(tocs.at(-1)!.fichesLink).toEqual({
        label: "Fiches et repères",
        page: firstFiche,
        anchor: "fiches",
      });
      for (const toc of tocs.slice(0, -1)) expect(toc.fichesLink).toBeNull();
      // Plus de « PDF « Fiches et repères » » : les fiches sont dans ce fichier.
      expect(tocs.at(-1)!.note).not.toContain("PDF");
    }
  });

  it("sans fiche ni allure : l'agenda seul, sans lien vers des fiches absentes", () => {
    const model = programPdf(programWithoutFiches());
    expect(model.fiches).toBeNull();
    expect(model.totalPages).toBe(model.agenda.pages.length);
    expect(tocPages(model).every((toc) => toc.fichesLink === null)).toBe(true);
    expect(model.agenda.pages.at(-1)!.nav.next).toBeNull();
  });

  it("depuis une séance, la semaine garde son ancre (#nameddest=week-N)", () => {
    const model = programPdf(demoProgram(6));
    expect(model.agenda.pages.map((page) => page.anchor)).toContain("week-3");
  });
});

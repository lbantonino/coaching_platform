import { describe, expect, it } from "vitest";

import { programPdf } from "@/domain/training/pdf-programme";
import { renderProgramPdf } from "@/features/programs/pdf/program-pdf";

import { demoProgram, programWithoutFiches } from "./pdf-fixtures";

// Rendu RÉEL du PDF du programme par React-PDF (police intégrée) : un vrai fichier PDF, en A4, avec
// EXACTEMENT les pages prévues par le modèle (une estimation de hauteur trop courte ferait déborder
// une page et décalerait tous les numéros des sommaires), des liens internes et des signets. Depuis
// D-211 (27/11), un seul fichier : l'agenda, puis « Fiches et repères ».
const pagesOf = (pdf: Buffer) => {
  const raw = pdf.toString("latin1");
  return {
    count: (raw.match(/\/Type \/Page\b/g) ?? []).length,
    a4: [...raw.matchAll(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/g)].every(
      ([, w, h]) => Math.round(Number(w)) === 595 && Math.round(Number(h)) === 842,
    ),
    links: (raw.match(/\/Subtype \/Link/g) ?? []).length,
    outlines: raw.includes("/Outlines"),
  };
};

describe("rendu du PDF du programme", () => {
  it("un PDF A4 aux pages prévues : l'agenda puis les fiches, liens et signets", async () => {
    const model = programPdf(demoProgram(14));
    const pdf = await renderProgramPdf(model, "Coach Test");
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    const pages = pagesOf(pdf);
    expect(pages.count).toBe(model.totalPages);
    expect(pages.a4).toBe(true);
    expect(pages.outlines).toBe(true);
    expect(pages.links).toBeGreaterThan(model.totalPages);
    const raw = pdf.toString("latin1");
    for (const name of ["toc", "toc-2", "week-1", "week-14", "fiches"])
      expect(raw.includes(`(${name})`), name).toBe(true);
  }, 30_000);

  // La ligne « Fiches et repères » compte comme une ligne du sommaire (12 par page) : 12 semaines =
  // un sommaire plein, puis une deuxième page de sommaire avec cette ligne.
  it("TC-17 : 12 semaines = 2 pages de sommaire + 12 pages, puis les fiches", async () => {
    const model = programPdf(demoProgram(12));
    expect(model.agenda.pages).toHaveLength(14);
    const pdf = await renderProgramPdf(model, "Coach Test");
    expect(pagesOf(pdf).count).toBe(model.totalPages);
    const raw = pdf.toString("latin1");
    for (const name of ["toc", ...Array.from({ length: 12 }, (_, i) => `week-${i + 1}`)])
      expect(raw.includes(`(${name})`), name).toBe(true);
  }, 30_000);

  // Relecture du 16/11 : « % du max » en entier ne doit pas faire passer les cellules à la ligne sans
  // que le modèle le sache (sinon une page en plus, et tous les numéros du sommaire décalés).
  it("Fiches : 7 exercices en % du max (sans max connu) sur 8 semaines, exactement les pages prévues", async () => {
    const program = demoProgram(8);
    for (const week of program.weeks) {
      const published = week.sessions[1]!.published!;
      if (published.content.discipline !== "strength") continue;
      published.content.items = Array.from({ length: 7 }, (_, i) => ({
        id: `p${i}`,
        kind: "exercise" as const,
        name: `Exercice numéro ${i + 1}`,
        loadMode: "pct" as const,
        sets: [70, 75, 80, 85].map((pct) => ({ type: "normal" as const, repsMin: 5, pct })),
        restSec: 120,
      }));
    }
    const model = programPdf(program);
    const pdf = await renderProgramPdf(model, "Coach Test");
    expect(pagesOf(pdf).count).toBe(model.totalPages);
  }, 30_000);

  // Relecture du 27/11 (D-211) : un long titre (2 ou 3 lignes) et un sommaire plein, plus la ligne
  // « Fiches et repères » : la page ne doit jamais déborder (sinon une page de plus, et tous les
  // numéros de page décalés d'un cran).
  for (const title of [
    "Préparation HYROX Bruxelles printemps 2027",
    "Préparation HYROX Bruxelles printemps 2027 : bloc de force, endurance et allures spécifiques course",
  ])
    for (const weeks of [11, 12, 24])
      it(`titre de ${title.length} caractères, ${weeks} semaines : exactement les pages prévues`, async () => {
        const model = programPdf({ ...demoProgram(weeks), title });
        const pdf = await renderProgramPdf(model, "Coach Test");
        expect(pagesOf(pdf).count).toBe(model.totalPages);
      }, 30_000);

  it("sans fiche ni allure : l'agenda seul", async () => {
    const model = programPdf(programWithoutFiches());
    const pdf = await renderProgramPdf(model, "Coach Test");
    expect(pagesOf(pdf).count).toBe(model.agenda.pages.length);
    expect(pdf.toString("latin1").includes("(fiches)")).toBe(false);
  }, 30_000);
});

import { describe, expect, it } from "vitest";

import { agendaPdf } from "@/domain/training/pdf-agenda";
import { fichesPdf } from "@/domain/training/pdf-fiches";
import { renderAgendaPdf } from "@/features/programs/pdf/agenda-pdf";
import { renderFichesPdf } from "@/features/programs/pdf/fiches-pdf";

import { demoProgram } from "./pdf-fixtures";

// Rendu RÉEL des deux PDF par React-PDF (police intégrée) : un vrai fichier PDF, en A4, avec
// EXACTEMENT les pages prévues par le modèle (une estimation de hauteur trop courte ferait déborder
// une page et décalerait tous les numéros du sommaire), des liens internes et des signets.
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

describe("rendu des PDF du programme", () => {
  it("Agenda : un PDF A4, une page par semaine, liens et signets", async () => {
    const model = agendaPdf(demoProgram(14));
    const pdf = await renderAgendaPdf(model, "Coach Test");
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    const pages = pagesOf(pdf);
    expect(pages.count).toBe(model.pages.length);
    expect(pages.a4).toBe(true);
    expect(pages.outlines).toBe(true);
    expect(pages.links).toBeGreaterThan(model.pages.length);
  }, 30_000);

  it("Fiches et repères : un PDF A4 aux pages prévues, « (suite) » compris", async () => {
    const model = fichesPdf(demoProgram(12));
    const pdf = await renderFichesPdf(model, "Coach Test");
    const pages = pagesOf(pdf);
    expect(pages.count).toBe(model.pages.length);
    expect(pages.a4).toBe(true);
    expect(pages.outlines).toBe(true);
  }, 30_000);
});

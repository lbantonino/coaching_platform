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

  it("TC-17 : 12 semaines = 13 pages (sommaire + 12), un lien et un signet vers chaque semaine", async () => {
    const model = agendaPdf(demoProgram(12));
    const pdf = await renderAgendaPdf(model, "Coach Test");
    expect(pagesOf(pdf).count).toBe(13);
    const raw = pdf.toString("latin1");
    for (const name of ["toc", ...Array.from({ length: 12 }, (_, i) => `week-${i + 1}`)])
      expect(raw.includes(`(${name})`), name).toBe(true);
  }, 30_000);

  it("Fiches et repères : un PDF A4 aux pages prévues, « (suite) » compris", async () => {
    const model = fichesPdf(demoProgram(12));
    const pdf = await renderFichesPdf(model, "Coach Test");
    const pages = pagesOf(pdf);
    expect(pages.count).toBe(model.pages.length);
    expect(pages.a4).toBe(true);
    expect(pages.outlines).toBe(true);
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
    const model = fichesPdf(program);
    const pdf = await renderFichesPdf(model, "Coach Test");
    expect(pagesOf(pdf).count).toBe(model.pages.length);
  }, 30_000);
});

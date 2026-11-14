import { describe, expect, it } from "vitest";

import { fitWithin, needsShrink } from "@/lib/shrink-photo";

// Réduction d'une photo dans le navigateur avant l'envoi (demande d'Antonino du 14/11 : une photo
// de téléphone de 3552 × 4879 menait à une page d'erreur, car l'envoi dépassait la limite de
// Vercel). Règles pures ; le dessin sur un canvas est vérifié par Playwright (photos.spec.ts).
describe("fitWithin", () => {
  it("ramène le plus grand côté à la taille voulue, sans déformer", () => {
    expect(fitWithin(3552, 4879, 1024)).toEqual({ width: 745, height: 1024, scale: 1024 / 4879 });
    expect(fitWithin(1024, 1536, 1024)).toEqual({ width: 683, height: 1024, scale: 1024 / 1536 });
  });

  it("n'agrandit jamais une petite photo", () => {
    expect(fitWithin(620, 526, 1024)).toEqual({ width: 620, height: 526, scale: 1 });
  });
});

describe("needsShrink", () => {
  it("réduit une grande photo, ou une petite photo trop lourde", () => {
    expect(needsShrink(0.5, 200_000)).toBe(true);
    expect(needsShrink(1, 1.5 * 1024 * 1024)).toBe(true);
  });

  it("envoie telle quelle une petite photo légère", () => {
    expect(needsShrink(1, 300_000)).toBe(false);
  });
});

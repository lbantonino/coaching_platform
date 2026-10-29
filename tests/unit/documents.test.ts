import { describe, expect, it } from "vitest";

import {
  checkDocument,
  formatBytes,
  guessCategoryId,
  isDocumentPath,
  nameFromFile,
  parseCategoryName,
  parseDocumentForm,
} from "@/domain/documents/documents";

const bytes = (...values: number[]) => new Uint8Array([...values, ...new Array(16).fill(0)]);
const PDF = bytes(0x25, 0x50, 0x44, 0x46, 0x2d, 0x31);
const ZIP = bytes(0x50, 0x4b, 0x03, 0x04);
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);

describe("documents du coach", () => {
  it("reconnaît un PDF, une image, un Word ou un Excel à leurs premiers octets", () => {
    expect(checkDocument(PDF, "bilan.pdf")).toMatchObject({ ok: true, kind: "pdf", ext: "pdf" });
    expect(checkDocument(PNG, "photo.png")).toMatchObject({ ok: true, mime: "image/png" });
    expect(checkDocument(ZIP, "contrat.docx")).toMatchObject({ ok: true, kind: "word" });
    expect(checkDocument(ZIP, "suivi.xlsx")).toMatchObject({ ok: true, kind: "excel" });
  });

  it("refuse un faux PDF, une archive quelconque, un fichier vide ou trop lourd", () => {
    expect(checkDocument(bytes(0x68, 0x65, 0x6c, 0x6c, 0x6f), "faux.pdf")).toMatchObject({
      ok: false,
    });
    expect(checkDocument(ZIP, "archive.zip")).toMatchObject({ ok: false });
    expect(checkDocument(new Uint8Array(), "vide.pdf")).toEqual({
      ok: false,
      error: "Choisis un fichier.",
    });
    const big = new Uint8Array(10 * 1024 * 1024 + 1);
    big.set([0x25, 0x50, 0x44, 0x46]);
    expect(checkDocument(big, "gros.pdf")).toEqual({
      ok: false,
      error: "Fichier trop lourd : 10 Mo maximum.",
    });
  });

  it("propose un nom lisible à partir du nom du fichier", () => {
    expect(nameFromFile("Contrat_coaching_2026.pdf")).toBe("Contrat coaching 2026");
    expect(nameFromFile("  bilan   octobre .docx")).toBe("bilan octobre");
  });

  it("ne sert que des chemins du dossier d'une organisation", () => {
    const org = "0a000000-0000-4000-8000-0000000000a1";
    const file = "1b2c3d4e-0000-4000-8000-000000000001";
    expect(isDocumentPath(`org/${org}/${file}.pdf`)).toBe(true);
    expect(isDocumentPath(`org/${org}/../${file}.pdf`)).toBe(false);
    expect(isDocumentPath(`user/${org}/${file}.pdf`)).toBe(false);
    expect(isDocumentPath(`org/${org}/${file}.exe`)).toBe(false);
  });

  it("valide nom, catégorie et sportif", () => {
    const category = "c0000000-0000-4000-8000-000000000001";
    expect(parseDocumentForm({ name: "  Bilan  ", categoryId: category, athleteId: "" })).toEqual({
      ok: true,
      document: { name: "Bilan", categoryId: category, athleteId: null },
    });
    // Sans catégorie (D-67) : permis.
    expect(parseDocumentForm({ name: "X", categoryId: "", athleteId: "" })).toMatchObject({
      ok: true,
      document: { categoryId: null },
    });
    expect(parseDocumentForm({ name: " ", categoryId: "", athleteId: "" }).ok).toBe(false);
    expect(parseDocumentForm({ name: "X", categoryId: "photo", athleteId: "" }).ok).toBe(false);
    expect(parseDocumentForm({ name: "X", categoryId: "", athleteId: "123" }).ok).toBe(false);
  });

  it("valide le nom d'une catégorie du coach (D-67)", () => {
    expect(parseCategoryName("  Certificats médicaux ")).toEqual({
      ok: true,
      name: "Certificats médicaux",
    });
    expect(parseCategoryName("  ").ok).toBe(false);
    expect(parseCategoryName("x".repeat(61)).ok).toBe(false);
  });

  it("devine la catégorie d'après le nom du fichier, parmi celles du coach", () => {
    const categories = [
      { id: "a", name: "Factures" },
      { id: "b", name: "Bilans" },
      { id: "c", name: "Divers" },
    ];
    expect(guessCategoryId("facture-octobre.pdf", categories)).toBe("a");
    expect(guessCategoryId("Bilan de rentrée.pdf", categories)).toBe("b");
    expect(guessCategoryId("contrat.pdf", categories)).toBeNull();
    expect(guessCategoryId("photo.jpg", categories)).toBeNull();
  });

  it("écrit la taille d'un fichier en français", () => {
    expect(formatBytes(800)).toBe("800 o");
    expect(formatBytes(340 * 1024)).toBe("340 Ko");
    expect(formatBytes(1.25 * 1024 * 1024)).toMatch(/^1,[23] Mo$/);
  });
});

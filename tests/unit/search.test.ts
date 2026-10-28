import { describe, expect, it } from "vitest";

import { cleanQuery, searchPattern } from "@/domain/search/search";

describe("recherche globale", () => {
  it("ne cherche pas en dessous de 2 lettres", () => {
    expect(searchPattern("")).toBeNull();
    expect(searchPattern(" a ")).toBeNull();
    expect(searchPattern("so")).toBe("%so%");
  });

  it("échappe les jokers et neutralise la syntaxe des filtres", () => {
    expect(searchPattern("100%")).toBe("%100\\%%");
    expect(searchPattern("a_b")).toBe("%a\\_b%");
    expect(cleanQuery("Sophie,(Lambert)")).toBe("Sophie Lambert");
  });

  it("borne la longueur et resserre les espaces", () => {
    expect(cleanQuery("  bilan    octobre  ")).toBe("bilan octobre");
    expect(cleanQuery("x".repeat(200))).toHaveLength(80);
  });
});

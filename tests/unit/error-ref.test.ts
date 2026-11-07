import { describe, expect, it } from "vitest";

import { formatErrorRef } from "@/lib/error-ref";

describe("référence d'une erreur", () => {
  it("garde 8 caractères, en majuscules, par paquets de 4", () => {
    expect(formatErrorRef("7f3a21c9e0b4")).toBe("7F3A-21C9");
    expect(formatErrorRef("2851234567")).toBe("2851-2345");
  });

  it("ignore les signes et masque une référence absente ou trop courte", () => {
    expect(formatErrorRef("ab-cd_12.34xy")).toBe("ABCD-1234");
    expect(formatErrorRef(undefined)).toBeNull();
    expect(formatErrorRef("")).toBeNull();
    expect(formatErrorRef("abc")).toBeNull();
  });
});

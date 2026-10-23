import { describe, expect, it } from "vitest";

import { completionLabel, missingProfileInfo } from "@/features/athletes/completeness";

describe("fiche à compléter (D-35)", () => {
  it("signale une fiche créée d'un simple prénom", () => {
    const missing = missingProfileInfo({ lastName: null, email: null, phone: null });
    expect(missing).toEqual(["nom de famille", "e-mail ou téléphone"]);
    expect(completionLabel(missing)).toBe(
      "Fiche à compléter : nom de famille, e-mail ou téléphone",
    );
  });
  it("se contente d'un e-mail OU d'un téléphone pour joindre le sportif", () => {
    expect(
      missingProfileInfo({ lastName: "Martin", email: null, phone: "+32 470 00 00 00" }),
    ).toEqual([]);
    expect(
      missingProfileInfo({ lastName: "Martin", email: "john@example.test", phone: null }),
    ).toEqual([]);
    expect(missingProfileInfo({ lastName: null, email: "john@example.test", phone: null })).toEqual(
      ["nom de famille"],
    );
  });
});

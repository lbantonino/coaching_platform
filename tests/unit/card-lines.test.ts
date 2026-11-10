import { describe, expect, it } from "vitest";

import { cardLines, shortLine } from "@/domain/training/card-lines";

describe("lignes courtes des cartes de l'agenda (2c)", () => {
  it("raccourcit comme la maquette", () => {
    expect(shortLine("20 min @6:00 min/km, allure progressive")).toBe("20 min @ 6:00");
    expect(shortLine("1:45 min de récupération (trot lent)")).toBe("récup 1:45");
    expect(shortLine("4 min @4:55 min/km")).toBe("4 min @ 4:55");
  });
  it("écrit une séance de fractionné en quatre lignes", () => {
    expect(
      cardLines({
        steps: [
          {
            title: "Échauffement",
            badge: "20 min",
            lines: ["20 min @6:00 min/km, allure progressive"],
          },
          {
            title: "Bloc principal",
            lines: [],
            repeat: {
              times: 5,
              lines: ["4 min @4:55 min/km", "1:45 min de récupération (trot lent)"],
            },
          },
          { title: "Retour au calme", lines: ["5 min @6:35 min/km"] },
        ],
      }),
    ).toEqual(["20 min @ 6:00", "5 × 4 min @ 4:55", "récup 1:45", "5 min @ 6:35"]);
  });
});

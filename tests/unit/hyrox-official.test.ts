import { describe, expect, it } from "vitest";

import {
  defaultHyroxDivision,
  HYROX_RULEBOOK_SEASON,
  HYROX_STATION_RULES,
  officialLoadKg,
  wallBallTargetMeters,
} from "@/domain/training/hyrox-official";
import { HYROX_STATIONS } from "@/domain/training/session-v2";

describe("charges officielles HYROX (règlement 26/27, C-10)", () => {
  it("note la saison du règlement", () => {
    expect(HYROX_RULEBOOK_SEASON).toBe("26/27");
  });
  it("donne les charges Open Femmes de BR-15", () => {
    expect(officialLoadKg("sled_push", "women_open", "female")).toBe(102);
    expect(officialLoadKg("sled_pull", "women_open", "female")).toBe(78);
    expect(officialLoadKg("farmers_carry", "women_open", "female")).toBe(16);
    expect(officialLoadKg("sandbag_lunges", "women_open", "female")).toBe(10);
    expect(officialLoadKg("wall_balls", "women_open", "female")).toBe(4);
  });
  it("Hommes Open et Femmes Pro partagent la même colonne", () => {
    for (const station of HYROX_STATIONS) {
      expect(officialLoadKg(station, "men_open", "male")).toBe(
        officialLoadKg(station, "women_pro", "female"),
      );
    }
    expect(officialLoadKg("sled_push", "men_pro", "male")).toBe(202);
  });
  it("Doubles Mixte prend la colonne du milieu pour les deux partenaires", () => {
    expect(officialLoadKg("sled_push", "doubles_mixed", "female")).toBe(152);
    expect(officialLoadKg("wall_balls", "doubles_mixed", "male")).toBe(6);
    expect(officialLoadKg("farmers_carry", "doubles_women", "female")).toBe(16);
  });
  it("Relais : chacun la colonne Open de son sexe ; sexe inconnu, pas de charge", () => {
    expect(officialLoadKg("sled_pull", "relay", "female")).toBe(78);
    expect(officialLoadKg("sled_pull", "relay", "male")).toBe(103);
    expect(officialLoadKg("sled_pull", "relay", "unspecified")).toBeNull();
  });
  it("les stations sans charge n'en ont pas, et 100 wall balls pour tous", () => {
    expect(officialLoadKg("skierg", "women_open", "female")).toBeNull();
    expect(officialLoadKg("burpee_broad_jumps", "men_pro", "male")).toBeNull();
    expect(HYROX_STATION_RULES.wall_balls.reps).toBe(100);
    expect(HYROX_STATION_RULES.sled_push.meters).toBe(50);
  });
  it("hauteur de cible des wall balls selon le sexe", () => {
    expect(wallBallTargetMeters("female")).toBe(2.7);
    expect(wallBallTargetMeters("male")).toBe(3);
    expect(wallBallTargetMeters(null)).toBeNull();
  });
});

describe("defaultHyroxDivision (division pré-remplie dans l'assistant)", () => {
  it("se déduit de l'objectif et du sexe quand c'est sans ambiguïté", () => {
    expect(defaultHyroxDivision("open", "female")).toBe("women_open");
    expect(defaultHyroxDivision("pro", "male")).toBe("men_pro");
    expect(defaultHyroxDivision("doubles", "female")).toBe("doubles_women");
    expect(defaultHyroxDivision("relay", null)).toBe("relay");
  });
  it("reste vide si le sexe ou la catégorie manque", () => {
    expect(defaultHyroxDivision("open", "unspecified")).toBeNull();
    expect(defaultHyroxDivision(null, "female")).toBeNull();
  });
});

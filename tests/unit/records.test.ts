import { describe, expect, it } from "vitest";

import {
  bestRecords,
  formatRaceTime,
  parseRecordForm,
  recordPace,
  recordTitle,
  type RecordFormInput,
  type RecordLike,
} from "@/features/records/schemas";

const TODAY = "2026-10-22";
const base: RecordFormInput = {
  event: "run_5k",
  hyroxCategory: "",
  time: "21:45",
  achievedOn: "2026-10-01",
  raceName: "",
};

describe("parseRecordForm", () => {
  it("enregistre un 5 km en secondes, sans catégorie Hyrox", () => {
    expect(parseRecordForm({ ...base, hyroxCategory: "pro" }, TODAY)).toEqual({
      ok: true,
      values: {
        event: "run_5k",
        hyrox_category: null,
        time_seconds: 1305,
        achieved_on: "2026-10-01",
        race_name: null,
      },
    });
  });

  it("accepte h:mm:ss et garde le nom de la course", () => {
    const result = parseRecordForm(
      { ...base, event: "run_half", time: "1:42:30", raceName: "  Semi de printemps " },
      TODAY,
    );
    expect(result).toMatchObject({
      ok: true,
      values: { time_seconds: 6150, race_name: "Semi de printemps" },
    });
  });

  it("exige la catégorie d'un Hyrox", () => {
    expect(parseRecordForm({ ...base, event: "hyrox", time: "1:18:40" }, TODAY)).toEqual({
      ok: false,
      error: "Choisis la catégorie Hyrox.",
    });
    expect(
      parseRecordForm({ ...base, event: "hyrox", hyroxCategory: "open", time: "1:18:40" }, TODAY),
    ).toMatchObject({ ok: true, values: { hyrox_category: "open", time_seconds: 4720 } });
  });

  it("refuse un temps invraisemblable avec un exemple au bon format", () => {
    // « 3:15 » pour un marathon : 3 min 15 s, faute de frappe probable.
    const result = parseRecordForm({ ...base, event: "run_marathon", time: "3:15" }, TODAY);
    expect(result).toEqual({
      ok: false,
      error:
        "Temps invraisemblable pour un marathon : entre 1:55:00 et 8:00:00, par exemple 3:45:00.",
    });
  });

  it("refuse un format illisible, une épreuve inconnue et une date future", () => {
    expect(parseRecordForm({ ...base, time: "21.45" }, TODAY)).toMatchObject({ ok: false });
    expect(parseRecordForm({ ...base, event: "run_15k" }, TODAY)).toEqual({
      ok: false,
      error: "Choisis l'épreuve.",
    });
    expect(parseRecordForm({ ...base, achievedOn: "2026-11-01" }, TODAY)).toEqual({
      ok: false,
      error: "La date de la performance ne peut pas être dans le futur.",
    });
  });
});

describe("formatage", () => {
  it("écrit les temps et l'allure moyenne", () => {
    expect(formatRaceTime(1305)).toBe("21:45");
    expect(formatRaceTime(6150)).toBe("1:42:30");
    expect(recordPace("run_5k", 1305)).toBe("4:21 /km");
    expect(recordPace("hyrox", 4720)).toBeNull();
    expect(recordTitle("hyrox", "pro")).toBe("Hyrox Pro");
    expect(recordTitle("run_half", null)).toBe("Semi-marathon");
  });
});

describe("bestRecords", () => {
  const entry = (values: RecordLike) => values;
  it("garde le meilleur temps par épreuve et par catégorie Hyrox, dans l'ordre fixe", () => {
    const best = bestRecords([
      entry({ event: "hyrox", hyroxCategory: "pro", timeSeconds: 5100, achievedOn: "2026-09-01" }),
      entry({ event: "run_5k", hyroxCategory: null, timeSeconds: 1350, achievedOn: "2026-05-01" }),
      entry({ event: "hyrox", hyroxCategory: "open", timeSeconds: 4720, achievedOn: "2025-12-14" }),
      entry({ event: "run_5k", hyroxCategory: null, timeSeconds: 1305, achievedOn: "2026-10-01" }),
      entry({ event: "hyrox", hyroxCategory: "open", timeSeconds: 4445, achievedOn: "2026-04-12" }),
    ]);
    expect(best.map((b) => [b.event, b.hyroxCategory, b.timeSeconds])).toEqual([
      ["run_5k", null, 1305],
      ["hyrox", "open", 4445],
      ["hyrox", "pro", 5100],
    ]);
  });

  it("à égalité, le record appartient à la première fois", () => {
    const [best] = bestRecords([
      entry({ event: "run_10k", hyroxCategory: null, timeSeconds: 2800, achievedOn: "2026-09-01" }),
      entry({ event: "run_10k", hyroxCategory: null, timeSeconds: 2800, achievedOn: "2026-03-01" }),
    ]);
    expect(best.achievedOn).toBe("2026-03-01");
  });
});

import { describe, expect, it } from "vitest";

import type { Week } from "@/domain/training/program-plan";
import {
  applyWeekSchedule,
  isPastWeek,
  orderedSessions,
  plannedDate,
  proposeWeekDays,
  scheduleWarnings,
  weekdayOf,
} from "@/domain/training/scheduling";

import { runningSession } from "./fixtures/program-v2";

const session = (key: string, extra: Partial<ReturnType<typeof runningSession>> = {}) =>
  runningSession({ key, ...extra });

describe("dates d'une semaine", () => {
  it("date une séance à jour fixe : semaine 2, mercredi = 4 novembre 2026", () => {
    expect(plannedDate("2026-10-26", 2, "wed")).toBe("2026-11-04");
    expect(weekdayOf("2026-11-07")).toBe("sat");
  });
  it("une semaine est passée quand son dimanche est avant aujourd'hui", () => {
    expect(isPastWeek("2026-10-26", 1, "2026-11-02")).toBe(true);
    expect(isPastWeek("2026-10-26", 1, "2026-11-01")).toBe(false);
  });
});

describe("orderedSessions (numérotation des séances)", () => {
  it("dans l'ordre : l'ordre choisi par le coach", () => {
    const week: Week = {
      index: 1,
      light: false,
      scheduling: "ordered",
      sessions: [session("b"), session("a")],
    };
    expect(orderedSessions(week).map((s) => s.key)).toEqual(["b", "a"]);
  });
  it("en jours fixes : l'ordre des jours, puis l'heure ; les séances sans jour à la fin (BR-03)", () => {
    const week: Week = {
      index: 1,
      light: false,
      scheduling: "fixed",
      sessions: [
        session("sans-jour"),
        session("jeudi", { fixedDay: "thu" }),
        session("mardi-soir", { fixedDay: "tue", fixedTime: "18:00" }),
        session("mardi-matin", { fixedDay: "tue", fixedTime: "07:00" }),
        session("coach", {
          withCoach: {
            coachSessionId: "ca000000-0000-4000-8000-000000000002",
            date: "2026-10-31",
            time: "10:00",
          },
        }),
      ],
    };
    expect(orderedSessions(week).map((s) => s.key)).toEqual([
      "mardi-matin",
      "mardi-soir",
      "jeudi",
      "coach",
      "sans-jour",
    ]);
  });
});

describe("scheduleWarnings (jamais bloquants)", () => {
  it("signale deux séances le même jour et un jour indisponible", () => {
    const week: Week = {
      index: 1,
      light: false,
      scheduling: "fixed",
      sessions: [
        session("a", { fixedDay: "mon" }),
        session("b", { fixedDay: "mon" }),
        session("c", { fixedDay: "sun" }),
      ],
    };
    const warnings = scheduleWarnings(week, ["mon", "wed", "fri"]);
    expect(warnings).toContainEqual({ code: "same_day", day: "mon", keys: ["a", "b"] });
    expect(warnings).toContainEqual({ code: "unavailable_day", day: "sun", key: "c" });
  });
  it("ne dit rien pour une semaine dans l'ordre", () => {
    const week: Week = {
      index: 1,
      light: false,
      scheduling: "ordered",
      sessions: [session("a"), session("b")],
    };
    expect(scheduleWarnings(week, ["mon"])).toEqual([]);
  });
});

describe("applyWeekSchedule (cette semaine / la phase / tout le programme)", () => {
  const weeks: Week[] = [1, 2, 3, 4].map((index) => ({
    index,
    light: false,
    scheduling: "ordered",
    sessions: [session(`w${index}-1`), session(`w${index}-2`)],
  }));
  const source: Week = {
    index: 2,
    light: false,
    scheduling: "fixed",
    sessions: [
      session("w2-1", { fixedDay: "tue" }),
      session("w2-2", { fixedDay: "sat", fixedTime: "09:00" }),
    ],
  };
  const all = weeks.map((week) => (week.index === 2 ? source : week));
  const phases = [{ id: "p1", name: "Base", weekFrom: 1, weekTo: 3 }];

  it("à la phase : les semaines de la phase reçoivent les mêmes jours, pas les autres", () => {
    const result = applyWeekSchedule(all, phases, 2, "phase");
    expect(result[2]?.scheduling).toBe("fixed");
    expect(result[2]?.sessions.map((s) => s.fixedDay)).toEqual(["tue", "sat"]);
    expect(result[2]?.sessions[1]?.fixedTime).toBe("09:00");
    expect(result[3]?.scheduling).toBe("ordered");
  });
  it("ne touche jamais une semaine passée (BR-07)", () => {
    const result = applyWeekSchedule(all, phases, 2, "program", {
      startDate: "2026-10-26",
      today: "2026-11-03",
    });
    expect(result[0]).toBe(all[0]);
    expect(result[3]?.scheduling).toBe("fixed");
  });
});

describe("proposeWeekDays (proposition automatique)", () => {
  it("garde le jour du rendez-vous du coach et n'utilise que les jours disponibles", () => {
    const sessions = [
      session("coach", {
        withCoach: { coachSessionId: "ca000000-0000-4000-8000-000000000002", date: "2026-10-31" },
      }),
      session("a"),
      session("b"),
    ];
    const days = proposeWeekDays(sessions, ["mon", "wed", "fri", "sat"]);
    expect(days.get("coach")).toBe("sat");
    expect(["mon", "wed", "fri"]).toContain(days.get("a"));
    expect(["mon", "wed", "fri"]).toContain(days.get("b"));
    expect(days.get("a")).not.toBe(days.get("b"));
  });
  it("évite deux séances dures de suite quand c'est possible", () => {
    const hard = (key: string) => session(key, { sessionType: "Fractionné" });
    const days = proposeWeekDays([hard("a"), hard("b"), hard("c")], []);
    const order = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const picked = ["a", "b", "c"]
      .map((key) => order.indexOf(days.get(key) ?? ""))
      .sort((x, y) => x - y);
    picked.slice(1).forEach((day, i) => expect(day - (picked[i] ?? 0)).toBeGreaterThan(1));
  });
});

import { describe, expect, it } from "vitest";

import { planIssues, type Week } from "@/domain/training/program-plan";
import {
  applySessionDay,
  applyWeekSchedule,
  dayHasRoom,
  fillMoments,
  isPastWeek,
  momentFromTime,
  orderedSessions,
  plannedDate,
  proposeWeekDays,
  scheduleWarnings,
  setWeekFixed,
  setWeekOrdered,
  suggestedMoment,
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
  it("signale plusieurs séances le même jour sans moment, et un jour indisponible", () => {
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
    expect(warnings).toContainEqual({ code: "moment_missing", day: "mon", keys: ["a", "b"] });
    expect(warnings).toContainEqual({ code: "unavailable_day", day: "sun", key: "c" });
  });
  it("deux séances le même jour avec leur moment : rien à signaler (D-164)", () => {
    const week: Week = {
      index: 1,
      light: false,
      scheduling: "fixed",
      sessions: [
        session("a", { fixedDay: "mon", moment: "evening" }),
        session("b", { fixedDay: "mon", fixedTime: "07:00" }),
      ],
    };
    expect(scheduleWarnings(week, [])).toEqual([]);
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

describe("TC-08 : la séance avec le coach garde le jour du rendez-vous (BR-06)", () => {
  const coach = session("coach", {
    withCoach: { coachSessionId: "ca000000-0000-4000-8000-000000000002", date: "2026-10-28" },
  });
  const week: Week = {
    index: 1,
    light: false,
    scheduling: "fixed",
    sessions: [session("seule", { fixedDay: "mon" }), coach],
  };
  it("changer son jour ne fait rien, même à l'échelle du programme", () => {
    const weeks = applySessionDay(
      [week],
      [],
      1,
      1,
      { day: "fri", athleteCanMove: false },
      "program",
    );
    expect(weeks[0]?.sessions[1]).toEqual(coach);
  });
  it("« Fixer les jours » et « Dans l'ordre » ne la touchent pas", () => {
    const fixed = setWeekFixed(week, new Map([["coach", "sun" as const]]));
    expect(fixed.sessions[1]).toEqual(coach);
    expect(setWeekOrdered(week).sessions[1]?.withCoach).toEqual(coach.withCoach);
  });
});

// Plusieurs séances le même jour (D-164) : jusqu'à 4, chacune avec son moment.
describe("moments de la journée", () => {
  const fixedWeek = (sessions: ReturnType<typeof session>[]): Week => ({
    index: 1,
    light: false,
    scheduling: "fixed",
    sessions,
  });

  it("déduit le moment d'une heure", () => {
    expect(momentFromTime("07:30")).toBe("morning");
    expect(momentFromTime("12:15")).toBe("noon");
    expect(momentFromTime("16:00")).toBe("afternoon");
    expect(momentFromTime("19:00")).toBe("evening");
    expect(momentFromTime(undefined)).toBeNull();
  });

  it("numérote par jour, puis matin, midi, après-midi, soir", () => {
    const week = fixedWeek([
      session("soir", { fixedDay: "mon", moment: "evening" }),
      session("mardi", { fixedDay: "tue" }),
      session("matin", { fixedDay: "mon", moment: "morning" }),
      session("midi", { fixedDay: "mon", moment: "noon" }),
    ]);
    expect(orderedSessions(week).map((item) => item.key)).toEqual([
      "matin",
      "midi",
      "soir",
      "mardi",
    ]);
  });

  it("donne un moment aux séances d'un jour qui en a plusieurs, matin d'abord", () => {
    const two = fillMoments(
      fixedWeek([session("a", { fixedDay: "mon" }), session("b", { fixedDay: "mon" })]),
    );
    expect(two.sessions.map((item) => item.moment)).toEqual(["morning", "evening"]);
    const three = fillMoments(
      fixedWeek([
        session("a", { fixedDay: "wed" }),
        session("b", { fixedDay: "wed" }),
        session("c", { fixedDay: "wed" }),
      ]),
    );
    expect(three.sessions.map((item) => item.moment)).toEqual(["morning", "noon", "evening"]);
    // Le soir est déjà pris : l'autre séance du jour passe au matin.
    const taken = fillMoments(
      fixedWeek([
        session("a", { fixedDay: "fri" }),
        session("b", { fixedDay: "fri", moment: "evening" }),
      ]),
    );
    expect(taken.sessions.find((item) => item.key === "a")?.moment).toBe("morning");
    // Un jour d'une seule séance ne change pas.
    const single = fillMoments(fixedWeek([session("a", { fixedDay: "sat" })]));
    expect(single.sessions[0]?.moment).toBeUndefined();
  });

  it("propose le moment suivant et refuse un cinquième passage le même jour", () => {
    const week = fixedWeek([
      session("a", { fixedDay: "mon", moment: "morning" }),
      session("b", { fixedDay: "mon", moment: "evening" }),
    ]);
    expect(suggestedMoment(week, "mon")).toBe("noon");
    expect(suggestedMoment(week, "tue")).toBeNull();
    // Une séance déjà là, sans moment : elle garde le matin, la nouvelle passe au soir.
    const one = fixedWeek([session("a", { fixedDay: "wed" })]);
    expect(suggestedMoment(one, "wed")).toBe("evening");
    const full = fixedWeek([
      session("a", { fixedDay: "sun" }),
      session("b", { fixedDay: "sun" }),
      session("c", { fixedDay: "sun" }),
      session("d", { fixedDay: "sun" }),
    ]);
    expect(dayHasRoom(full, "sun")).toBe(false);
    expect(dayHasRoom(full, "sun", "d")).toBe(true);
  });

  it("la proposition automatique double des jours sans dépasser 4 séances par jour", () => {
    const sessions = Array.from({ length: 10 }, (_, i) => session(`s${i}`));
    const days = proposeWeekDays(sessions, ["mon", "wed"]);
    const perDay = new Map<string, number>();
    for (const day of days.values()) perDay.set(day, (perDay.get(day) ?? 0) + 1);
    expect(Math.max(...perDay.values())).toBeLessThanOrEqual(4);
    expect(days.size).toBe(8);
  });

  it("un plan refuse une cinquième séance le même jour", () => {
    const issues = planIssues({
      phases: [],
      weeks: [fixedWeek(["a", "b", "c", "d", "e"].map((key) => session(key, { fixedDay: "thu" })))],
    });
    expect(issues.some((issue) => issue.message === "4 séances au plus le même jour.")).toBe(true);
  });
});

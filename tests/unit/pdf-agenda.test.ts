import { describe, expect, it } from "vitest";

import { agendaPdf, fitWeek, hasFiche, type AgendaWeekPage } from "@/domain/training/pdf-agenda";
import { programKindLabel } from "@/domain/training/discipline";
import { sessionToDisplay } from "@/domain/training/program-session";

import { demoProgram, hyrox, running, strength } from "./pdf-fixtures";

// PDF 1 « Agenda du programme » (phase 5) : sommaire, une page par semaine, liens ‹ ›.
describe("PDF Agenda du programme", () => {
  it("un sommaire puis une page par semaine, reliés par ‹ › et le bouton central", () => {
    const pdf = agendaPdf(demoProgram(6));
    expect(pdf.pages.map((page) => page.anchor)).toEqual([
      "toc",
      "week-1",
      "week-2",
      "week-3",
      "week-4",
      "week-5",
      "week-6",
    ]);
    const [toc, first, , , , , last] = pdf.pages;
    expect(toc!.nav).toEqual({
      prev: null,
      current: { label: "Sommaire", anchor: "toc" },
      next: { label: "Semaine 1", anchor: "week-1" },
    });
    expect(first!.nav.prev).toEqual({ label: "Sommaire", anchor: "toc" });
    expect(first!.nav.current).toEqual({ label: "Semaine 1 sur 6", anchor: "toc" });
    expect(last!.nav.next).toBeNull();
    expect(last!.pageNumber).toBe(7);
    expect(pdf.fileName).toBe("Agenda du programme - Prépa test - Anaïs Test - v1.pdf");
    expect(pdf.footer).toBe("Coory · Coach Test · Version 1");
  });

  it("le sommaire : page de chaque semaine, phase, semaine allégée, course, semaine en cours", () => {
    const toc = agendaPdf(demoProgram(6)).pages[0]!;
    if (toc.kind !== "toc") throw new Error("sommaire attendu");
    expect(toc.subtitle).toBe("9 nov. 2026 → 20 déc. 2026 · 6 semaines · 3 séances par semaine");
    expect(toc.rows[0]).toMatchObject({ page: 2, current: true, phase: 0, tag: "" });
    expect(toc.rows[3]!.tag).toBe("allégée");
    expect(toc.rows[5]).toMatchObject({ tag: "★ course", phase: 1 });
  });

  it("au-delà de 12 semaines, le sommaire continue sur une deuxième page", () => {
    const pdf = agendaPdf(demoProgram(20));
    expect(pdf.pages.filter((page) => page.kind === "toc")).toHaveLength(2);
    expect(pdf.pages[2]!.anchor).toBe("week-1");
    expect(pdf.pages[2]!.pageNumber).toBe(3);
  });

  it("une semaine à jours fixés : 7 jours, Repos, renvoi aux fiches, Running en minutes", () => {
    const week = agendaPdf(demoProgram(6)).pages[1] as AgendaWeekPage;
    expect(week.badge).toBe("Jours fixés par le coach");
    expect(week.days.map((day) => day.label)).toEqual([
      "Lundi",
      "Mardi",
      "Mercredi",
      "Jeudi",
      "Vendredi",
      "Samedi",
      "Dimanche",
    ]);
    expect(week.days[0]).toMatchObject({ date: "9 nov.", sessions: [] });
    const [tuesday] = week.days[1]!.sessions;
    expect(tuesday).toMatchObject({ discipline: "hyrox", fiche: { summary: "3 tours · 43 min" } });
    // Musculation (décision d'Antonino du 16/11) : les exercices listés comme la carte de l'app, le
    // superset groupé, l'EMOM groupé, puis le renvoi à sa fiche (sans résumé).
    const wednesday = week.days[2]!.sessions[0]!;
    expect(wednesday.fiche).toEqual({ summary: null });
    expect(wednesday.lines[0]).toMatchObject({
      kind: "line",
      text: expect.stringMatching(/^Back squat/),
    });
    expect(
      wednesday.lines.find((line) => line.kind === "group" && line.label.startsWith("Superset")),
    ).toMatchObject({
      label: "Superset · 3 tours",
      lines: [expect.stringMatching(/^Fentes/), expect.stringMatching(/^Hip thrust/)],
    });
    expect(wednesday.lines.some((line) => line.kind === "repeat")).toBe(false);
    const thursday = week.days[3]!.sessions[0]!;
    expect(thursday).toMatchObject({ meta: "≈ 50 min", fiche: null, cut: false });
    expect(thursday.lines[0]).toEqual({ kind: "line", text: "15 min · Z2 · 135–150 bpm" });
  });

  it("la course du programme porte une étoile, et un 90 min reste en minutes", () => {
    const input = demoProgram(6);
    const race = { ...running(90), title: "HYROX Test", fixedDay: "sat" as const };
    input.weeks[5]!.sessions.push({
      content: sessionToDisplay(race),
      headline: "course",
      day: "sat",
      time: "10:40",
      coachDate: null,
      published: race,
    });
    const week = agendaPdf(input).pages.at(-1) as AgendaWeekPage;
    expect(week.days[5]!.sessions[0]).toMatchObject({
      title: "★ HYROX Test",
      meta: "10:40 · ≈ 90 min",
    });
  });

  it("dans l'ordre : une ligne par séance, sans jour", () => {
    const input = demoProgram(6);
    input.weeks[0]!.fixed = false;
    const week = agendaPdf(input).pages[1] as AgendaWeekPage;
    expect(week.badge).toBe("Dans l'ordre, jours au choix");
    expect(week.days.map((day) => day.label)).toEqual(["Séance 1", "Séance 2", "Séance 3"]);
  });

  it("un bloc répété qui n'est pas un superset garde son nom (« Gainage · 4 tours »)", () => {
    const program = demoProgram(1);
    const session = program.weeks[0]!.sessions[1]!;
    const published = structuredClone(session.published!);
    if (published.content.discipline !== "strength") throw new Error("musculation attendue");
    published.content.items = [
      ...published.content.items.slice(0, 3),
      {
        id: "gainage",
        kind: "text",
        title: "Gainage",
        lines: [],
        repeat: { times: 4, lines: ["Planche 45 s", "Dead bug 10"] },
      },
    ];
    program.weeks[0]!.sessions[1] = { ...session, content: sessionToDisplay(published), published };
    const week = agendaPdf(program).pages[1] as AgendaWeekPage;
    const labels = week.days[2]!.sessions[0]!.lines.flatMap((line) =>
      line.kind === "group" ? [line.label] : [],
    );
    expect(labels).toEqual(["Superset · 3 tours", "Gainage · 4 tours"]);
  });

  it("fiche : toute la musculation, un Hyrox trop long pour une carte, jamais le Running", () => {
    expect(hasFiche(sessionToDisplay(strength(40)))).toBe(true);
    expect(hasFiche(sessionToDisplay(hyrox(3)))).toBe(true);
    expect(hasFiche(sessionToDisplay(running(50)))).toBe(false);
  });

  it("une semaine trop chargée tient sur sa page : séances raccourcies et « détail dans Coory »", () => {
    const day = {
      label: "Lundi",
      date: "9 nov.",
      sessions: Array.from({ length: 3 }, () => ({
        discipline: "running" as const,
        title: "Fractionné",
        meta: "≈ 50 min",
        lines: Array.from({ length: 6 }, (_, i) => ({
          kind: "line" as const,
          text: `${i + 1} min`,
        })),
        fiche: null,
        cut: false,
      })),
    };
    const sessions = fitWeek(Array.from({ length: 7 }, () => day)).flatMap((d) => d.sessions);
    expect(sessions.some((session) => session.cut)).toBe(true);
    expect(sessions.filter((s) => s.cut).every((s) => s.lines.length <= 3)).toBe(true);
  });

  it("une musculation listée se raccourcit aussi, et garde son renvoi à la fiche", () => {
    const day = {
      label: "Lundi",
      date: "9 nov.",
      sessions: Array.from({ length: 3 }, () => ({
        discipline: "strength" as const,
        title: "Force",
        meta: "≈ 60 min",
        lines: Array.from({ length: 6 }, (_, i) => ({
          kind: "line" as const,
          text: `Exercice ${i + 1} 4 × 6`,
        })),
        fiche: { summary: null },
        cut: false,
      })),
    };
    const sessions = fitWeek(Array.from({ length: 7 }, () => day)).flatMap((d) => d.sessions);
    expect(sessions.some((session) => session.cut)).toBe(true);
    expect(
      sessions.filter((s) => s.cut).every((s) => s.lines.length <= 3 && s.fiche !== null),
    ).toBe(true);
  });
});

// D-180 (demande d'Antonino du 14/11) : la discipline du programme se lit dans le PDF, pour toutes les
// disciplines ; un ancien programme (v1, sans discipline) garde les textes d'avant.
describe("PDF : discipline du programme", () => {
  it("un libellé par discipline", () => {
    expect(programKindLabel("running")).toBe("Programme running");
    expect(programKindLabel("strength")).toBe("Programme musculation");
    expect(programKindLabel("hyrox")).toBe("Programme Hyrox");
    expect(programKindLabel("hybrid")).toBe("Programme hybride");
    expect(programKindLabel(null)).toBeNull();
  });
  it("en-tête et sommaire de l'agenda", () => {
    const pdf = agendaPdf(demoProgram(6));
    expect(pdf.headerSubtitle).toBe("Programme hybride · Agenda · 6 semaines");
    expect(pdf.pages[0]).toMatchObject({ kind: "toc", kicker: "Programme hybride · Sommaire" });
  });
  it("sans discipline (v1) : les textes d'avant", () => {
    const pdf = agendaPdf({ ...demoProgram(6), discipline: null });
    expect(pdf.headerSubtitle).toBe("Agenda du programme · 6 semaines");
    expect(pdf.pages[0]).toMatchObject({ kind: "toc", kicker: "Sommaire" });
  });
});

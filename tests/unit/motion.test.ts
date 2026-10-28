import { describe, expect, it } from "vitest";

import { project, releaseVelocity, rubberband, springCurve } from "@/lib/motion";

// Mouvement (audit apple-design, 28/10) : ressorts, élan, résistance aux bords.
describe("springCurve", () => {
  it("va de 0 à 1 sans rebond (ressort critique)", () => {
    const { easing, duration } = springCurve({ response: 0.34 });
    const points = easing
      .replace(/^linear\(|\)$/g, "")
      .split(", ")
      .map(Number);
    expect(points[0]).toBe(0);
    expect(points.at(-1)).toBe(1);
    expect(points.every((p, i) => i === 0 || p >= points[i - 1])).toBe(true);
    expect(Math.max(...points)).toBeLessThanOrEqual(1);
    expect(duration).toBeGreaterThan(300);
    expect(duration).toBeLessThan(700);
  });

  it("part plus vite quand le doigt lâche avec de l'élan", () => {
    const still = springCurve({ response: 0.34 })
      .easing.split(", ")
      .map((p) => parseFloat(p.replace("linear(", "")));
    const thrown = springCurve({ response: 0.34 }, 4)
      .easing.split(", ")
      .map((p) => parseFloat(p.replace("linear(", "")));
    expect(thrown[2]).toBeGreaterThan(still[2]);
  });
});

describe("élan et bords", () => {
  it("projette la course d'un geste lancé, comme un défilement", () => {
    expect(project(0)).toBe(0);
    expect(project(1000)).toBeCloseTo(499, 0);
    expect(project(-1000)).toBeCloseTo(-499, 0);
  });

  it("résiste de plus en plus au-delà d'une limite", () => {
    const small = rubberband(20, 600);
    const big = rubberband(200, 600);
    expect(small).toBeLessThan(20);
    expect(big).toBeLessThan(200);
    expect(big / 200).toBeLessThan(small / 20);
  });

  it("mesure la vitesse sur les 100 dernières millisecondes", () => {
    const points = [
      { y: 0, t: 0 },
      { y: 10, t: 400 },
      { y: 40, t: 450 },
      { y: 60, t: 500 },
    ];
    // De t = 400 à 500 ms : 50 px en 100 ms (le début lent du geste est ignoré).
    expect(releaseVelocity(points)).toBeCloseTo(500, 0);
    expect(releaseVelocity([{ y: 5, t: 10 }])).toBe(0);
  });
});

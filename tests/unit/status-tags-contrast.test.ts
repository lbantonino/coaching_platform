import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { athleteStatusTags } from "@/features/athletes/schemas";

// Étiquettes de statut d'un sportif (16/11/2026 : plus de pastilles) : le texte coloré sur son fond
// teinté, posé sur une carte (--surface), reste lisible (WCAG AA, 4,5:1) en sombre ET en clair.
const css = readFileSync(join(process.cwd(), "src/styles/tokens.css"), "utf8");

function tokens(theme: "dark" | "light"): Map<string, string> {
  const start = css.indexOf(`[data-theme="${theme}"] {`);
  const block = css.slice(start, css.indexOf("\n}", start));
  const map = new Map<string, string>();
  for (const match of block.matchAll(/--([\w-]+):\s*([^;]+);/g))
    map.set(match[1]!, match[2]!.trim());
  return map;
}

type Rgba = [number, number, number, number];
function parse(value: string): Rgba {
  const hex = /^#([0-9a-f]{6})$/i.exec(value);
  if (hex) {
    const n = Number.parseInt(hex[1]!, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const rgba = /^rgba?\(([^)]+)\)$/.exec(value);
  if (!rgba) throw new Error(`Couleur non lue : ${value}`);
  const [r, g, b, a = "1"] = rgba[1]!.split(",").map((part) => part.trim());
  return [Number(r), Number(g), Number(b), Number(a)];
}
const over = ([r, g, b, a]: Rgba, [R, G, B]: Rgba): Rgba => [
  r * a + R * (1 - a),
  g * a + G * (1 - a),
  b * a + B * (1 - a),
  1,
];
const luminance = ([r, g, b]: Rgba) => {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const ratio = (a: Rgba, b: Rgba) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

describe("étiquettes de statut d'un sportif", () => {
  for (const theme of ["dark", "light"] as const) {
    const map = tokens(theme);
    const surface = parse(map.get("surface")!);
    for (const [status, classes] of Object.entries(athleteStatusTags)) {
      it(`${status}, thème ${theme === "dark" ? "sombre" : "clair"} : contraste AA (≥ 4,5)`, () => {
        const bg = /bg-([\w-]+)/.exec(classes)![1]!;
        const text = /text-([\w-]+)/.exec(classes)![1]!;
        const fill = over(parse(map.get(bg)!), surface);
        expect(ratio(parse(map.get(text)!), fill)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});

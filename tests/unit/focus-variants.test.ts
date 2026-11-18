import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

// Tailwind 4 lit les variantes de gauche à droite : « after:focus-visible:outline-2 » vise
// « .x::after:focus-visible », qui ne correspond jamais ; le contour de focus d'une carte cliquable
// restait invisible au clavier (relecture du 17/11). L'ordre juste est « focus-visible:after:… ».
const ROOT = join(process.cwd(), "src");
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });

describe("focus visible des cartes cliquables", () => {
  it("aucune classe « after:focus-visible: » (ordre de variantes qui ne marche jamais)", () => {
    const found = files(ROOT).flatMap((path) =>
      readFileSync(path, "utf8")
        .split("\n")
        .flatMap((line, i) =>
          line.includes("after:focus-visible:") ? [`${relative(ROOT, path)}:${i + 1}`] : [],
        ),
    );
    expect(found).toEqual([]);
  }, 30_000);
});

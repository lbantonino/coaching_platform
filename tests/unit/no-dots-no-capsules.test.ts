import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

// Règle d'Antonino du 16/11/2026 (D-188) : plus AUCUNE pastille (petit rond de couleur) et des
// étiquettes en rectangles aux coins arrondis, JAMAIS en capsule. Ce test lit le code de l'app et
// signale une classe qui redessinerait l'un ou l'autre. Exceptions voulues (planche validée) : les
// commandes (boutons de choix, puces de filtre, suggestions), boutons radio, curseur d'un graphique,
// points d'une frise ; chacune listée ci-dessous par son fichier et un extrait de sa classe.
const ROOT = join(process.cwd(), "src");

const allowed: { file: string; snippet: string; why: string }[] = [
  {
    file: "components/blocks/assistant.tsx",
    snippet: "tap-44 inline-flex h-9",
    why: "suggestions, boutons",
  },
  {
    file: "components/blocks/session-form.tsx",
    snippet: "tap-44 group inline-flex h-10",
    why: "choix",
  },
  {
    file: "components/ui/form-styles.ts",
    snippet: "group inline-flex",
    why: "choix d'un formulaire",
  },
  { file: "components/ui/form-styles.ts", snippet: "has-checked:before:content", why: "choix" },
  { file: "components/ui/dialog-styles.ts", snippet: "group inline-flex h-[38px]", why: "choix" },
  { file: "components/ui/chip-group.tsx", snippet: "h-9 rounded-[18px]", why: "puces de filtre" },
  {
    file: "app/(coach)/coach/bibliotheque/exercise-form.tsx",
    snippet: "tap-44 group inline-flex h-10",
    why: "choix",
  },
  {
    file: "app/(coach)/coach/o/[orgId]/sportifs/[athleteId]/references-board.tsx",
    snippet: "size-[9px] rounded-full bg-surface",
    why: "curseur du graphique",
  },
  {
    file: "app/(coach)/coach/o/[orgId]/programmes/_session/strength-parts.tsx",
    snippet: "-left-[15px] -mt-1 size-2 rounded-full",
    why: "frise du superset",
  },
  {
    file: "app/(coach)/coach/o/[orgId]/agenda/seances/[sessionId]/page.tsx",
    snippet: "size-2.5 rounded-full bg-surface inset-ring",
    why: "frise du déroulé",
  },
  {
    file: "components/blocks/upcoming-days.tsx",
    snippet: "-left-[27px] size-3 rounded-full",
    why: "frise des prochains jours",
  },
  {
    file: "components/layout/account-kind-cards.tsx",
    snippet: "size-2.5 rounded-full group-has-checked",
    why: "bouton radio",
  },
  {
    file: "components/ui/radio-choice.tsx",
    snippet: "rounded-full bg-on-cta",
    why: "bouton radio",
  },
  {
    file: "app/(coach)/coach/o/[orgId]/sportifs/[athleteId]/athlete-agenda.tsx",
    snippet: "inline-flex min-h-9 items-center rounded-pill",
    why: "sélecteur Semaine / Mois",
  },
];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(tsx?|css)$/.test(name) && !name.endsWith(".d.ts") ? [path] : [];
  });
}

const height = (token: string): number | null => {
  const scale = /^h-(\d+(?:\.\d+)?)$/.exec(token);
  if (scale) return Number(scale[1]) * 4;
  const px = /^h-\[(\d+(?:\.\d+)?)px\]$/.exec(token);
  return px ? Number(px[1]) : null;
};
const radius = (token: string): number | null => {
  if (token === "rounded-full" || token === "rounded-pill") return 999;
  const px = /^rounded-\[(\d+(?:\.\d+)?)px\]$/.exec(token);
  if (px) return Number(px[1]);
  return ({ "rounded-xl": 12, "rounded-2xl": 16 } as Record<string, number>)[token] ?? null;
};

// Une ligne de classes : une étiquette en capsule (du texte, ≤ 30 px de haut, arrondi ≥ moitié de la
// hauteur, pour une même variante ; ou arrondi complet sans hauteur fixée), ou un point (≤ 12 px).
function problem(line: string): string | null {
  const tokens = line.split(/[\s"'`{}]+/);
  if (/\btext-(\[|xs\b)/.test(line)) {
    const byVariant = new Map<string, { h?: number; r?: number }>();
    for (const token of tokens) {
      const cut = token.lastIndexOf(":");
      const variant = cut === -1 ? "" : token.slice(0, cut);
      const base = token.slice(cut + 1);
      const entry = byVariant.get(variant) ?? {};
      const h = height(base);
      const r = radius(base);
      if (h !== null) entry.h = h;
      if (r !== null) entry.r = r;
      byVariant.set(variant, entry);
    }
    const base = byVariant.get("") ?? {};
    // Sans hauteur fixée : un texte arrondi en entier avec une marge de côté est une capsule.
    const round = tokens.some((token) => token === "rounded-full" || token === "rounded-pill");
    const padded = tokens.some((token) => /^p[xl]-/.test(token));
    const sized = tokens.some((token) => height(token.slice(token.lastIndexOf(":") + 1)) !== null);
    if (round && padded && !sized)
      return "étiquette en capsule (arrondi complet, hauteur par la marge)";
    for (const [variant, entry] of byVariant) {
      const h = entry.h ?? base.h;
      const r = entry.r ?? (variant ? base.r : undefined);
      if (h !== undefined && r !== undefined && h <= 30 && r >= h / 2 - 0.01) {
        return `étiquette en capsule (${variant || "base"} : ${h} px de haut, arrondi ${r})`;
      }
    }
  }
  if (
    tokens.includes("rounded-full") &&
    tokens.some((token) => /^size-(1|1\.5|2|2\.5|3|\[(?:[3-9]|1[0-2])px\])$/.test(token))
  ) {
    return "pastille (petit rond)";
  }
  return null;
}

describe("plus de pastilles, plus d'étiquettes en capsule (D-188)", () => {
  it("aucune classe ne redessine une pastille ou une étiquette en capsule", () => {
    const found: string[] = [];
    for (const path of files(ROOT)) {
      const file = relative(ROOT, path);
      readFileSync(path, "utf8")
        .split("\n")
        .forEach((line, index) => {
          const issue = problem(line);
          if (!issue) return;
          if (allowed.some((entry) => entry.file === file && line.includes(entry.snippet))) return;
          found.push(`${file}:${index + 1} : ${issue}`);
        });
    }
    expect(found).toEqual([]);
    // Lit tout src/ : sous la charge de la suite complète, plus que les 5 s par défaut.
  }, 30_000);
});

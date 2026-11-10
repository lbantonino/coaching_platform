import type { ProgramSessionContent } from "./program-session";

// Lignes courtes d'une carte de séance dans l'agenda du programme (maquette 2c, AGD-01 à 04) : une
// info par ligne, sans graphique (« 20 min @ 6:00 », « 5 × 4 min @ 4:55 », « récup 1:45 »). Lues
// depuis la forme d'affichage commune à la v1 et à la v2. Fonction pure, testée par Vitest.

// « 20 min @6:00 min/km, allure progressive » -> « 20 min @ 6:00 » ;
// « 1:45 min de récupération (trot lent) » -> « récup 1:45 ».
export function shortLine(line: string): string {
  const recovery = /^(\S+)(?: min)? de (?:récupération|repos)/i.exec(line);
  if (recovery) return `${/repos/i.test(line) ? "repos" : "récup"} ${recovery[1]}`;
  return line
    .split(",")[0]!
    .replace(/ min\/km/g, "")
    .replace(/ ?\/500 ?m/g, " /500 m")
    .replace(/\s*@\s*/g, " @ ")
    .trim();
}

export function cardLines(content: Pick<ProgramSessionContent, "steps">, max = 4): string[] {
  const lines = content.steps.flatMap((step) => {
    if (step.repeat) {
      const [first, ...rest] = step.repeat.lines;
      return [`${step.repeat.times} × ${shortLine(first ?? step.title)}`, ...rest.map(shortLine)];
    }
    // Musculation : « Exercices · 2 exercices » se lit par sa pastille.
    if (step.title === "Exercices" && step.badge) return [step.badge];
    return [shortLine(step.lines[0] ?? step.badge ?? step.title)];
  });
  return lines.slice(0, max);
}

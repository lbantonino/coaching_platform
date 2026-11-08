import type { ProgramSessionStep } from "@/domain/training/program-session";

// Lecture, pour l'affichage, d'une séance de programme écrite en texte (D-46, tranche 1) : durées,
// allures et récupérations de ses lignes, pour la page d'une séance (maquette « Sportifs » du
// 03/11/2026, page 2d). L'éditeur de programmes (P4) enregistrera ces valeurs directement ; d'ici
// là, une ligne qui n'est pas comprise s'affiche telle quelle. Le calcul du graphique « Déroulé de
// la séance » a été retiré avec lui (D-152). Fonctions pures, testées par Vitest.

export type SegmentKind = "effort" | "recovery";

// Une ligne d'un bloc répété : « Effort · 4:55 min/km · 4 min ».
export type Segment = {
  kind: SegmentKind;
  label: string;
  detail: string | null;
  // Ce qui s'écrit à droite : « 4 min », « 1 km », « 10 ».
  value: string | null;
};

const PACE = String.raw`(\d{1,2}:[0-5]\d)\s*min\/km`;

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const isRecoveryLine = (line: string) => /récup|repos|marche|retour en/i.test(line);

export function parseSegment(line: string): Segment {
  const text = line.trim();
  // « 4 min @4:55 min/km » : un effort en durée.
  let match = new RegExp(String.raw`^(\d+(?::[0-5]\d)?)\s*min\s*@\s*${PACE}$`, "i").exec(text);
  if (match) {
    return {
      kind: "effort",
      label: "Effort",
      detail: `${match[2]} min/km`,
      value: `${match[1]} min`,
    };
  }
  // « 1 km @5:15 min/km », « Run 1 km @5:15 min/km » : un effort en distance.
  match = new RegExp(
    String.raw`^(?:(\D+?)\s+)?(\d+(?:[.,]\d+)?)\s*(km|m)\s*@\s*${PACE}$`,
    "i",
  ).exec(text);
  if (match) {
    return {
      kind: "effort",
      label: match[1] ? capitalize(match[1]) : "Effort",
      detail: `${match[4]} min/km`,
      value: `${match[2]} ${match[3]}`,
    };
  }
  // « 1:45 min de récupération (trot lent) ».
  match = /^(\d+(?::[0-5]\d)?)\s*min\s+de\s+récupération(?:\s*\((.+)\))?$/i.exec(text);
  if (match) {
    return {
      kind: "recovery",
      label: "Récupération",
      detail: match[2] ? capitalize(match[2]) : null,
      value: `${match[1]} min`,
    };
  }
  // « Goblet squat · 10 » : un exercice et sa quantité.
  match = /^(.+?)\s+·\s+(.+)$/.exec(text);
  if (match) {
    return {
      kind: isRecoveryLine(text) ? "recovery" : "effort",
      label: match[1],
      detail: null,
      value: match[2],
    };
  }
  return {
    kind: isRecoveryLine(text) ? "recovery" : "effort",
    label: text,
    detail: null,
    value: null,
  };
}

export type StepRole = "warmup" | "cooldown" | "main";

export function stepRole(step: ProgramSessionStep): StepRole {
  const title = step.title.toLowerCase();
  if (title.startsWith("échauffement")) return "warmup";
  if (title.startsWith("retour au calme")) return "cooldown";
  return "main";
}

// Ligne d'une étape sans la durée déjà écrite à droite :
// « 20 min @6:00 min/km, allure progressive » → « À 6:00 min/km, allure progressive ».
export function stepLine(line: string, badge?: string): string {
  if (!badge) return line;
  const escaped = badge.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const prefix = new RegExp(String.raw`^${escaped}\s*@\s*`);
  return prefix.test(line) ? line.replace(prefix, "À ") : line;
}

import { formatPace, paceToSpeedKmh } from "@/domain/training/pace";
import { formatDate } from "@/lib/format";

import { formatReferenceValue } from "./format";
import type { ReferenceEntry } from "./queries";
import { referenceKindLabels, referenceSourceLabels, type ReferenceKind } from "./schemas";

// Courbes d'évolution des repères (P2-04 étape 3). Module PUR : aucune base, aucune interface,
// testé par Vitest. La page le calcule côté serveur et passe le résultat au graphique.

// Couleur d'un repère (D-25), partagée par les tuiles et le graphique : allures en bleu Running,
// race pace en orange Hyrox, fréquences cardiaques en rouge, charges en violet Musculation.
export type ReferenceTone = "run" | "hyrox" | "heart" | "strength";

export function referenceTone(kind: ReferenceKind): ReferenceTone {
  if (kind === "pace_race") return "hyrox";
  if (kind.startsWith("pace_")) return "run";
  if (kind.startsWith("hr_")) return "heart";
  return "strength";
}

// Unité de l'axe : la VMA est une vitesse, les autres allures restent en min/km.
export type SeriesUnit = "km/h" | "min/km" | "bpm" | "kg";

export type SeriesPoint = {
  id: string;
  // Jours depuis le 1er janvier 1970 (UTC) : position horizontale proportionnelle au temps écoulé.
  day: number;
  dateLabel: string;
  value: number;
  valueLabel: string;
  sourceLabel: string;
};

export type ReferenceSeries = {
  key: string;
  kind: ReferenceKind;
  title: string;
  tone: ReferenceTone;
  unit: SeriesUnit;
  // Allure : une valeur plus petite est plus rapide, donc l'axe est inversé (le progrès monte) ; de
  // même pour la FC de repos (plus basse = mieux, maquette « Sportifs », page 2g).
  inverted: boolean;
  points: SeriesPoint[];
  // Graduations de l'axe vertical (valeurs et libellés), calculées ici pour que le graphique reste simple.
  ticks: { value: number; label: string }[];
  progress: string | null;
};

// Clé d'un repère : son type, ou son exercice pour une charge (une courbe par exercice). Partagée par
// les cartes et le graphique de l'onglet Repères.
export function seriesKey(entry: Pick<ReferenceEntry, "kind" | "exercise">): string {
  return entry.kind === "strength_load"
    ? `strength_load:${entry.exercise?.trim().toLowerCase() ?? ""}`
    : entry.kind;
}

// Valeur tracée : vitesse pour la VMA, milieu de plage pour une allure, bpm, ou charge en kg.
function plottedValue(entry: ReferenceEntry): { unit: SeriesUnit; value: number } | null {
  if (entry.kind === "pace_vma" && entry.paceMin !== null) {
    return { unit: "km/h", value: paceToSpeedKmh(entry.paceMin) };
  }
  if (entry.paceMin !== null && entry.paceMax !== null) {
    return { unit: "min/km", value: (entry.paceMin + entry.paceMax) / 2 };
  }
  if (entry.bpm !== null) return { unit: "bpm", value: entry.bpm };
  if (entry.loadKg !== null) return { unit: "kg", value: entry.loadKg };
  return null;
}

function dayNumber(isoDay: string): number {
  return Math.round(Date.parse(`${isoDay}T00:00:00Z`) / 86_400_000);
}

// Regroupe l'historique (du plus récent au plus ancien, comme listReferences) en une série par repère
// (par exercice pour les charges), points du plus ancien au plus récent. Deux mesures le même jour :
// seule la plus récente compte, comme pour la valeur actuelle.
export function buildReferenceSeries(history: ReferenceEntry[]): ReferenceSeries[] {
  const byKey = new Map<string, ReferenceSeries>();
  for (const entry of history) {
    const plotted = plottedValue(entry);
    if (!plotted) continue;
    const key = seriesKey(entry);
    let series = byKey.get(key);
    if (!series) {
      series = {
        key,
        kind: entry.kind,
        title:
          entry.kind === "strength_load" && entry.exercise
            ? entry.exercise.trim()
            : referenceKindLabels[entry.kind],
        tone: referenceTone(entry.kind),
        unit: plotted.unit,
        inverted: plotted.unit === "min/km" || entry.kind === "hr_rest",
        points: [],
        ticks: [],
        progress: null,
      };
      byKey.set(key, series);
    }
    const day = dayNumber(entry.measuredOn);
    if (series.points.some((point) => point.day === day)) continue;
    series.points.push({
      id: entry.id,
      day,
      dateLabel: formatDate(entry.measuredOn),
      value: plotted.value,
      valueLabel: formatReferenceValue(entry),
      sourceLabel: referenceSourceLabels[entry.source],
    });
  }

  // Ordre fixe : celui des types de repères (allures, FC, charges), puis exercices par ordre alphabétique.
  const order = Object.keys(referenceKindLabels);
  return [...byKey.values()]
    .map((series) => {
      const points = series.points.reverse();
      const values = points.map((point) => point.value);
      const ticks = niceTicks(Math.min(...values), Math.max(...values), series.unit).map(
        (value) => ({ value, label: formatAxisValue(value, series.unit) }),
      );
      const done = { ...series, points, ticks };
      return { ...done, progress: describeProgress(done) };
    })
    .sort(
      (a, b) =>
        order.indexOf(a.kind) - order.indexOf(b.kind) || a.title.localeCompare(b.title, "fr"),
    );
}

const numberFr = new Intl.NumberFormat("fr-BE", { maximumFractionDigits: 1 });
// L'axe garde deux décimales : un pas de 0,25 ne doit pas s'afficher « 13,8 » au lieu de 13,75.
const axisFr = new Intl.NumberFormat("fr-BE", { maximumFractionDigits: 2 });

// Graduation de l'axe vertical dans l'unité de la série.
export function formatAxisValue(value: number, unit: SeriesUnit): string {
  return unit === "min/km" ? formatPace(value) : axisFr.format(value);
}

// Évolution entre la première et la dernière mesure, en mots (« 0,9 km/h de plus depuis le … »).
export function describeProgress(series: ReferenceSeries): string | null {
  if (series.points.length < 2) return null;
  const first = series.points[0];
  const last = series.points[series.points.length - 1];
  const diff = last.value - first.value;
  const since = `depuis le ${first.dateLabel}`;
  if (Math.abs(diff) < 0.05) return `Stable ${since}`;
  if (series.unit === "min/km") {
    const seconds = Math.round(Math.abs(diff));
    return `${seconds} s/km plus ${diff < 0 ? "rapide" : "lente"} ${since}`;
  }
  return `${numberFr.format(Math.abs(diff))} ${series.unit} de ${diff > 0 ? "plus" : "moins"} ${since}`;
}

// Graduations « rondes » couvrant [min, max] (pas de 1, 2, 2,5 ou 5 × 10^n ; 5 s, 10 s, 15 s… pour
// une allure). Une seule valeur ou des valeurs égales : on ouvre une marge autour.
export function niceTicks(min: number, max: number, unit: SeriesUnit, target = 4): number[] {
  let low = min;
  let high = max;
  if (high - low < 1e-9) {
    const pad = unit === "min/km" ? 10 : Math.max(Math.abs(low) * 0.05, 1);
    low -= pad;
    high += pad;
  }
  const steps = unit === "min/km" ? [5, 10, 15, 20, 30, 60, 120] : niceSteps((high - low) / target);
  const rough = (high - low) / target;
  const step = steps.find((candidate) => candidate >= rough) ?? steps[steps.length - 1];
  const start = Math.floor(low / step) * step;
  const end = Math.ceil(high / step) * step;
  const ticks: number[] = [];
  for (let value = start; value <= end + step / 2; value += step) {
    ticks.push(Math.round(value * 1000) / 1000);
  }
  return ticks;
}

function niceSteps(rough: number): number[] {
  const power = 10 ** Math.floor(Math.log10(rough));
  return [1, 2, 2.5, 5, 10].map((factor) => factor * power);
}

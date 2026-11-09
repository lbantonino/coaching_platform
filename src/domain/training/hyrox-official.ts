import type { HyroxDivision } from "./program-plan";
import type { HyroxStation } from "./session-v2";

// Charges et volumes OFFICIELS HYROX (BR-15, C-10). Source : règlements officiels de la saison 26/27
// (Singles p. 8 et p. 35, Doubles p. 8, Relay p. 8), téléchargés depuis hyrox.com le 09/11/2026.
// À REVÉRIFIER à chaque nouvelle saison. Les poids des traîneaux comprennent le traîneau ; le farmers
// carry se donne PAR MAIN. La course : 8 × 1 km.

export const HYROX_RULEBOOK_SEASON = "26/27";

// Les trois colonnes du règlement.
type LoadColumn = "women_open" | "men_open_women_pro" | "men_pro";

type StationRule = { meters?: number; reps?: number; loadKg?: Record<LoadColumn, number> };

export const HYROX_STATION_RULES: Record<HyroxStation, StationRule> = {
  skierg: { meters: 1000 },
  sled_push: { meters: 50, loadKg: { women_open: 102, men_open_women_pro: 152, men_pro: 202 } },
  sled_pull: { meters: 50, loadKg: { women_open: 78, men_open_women_pro: 103, men_pro: 153 } },
  burpee_broad_jumps: { meters: 80 },
  rowing: { meters: 1000 },
  farmers_carry: { meters: 200, loadKg: { women_open: 16, men_open_women_pro: 24, men_pro: 32 } },
  sandbag_lunges: { meters: 100, loadKg: { women_open: 10, men_open_women_pro: 20, men_pro: 30 } },
  wall_balls: { reps: 100, loadKg: { women_open: 4, men_open_women_pro: 6, men_pro: 9 } },
};

export const HYROX_RUN_METERS = 1000;

export const hyroxStationLabels: Record<HyroxStation, string> = {
  skierg: "SkiErg",
  sled_push: "Sled push",
  sled_pull: "Sled pull",
  burpee_broad_jumps: "Burpee broad jumps",
  rowing: "Rameur",
  farmers_carry: "Farmers carry",
  sandbag_lunges: "Fentes sandbag",
  wall_balls: "Wall balls",
};

export const hyroxDivisionLabels: Record<HyroxDivision, string> = {
  women_open: "Open Femmes",
  men_open: "Open Hommes",
  women_pro: "Pro Femmes",
  men_pro: "Pro Hommes",
  doubles_women: "Doubles Femmes",
  doubles_men: "Doubles Hommes",
  doubles_mixed: "Doubles Mixte",
  doubles_women_pro: "Doubles Femmes Pro",
  doubles_men_pro: "Doubles Hommes Pro",
  relay: "Relais",
};

export type AthleteSex = "female" | "male" | "unspecified" | null;

// Colonne de charges d'une division. Doubles Mixte : la colonne du milieu pour les deux partenaires.
// Relais : la colonne Open du sexe du sportif (déduit du tableau du règlement) ; sexe inconnu = null.
function loadColumn(division: HyroxDivision, sex: AthleteSex): LoadColumn | null {
  switch (division) {
    case "women_open":
    case "doubles_women":
      return "women_open";
    case "men_open":
    case "women_pro":
    case "doubles_men":
    case "doubles_mixed":
    case "doubles_women_pro":
      return "men_open_women_pro";
    case "men_pro":
    case "doubles_men_pro":
      return "men_pro";
    case "relay":
      return sex === "female" ? "women_open" : sex === "male" ? "men_open_women_pro" : null;
  }
}

// Charge officielle d'une station pour une division, en kg (par main pour le farmers carry) ;
// null si la station n'a pas de charge ou si la division ne suffit pas à la connaître.
export function officialLoadKg(
  station: HyroxStation,
  division: HyroxDivision,
  sex: AthleteSex,
): number | null {
  const loads = HYROX_STATION_RULES[station].loadKg;
  const column = loadColumn(division, sex);
  return loads && column ? loads[column] : null;
}

// Hauteur de cible des wall balls : selon le sexe de chacun (2,70 m femmes, 3,00 m hommes).
export function wallBallTargetMeters(sex: AthleteSex): number | null {
  return sex === "female" ? 2.7 : sex === "male" ? 3 : null;
}

// Division pré-remplie depuis l'objectif (« open, pro, doubles, relay ») et le sexe, quand c'est
// sans ambiguïté. Doubles : femmes ou hommes par défaut (le mixte se choisit dans l'assistant).
export function defaultHyroxDivision(
  category: "open" | "pro" | "doubles" | "relay" | null,
  sex: AthleteSex,
): HyroxDivision | null {
  if (category === "relay") return "relay";
  if (sex !== "female" && sex !== "male") return null;
  const women = sex === "female";
  switch (category) {
    case "open":
      return women ? "women_open" : "men_open";
    case "pro":
      return women ? "women_pro" : "men_pro";
    case "doubles":
      return women ? "doubles_women" : "doubles_men";
    default:
      return null;
  }
}

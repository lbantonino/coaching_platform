// Mouvement de l'interface (audit apple-design du 28/10) : des ressorts plutôt que des durées fixes.
// Règles PURES (testées par Vitest), sans bibliothèque : le navigateur anime avec l'API Web
// Animations et une courbe `linear()` calculée ici, ce qui permet de reprendre la vitesse du doigt
// au moment où il lâche (pas de « couture » entre le glissé et l'animation).

// Ressort critique (amortissement 1, aucun rebond) : `response` = rapidité, en secondes (Apple :
// 0,3 à 0,4 pour l'interface). Ce n'est pas une durée : la fin du mouvement découle des paramètres.
export type Spring = { response: number };
export const SHEET_SPRING: Spring = { response: 0.34 };

// Courbe d'un ressort critique allant de 0 à 1, avec une vitesse de départ `velocity` exprimée en
// « distance totale par seconde » (vitesse du doigt / distance qui reste à parcourir). Renvoie la
// courbe CSS `linear(...)` et la durée utile (jusqu'à ce que l'écart devienne imperceptible).
export function springCurve(
  spring: Spring,
  velocity = 0,
  samples = 32,
): { easing: string; duration: number } {
  const omega = (2 * Math.PI) / spring.response;
  // Écart au but x(t) = (x0 + (v0 + ω·x0)·t)·e^(−ω·t), avec x0 = 1 (au départ) et v0 = −velocity.
  const offset = (t: number) => (1 + (-velocity + omega) * t) * Math.exp(-omega * t);
  // Durée : jusqu'à ce que l'écart reste sous 0,1 % (plafonnée, pour une vitesse extrême).
  let duration = 0.05;
  while (duration < 2 && Math.abs(offset(duration)) > 0.001) duration += 0.01;
  const points: string[] = [];
  for (let i = 0; i <= samples; i += 1) {
    const progress = 1 - offset((duration * i) / samples);
    points.push(String(Math.round(progress * 10_000) / 10_000));
  }
  points[points.length - 1] = "1";
  return { easing: `linear(${points.join(", ")})`, duration: Math.round(duration * 1000) };
}

// Où un geste « lancé » finirait sa course (fonction de l'échantillon Apple « Designing Fluid
// Interfaces ») : vitesse en px/s, décélération ≈ 0,998 comme un défilement.
export function project(velocity: number, decelerationRate = 0.998): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

// Résistance progressive au-delà d'une limite : plus on tire, moins l'élément suit.
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

// Vitesse (px/s) à partir des derniers points d'un glissé : seulement les 100 dernières ms, pour
// mesurer le geste au moment où le doigt lâche, pas sa moyenne depuis le début.
export function releaseVelocity(points: { y: number; t: number }[]): number {
  if (points.length < 2) return 0;
  const last = points[points.length - 1];
  const recent = points.filter((point) => last.t - point.t <= 100);
  const first = recent[0] ?? points[0];
  const dt = last.t - first.t;
  return dt > 0 ? ((last.y - first.y) / dt) * 1000 : 0;
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Courbe `linear()` (Chrome 113, Safari 17.2, Firefox 112) ; sinon la courbe des feuilles d'iOS.
export function easingFor(curve: { easing: string }): string {
  if (typeof CSS !== "undefined" && CSS.supports("transition-timing-function", "linear(0, 1)")) {
    return curve.easing;
  }
  return "cubic-bezier(0.32, 0.72, 0, 1)";
}

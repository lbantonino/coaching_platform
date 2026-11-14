// Les 7 modèles de programme Coory générés (D-177, liste validée par Antonino le 14/11/2026) :
// Réussir son 5 km, Améliorer son seuil, Améliorer sa vitesse (VMA), Développer sa force,
// Renforcement musculaire et hypertrophie, et deux programmes hybrides. Les 4 modèles plus anciens
// (Hyrox, 10 km, semi, marathon) restent écrits à la main dans supabase/content/modeles_coory.sql.
// Allures en % de VMA et zones de FC : recalculées pour chaque sportif ; charges en % du max ou
// choisies par le coach (RIR). Rien n'est publié : un coach part d'un modèle et l'ajuste.
import type { Phase, ProgramPlan, Week } from "@/domain/training/program-plan";
import type { SessionDraft, StrengthSet } from "@/domain/training/session-v2";

import {
  EX,
  cooldown,
  exercise,
  heldSets,
  kgSets,
  pctSets,
  recovery,
  repeat,
  runFor,
  session,
  strides,
  superset,
  vma,
  warmup,
  zone,
} from "./briques";

export type CooryTemplate = { id: string; plan: ProgramPlan };

// Modèle n° n : …1nn (…105 à …111). Les numéros …001 à …004 sont les modèles écrits à la main, et la
// graine de développement prend d'autres numéros du même bloc (…011, …0a1) pour ses modèles de coach.
const templateId = (n: number) => `7a000000-0000-4000-8000-${String(100 + n).padStart(12, "0")}`;

const week = (index: number, light: boolean, sessions: SessionDraft[]): Week => ({
  index,
  light,
  scheduling: "ordered",
  sessions,
});

const phases = (...list: [string, number, number][]): Phase[] =>
  list.map(([name, weekFrom, weekTo], i) => ({ id: `p${i + 1}`, name, weekFrom, weekTo }));

const plan = (
  title: string,
  discipline: ProgramPlan["discipline"],
  strength: "kg" | "pct",
  sessionsPerWeek: number,
  planPhases: Phase[],
  weeks: Week[],
): ProgramPlan => ({
  schemaVersion: 2,
  title,
  discipline,
  aimDefaults: { running: "hr", strength },
  sessionsPerWeek,
  phases: planPhases,
  weeks,
});

const range = (count: number) => Array.from({ length: count }, (_, i) => i + 1);

// ---------------------------------------------------------------------------
// Séances de course communes
// ---------------------------------------------------------------------------
const endurance = (key: string, min: number, withStrides = 0) =>
  session(
    key,
    withStrides
      ? {
          title: "Endurance et lignes droites",
          sessionType: "Endurance",
          objective: "Endurance et foulée relâchée",
          coachTip:
            "Allure facile : tu dois pouvoir parler en courant. Lignes droites progressives et relâchées, sans sprinter.",
        }
      : {
          title: "Endurance",
          sessionType: "Endurance",
          objective: "Développer l'endurance de base",
          coachTip: "Allure facile : tu dois pouvoir parler en courant.",
        },
    {
      discipline: "running",
      items: [
        runFor("s1", min, zone(2), { label: "Endurance" }),
        ...(withStrides ? [strides("l1", withStrides)] : []),
      ],
    },
  );

const longRun = (key: string, min: number, activeFinish = 0) =>
  session(
    key,
    {
      title: "Sortie longue",
      sessionType: "Sortie longue",
      objective: "Construire l'endurance de fond",
      coachTip: activeFinish
        ? `Reste en aisance respiratoire, puis finis les ${activeFinish} dernières minutes un cran plus vite, sans te mettre dans le rouge.`
        : "Reste en aisance respiratoire du début à la fin.",
    },
    {
      discipline: "running",
      items: activeFinish
        ? [
            runFor("s1", min - activeFinish, zone(2), { label: "Sortie longue" }),
            runFor("s2", activeFinish, zone(3), { label: "Fin en progression" }),
          ]
        : [runFor("s1", min, zone(2), { label: "Sortie longue" })],
    },
  );

// Fractionné : N × effort, entre un échauffement de 15 min et un retour au calme de 10 min.
const intervals = (
  key: string,
  text: { title: string; sessionType: string; objective: string; coachTip: string },
  times: number,
  effort: number | { m: number },
  percent: [number, number],
  recoveryMin: number,
  label: string,
  warmupMin = 15,
) =>
  session(key, text, {
    discipline: "running",
    items: [
      warmup(warmupMin),
      repeat("r1", times, effort, vma(...percent), recoveryMin, label),
      cooldown(10),
    ],
  });

const threshold = (key: string, times: number, min: number, recoveryMin: number, light = false) =>
  intervals(
    key,
    {
      title: "Seuil",
      sessionType: "Tempo",
      objective: "Repousser le seuil : tenir une allure soutenue plus longtemps",
      coachTip: light
        ? "Semaine allégée : garde l'allure, pas plus de répétitions."
        : "Allure confortablement difficile : tu peux dire quelques mots, pas tenir une conversation. Récupérations en trottinant.",
    },
    times,
    min,
    [85, 88],
    recoveryMin,
    "Seuil",
  );

// ---------------------------------------------------------------------------
// 5. Réussir son 5 km · 6 semaines, 3 séances
// ---------------------------------------------------------------------------
function fiveK(): CooryTemplate {
  const enduranceMin = [25, 30, 30, 35, 35, 20];
  const reps: [number, number, number][] = [
    [6, 1, 1],
    [8, 1, 1],
    [5, 2, 1.5],
    [6, 2, 1.5],
    [4, 3, 2],
  ];
  const longMin = [35, 40, 45, 45, 50];
  const weeks = range(6).map((w) => {
    const k = (n: number) => `t5-s${w}-${n}`;
    if (w === 6)
      return week(w, true, [
        endurance(k(1), enduranceMin[5] ?? 20, 4),
        intervals(
          k(2),
          {
            title: "Rappel allure 5 km",
            sessionType: "Tempo",
            objective: "Sentir l'allure de course sans fatigue",
            coachTip: "Court et facile : garde ta fraîcheur pour le jour J.",
          },
          3,
          2,
          [95, 95],
          2,
          "Allure 5 km",
        ),
        session(
          k(3),
          {
            title: "Jour J : 5 km",
            sessionType: "Compétition",
            objective: "Courir ton 5 km à l'allure travaillée",
            coachTip:
              "Premier kilomètre sur l'allure la plus lente de la plage, puis régulier. Accélère dans le dernier si tu peux. Tu es prêt.",
          },
          {
            discipline: "running",
            items: [
              warmup(15),
              {
                id: "s1",
                kind: "step",
                role: "run",
                label: "5 km",
                measure: { type: "distance", meters: 5000 },
                target: vma(93, 97),
              },
              cooldown(10),
            ],
          },
        ),
      ]);
    const [times, effort, rest] = reps[w - 1] ?? [6, 1, 1];
    return week(w, false, [
      endurance(k(1), enduranceMin[w - 1] ?? 30, w >= 3 ? 4 : 0),
      intervals(
        k(2),
        {
          title: "Fractionné allure 5 km",
          sessionType: "Fractionné",
          objective: "Habituer le corps à l'allure du 5 km",
          coachTip:
            "Récupérations en trottinant. Si l'allure ne tient plus, arrête les répétitions : la qualité compte plus que le nombre.",
        },
        times,
        effort,
        [95, 95],
        rest,
        "Allure 5 km",
      ),
      longRun(k(3), longMin[w - 1] ?? 40),
    ]);
  });
  return {
    id: templateId(5),
    plan: plan(
      "Réussir son 5 km",
      "running",
      "kg",
      3,
      phases(["Base", 1, 2], ["Développement", 3, 5], ["Affûtage", 6, 6]),
      weeks,
    ),
  };
}

// ---------------------------------------------------------------------------
// 6. Améliorer son seuil · 6 semaines, 3 séances
// ---------------------------------------------------------------------------
function thresholdPlan(): CooryTemplate {
  const enduranceMin = [40, 45, 50, 35, 50, 45];
  const reps: [number, number, number][] = [
    [3, 6, 2],
    [3, 8, 2],
    [4, 8, 2],
    [2, 8, 2],
    [3, 10, 2.5],
    [2, 15, 3],
  ];
  const longMin = [55, 60, 65, 45, 70, 60];
  const finish = [0, 10, 10, 0, 15, 15];
  const weeks = range(6).map((w) => {
    const k = (n: number) => `t6-s${w}-${n}`;
    const [times, min, rest] = reps[w - 1] ?? [3, 8, 2];
    return week(w, w === 4, [
      endurance(k(1), enduranceMin[w - 1] ?? 45),
      threshold(k(2), times, min, rest, w === 4),
      longRun(k(3), longMin[w - 1] ?? 60, finish[w - 1] ?? 0),
    ]);
  });
  return {
    id: templateId(6),
    plan: plan(
      "Améliorer son seuil",
      "running",
      "kg",
      3,
      phases(["Construction", 1, 3], ["Assimilation", 4, 4], ["Consolidation", 5, 6]),
      weeks,
    ),
  };
}

// ---------------------------------------------------------------------------
// 7. Améliorer sa vitesse (VMA) · 6 semaines, 3 séances
// ---------------------------------------------------------------------------
function speedPlan(): CooryTemplate {
  const enduranceMin = [35, 40, 40, 30, 40, 30];
  // VMA courte : blocs de 30/30 (nombre de blocs, répétitions par bloc).
  const shortBlocks: [number, number][] = [
    [2, 8],
    [2, 10],
    [3, 8],
    [2, 6],
    [3, 10],
    [2, 8],
  ];
  // VMA longue : N × distance, récupération en minutes.
  const longReps: [number, number, number][] = [
    [6, 400, 1.5],
    [8, 400, 1.5],
    [5, 800, 2],
    [4, 400, 1.5],
    [6, 800, 2],
  ];
  const weeks = range(6).map((w) => {
    const k = (n: number) => `t7-s${w}-${n}`;
    const light = w === 4 || w === 6;
    const [blocks, perBlock] = shortBlocks[w - 1] ?? [2, 8];
    const shortItems = range(blocks).flatMap((b) => [
      ...(b > 1 ? [recovery(`p${b}`, 3)] : []),
      repeat(`r${b}`, perBlock, 0.5, vma(100, 105), 0.5, "30 s vite"),
    ]);
    const short = session(
      k(2),
      {
        title: "VMA courte · 30/30",
        sessionType: "Fractionné",
        objective: "Développer la VMA",
        coachTip: light
          ? "Semaine allégée : même vitesse, moins de répétitions."
          : "30 s vite, 30 s de trot. Les dernières répétitions doivent aller aussi vite que les premières. 3 min de trot entre les blocs.",
      },
      { discipline: "running", items: [warmup(15), ...shortItems, cooldown(10)] },
    );
    const third =
      w === 6
        ? session(
            k(3),
            {
              title: "Test de Cooper (12 min)",
              sessionType: "Test",
              objective: "Mesurer les progrès de ta VMA",
              coachTip:
                "Cours le plus loin possible en 12 min, sur piste si tu peux, puis note la distance et donne-la à ton coach : elle sert à recalculer ta VMA.",
            },
            {
              discipline: "running",
              items: [
                warmup(20),
                {
                  id: "s1",
                  kind: "step",
                  role: "run",
                  label: "Test de Cooper",
                  measure: { type: "time", seconds: 720 },
                  note: "Le plus loin possible en 12 min : note la distance parcourue.",
                },
                cooldown(10),
              ],
            },
          )
        : (() => {
            const [times, m, rest] = longReps[w - 1] ?? [6, 400, 1.5];
            return intervals(
              k(3),
              {
                title: `VMA longue · ${times} × ${m} m`,
                sessionType: "Fractionné",
                objective: "Tenir une allure proche de la VMA plus longtemps",
                coachTip: light
                  ? "Semaine allégée : garde l'allure, pas plus de répétitions."
                  : "Récupérations en trottinant. Régularité avant tout : toutes les répétitions à la même allure.",
              },
              times,
              { m },
              [95, 100],
              rest,
              `${m} m`,
              20,
            );
          })();
    return week(w, light, [
      endurance(k(1), enduranceMin[w - 1] ?? 35, light ? 4 : 6),
      short,
      third,
    ]);
  });
  return {
    id: templateId(7),
    plan: plan(
      "Améliorer sa vitesse (VMA)",
      "running",
      "kg",
      3,
      phases(["Construction", 1, 3], ["Assimilation", 4, 4], ["Pic et test", 5, 6]),
      weeks,
    ),
  };
}

// ---------------------------------------------------------------------------
// Musculation : réglages communs
// ---------------------------------------------------------------------------
const STRENGTH_WARMUP =
  "Mobilité des hanches, des chevilles et des épaules, puis séries de montée en charge, 10 min";
const STRENGTH_COOLDOWN = "Retour au calme et étirements doux, 5 min";
const RIR_TIP =
  "RIR = répétitions en réserve : arrête la série quand il t'en reste ce nombre. Quand tu atteins le haut de la plage sur toutes les séries, ajoute un peu de charge la fois suivante.";

const strengthSession = (
  key: string,
  text: { title: string; objective: string; coachTip: string },
  items: Extract<SessionDraft["content"], { discipline: "strength" }>["items"],
) =>
  session(
    key,
    { ...text, sessionType: "Force" },
    { discipline: "strength", warmup: STRENGTH_WARMUP, items, cooldown: STRENGTH_COOLDOWN },
  );

// ---------------------------------------------------------------------------
// 8. Développer sa force · 8 semaines, 3 séances (A, B, C), en % du max
// ---------------------------------------------------------------------------
function forcePlan(): CooryTemplate {
  // Mouvement principal : séries, répétitions, % du max.
  const heavy: [number, number, number][] = [
    [5, 5, 75],
    [5, 5, 77.5],
    [5, 5, 80],
    [3, 5, 65],
    [5, 3, 82.5],
    [5, 3, 85],
    [4, 2, 87.5],
    [3, 1, 90],
  ];
  // Séance C, volume : séries, répétitions, % du max.
  const volume: [number, number, number][] = [
    [3, 8, 65],
    [3, 8, 67.5],
    [3, 8, 70],
    [2, 8, 60],
    [4, 6, 72.5],
    [4, 6, 75],
    [3, 5, 77.5],
    [2, 5, 65],
  ];
  const weeks = range(8).map((w) => {
    const k = (n: number) => `t8-s${w}-${n}`;
    const [sets, reps, pct] = heavy[w - 1] ?? [5, 5, 75];
    const [vSets, vReps, vPct] = volume[w - 1] ?? [3, 8, 65];
    const deload = w === 4;
    const peak = w === 8;
    // Accessoires : 3 séries (2 en décharge et au pic), RIR 2 (3 en décharge).
    const acc = deload || peak ? 2 : 3;
    const rir = deload ? 3 : 2;
    const tip = deload
      ? "Semaine de décharge : charges légères, tu dois finir chaque série en gardant de la marge."
      : peak
        ? "Semaine pic : une répétition lourde par série, 3 à 4 min de repos, jamais jusqu'à l'échec."
        : "Les % se calculent sur le max de chaque mouvement (fiche du sportif, Repères). Si la vitesse de la barre chute nettement, arrête la série.";
    const heavyRest = peak ? 240 : 180;
    return week(w, deload, [
      strengthSession(
        k(1),
        {
          title: "Force A · Squat et développé couché",
          objective: "Gagner en force sur le squat et le développé couché",
          coachTip: tip,
        },
        [
          exercise("x1", EX.backSquat, "pct", pctSets(sets, reps, pct), {
            restSec: heavyRest,
            cue: "Gainage serré, descends sous le parallèle si ta mobilité le permet.",
          }),
          exercise("x2", EX.benchPress, "pct", pctSets(sets, reps, pct), {
            restSec: heavyRest,
            cue: "Omoplates serrées, pieds ancrés, barre contrôlée jusqu'à la poitrine.",
          }),
          exercise("x3", EX.barbellRow, "kg", kgSets(acc, [6, 8], rir), { restSec: 120 }),
          exercise("x4", EX.plank, "kg", heldSets(acc, [30, 45]), { restSec: 60 }),
        ],
      ),
      strengthSession(
        k(2),
        {
          title: "Force B · Soulevé de terre et développé militaire",
          objective: "Gagner en force sur le soulevé de terre et le développé militaire",
          coachTip: tip,
        },
        [
          exercise("x1", EX.deadlift, "pct", pctSets(Math.max(2, sets - 2), reps, pct), {
            restSec: heavyRest,
            cue: "Dos neutre, barre contre les tibias, pousse le sol avec les jambes.",
          }),
          exercise("x2", EX.ohp, "pct", pctSets(sets, reps, pct), {
            restSec: heavyRest,
            cue: "Fessiers serrés, pas de cambrure : la barre monte au-dessus de la tête.",
          }),
          exercise("x3", EX.pullUp, "kg", kgSets(acc, [5, 8], rir), {
            restSec: 120,
            cue: "Avec un élastique si besoin ; lesté quand 8 répétitions passent facilement.",
          }),
          exercise("x4", EX.legRaise, "kg", kgSets(acc, [8, 12]), { restSec: 60 }),
        ],
      ),
      strengthSession(
        k(3),
        {
          title: "Force C · Volume",
          objective: "Ajouter du volume sur les mouvements de base",
          coachTip:
            deload || peak ? tip : "Séance plus légère que A et B : vitesse et technique propres.",
        },
        [
          exercise("x1", EX.backSquat, "pct", pctSets(vSets, vReps, vPct), { restSec: 150 }),
          exercise("x2", EX.benchPress, "pct", pctSets(vSets, vReps, vPct), { restSec: 150 }),
          exercise("x3", EX.rdl, "kg", kgSets(acc, 8, rir), { restSec: 120 }),
          exercise("x4", EX.reverseLunge, "kg", kgSets(acc, 8, rir), {
            restSec: 90,
            cue: "Par jambe.",
          }),
          exercise("x5", EX.sidePlank, "kg", heldSets(acc, 30), { restSec: 45, cue: "Par côté." }),
        ],
      ),
    ]);
  });
  return {
    id: templateId(8),
    plan: plan(
      "Développer sa force",
      "strength",
      "pct",
      3,
      phases(["Accumulation", 1, 3], ["Décharge", 4, 4], ["Intensification", 5, 7], ["Pic", 8, 8]),
      weeks,
    ),
  };
}

// ---------------------------------------------------------------------------
// 9. Renforcement musculaire et hypertrophie · 8 semaines, 4 séances (haut et bas du corps)
// ---------------------------------------------------------------------------
function hypertrophyPlan(): CooryTemplate {
  // Séries des exercices principaux, plage de répétitions, RIR.
  const params: [number, [number, number], number][] = [
    [3, [10, 12], 3],
    [3, [10, 12], 2],
    [4, [10, 12], 2],
    [2, [10, 12], 4],
    [3, [8, 10], 2],
    [4, [8, 10], 2],
    [4, [8, 10], 1],
    [3, [8, 10], 1],
  ];
  const weeks = range(8).map((w) => {
    const k = (n: number) => `t9-s${w}-${n}`;
    const [sets, reps, rir] = params[w - 1] ?? [3, [10, 12], 2];
    const deload = w === 4;
    // Isolation : plage plus haute, 3 séries au plus.
    const isoSets = Math.min(sets, 3);
    const isoReps: [number, number] = w <= 4 ? [12, 15] : [10, 12];
    const main = (): StrengthSet[] => kgSets(sets, reps, rir);
    const iso = (): StrengthSet[] => kgSets(isoSets, isoReps, rir);
    const tip = deload
      ? "Semaine de décharge : moins de séries et des charges un peu plus légères qu'en semaine 3."
      : RIR_TIP;
    return week(w, deload, [
      strengthSession(
        k(1),
        {
          title: "Haut du corps A",
          objective: "Développer pectoraux, dos et épaules",
          coachTip: tip,
        },
        [
          exercise("x1", EX.benchPress, "kg", main(), { restSec: 120 }),
          exercise("x2", EX.latPulldown, "kg", main(), { restSec: 90 }),
          exercise("x3", EX.dbShoulder, "kg", main(), { restSec: 90 }),
          exercise("x4", EX.cableRow, "kg", main(), { restSec: 90 }),
          superset("ss1", isoSets, 60, [
            exercise("x5", EX.hammerCurl, "kg", kgSets(1, isoReps, rir)),
            exercise("x6", EX.pushdown, "kg", kgSets(1, isoReps, rir)),
          ]),
          exercise("x7", EX.lateralRaise, "kg", iso(), { restSec: 60 }),
        ],
      ),
      strengthSession(
        k(2),
        {
          title: "Bas du corps A",
          objective: "Développer cuisses et fessiers",
          coachTip: tip,
        },
        [
          exercise("x1", EX.backSquat, "kg", main(), { restSec: 150 }),
          exercise("x2", EX.rdl, "kg", main(), { restSec: 120 }),
          exercise("x3", EX.legPress, "kg", main(), { restSec: 90 }),
          exercise("x4", EX.legCurl, "kg", iso(), { restSec: 60 }),
          exercise("x5", EX.calfRaise, "kg", iso(), { restSec: 60 }),
          exercise("x6", EX.plank, "kg", heldSets(isoSets, [30, 45]), { restSec: 60 }),
        ],
      ),
      strengthSession(
        k(3),
        {
          title: "Haut du corps B",
          objective: "Développer dos, épaules et bras",
          coachTip: tip,
        },
        [
          exercise("x1", EX.inclineDb, "kg", main(), { restSec: 120 }),
          exercise("x2", EX.pullUp, "kg", kgSets(sets, [6, 10], rir), {
            restSec: 120,
            cue: "Avec un élastique si besoin.",
          }),
          exercise("x3", EX.ohp, "kg", main(), { restSec: 90 }),
          exercise("x4", EX.barbellRow, "kg", main(), { restSec: 90 }),
          superset("ss1", isoSets, 60, [
            exercise("x5", EX.barbellCurl, "kg", kgSets(1, isoReps, rir)),
            exercise("x6", EX.dips, "kg", kgSets(1, [8, 12], rir)),
          ]),
          exercise("x7", EX.facePull, "kg", iso(), { restSec: 60 }),
        ],
      ),
      strengthSession(
        k(4),
        {
          title: "Bas du corps B",
          objective: "Développer fessiers et ischio-jambiers",
          coachTip: tip,
        },
        [
          exercise("x1", EX.hipThrust, "kg", main(), { restSec: 120 }),
          exercise("x2", EX.bulgarian, "kg", main(), { restSec: 90, cue: "Par jambe." }),
          exercise("x3", EX.legExtension, "kg", iso(), { restSec: 60 }),
          exercise("x4", EX.seatedLegCurl, "kg", iso(), { restSec: 60 }),
          exercise("x5", EX.legRaise, "kg", kgSets(isoSets, [10, 15]), { restSec: 60 }),
          exercise("x6", EX.sidePlank, "kg", heldSets(isoSets, 30), {
            restSec: 45,
            cue: "Par côté.",
          }),
        ],
      ),
    ]);
  });
  return {
    id: templateId(9),
    plan: plan(
      "Renforcement musculaire et hypertrophie",
      "strength",
      "kg",
      4,
      phases(["Accumulation", 1, 3], ["Décharge", 4, 4], ["Progression", 5, 8]),
      weeks,
    ),
  };
}

// ---------------------------------------------------------------------------
// 10 et 11. Hybride : 2 ou 3 sorties de course et 2 séances de musculation · 8 semaines
// ---------------------------------------------------------------------------
// Séance de qualité, une semaine sur deux fractionné ou seuil ; fartlek en semaine allégée.
function quality(key: string, w: number): SessionDraft {
  const fartlek = () =>
    intervals(
      key,
      {
        title: "Fartlek",
        sessionType: "Fractionné",
        objective: "Garder du rythme sans se fatiguer",
        coachTip: "Semaine allégée : accélérations franches, jamais à fond.",
      },
      6,
      1,
      [90, 90],
      1,
      "Accélération",
    );
  const vmaWork = (times: number, min: number, rest: number) =>
    intervals(
      key,
      {
        title: "Fractionné",
        sessionType: "Fractionné",
        objective: "Développer la VMA",
        coachTip: "Récupérations en trottinant. Toutes les répétitions à la même allure.",
      },
      times,
      min,
      [95, 100],
      rest,
      "Vite",
    );
  switch (w) {
    case 1:
      return vmaWork(8, 1, 1);
    case 2:
      return threshold(key, 3, 6, 2);
    case 3:
      return vmaWork(10, 1, 1);
    case 5:
      return threshold(key, 3, 8, 2);
    case 6:
      return vmaWork(6, 2, 1.5);
    case 7:
      return threshold(key, 2, 12, 3);
    default:
      return fartlek();
  }
}

function hybridStrength(key: string, w: number, which: "A" | "B"): SessionDraft {
  // Séries et RIR selon la semaine ; semaines 4 et 8 allégées.
  const params: [number, number][] = [
    [3, 3],
    [3, 2],
    [4, 2],
    [2, 3],
    [3, 2],
    [4, 2],
    [4, 1],
    [2, 3],
  ];
  const [sets, rir] = params[w - 1] ?? [3, 2];
  const light = w === 4 || w === 8;
  const tip = light
    ? "Semaine allégée : moins de séries, garde de la marge sur chaque série."
    : `${RIR_TIP} Si possible, laisse quelques heures entre cette séance et une séance de qualité en course.`;
  return which === "A"
    ? strengthSession(
        key,
        {
          title: "Force · Full body A",
          objective: "Force générale des jambes, de la poussée et du tirage",
          coachTip: tip,
        },
        [
          exercise("x1", EX.backSquat, "kg", kgSets(sets, [6, 8], rir), { restSec: 150 }),
          exercise("x2", EX.dbBench, "kg", kgSets(sets, [8, 10], rir), { restSec: 90 }),
          exercise("x3", EX.latPulldown, "kg", kgSets(sets, [8, 10], rir), { restSec: 90 }),
          exercise("x4", EX.plank, "kg", heldSets(Math.min(sets, 3), [30, 45]), { restSec: 60 }),
        ],
      )
    : strengthSession(
        key,
        {
          title: "Force · Full body B",
          objective: "Chaîne arrière, jambe par jambe et haut du corps",
          coachTip: tip,
        },
        [
          exercise("x1", EX.rdl, "kg", kgSets(sets, [6, 8], rir), { restSec: 120 }),
          exercise("x2", EX.reverseLunge, "kg", kgSets(sets, 8, rir), {
            restSec: 90,
            cue: "Par jambe.",
          }),
          exercise("x3", EX.ohp, "kg", kgSets(sets, [6, 8], rir), { restSec: 90 }),
          exercise("x4", EX.pullUp, "kg", kgSets(sets, [5, 8], rir), {
            restSec: 90,
            cue: "Avec un élastique si besoin.",
          }),
          exercise("x5", EX.deadBug, "kg", kgSets(Math.min(sets, 3), 8), {
            restSec: 45,
            cue: "Par côté. Bas du dos plaqué au sol.",
          }),
        ],
      );
}

function hybridPlan(runs: 2 | 3): CooryTemplate {
  const n = runs === 2 ? 10 : 11;
  const enduranceMin =
    runs === 2 ? [40, 45, 50, 35, 50, 55, 60, 40] : [35, 40, 40, 30, 40, 45, 45, 30];
  const longMin = [55, 60, 70, 45, 70, 75, 80, 50];
  const weeks = range(8).map((w) => {
    const k = (i: number) => `t${n}-s${w}-${i}`;
    const sessions = [
      endurance(k(1), enduranceMin[w - 1] ?? 40),
      hybridStrength(k(2), w, "A"),
      quality(k(3), w),
      hybridStrength(k(4), w, "B"),
      ...(runs === 3 ? [longRun(k(5), longMin[w - 1] ?? 60)] : []),
    ];
    return week(w, w === 4 || w === 8, sessions);
  });
  return {
    id: templateId(n),
    plan: plan(
      `Hybride : ${runs} running + 2 musculation`,
      "hybrid",
      "kg",
      runs + 2,
      phases(["Base", 1, 4], ["Développement", 5, 8]),
      weeks,
    ),
  };
}

export const GENERATED_TEMPLATES: CooryTemplate[] = [
  fiveK(),
  thresholdPlan(),
  speedPlan(),
  forcePlan(),
  hypertrophyPlan(),
  hybridPlan(2),
  hybridPlan(3),
];

// ---------------------------------------------------------------------------
// La partie générée de supabase/content/modeles_coory.sql.
// ---------------------------------------------------------------------------
export const SECTION_START = "-- <modeles-generes>";
export const SECTION_END = "-- </modeles-generes>";

const sqlText = (value: string) => `'${value.replace(/'/g, "''")}'`;

export function generatedSection(templates: CooryTemplate[] = GENERATED_TEMPLATES): string {
  const rows = templates.map(
    ({ id, plan: p }) =>
      `  ('${id}', null, 'coory', ${sqlText(p.title)}, '${p.discipline}', ${p.weeks.length}, ${p.sessionsPerWeek}, ${sqlText(JSON.stringify(p))}::jsonb, null)`,
  );
  return [
    SECTION_START,
    "-- Écrit par « npm run content:modeles » d'après scripts/modeles-coory/modeles.ts : ne pas",
    "-- modifier à la main (le test tests/unit/modeles-coory.test.ts vérifie que cette partie est à jour).",
    "insert into public.program_templates (id, organization_id, origin, title, discipline, weeks_count, sessions_per_week, content_json, created_by) values",
    rows.join(",\n"),
    "on conflict (id) do update set title = excluded.title, discipline = excluded.discipline,",
    "  weeks_count = excluded.weeks_count, sessions_per_week = excluded.sessions_per_week,",
    "  content_json = excluded.content_json",
    "  where public.program_templates.origin = 'coory';",
    SECTION_END,
  ].join("\n");
}

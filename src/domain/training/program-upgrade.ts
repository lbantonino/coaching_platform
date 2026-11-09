import { hrZoneRange, paceRangeFromVma } from "./aims";
import type { Discipline } from "./discipline";
import { parseProgramSession, upgradeV1Session } from "./program-session";
import {
  programDraftSchema,
  type AimDefaults,
  type Phase,
  type ProgramDraft,
  type ProgramPlan,
  type Week,
} from "./program-plan";
import { plannedDate, weekdayOf } from "./scheduling";
import { publishedSessionSchema, type SessionContent, type SessionDraft } from "./session-v2";

// Passer d'une version publiée à un brouillon, et d'un modèle au programme d'un sportif. Règles PURES.

// Façons de viser des programmes d'avant l'éditeur (livraison, « données existantes ») : allure, kg.
export const LEGACY_AIM_DEFAULTS: AimDefaults = { running: "pace", strength: "kg" };

// Séance encadrée du coach (agenda), pour dater une séance « avec le coach » d'une semaine donnée.
export type CoachSessionSlot = { id: string; startsOn: string; startTime: string };

export type PublicationSource = {
  program: {
    title: string;
    goal: string | null;
    discipline: Discipline | null;
    startDate: string;
    weeksCount: number;
  };
  snapshot: unknown;
  sessions: { key: string; weekIndex: number; slotIndex: number; json: unknown }[];
  coachSessions: readonly CoachSessionSlot[];
};

// Semaines consécutives de même étiquette (v1 : « Préparation », « Allègement »…) -> phases.
function phasesFromLabels(labels: (string | null)[]): Phase[] {
  const phases: Phase[] = [];
  labels.forEach((label, i) => {
    const index = i + 1;
    const last = phases[phases.length - 1];
    if (!label) return;
    if (last && last.name === label && last.weekTo === index - 1) last.weekTo = index;
    else
      phases.push({
        id: `p${phases.length + 1}`,
        name: label.slice(0, 40),
        weekFrom: index,
        weekTo: index,
      });
  });
  // Contiguës (BR-17) : une semaine sans étiquette entre deux phases rejoint la précédente.
  for (let i = 1; i < phases.length; i++) {
    const previous = phases[i - 1] as Phase;
    const phase = phases[i] as Phase;
    if (phase.weekFrom > previous.weekTo + 1) previous.weekTo = phase.weekFrom - 1;
  }
  return phases;
}

function snapshotWeeks(
  snapshot: unknown,
): { index: number; label: string | null; light?: boolean; scheduling?: string }[] {
  if (typeof snapshot !== "object" || snapshot === null || !("weeks" in snapshot)) return [];
  const weeks = (snapshot as { weeks: unknown }).weeks;
  if (!Array.isArray(weeks)) return [];
  return weeks.flatMap((week) =>
    typeof week === "object" &&
    week !== null &&
    typeof (week as { index?: unknown }).index === "number"
      ? [
          {
            index: (week as { index: number }).index,
            label:
              typeof (week as { label?: unknown }).label === "string"
                ? (week as { label: string }).label
                : null,
            light: (week as { light?: unknown }).light === true,
            scheduling:
              (week as { scheduling?: unknown }).scheduling === "fixed" ? "fixed" : "ordered",
          },
        ]
      : [],
  );
}

function snapshotPhases(snapshot: unknown): Phase[] | null {
  if (typeof snapshot !== "object" || snapshot === null || !("schemaVersion" in snapshot))
    return null;
  const phases = (snapshot as { phases?: unknown }).phases;
  return Array.isArray(phases) ? (phases as Phase[]) : null;
}

// Brouillon d'un programme publié qui n'en a pas encore (publié avant l'éditeur, ou dont le brouillon
// n'a jamais été ouvert) : la version active, reprise sans perte. null si elle ne forme pas un
// brouillon valide (le coach en est averti au lieu de perdre des séances en silence).
export function draftFromPublication(source: PublicationSource): ProgramDraft | null {
  const { program } = source;
  const weeksMeta = snapshotWeeks(source.snapshot);
  const weeks: Week[] = Array.from({ length: program.weeksCount }, (_, i) => {
    const meta = weeksMeta.find((week) => week.index === i + 1);
    return {
      index: i + 1,
      light: meta?.light ?? false,
      scheduling: meta?.scheduling === "fixed" ? "fixed" : "ordered",
      sessions: [],
    };
  });

  const disciplines = new Map<Discipline, number>();
  const rows = [...source.sessions].sort(
    (a, b) => a.weekIndex - b.weekIndex || a.slotIndex - b.slotIndex,
  );
  for (const row of rows) {
    const week = weeks[row.weekIndex - 1];
    if (!week) return null;
    let session: SessionDraft | null = null;
    const v2 = publishedSessionSchema.safeParse(row.json);
    if (v2.success) {
      // La version figée devient une séance du brouillon : même contenu, sans le numéro de schéma.
      session = { ...v2.data, schemaVersion: undefined, key: row.key } as SessionDraft;
    } else {
      const v1 = parseProgramSession(row.json);
      if (!v1) return null;
      let withCoach: SessionDraft["withCoach"];
      const coach = v1.withCoach
        ? source.coachSessions.find((candidate) => candidate.id === v1.withCoach?.sessionId)
        : undefined;
      if (coach) {
        withCoach = {
          coachSessionId: coach.id,
          date: plannedDate(program.startDate, row.weekIndex, weekdayOf(coach.startsOn)),
          time: coach.startTime.slice(0, 5),
        };
      }
      session = upgradeV1Session(v1, row.key, withCoach);
    }
    disciplines.set(
      session.content.discipline,
      (disciplines.get(session.content.discipline) ?? 0) + 1,
    );
    week.sessions.push(session);
  }

  const majority = [...disciplines.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const draft = {
    schemaVersion: 2 as const,
    title: program.title,
    discipline: program.discipline ?? majority ?? "hybrid",
    aimDefaults: LEGACY_AIM_DEFAULTS,
    sessionsPerWeek: Math.min(Math.max(...weeks.map((week) => week.sessions.length), 1), 7),
    phases:
      snapshotPhases(source.snapshot) ??
      phasesFromLabels(
        weeks.map((week) => weeksMeta.find((meta) => meta.index === week.index)?.label ?? null),
      ),
    weeks,
    startDate: program.startDate,
    ...(program.goal ? { goal: { note: program.goal.slice(0, 300) } } : {}),
  };
  const parsed = programDraftSchema.safeParse(draft);
  return parsed.success ? parsed.data : null;
}

// ---------------------------------------------------------------------------
// Adapter un plan (modèle, ancien programme) à un sportif : nombre de semaines, et valeurs calculées
// depuis SES repères (allure depuis la VMA, plage de FC depuis la FC max). Sans repère : on garde ce
// qui est écrit. Les rendez-vous du coach ne se copient pas (ils appartiennent à l'agenda d'origine).
// ---------------------------------------------------------------------------
export type AthleteAims = { vmaKmh: number | null; hrMax: number | null };

function adaptContent(content: SessionContent, aims: AthleteAims): SessionContent {
  if (content.discipline !== "running") return content;
  return {
    ...content,
    items: content.items.map((item) => {
      const adapt = (step: Extract<typeof item, { kind: "step" }>) => {
        const target = step.target;
        if (target?.kind === "pace" && target.vmaPercent && aims.vmaKmh !== null) {
          return {
            ...step,
            target: {
              ...target,
              ...paceRangeFromVma(aims.vmaKmh, target.vmaPercent.from, target.vmaPercent.to),
            },
          };
        }
        if (target?.kind === "hr" && aims.hrMax !== null) {
          const range = hrZoneRange(aims.hrMax, target.zone);
          return range ? { ...step, target: { ...target, ...range } } : step;
        }
        return step;
      };
      if (item.kind === "step") return adapt(item);
      if (item.kind === "repeat") return { ...item, steps: item.steps.map(adapt) };
      return item;
    }),
  };
}

export function adaptSession(session: SessionDraft, aims: AthleteAims): SessionDraft {
  return { ...session, withCoach: undefined, content: adaptContent(session.content, aims) };
}

// Le plan ramené à N semaines : les semaines en trop sont retirées, les manquantes ajoutées vides ;
// les phases sont coupées à la fin du programme.
export function resizePlan(
  plan: Pick<ProgramPlan, "weeks" | "phases">,
  weeksCount: number,
  aims: AthleteAims,
): Pick<ProgramPlan, "weeks" | "phases"> {
  const weeks: Week[] = Array.from({ length: weeksCount }, (_, i) => {
    const week = plan.weeks[i];
    return week
      ? { ...week, sessions: week.sessions.map((session) => adaptSession(session, aims)) }
      : { index: i + 1, light: false, scheduling: "ordered", sessions: [] };
  });
  const phases = plan.phases
    .filter((phase) => phase.weekFrom <= weeksCount)
    .map((phase) => ({ ...phase, weekTo: Math.min(phase.weekTo, weeksCount) }));
  return { weeks, phases };
}

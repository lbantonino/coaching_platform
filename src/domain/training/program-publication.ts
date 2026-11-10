import { hrZoneRange, kgFromPercent, type OneRepMax } from "./aims";
import { officialLoadKg, type AthleteSex } from "./hyrox-official";
import { phaseOfWeek, planSessions, type HyroxDivision, type ProgramDraft } from "./program-plan";
import { orderedSessions, plannedDate, scheduleWarnings, sessionDay } from "./scheduling";
import type {
  HyroxContent,
  PublishedSession,
  RunningContent,
  SessionContent,
  SessionDraft,
  StrengthContent,
  StrengthExercise,
  Weekday,
} from "./session-v2";

// Publier un brouillon (08) : règles PURES, testées par Vitest. La fonction SQL publish_program
// enregistre ce que construit buildPublication, dans une seule transaction.

// Ce qu'on sait du sportif pour calculer les valeurs (D-153).
export type AimContext = {
  hrMax: number | null;
  // Max par exercice de la Bibliothèque (repère relié, C-11 ; estimé si plusieurs répétitions).
  maxByExercise: ReadonlyMap<string, OneRepMax>;
  hyroxDivision: HyroxDivision | null;
  sex: AthleteSex;
};

// ---------------------------------------------------------------------------
// Figer les valeurs calculées. Allure et FC : la valeur du brouillon (ce que le coach a vu) ; si elle
// manque, on la calcule. % du max : les kg manquants sont calculés depuis le max. Charges officielles :
// TOUJOURS recalculées depuis la division (c'est le sens de « officielles »).
// ---------------------------------------------------------------------------
function freezeRunning(content: RunningContent, ctx: AimContext): RunningContent {
  return {
    ...content,
    items: content.items.map((item) => {
      const fix = (step: Extract<RunningContent["items"][number], { kind: "step" }>) => {
        if (step.target?.kind !== "hr" || step.target.bpmFrom !== undefined || ctx.hrMax === null)
          return step;
        const range = hrZoneRange(ctx.hrMax, step.target.zone);
        return range ? { ...step, target: { ...step.target, ...range } } : step;
      };
      if (item.kind === "step") return fix(item);
      if (item.kind === "repeat") return { ...item, steps: item.steps.map(fix) };
      return item;
    }),
  };
}

function freezeExercise(exercise: StrengthExercise, ctx: AimContext): StrengthExercise {
  if (exercise.loadMode !== "pct") return exercise;
  const max = exercise.exerciseId ? ctx.maxByExercise.get(exercise.exerciseId) : undefined;
  if (!max) return exercise;
  return {
    ...exercise,
    sets: exercise.sets.map((set) =>
      // Toujours depuis le max du jour de la publication (BR-14) : des kg gardés dans le brouillon
      // dateraient d'un ancien max.
      set.pct !== undefined ? { ...set, kg: kgFromPercent(max.kg, set.pct) } : set,
    ),
  };
}

function freezeStrength(content: StrengthContent, ctx: AimContext): StrengthContent {
  return {
    ...content,
    items: content.items.map((item) => {
      if (item.kind === "exercise") return freezeExercise(item, ctx);
      if (item.kind === "superset" || item.kind === "emom") {
        return {
          ...item,
          exercises: item.exercises.map((exercise) => freezeExercise(exercise, ctx)),
        };
      }
      return item;
    }),
  };
}

function freezeHyrox(content: HyroxContent, ctx: AimContext): HyroxContent {
  return {
    ...content,
    items: content.items.map((item) => {
      if (item.kind !== "block") return item;
      return {
        ...item,
        lines: item.lines.map((line) => {
          if (
            line.kind !== "station" ||
            line.loadSource !== "official" ||
            ctx.hyroxDivision === null
          )
            return line;
          const kg = officialLoadKg(line.station, ctx.hyroxDivision, ctx.sex);
          return kg === null ? line : { ...line, loadKg: kg };
        }),
      };
    }),
  };
}

export function freezeContent(content: SessionContent, ctx: AimContext): SessionContent {
  switch (content.discipline) {
    case "running":
      return freezeRunning(content, ctx);
    case "strength":
      return freezeStrength(content, ctx);
    case "hyrox":
      return freezeHyrox(content, ctx);
    case "hybrid":
      return content;
  }
}

// ---------------------------------------------------------------------------
// Construire la version publiée : la photo du programme et une ligne par séance, numérotée dans
// l'ordre de la semaine (en jours fixes : l'ordre des jours, BR-03), datée si elle a un jour.
// ---------------------------------------------------------------------------
export type PublicationSession = {
  key: string;
  weekIndex: number;
  slotIndex: number;
  plannedDate?: string;
  plannedTime?: string;
  content: PublishedSession;
};

export type Publication = {
  title: string;
  discipline: ProgramDraft["discipline"];
  startDate: string;
  weeksCount: number;
  snapshot: Record<string, unknown>;
  sessions: PublicationSession[];
};

function publishedSession(session: SessionDraft, ctx: AimContext): PublishedSession {
  return {
    schemaVersion: 2,
    title: session.title,
    sessionType: session.sessionType,
    durationMinutes: session.durationMinutes,
    ...(session.objective ? { objective: session.objective } : {}),
    ...(session.coachTip ? { coachTip: session.coachTip } : {}),
    content: freezeContent(session.content, ctx),
    ...(session.fixedDay ? { fixedDay: session.fixedDay } : {}),
    ...(session.fixedTime ? { fixedTime: session.fixedTime } : {}),
    athleteCanMove: session.athleteCanMove,
    ...(session.withCoach ? { withCoach: session.withCoach } : {}),
  };
}

export function buildPublication(draft: ProgramDraft, ctx: AimContext): Publication {
  const sessions: PublicationSession[] = [];
  for (const week of draft.weeks) {
    orderedSessions(week).forEach((session, i) => {
      const day: Weekday | null = week.scheduling === "fixed" ? sessionDay(session) : null;
      const date =
        session.withCoach?.date ??
        (day ? plannedDate(draft.startDate, week.index, day) : undefined);
      const time =
        session.withCoach?.time ?? (week.scheduling === "fixed" ? session.fixedTime : undefined);
      sessions.push({
        key: session.key,
        weekIndex: week.index,
        slotIndex: i + 1,
        ...(date ? { plannedDate: date } : {}),
        ...(time ? { plannedTime: time } : {}),
        content: publishedSession(session, ctx),
      });
    });
  }
  return {
    title: draft.title,
    discipline: draft.discipline,
    startDate: draft.startDate,
    weeksCount: draft.weeks.length,
    snapshot: {
      schemaVersion: 2,
      title: draft.title,
      discipline: draft.discipline,
      startDate: draft.startDate,
      weeksCount: draft.weeks.length,
      sessionsPerWeek: draft.sessionsPerWeek,
      aimDefaults: draft.aimDefaults,
      ...(draft.goal ? { goal: draft.goal } : {}),
      phases: draft.phases,
      // « label » : le nom de la phase, lu par l'agenda comme en v1.
      weeks: draft.weeks.map((week) => ({
        index: week.index,
        label: phaseOfWeek(draft.phases, week.index)?.name ?? null,
        light: week.light,
        scheduling: week.scheduling,
      })),
    },
    sessions,
  };
}

// ---------------------------------------------------------------------------
// Avant de publier (fenêtre 08) : ce qui bloque, et ce qui mérite seulement un avertissement.
// ---------------------------------------------------------------------------
export type PublishIssue = {
  level: "blocking" | "warning";
  code:
    | "no_session"
    | "overlap"
    | "empty_week"
    | "same_day"
    | "unavailable_day"
    | "pct_without_max"
    | "official_without_division"
    | "hr_without_max"
    | "coach_session_missing";
  message: string;
  weekIndex?: number;
  sessionKey?: string;
};

export type PublishContext = AimContext & {
  // Autres programmes PUBLIÉS du même sportif (C-8 : pas de chevauchement).
  otherPublished: { title: string; startDate: string; weeksCount: number }[];
  availableDays: readonly Weekday[];
  // Séances encadrées existantes de l'organisation (pour les séances « avec le coach »).
  coachSessionIds: ReadonlySet<string>;
};

const addDays = (isoDate: string, days: number) => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

function strengthExercises(content: StrengthContent): StrengthExercise[] {
  return content.items.flatMap((item) =>
    item.kind === "exercise"
      ? [item]
      : item.kind === "superset" || item.kind === "emom"
        ? item.exercises
        : [],
  );
}

export function validateForPublish(draft: ProgramDraft, ctx: PublishContext): PublishIssue[] {
  const issues: PublishIssue[] = [];
  const all = planSessions(draft);
  if (all.length === 0) {
    issues.push({
      level: "blocking",
      code: "no_session",
      message: "Ajoute au moins une séance avant de publier.",
    });
  }

  const end = addDays(draft.startDate, draft.weeks.length * 7);
  for (const other of ctx.otherPublished) {
    const otherEnd = addDays(other.startDate, other.weeksCount * 7);
    if (draft.startDate < otherEnd && other.startDate < end) {
      issues.push({
        level: "blocking",
        code: "overlap",
        message: `Les dates chevauchent le programme publié « ${other.title} ».`,
      });
    }
  }

  for (const week of draft.weeks) {
    if (week.sessions.length === 0) {
      issues.push({
        level: "warning",
        code: "empty_week",
        weekIndex: week.index,
        message: `Semaine ${week.index} sans séance.`,
      });
    }
    for (const warning of scheduleWarnings(week, ctx.availableDays)) {
      issues.push(
        warning.code === "same_day"
          ? {
              level: "warning",
              code: "same_day",
              weekIndex: week.index,
              message: `Semaine ${week.index} : deux séances le même jour.`,
            }
          : {
              level: "warning",
              code: "unavailable_day",
              weekIndex: week.index,
              sessionKey: warning.key,
              message: `Semaine ${week.index} : une séance tombe un jour où le sportif n'est pas disponible.`,
            },
      );
    }
  }

  for (const { week, session } of all) {
    const where = { weekIndex: week.index, sessionKey: session.key };
    const label = `Semaine ${week.index} · ${session.title}`;
    if (session.withCoach && !ctx.coachSessionIds.has(session.withCoach.coachSessionId)) {
      issues.push({
        level: "warning",
        code: "coach_session_missing",
        ...where,
        message: `${label} : le rendez-vous du coach n'existe plus.`,
      });
    }
    const { content } = session;
    if (content.discipline === "strength") {
      const missing = strengthExercises(content).some(
        (exercise) =>
          exercise.loadMode === "pct" &&
          (!exercise.exerciseId || !ctx.maxByExercise.has(exercise.exerciseId)),
      );
      if (missing) {
        issues.push({
          level: "warning",
          code: "pct_without_max",
          ...where,
          message: `${label} : un % sans max connu (les kg ne sont pas calculés).`,
        });
      }
    }
    if (content.discipline === "hyrox") {
      const official = content.items.some(
        (item) =>
          item.kind === "block" &&
          item.lines.some((line) => line.kind === "station" && line.loadSource === "official"),
      );
      const known =
        ctx.hyroxDivision !== null &&
        (ctx.hyroxDivision !== "relay" || ctx.sex === "female" || ctx.sex === "male");
      if (official && !known) {
        issues.push({
          level: "warning",
          code: "official_without_division",
          ...where,
          message: `${label} : charges officielles sans division Hyrox connue.`,
        });
      }
    }
    if (content.discipline === "running" && ctx.hrMax === null) {
      const steps = content.items.flatMap((item) =>
        item.kind === "step" ? [item] : item.kind === "repeat" ? item.steps : [],
      );
      if (steps.some((step) => step.target?.kind === "hr" && step.target.bpmFrom === undefined)) {
        issues.push({
          level: "warning",
          code: "hr_without_max",
          ...where,
          message: `${label} : zone de FC sans plage en bpm (FC max inconnue).`,
        });
      }
    }
  }
  return issues;
}

import { hrZoneRange, kgFromPercent, type OneRepMax } from "./aims";
import { officialLoadKg, type AthleteSex } from "./hyrox-official";
import { BLANK_EXERCISE_NAME, BLANK_SESSION_TITLE } from "./plan-edit";
import { phaseOfWeek, planSessions, type HyroxDivision, type ProgramDraft } from "./program-plan";
import {
  orderedSessions,
  plannedDate,
  scheduleWarnings,
  sessionDay,
  weekMonday,
} from "./scheduling";
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
    ...(session.moment ? { moment: session.moment } : {}),
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
    | "moment_missing"
    | "unavailable_day"
    | "pct_without_max"
    | "official_without_division"
    | "hr_without_max"
    | "coach_session_missing"
    | "coach_date_mismatch"
    | "incomplete_session";
  message: string;
  weekIndex?: number;
  sessionKey?: string;
};

// Un groupe par genre de problème, bloquants d'abord (« 3 semaines sans séance. ») : la fenêtre
// « Publier » de l'éditeur et la carte « Publier le programme » de l'Assistant IA (lot 3b). Le groupe
// garde la semaine du premier problème (« Voir »).
const ISSUE_GROUPS: Record<PublishIssue["code"], (count: number) => string> = {
  no_session: () => "Ajoute au moins une séance avant de publier.",
  overlap: (n) => `Les dates chevauchent ${n} programmes publiés.`,
  empty_week: (n) => `${n} semaines sans séance.`,
  moment_missing: (n) => `${n} semaines avec plusieurs séances un même jour, sans moment.`,
  unavailable_day: (n) => `${n} séances tombent un jour où le sportif n'est pas disponible.`,
  pct_without_max: (n) => `${n} exercices en % sans max connu (les kg ne sont pas calculés).`,
  official_without_division: (n) => `${n} séances aux charges officielles sans division Hyrox.`,
  hr_without_max: (n) => `${n} étapes en zone de FC sans plage en bpm (FC max inconnue).`,
  coach_session_missing: (n) => `${n} rendez-vous du coach n'existent plus.`,
  coach_date_mismatch: (n) => `${n} rendez-vous du coach hors de leur semaine.`,
  incomplete_session: (n) => `${n} séances à compléter.`,
};

export function groupPublishIssues(issues: PublishIssue[]): PublishIssue[] {
  const sorted = [
    ...issues.filter((issue) => issue.level === "blocking"),
    ...issues.filter((issue) => issue.level === "warning"),
  ];
  return [...new Set(sorted.map((issue) => issue.code))].map((code) => {
    const items = sorted.filter((issue) => issue.code === code);
    const first = items[0] as PublishIssue;
    return {
      ...first,
      message: items.length > 1 ? ISSUE_GROUPS[code](items.length) : first.message,
    };
  });
}

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
        warning.code === "moment_missing"
          ? {
              level: "warning",
              code: "moment_missing",
              weekIndex: week.index,
              message: `Semaine ${week.index} : plusieurs séances le même jour sans moment (matin, soir…).`,
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
    } else if (session.withCoach) {
      // Revue MVP du 13/11 (B5) : le rendez-vous est daté ; s'il ne tombe plus dans SA semaine (dates
      // du programme changées, ancienne copie), la séance s'afficherait au mauvais endroit.
      const monday = weekMonday(draft.startDate, week.index);
      if (session.withCoach.date < monday || session.withCoach.date > addDays(monday, 6)) {
        issues.push({
          level: "warning",
          code: "coach_date_mismatch",
          ...where,
          message: `${label} : le rendez-vous du coach n'est pas dans cette semaine.`,
        });
      }
    }
    // Revue MVP du 13/11 (C24) : une séance ajoutée puis jamais remplie part telle quelle chez le
    // sportif (« Nouvelle séance », « Exercice à choisir »).
    const blankExercise =
      session.content.discipline === "strength" &&
      strengthExercises(session.content).some(
        (exercise) => exercise.name === BLANK_EXERCISE_NAME && !exercise.exerciseId,
      );
    if (session.title === BLANK_SESSION_TITLE || blankExercise) {
      issues.push({
        level: "warning",
        code: "incomplete_session",
        ...where,
        message: `${label} : séance à compléter${blankExercise ? " (exercice à choisir)" : ""}.`,
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

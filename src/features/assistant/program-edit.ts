import { z } from "zod";

import { DISCIPLINES, disciplineLabels } from "@/domain/training/discipline";
import { hyroxDivisionLabels } from "@/domain/training/hyrox-official";
import {
  addPhase,
  addSession,
  addWeek,
  duplicateSession,
  duplicateWeekTo,
  findSession,
  moveSessionTo,
  removePhase,
  removeSession,
  removeWeek,
  renamePhase,
  replaceSession,
  setPhaseRange,
  setWeekLight,
} from "@/domain/training/plan-edit";
import {
  HYROX_DIVISIONS,
  programDraftSchema,
  programPlanSchema,
  type ProgramDraft,
  type ProgramPlan,
  type Week,
} from "@/domain/training/program-plan";
import {
  applySessionDay,
  dayApplicationReach,
  dayHasRoom,
  fillMoments,
  isPastWeek,
  setWeekFixed,
  setWeekOrdered,
} from "@/domain/training/scheduling";
import { withEstimatedDuration } from "@/domain/training/session-duration";
import {
  MAX_SESSIONS_PER_WEEK,
  SESSION_MOMENTS,
  WEEKDAYS,
  sessionBodySchema,
  type SessionBody,
  type SessionDraft,
  type Weekday,
} from "@/domain/training/session-v2";
import { sessionHeadline, sessionSteps } from "@/domain/training/session-view";
import { mondayOf } from "@/features/programs/template-use";

import { dayInWords } from "./rules";

// Assistant IA, lot 3b (D-182, règle d'Antonino du 14/11/2026 : l'assistant fait TOUT ce que le coach
// fait à la main) : lire un programme ou un modèle, puis le modifier par les MÊMES fonctions que
// l'éditeur (src/domain/training/plan-edit.ts, scheduling.ts). Règles PURES, testées par Vitest.

type AnyPlan = ProgramPlan | ProgramDraft;
const isDraft = (plan: AnyPlan): plan is ProgramDraft => "startDate" in plan;

// --- Lecture --------------------------------------------------------------------------------------
// Une demande est bornée à 80 000 caractères (rules.ts) ; un marathon de 16 semaines en fait ~90 000 en
// JSON. L'assistant lit donc le SOMMAIRE (une ligne par séance), puis 2 semaines détaillées au plus.
export const draftReadInput = z.object({
  programme_id: z.uuid(),
  semaines: z.array(z.number().int().min(1).max(52)).min(1).max(2).optional(),
});
export const templateReadInput = z.object({
  modele_id: z.uuid(),
  semaines: z.array(z.number().int().min(1).max(52)).min(1).max(2).optional(),
});

export function outlineDraft(plan: AnyPlan, meta: { revision: number; status: string }) {
  return {
    titre: plan.title,
    discipline: plan.discipline,
    ...(isDraft(plan) ? { debut: plan.startDate } : {}),
    ...(isDraft(plan) && plan.goal ? { objectif: plan.goal } : {}),
    viser: plan.aimDefaults,
    seances_par_semaine: plan.sessionsPerWeek,
    statut: meta.status,
    revision: meta.revision,
    phases: plan.phases.map((phase) => ({
      id: phase.id,
      nom: phase.name,
      de: phase.weekFrom,
      a: phase.weekTo,
    })),
    semaines: plan.weeks.map((week) => ({
      semaine: week.index,
      allegee: week.light,
      organisation: week.scheduling,
      seances: week.sessions.map((session) => ({
        cle: session.key,
        titre: session.title,
        discipline: session.content.discipline,
        ...(session.fixedDay ? { jour: session.fixedDay } : {}),
        ...(session.fixedTime ? { heure: session.fixedTime } : {}),
        ...(session.moment ? { moment: session.moment } : {}),
        resume: sessionHeadline(session),
      })),
    })),
  };
}
export type DraftOutline = ReturnType<typeof outlineDraft>;

export function weekDetail(plan: AnyPlan, weeks: number[]) {
  return plan.weeks
    .filter((week) => weeks.includes(week.index))
    .map((week) => ({
      semaine: week.index,
      seances: week.sessions.map((session) => ({
        cle: session.key,
        title: session.title,
        sessionType: session.sessionType,
        durationMinutes: session.durationMinutes,
        ...(session.objective ? { objective: session.objective } : {}),
        ...(session.coachTip ? { coachTip: session.coachTip } : {}),
        ...(session.fixedDay ? { jour: session.fixedDay } : {}),
        content: session.content,
      })),
    }));
}
export type WeekDetail = ReturnType<typeof weekDetail>[number];

// Ce que rend voir_brouillon / voir_modele : le sommaire, ou le détail de 1 ou 2 semaines AVEC la
// révision lue (relecture n°9 : une séance réécrite d'après ce détail est protégée par cette révision).
export function draftReading(
  plan: AnyPlan,
  meta: { revision: number; status: string },
  weeks?: number[],
) {
  return weeks
    ? { revision: meta.revision, statut: meta.status, semaines: weekDetail(plan, weeks) }
    : outlineDraft(plan, meta);
}

// --- Opérations -----------------------------------------------------------------------------------
// Chaque opération appelle la fonction de l'éditeur (plan-edit.ts, scheduling.ts) : le résultat est
// celui que le coach obtiendrait à la main. Seul « déplacer une séance vers une autre semaine » n'a pas
// de geste manuel : la séance quitte sa semaine et entre dans l'autre, avec sa clé.
const key = z.string().regex(/^[A-Za-z0-9_-]{1,80}$/);
const week = z.number().int().min(1).max(52);
const phaseId = z.string().regex(/^[A-Za-z0-9_-]{1,40}$/);
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const label = (max: number) => z.string().trim().min(1).max(max);

export const programEditSchema = z.discriminatedUnion("op", [
  z.strictObject({ op: z.literal("modifier_seance"), cle: key, seance: sessionBodySchema }),
  z.strictObject({ op: z.literal("ajouter_seance"), semaine: week, seance: sessionBodySchema }),
  z.strictObject({ op: z.literal("dupliquer_seance"), cle: key }),
  z.strictObject({ op: z.literal("supprimer_seance"), cle: key }),
  z.strictObject({
    op: z.literal("deplacer_seance"),
    cle: key,
    semaine: week,
    position: z.number().int().min(1).max(14).optional(),
  }),
  z.strictObject({
    op: z.literal("jour_seance"),
    cle: key,
    jour: z.enum(WEEKDAYS).nullable(),
    heure: hhmm.optional(),
    moment: z.enum(SESSION_MOMENTS).optional(),
    portee: z.enum(["semaine", "phase", "programme"]).optional(),
  }),
  z.strictObject({ op: z.literal("ajouter_semaine") }),
  z.strictObject({ op: z.literal("retirer_semaine"), semaine: week }),
  z.strictObject({ op: z.literal("semaine_allegee"), semaine: week, allegee: z.boolean() }),
  z.strictObject({
    op: z.literal("dupliquer_semaine"),
    source: week,
    vers: z.array(week).min(1).max(51),
  }),
  z.strictObject({
    op: z.literal("organisation_semaine"),
    semaine: week,
    mode: z.enum(["ordered", "fixed"]),
  }),
  z.strictObject({ op: z.literal("ajouter_phase"), nom: label(40) }),
  z.strictObject({ op: z.literal("renommer_phase"), phase: phaseId, nom: label(40) }),
  z.strictObject({ op: z.literal("semaines_phase"), phase: phaseId, de: week, a: week }),
  z.strictObject({ op: z.literal("retirer_phase"), phase: phaseId }),
  z.strictObject({ op: z.literal("titre"), titre: label(120) }),
  z.strictObject({ op: z.literal("discipline"), discipline: z.enum(DISCIPLINES) }),
  z.strictObject({ op: z.literal("debut"), date: z.iso.date() }),
  z.strictObject({
    op: z.literal("objectif"),
    course: label(120).optional(),
    date: z.iso.date().optional(),
    categorie_hyrox: z.enum(HYROX_DIVISIONS).optional(),
    note: label(300).optional(),
  }),
  z.strictObject({
    op: z.literal("viser"),
    running: z.enum(["pace", "hr"]).optional(),
    strength: z.enum(["kg", "pct"]).optional(),
  }),
]);
export type ProgramEdit = z.infer<typeof programEditSchema>;
export const MAX_PROGRAM_EDITS = 20;

const DAY_WORDS: Record<Weekday, string> = {
  mon: "lundi",
  tue: "mardi",
  wed: "mercredi",
  thu: "jeudi",
  fri: "vendredi",
  sat: "samedi",
  sun: "dimanche",
};
const AIM_WORDS = { pace: "allure", hr: "zones de FC", kg: "kg", pct: "% du max" } as const;

// « Modifier une séance » : Claude réécrit la séance ENTIÈRE ; la carte dit chaque différence, avec
// les lignes que montrent la page d'une séance et les PDF (sessionSteps : exercice et son volume,
// étape de course et sa cible), pour que rien ne change sans se voir (relecture n°2).
function viewLines(session: Pick<SessionBody, "content">): string[] {
  return sessionSteps(session).flatMap((step) =>
    step.repeat ? [`${step.title} : ${step.repeat.lines.join(" + ")}`, ...step.lines] : step.lines,
  );
}

// Deux lignes « Nom · volume » : seulement ce qui change (« Back squat → Presse à cuisses »,
// « Back squat : 4 × 6 · 60 kg → 5 × 5 · 70 kg »).
function pairLine(was: string, now: string): string {
  const [nameWas = "", ...restWas] = was.split(" · ");
  const [nameNow = "", ...restNow] = now.split(" · ");
  if (restWas.length > 0 && restWas.join(" · ") === restNow.join(" · ")) {
    return `${nameWas} → ${nameNow}`;
  }
  if (restWas.length > 0 && nameWas === nameNow) {
    return `${nameWas} : ${restWas.join(" · ")} → ${restNow.join(" · ")}`;
  }
  return `${was} → ${now}`;
}

const textChange = (label: string, was?: string, now?: string) =>
  (was ?? "") === (now ?? "")
    ? null
    : now
      ? `${label} ${was ? "réécrit" : "ajouté"}`
      : `${label} retiré`;

const MAX_CHANGE_LINES = 6;

function changeLines(before: SessionDraft, after: SessionDraft): string[] {
  const out: string[] = [];
  if (before.title !== after.title) out.push(`titre « ${before.title} » → « ${after.title} »`);
  if (before.sessionType !== after.sessionType) {
    out.push(`type « ${before.sessionType} » → « ${after.sessionType} »`);
  }
  if (before.durationMinutes !== after.durationMinutes) {
    out.push(`durée ${before.durationMinutes} → ${after.durationMinutes} min`);
  }
  const objective = textChange("objectif", before.objective, after.objective);
  if (objective) out.push(objective);
  const tip = textChange("conseil du coach", before.coachTip, after.coachTip);
  if (tip) out.push(tip);
  const was = viewLines(before);
  const now = viewLines(after);
  const removed = was.filter((line) => !now.includes(line));
  const added = now.filter((line) => !was.includes(line));
  const pairs = Math.min(removed.length, added.length);
  for (let i = 0; i < pairs; i++) out.push(pairLine(removed[i] ?? "", added[i] ?? ""));
  removed.slice(pairs).forEach((line) => out.push(`retiré : ${line}`));
  added.slice(pairs).forEach((line) => out.push(`ajouté : ${line}`));
  // Un réglage qu'aucune ligne ne montre (exercice de la Bibliothèque relié, détail d'une série) :
  // signalé quand même, jamais « inchangée » à tort.
  if (out.length === 0 && JSON.stringify(before.content) !== JSON.stringify(after.content)) {
    out.push("autres réglages modifiés");
  }
  if (out.length === 0) out.push("inchangée");
  return out.length > MAX_CHANGE_LINES
    ? [
        ...out.slice(0, MAX_CHANGE_LINES - 1),
        `… et ${out.length - MAX_CHANGE_LINES + 1} autres changements`,
      ]
    : out;
}

// La séance écrite par l'assistant, à la place de `previous` ou nouvelle : durée recalculée d'après le
// contenu (comme l'éditeur), sauf une durée corrigée à la main par le coach.
function placedBody(body: SessionBody, previous?: SessionDraft): SessionBody {
  if (previous?.durationManual) return body;
  return withEstimatedDuration(body);
}

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? "s" : ""}`;

type Applied<T> =
  { ok: true; plan: T; lines: string[]; weeks: number[] } | { ok: false; error: string };

export function applyProgramEdits<T extends AnyPlan>(
  plan: T,
  edits: ProgramEdit[],
  { today }: { today?: string } = {},
): Applied<T> {
  if (edits.length === 0 || edits.length > MAX_PROGRAM_EDITS) {
    return { ok: false, error: `Entre 1 et ${MAX_PROGRAM_EDITS} changements par carte.` };
  }
  const fail = (error: string): Applied<T> => ({ ok: false, error });
  // Relecture n°1 : ajouter et retirer des semaines dans la même carte embrouillerait leurs numéros.
  const ops = new Set(edits.map((edit) => edit.op));
  if (ops.has("ajouter_semaine") && ops.has("retirer_semaine")) {
    return fail(
      "Ajouter et retirer des semaines dans la même carte embrouille leurs numéros : fais deux cartes (la seconde après validation de la première).",
    );
  }
  let current: T = plan;
  const lines: string[] = [];
  // Relecture n°1 : chaque numéro de semaine est celui du programme LU (voir_brouillon), même après
  // un retrait plus haut dans la carte ; une semaine ajoutée prend le numéro suivant le dernier.
  const read = plan.weeks.length;
  const origin = plan.weeks.map((_, i) => i + 1); // place actuelle - 1 → numéro lu
  const removed = new Set<number>();
  const touched = new Set<number>(); // numéros lus
  const place = (label: number): number | null => {
    const at = origin.indexOf(label);
    return at === -1 ? null : at + 1;
  };
  const labelOf = (index: number) => origin[index - 1] ?? index;
  const noWeek = (label: number) =>
    fail(
      removed.has(label)
        ? `La semaine ${label} est retirée plus haut dans cette carte : elle ne peut plus changer.`
        : `La semaine ${label} n'existe pas : le programme lu a ${read} semaines.`,
    );
  const find = (cle: string) => findSession(current, cle);
  const noSession = (cle: string) =>
    fail(`Séance « ${cle} » introuvable : regarde les clés avec voir_brouillon.`);
  const phaseOf = (id: string) => current.phases.find((phase) => phase.id === id);
  const noPhase = (id: string) => fail(`Phase « ${id} » introuvable : regarde voir_brouillon.`);
  const dates = isDraft(current) && today ? { startDate: current.startDate, today } : undefined;

  for (const edit of edits) {
    switch (edit.op) {
      case "modifier_seance": {
        const found = find(edit.cle);
        if (!found) return noSession(edit.cle);
        const label = labelOf(found.week.index);
        const next: SessionDraft = { ...found.session, ...placedBody(edit.seance, found.session) };
        current = replaceSession(current, next);
        for (const change of changeLines(found.session, next)) {
          lines.push(`Semaine ${label} · ${found.session.title} : ${change}`);
        }
        touched.add(label);
        break;
      }
      case "ajouter_seance": {
        const at = place(edit.semaine);
        if (at === null) return noWeek(edit.semaine);
        const body = placedBody(edit.seance);
        const added = addSession(current, at, body);
        if (!added.key) return fail(`La semaine ${edit.semaine} est pleine (14 séances).`);
        current = added.plan;
        lines.push(
          `Semaine ${edit.semaine} : nouvelle séance « ${body.title} » (${body.durationMinutes} min)`,
        );
        touched.add(edit.semaine);
        break;
      }
      case "dupliquer_seance": {
        const found = find(edit.cle);
        if (!found) return noSession(edit.cle);
        const label = labelOf(found.week.index);
        const copied = duplicateSession(current, found.week.index, edit.cle);
        if (!copied.key) return fail(`La semaine ${label} est pleine (14 séances).`);
        current = copied.plan;
        lines.push(`Semaine ${label} : « ${found.session.title} » dupliquée`);
        touched.add(label);
        break;
      }
      case "supprimer_seance": {
        const found = find(edit.cle);
        if (!found) return noSession(edit.cle);
        const label = labelOf(found.week.index);
        current = removeSession(current, found.week.index, edit.cle);
        lines.push(`Semaine ${label} : « ${found.session.title} » supprimée (définitif)`);
        touched.add(label);
        break;
      }
      case "deplacer_seance": {
        const found = find(edit.cle);
        if (!found) return noSession(edit.cle);
        const to = place(edit.semaine);
        if (to === null) return noWeek(edit.semaine);
        const from = found.week.index;
        const fromLabel = labelOf(from);
        if (from === to) {
          const slot = Math.min(
            (edit.position ?? found.week.sessions.length) - 1,
            found.week.sessions.length - 1,
          );
          current = moveSessionTo(current, from, found.position, slot);
          lines.push(
            `« ${found.session.title} » : place ${found.position + 1} → ${slot + 1} (semaine ${fromLabel})`,
          );
        } else {
          const target = current.weeks[to - 1] as Week;
          if (target.sessions.length >= MAX_SESSIONS_PER_WEEK) {
            return fail(`La semaine ${edit.semaine} est pleine (14 séances).`);
          }
          // Le jour suit la semaine d'arrivée : gardé s'il y a de la place en jours fixes, sinon retiré.
          const keepDay =
            target.scheduling === "fixed" &&
            found.session.fixedDay !== undefined &&
            dayHasRoom(target, found.session.fixedDay);
          const moved: SessionDraft = keepDay
            ? { ...found.session, withCoach: undefined }
            : {
                ...found.session,
                withCoach: undefined,
                fixedDay: undefined,
                fixedTime: undefined,
                moment: undefined,
              };
          const without = removeSession(current, from, edit.cle);
          current = {
            ...without,
            weeks: without.weeks.map((item) => {
              if (item.index !== to) return item;
              const sessions = [...item.sessions];
              sessions.splice(
                Math.min((edit.position ?? sessions.length + 1) - 1, sessions.length),
                0,
                moved,
              );
              return fillMoments({ ...item, sessions });
            }),
          };
          lines.push(`« ${found.session.title} » : semaine ${fromLabel} → semaine ${edit.semaine}`);
          touched.add(edit.semaine);
        }
        touched.add(fromLabel);
        break;
      }
      case "jour_seance": {
        const found = find(edit.cle);
        if (!found) return noSession(edit.cle);
        const label = labelOf(found.week.index);
        // Relecture n°5 : comme l'éditeur, un jour se choisit dans une semaine à jours fixes, et le
        // jour d'une séance avec le coach suit son rendez-vous.
        if (found.week.scheduling !== "fixed") {
          return fail(
            `La semaine ${label} est « dans l'ordre » : passe-la d'abord en jours fixes (organisation_semaine), comme dans l'éditeur.`,
          );
        }
        if (found.session.withCoach) {
          return fail(
            `« ${found.session.title} » se fait avec le coach : son jour suit le rendez-vous de l'agenda.`,
          );
        }
        const scope =
          edit.portee === "phase" ? "phase" : edit.portee === "programme" ? "program" : "week";
        const weeksAfter = applySessionDay(
          current.weeks,
          current.phases,
          found.week.index,
          found.position,
          {
            day: edit.jour,
            ...(edit.heure ? { time: edit.heure } : {}),
            ...(edit.moment ? { moment: edit.moment } : {}),
            athleteCanMove: found.session.athleteCanMove,
          },
          scope,
          dates,
        );
        // Ce qui a vraiment changé ailleurs, compté comme le message de l'éditeur.
        const reach = dayApplicationReach(current.weeks, weeksAfter, found.week.index);
        weeksAfter.forEach((item, i) => {
          if (item !== current.weeks[i]) touched.add(labelOf(item.index));
        });
        current = { ...current, weeks: weeksAfter };
        const when = edit.jour
          ? [DAY_WORDS[edit.jour], edit.heure].filter(Boolean).join(" à ")
          : "sans jour";
        const details = [
          reach.copies > 0
            ? `${plural(reach.copies, "copie")} créée${reach.copies > 1 ? "s" : ""}`
            : null,
          reach.nowFixed > 0
            ? `${reach.nowFixed} passe${reach.nowFixed > 1 ? "nt" : ""} en jours fixes`
            : null,
        ].filter(Boolean);
        const others =
          reach.others > 0
            ? `, et dans ${`${reach.others} autre${reach.others > 1 ? "s" : ""} semaine${reach.others > 1 ? "s" : ""}`}${details.length > 0 ? ` (${details.join(" ; ")})` : ""}`
            : scope !== "week"
              ? " (aucune autre semaine ne pouvait changer)"
              : "";
        lines.push(`Semaine ${label} · ${found.session.title} : ${when}${others}`);
        touched.add(label);
        break;
      }
      case "ajouter_semaine": {
        current = addWeek(current);
        // Pas de retrait dans la même carte (refusé plus haut) : le numéro est la nouvelle place.
        const label = origin.length + 1;
        origin.push(label);
        lines.push(`Nouvelle semaine à la fin (semaine ${current.weeks.length})`);
        touched.add(label);
        break;
      }
      case "retirer_semaine": {
        const at = place(edit.semaine);
        if (at === null) return noWeek(edit.semaine);
        if (current.weeks.length === 1) return fail("Un programme garde au moins une semaine.");
        const count = (current.weeks[at - 1] as Week).sessions.length;
        current = removeWeek(current, at);
        origin.splice(at - 1, 1);
        removed.add(edit.semaine);
        touched.delete(edit.semaine);
        lines.push(
          `Semaine ${edit.semaine} retirée (${plural(count, "séance")}, définitif)${
            at <= current.weeks.length ? " ; les suivantes remontent d'un cran" : ""
          }`,
        );
        break;
      }
      case "semaine_allegee": {
        const at = place(edit.semaine);
        if (at === null) return noWeek(edit.semaine);
        current = setWeekLight(current, at, edit.allegee);
        lines.push(`Semaine ${edit.semaine} : ${edit.allegee ? "allégée" : "plus allégée"}`);
        touched.add(edit.semaine);
        break;
      }
      case "dupliquer_semaine": {
        const source = place(edit.source);
        if (source === null) return noWeek(edit.source);
        const labels = edit.vers.filter((label) => label !== edit.source);
        const targets: number[] = [];
        for (const label of labels) {
          const at = place(label);
          if (at === null) return noWeek(label);
          // Relecture n°4 : une semaine passée ne reçoit jamais de copie (BR-07, comme l'éditeur).
          if (dates && isPastWeek(dates.startDate, at, dates.today)) {
            return fail(
              `La semaine ${label} est passée : le sportif l'a déjà vécue, elle ne reçoit pas de copie (comme dans l'éditeur).`,
            );
          }
          targets.push(at);
        }
        current = duplicateWeekTo(current, source, targets);
        lines.push(
          `Semaine ${edit.source} copiée vers les semaines ${labels.join(", ")} (remplace leurs séances)`,
        );
        labels.forEach((label) => touched.add(label));
        break;
      }
      case "organisation_semaine": {
        const at = place(edit.semaine);
        if (at === null) return noWeek(edit.semaine);
        current = {
          ...current,
          weeks: current.weeks.map((item) => {
            if (item.index !== at) return item;
            if (edit.mode === "ordered") return setWeekOrdered(item);
            const days = new Map<string, Weekday>();
            item.sessions.forEach((session) => {
              if (session.fixedDay) days.set(session.key, session.fixedDay);
            });
            return setWeekFixed(item, days);
          }),
        };
        lines.push(
          `Semaine ${edit.semaine} : ${edit.mode === "ordered" ? "dans l'ordre" : "jours fixes"}`,
        );
        touched.add(edit.semaine);
        break;
      }
      case "ajouter_phase": {
        const next = addPhase(current, edit.nom);
        if (next === current) {
          return fail(
            "Toutes les semaines ont déjà une phase : raccourcis ou retire une phase d'abord.",
          );
        }
        current = next;
        lines.push(`Nouvelle phase « ${edit.nom} »`);
        break;
      }
      case "renommer_phase": {
        const phase = phaseOf(edit.phase);
        if (!phase) return noPhase(edit.phase);
        current = renamePhase(current, edit.phase, edit.nom);
        lines.push(`Phase « ${phase.name} » → « ${edit.nom} »`);
        break;
      }
      case "semaines_phase": {
        const phase = phaseOf(edit.phase);
        if (!phase) return noPhase(edit.phase);
        const from = place(edit.de);
        if (from === null) return noWeek(edit.de);
        const to = place(edit.a);
        if (to === null) return noWeek(edit.a);
        current = setPhaseRange(current, edit.phase, from, Math.max(from, to));
        const placed = phaseOf(edit.phase) ?? phase;
        lines.push(
          `Phase « ${phase.name} » : semaines ${labelOf(placed.weekFrom)} à ${labelOf(placed.weekTo)}`,
        );
        break;
      }
      case "retirer_phase": {
        const phase = phaseOf(edit.phase);
        if (!phase) return noPhase(edit.phase);
        current = removePhase(current, edit.phase);
        lines.push(`Phase « ${phase.name} » retirée`);
        break;
      }
      case "titre":
        lines.push(`Titre : « ${current.title} » → « ${edit.titre} »`);
        current = { ...current, title: edit.titre };
        break;
      case "discipline":
        lines.push(
          `Discipline : ${disciplineLabels[current.discipline]} → ${disciplineLabels[edit.discipline]}`,
        );
        current = { ...current, discipline: edit.discipline };
        break;
      case "debut": {
        if (!isDraft(current)) return fail("Un modèle n'a pas de dates : seul un programme en a.");
        const monday = mondayOf(edit.date);
        current = { ...current, startDate: monday };
        lines.push(`Début : ${dayInWords(monday)}`);
        break;
      }
      case "objectif": {
        if (!isDraft(current))
          return fail("Un modèle n'a pas d'objectif : seul un programme en a.");
        const goal = {
          ...current.goal,
          ...(edit.course ? { raceName: edit.course } : {}),
          ...(edit.date ? { raceDate: edit.date } : {}),
          ...(edit.categorie_hyrox ? { hyroxDivision: edit.categorie_hyrox } : {}),
          ...(edit.note ? { note: edit.note } : {}),
        };
        current = { ...current, goal };
        lines.push(
          `Objectif : ${[
            goal.raceName,
            goal.raceDate ? `le ${dayInWords(goal.raceDate)}` : null,
            goal.hyroxDivision ? hyroxDivisionLabels[goal.hyroxDivision] : null,
            goal.note,
          ]
            .filter(Boolean)
            .join(" · ")}`,
        );
        break;
      }
      case "viser": {
        const aims = {
          running: edit.running ?? current.aimDefaults.running,
          strength: edit.strength ?? current.aimDefaults.strength,
        };
        current = { ...current, aimDefaults: aims };
        lines.push(`Façon de viser : ${AIM_WORDS[aims.running]} ; ${AIM_WORDS[aims.strength]}`);
        break;
      }
    }
  }

  // Le résultat passe les MÊMES règles qu'un enregistrement de l'éditeur.
  const checked = isDraft(current)
    ? programDraftSchema.safeParse(current)
    : programPlanSchema.safeParse(current);
  if (!checked.success) {
    return fail(
      `Ces changements rendraient le programme invalide : ${checked.error.issues[0]?.message ?? ""}`,
    );
  }
  // Les semaines touchées, à leur place dans le programme enregistré (lien « Voir »).
  const weeks = [...touched]
    .map(place)
    .filter((index): index is number => index !== null)
    .sort((a, b) => a - b);
  return { ok: true, plan: current, lines, weeks };
}

export function describeProgramEdits(plan: AnyPlan, edits: ProgramEdit[]): string[] {
  const result = applyProgramEdits(plan, edits);
  return result.ok ? result.lines : [];
}

// --- Cartes « Modifier le programme » et « Modifier le modèle » (Task 3) --------------------------
// Les opérations données à Claude : le schéma EXACT des opérations, sauf la séance, qui renvoie au
// format des seances de creer_programme (même schéma, déjà dans la liste des outils) : 16 000
// caractères de moins à chaque demande.
const SESSION_FORMAT = {
  type: "object",
  description:
    "La séance COMPLÈTE, au format exact d'une séance de creer_programme (sans ref, fixedDay, fixedTime ni moment) : pour modifier, repars de son contenu lu avec voir_brouillon (semaines) et change seulement ce qui est demandé.",
};
export const programEditsToolSchema = (() => {
  const json = z.toJSONSchema(programEditSchema.array().min(1).max(MAX_PROGRAM_EDITS), {
    unrepresentable: "any",
    override: (ctx) => {
      if (ctx.zodSchema !== sessionBodySchema) return;
      for (const field of Object.keys(ctx.jsonSchema)) delete ctx.jsonSchema[field];
      Object.assign(ctx.jsonSchema, SESSION_FORMAT);
    },
  }) as Record<string, unknown>;
  delete json.$schema;
  return json;
})();

type EditTarget = "programme" | "modele";

// Clic « Valider » : la carte a été préparée sur une révision (programme) ou une version (modèle) ;
// une autre révision veut dire que le coach (ou une autre carte) a changé le brouillon entre-temps.
export const changedSinceProposal = (target: EditTarget = "programme") =>
  `${target === "modele" ? "Le modèle" : "Le brouillon"} a changé depuis la proposition : rien n'a été modifié. Redemande à l'assistant.`;

export function revisionConflict(
  expected: number,
  current: number,
  target: EditTarget = "programme",
): string | null {
  return expected === current ? null : changedSinceProposal(target);
}

// Proposition : Claude écrit d'après sa LECTURE (contenu des séances compris) ; une lecture dépassée
// écraserait un changement du coach, il relit d'abord.
export function staleReading(
  read: number,
  current: number,
  target: EditTarget = "programme",
): string | null {
  if (read === current) return null;
  return target === "modele"
    ? `Le modèle a changé depuis ta lecture (version ${read}, maintenant ${current}) : relis-le avec voir_modele, puis propose à nouveau.`
    : `Le brouillon a changé depuis ta lecture (révision ${read}, maintenant ${current}) : relis-le avec voir_brouillon, puis propose à nouveau.`;
}

// Comme l'interface : un programme archivé ne se modifie pas (le désarchiver d'abord), un modèle
// Coory se lit seulement (le dupliquer dans Mes modèles).
export function programEditRefusal(
  program: { status: string; hasDraft: boolean } | null,
): string | null {
  if (!program) return "Programme introuvable : regarde voir_programmes.";
  if (program.status === "archived") {
    return "Ce programme est archivé : il faut d'abord le désarchiver (desarchiver_programme).";
  }
  if (!program.hasDraft) {
    return "Le brouillon de ce programme ne peut pas être lu : le coach doit l'ouvrir dans l'éditeur.";
  }
  return null;
}

export function templateEditRefusal(
  template: { source: "coory" | "mine"; hasPlan: boolean } | null,
): string | null {
  if (!template) return "Modèle introuvable : regarde voir_modeles.";
  if (template.source === "coory") {
    return "Les modèles Coory se lisent seulement : duplique-le d'abord dans Mes modèles (dupliquer_modele), puis modifie la copie.";
  }
  if (!template.hasPlan) {
    return "Ce modèle ne peut pas être lu : le coach doit l'ouvrir dans l'éditeur.";
  }
  return null;
}

// Ce que la carte affiche (résolu par le serveur, lu par summarize) : titre, sportif, une ligne par
// changement (« définitif » pour une suppression), puis où vont les changements.
const EDIT_STATUS_LINE = {
  draft: "Brouillon : à relire et publier dans l'éditeur",
  published:
    "Programme publié : les changements vont dans son brouillon ; la version publiée ne change pas avant « Publier »",
  template: "Mes modèles : les programmes déjà créés depuis ce modèle ne changent pas",
} as const;

export function editCardNames(card: {
  title: string;
  athlete: string | null;
  status: keyof typeof EDIT_STATUS_LINE;
  lines: string[];
}): Record<string, string> {
  const names: Record<string, string> = {
    titre: card.title,
    statut: EDIT_STATUS_LINE[card.status],
  };
  if (card.athlete) names.sportif = card.athlete;
  card.lines.forEach((line, index) => {
    names[`ligne:${index}`] = line;
  });
  return names;
}

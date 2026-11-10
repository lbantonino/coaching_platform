"use client";

import {
  Archive,
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Copy,
  Eye,
  FileDown,
  FileText,
  LayoutTemplate,
  ListFilter,
  Lock,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { barBackClass, barBackIcon } from "@/components/layout/back-link";
import { MobileBarTitle, phoneFabClass } from "@/components/layout/mobile-bar";
import { EditorSessionCard } from "@/components/programs/editor-session-card";
import { ProgramPdfMenu } from "@/components/programs/program-pdf-menu";
import { SessionDetail } from "@/components/programs/session-detail";
import { Avatar } from "@/components/ui/avatar";
import { MoreMenu, type MoreMenuItem } from "@/components/ui/more-menu";
import { ConfirmDialog, DialogBody, Overlay } from "@/components/ui/overlay";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SelectField } from "@/components/ui/select-field";
import { useToast } from "@/components/ui/toast";
import { disciplineLabels, disciplineStyles, type Discipline } from "@/domain/training/discipline";
import {
  addPhase,
  addSession,
  addWeek,
  blankSession,
  duplicateSession,
  duplicateWeekTo,
  moveSession,
  removePhase,
  removeSession,
  removeWeek,
  renamePhase,
  setWeekLight,
} from "@/domain/training/plan-edit";
import {
  phaseOfWeek,
  type ProgramDraft,
  type ProgramPlan,
  type Week,
} from "@/domain/training/program-plan";
import { validateForPublish, type PublishContext } from "@/domain/training/program-publication";
import {
  applySessionDay,
  applyWeekSchedule,
  isPastWeek,
  orderedSessions,
  setWeekFixed,
  setWeekOrdered,
  weekMonday,
  type ScheduleScope,
} from "@/domain/training/scheduling";
import type { Weekday } from "@/domain/training/session-v2";
import type { SessionBody, SessionDraft } from "@/domain/training/session-v2";
import { sessionHeadline } from "@/domain/training/session-view";
import {
  archiveProgram,
  archiveTemplate,
  duplicateProgram,
  duplicateTemplate,
  publishProgram,
  saveProgramAsTemplate,
} from "@/features/programs/actions";

import { saveStatusLabel, useEditor } from "./editor-provider";
import {
  DayPad,
  DayPicker,
  DayStrip,
  MiniDayStrip,
  ProposeDaysDialog,
  type DayChoice,
  type DaysContext,
} from "./fixed-days";
import {
  DuplicateWeekSheet,
  PublishSheet,
  SessionTemplateSheet,
  TextSheet,
  type SessionTemplateOption,
} from "./editor-sheets";

// Éditeur de programme (maquette 03, EDT-01 à 05, D-157). Ordinateur : bandeau du programme, puis
// trois colonnes (semaines groupées par phase 196 px · la semaine · la séance choisie 304 px).
// Téléphone : une pile de navigation (Semaines → une semaine → une séance), le retour dans la barre
// du haut (« ← Programmes », « ← Semaines », « ← Semaine 2 »). Un modèle s'ouvre ici aussi, sans
// sportif ni dates (« Semaine 1 à N ») ; un modèle Coory en lecture seule.

export type EditorMeta = {
  base: string;
  mode: "program" | "template";
  athlete: { name: string; firstName: string; photoPath: string | null } | null;
  // Programme : la version publiée active, s'il y en a une.
  // sourceRevision : la révision du brouillon qui a donné cette version (« Modifications non publiées »
  // dès que le brouillon enregistré en diffère).
  publication: { number: number; sourceRevision: number | null } | null;
  athleteHref: string | null;
  today: string;
  templateSource: "coory" | "mine" | null;
  // Semaine (et séance) à ouvrir : retour de l'éditeur de séance.
  focus: { week: number | null; session: string | null };
  sessionTemplates: (SessionTemplateOption & { body: SessionBody })[];
  publishContext:
    | (Omit<PublishContext, "maxByExercise" | "coachSessionIds"> & {
        maxByExercise: [
          string,
          { kg: number; estimated: boolean; fromKg: number; fromReps: number },
        ][];
        coachSessionIds: string[];
      })
    | null;
};

const dayMonth = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const dayOnly = new Intl.DateTimeFormat("fr-BE", { day: "numeric", timeZone: "UTC" });
const weekdayShort = new Intl.DateTimeFormat("fr-BE", { weekday: "short", timeZone: "UTC" });
const asDate = (iso: string) => new Date(`${iso}T00:00:00Z`);

function weekRange(startDate: string, index: number): string {
  const monday = weekMonday(startDate, index);
  const sunday = new Date(asDate(monday));
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  const sameMonth = asDate(monday).getUTCMonth() === sunday.getUTCMonth();
  return sameMonth
    ? `${dayOnly.format(asDate(monday))} – ${dayMonth.format(sunday)}`
    : `${dayMonth.format(asDate(monday))} – ${dayMonth.format(sunday)}`;
}

function coachLabel(session: SessionDraft): string | undefined {
  if (!session.withCoach) return undefined;
  const date = asDate(session.withCoach.date);
  const day = weekdayShort.format(date).replace(".", "");
  const label = `${day.charAt(0).toUpperCase()}${day.slice(1)} ${dayOnly.format(date)}`;
  return `Avec le coach · ${label}${session.withCoach.time ? ` · ${session.withCoach.time}` : ""}`;
}

const PUBLISH_EVENT = "coory:publier";

const isDraft = (plan: ProgramPlan | ProgramDraft): plan is ProgramDraft => "startDate" in plan;

const pill =
  "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-[12px] px-[9px] text-[11.5px] leading-[normal] font-semibold whitespace-nowrap";
const smallButton =
  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[9px] bg-surface px-3 text-[12.5px] font-semibold text-text inset-ring inset-ring-field-ring transition-[scale,background-color] duration-150 enabled:hover:bg-surface-2 enabled:active:scale-[0.97] disabled:text-faint";
const card = "rounded-[20px] bg-surface";
const phoneButton =
  "inline-flex h-11 flex-1 items-center justify-center rounded-[12px] px-4 text-[14px] font-semibold transition-[scale] duration-150 active:scale-[0.98]";

export function ProgramEditor({ meta }: { meta: EditorMeta }) {
  const editor = useEditor<ProgramDraft | ProgramPlan>();
  const { plan, update, readOnly, organizationId, target } = editor;
  const router = useRouter();
  const toast = useToast();
  const draft = isDraft(plan) ? plan : null;
  const [weekIndex, setWeekIndex] = useState(() => {
    if (meta.focus.week && plan.weeks.some((item) => item.index === meta.focus.week))
      return meta.focus.week;
    if (draft) {
      const days = Math.floor((Date.parse(meta.today) - Date.parse(draft.startDate)) / 86_400_000);
      return Math.min(Math.max(Math.floor(days / 7) + 1, 1), plan.weeks.length);
    }
    return 1;
  });
  const week = plan.weeks.find((item) => item.index === weekIndex) ?? plan.weeks[0];
  const ordered = useMemo(() => (week ? orderedSessions(week) : []), [week]);
  const [sessionKey, setSessionKey] = useState<string | null>(
    ordered.find((item) => item.key === meta.focus.session)?.key ?? ordered[0]?.key ?? null,
  );
  const session = ordered.find((item) => item.key === sessionKey) ?? null;
  // Téléphone : le niveau ouvert de la pile.
  const [level, setLevel] = useState<"weeks" | "week" | "session">(
    meta.focus.week ? "week" : "weeks",
  );

  const [sheet, setSheet] = useState<
    | null
    | "duplicate"
    | "from-template"
    | "rename"
    | "save-template"
    | "archive"
    | "publish"
    | "delete-session"
    | { renamePhase: string }
  >(null);
  const [pending, startTransition] = useTransition();
  // Jours fixes (03b) : le choix du jour d'une séance (panneau à droite ou feuille du téléphone) et la
  // proposition en passant une semaine en « Jours fixes ».
  const [dayPicker, setDayPicker] = useState<{ key: string; sheet: boolean } | null>(null);
  const [proposal, setProposal] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [openedRevision] = useState(editor.revision);
  // Téléphone : chaque niveau de la pile s'ouvre en haut de la page.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [level]);
  useEffect(() => {
    const open = () => {
      setPublishError(null);
      setSheet("publish");
    };
    window.addEventListener(PUBLISH_EVENT, open);
    return () => window.removeEventListener(PUBLISH_EVENT, open);
  }, []);

  const currentWeek = draft
    ? Math.floor((Date.parse(meta.today) - Date.parse(draft.startDate)) / (7 * 86_400_000)) + 1
    : null;
  const locked = (index: number) =>
    draft ? isPastWeek(draft.startDate, index, meta.today) : false;
  const weekLabel = (item: Week) =>
    draft
      ? `Semaine ${item.index} · ${weekRange(draft.startDate, item.index)}`
      : `Semaine ${item.index}`;
  const editHref = (key: string) =>
    target.kind === "program" ? `${meta.base}/${target.programId}/seances/${key}` : null;

  // Ouvrir une séance seulement quand le brouillon est bien enregistré : sinon sa page ne la
  // trouverait pas (« Page introuvable »).
  const openSession = async (key: string) => {
    const href = editHref(key);
    if (!href) return;
    if (!(await editor.flush())) {
      toast("Le brouillon n'est pas enregistré : recharge la page, puis réessaie.");
      return;
    }
    router.push(href);
  };

  const chooseWeek = (index: number) => {
    setWeekIndex(index);
    const next = plan.weeks.find((item) => item.index === index);
    setSessionKey(next ? (orderedSessions(next)[0]?.key ?? null) : null);
    setLevel("week");
  };

  const addBlank = () => {
    if (!week) return;
    const discipline = plan.discipline === "hybrid" ? "running" : plan.discipline;
    let created = "";
    update((current) => {
      const result = addSession(current, week.index, blankSession(discipline));
      created = result.key;
      return result.plan;
    });
    if (created) {
      setSessionKey(created);
      void openSession(created);
    }
  };

  // Publier (08) : vérifications côté navigateur, puis l'action (qui revérifie tout).
  const publishContext: PublishContext | null = meta.publishContext
    ? {
        ...meta.publishContext,
        maxByExercise: new Map(meta.publishContext.maxByExercise),
        coachSessionIds: new Set(meta.publishContext.coachSessionIds),
      }
    : null;
  const issues = draft && publishContext ? validateForPublish(draft, publishContext) : [];
  const nextVersion = (meta.publication?.number ?? 0) + 1;
  const sessionCount = plan.weeks.reduce((total, item) => total + item.sessions.length, 0);

  const publish = () => {
    if (target.kind !== "program") return;
    setPublishError(null);
    startTransition(async () => {
      const saved = await editor.flush();
      if (!saved) return setPublishError("Le brouillon n'est pas enregistré. Réessaie.");
      const result = await publishProgram(
        organizationId,
        target.programId,
        editor.currentRevision(),
      );
      if (!result.ok) return setPublishError(result.issues?.[0] ?? result.message);
      setSheet(null);
      toast(`Programme publié (version ${result.number}).`, {
        action: meta.athleteHref
          ? { label: "Voir", onClick: () => router.push(meta.athleteHref as string) }
          : undefined,
      });
      router.refresh();
    });
  };

  const menuItems: MoreMenuItem[] =
    target.kind === "program"
      ? [
          {
            label: "Enregistrer comme modèle",
            icon: LayoutTemplate,
            highlighted: true,
            onSelect: () => setSheet("save-template"),
          },
          {
            label: "Dupliquer le programme",
            icon: Copy,
            onSelect: () =>
              startTransition(async () => {
                await editor.flush();
                const result = await duplicateProgram(organizationId, target.programId);
                if (result.ok) router.push(`${meta.base}/${result.programId}`);
                else toast(result.message);
              }),
          },
          { label: "Renommer", icon: Pencil, onSelect: () => setSheet("rename") },
          {
            label: "Archiver",
            icon: Archive,
            destructive: true,
            onSelect: () => setSheet("archive"),
          },
        ]
      : [
          { label: "Renommer", icon: Pencil, onSelect: () => setSheet("rename") },
          {
            label: "Archiver le modèle",
            icon: Archive,
            destructive: true,
            onSelect: () => setSheet("archive"),
          },
        ];

  const copyCoory = () =>
    target.kind === "template" &&
    startTransition(async () => {
      const result = await duplicateTemplate(organizationId, "program", target.templateId);
      if (!result.ok) return toast(result.message);
      toast("Modèle dupliqué dans Mes modèles.");
      router.push(`${meta.base}/modeles/${result.templateId}`);
    });

  // ---------------------------------------------------------------------------
  // Morceaux
  // ---------------------------------------------------------------------------
  // Bandeau (ordinateur) : une pilule 32 px « Publié v1 · ● Modifications non publiées ».
  const unpublished =
    meta.publication !== null &&
    editor.revision > 0 &&
    editor.revision !== meta.publication.sourceRevision;
  const statePill = (
    <span className="flex h-8 shrink-0 items-center gap-2 rounded-[9px] bg-surface-2 px-3 text-[12.5px] font-medium whitespace-nowrap text-text-2">
      {readOnly && target.kind === "program" ? (
        "Archivé"
      ) : readOnly ? (
        <>
          <span className="font-semibold text-violet-text">Coory</span>
          <span aria-hidden className="size-1 rounded-full bg-dlg-disabled" />
          <span className="flex items-center gap-[7px]">
            <Lock aria-hidden size={13} strokeWidth={2} />
            Lecture seule
          </span>
        </>
      ) : target.kind === "template" ? (
        <span className="font-semibold text-text">Mes modèles</span>
      ) : meta.publication ? (
        <>
          <span className="font-semibold text-text">Publié v{meta.publication.number}</span>
          {unpublished ? (
            <>
              <span aria-hidden className="size-1 rounded-full bg-dlg-disabled" />
              <span className="flex items-center gap-2">
                <span aria-hidden className="size-[7px] rounded-full bg-violet" />
                Modifications non publiées
              </span>
            </>
          ) : null}
        </>
      ) : (
        <span className="font-semibold text-text">Brouillon</span>
      )}
    </span>
  );
  // Téléphone : des pilules blanches séparées (« Hyrox », « Publié v1 », « ● Non publié »).
  const phonePill =
    "flex h-[26px] items-center gap-1.5 rounded-[13px] bg-surface px-2.5 text-[12.5px] whitespace-nowrap";
  const phonePills = (
    <span className="mt-1 flex flex-wrap gap-1.5">
      <span className={`${phonePill} font-medium text-text`}>
        <span
          aria-hidden
          className={`size-[7px] rounded-full ${disciplineStyles[plan.discipline].dot}`}
        />
        {disciplineLabels[plan.discipline]}
      </span>
      {readOnly && target.kind === "program" ? (
        <span className={`${phonePill} font-semibold text-text`}>Archivé</span>
      ) : readOnly ? (
        <span className={`${phonePill} font-medium text-text-2`}>
          <span className="font-semibold text-violet-text">Coory</span>
          <Lock aria-hidden size={12} strokeWidth={2} />
          Lecture seule
        </span>
      ) : target.kind === "template" ? (
        <span className={`${phonePill} font-semibold text-text`}>Mes modèles</span>
      ) : meta.publication ? (
        <>
          <span className={`${phonePill} font-semibold text-text`}>
            Publié v{meta.publication.number}
          </span>
          {unpublished ? (
            <span className={`${phonePill} font-medium text-text-2`}>
              <span aria-hidden className="size-[7px] rounded-full bg-violet" />
              Non publié
            </span>
          ) : null}
        </>
      ) : (
        <span className={`${phonePill} font-semibold text-text`}>Brouillon</span>
      )}
    </span>
  );

  const metaLine = [
    meta.athlete?.name,
    meta.mode === "template"
      ? `${meta.templateSource === "coory" ? "Modèle Coory" : "Mes modèles"} · sans sportif ni dates`
      : null,
    draft
      ? `${dayMonth.format(asDate(draft.startDate))} → ${dayMonth.format(
          asDate(weekMonday(draft.startDate, plan.weeks.length + 1)),
        )}`
      : null,
    `${plan.weeks.length} semaine${plan.weeks.length > 1 ? "s" : ""}`,
    `${plan.sessionsPerWeek} séance${plan.sessionsPerWeek > 1 ? "s" : ""} par semaine`,
    draft?.goal?.raceName
      ? `objectif ${draft.goal.raceName}${draft.goal.raceDate ? `, ${dayMonth.format(asDate(draft.goal.raceDate))}` : ""}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const disciplinePill = (discipline: Discipline) => (
    <span className={`${pill} bg-bg text-[12px] font-medium text-text-2`}>
      <span aria-hidden className={`size-[7px] rounded-full ${disciplineStyles[discipline].dot}`} />
      {disciplineLabels[discipline]}
    </span>
  );

  const saveLabel =
    readOnly || (editor.status === "saved" && editor.revision === openedRevision) ? null : (
      <span
        aria-live="polite"
        className={`text-[12.5px] whitespace-nowrap ${
          editor.status === "error" || editor.status === "conflict"
            ? "font-semibold text-alert"
            : "text-faint"
        }`}
      >
        {saveStatusLabel(editor.status)}
        {editor.status === "error" ? (
          <button type="button" onClick={editor.retry} className="ml-1.5 underline">
            Réessayer
          </button>
        ) : null}
        {editor.status === "conflict" ? (
          <button type="button" onClick={() => router.refresh()} className="ml-1.5 underline">
            Recharger
          </button>
        ) : null}
      </span>
    );

  const phaseGroups = (() => {
    const groups: { phase: (typeof plan.phases)[number] | null; weeks: Week[] }[] = [];
    for (const item of plan.weeks) {
      const phase = phaseOfWeek(plan.phases, item.index);
      const last = groups[groups.length - 1];
      if (last && last.phase?.id === phase?.id) last.weeks.push(item);
      else groups.push({ phase, weeks: [item] });
    }
    return groups;
  })();
  // Téléphone (demande d'Antonino du 10/11) : n'afficher qu'une semaine de la liste, ou toutes.
  const [phoneWeek, setPhoneWeek] = useState<number | null>(null);
  const phoneGroups =
    phoneWeek === null
      ? phaseGroups
      : phaseGroups
          .map((group) => ({ ...group, weeks: group.weeks.filter((w) => w.index === phoneWeek) }))
          .filter((group) => group.weeks.length > 0);
  const nextPhaseName =
    ["Base", "Spécifique", "Affûtage"][plan.phases.length] ?? `Phase ${plan.phases.length + 1}`;
  const canAddPhase =
    !readOnly &&
    (plan.phases.length === 0 || Math.max(...plan.phases.map((p) => p.weekTo)) < plan.weeks.length);

  const phaseMenu = (phase: (typeof plan.phases)[number], size: "md" | "lg" = "md") =>
    readOnly ? null : (
      <MoreMenu
        label={`Plus d'actions sur la phase ${phase.name}`}
        title={phase.name}
        phoneSize={size}
        width={220}
        items={[
          {
            label: "Renommer la phase",
            icon: Pencil,
            onSelect: () => setSheet({ renamePhase: phase.id }),
          },
          {
            label: "Retirer la phase",
            icon: Trash2,
            destructive: true,
            onSelect: () => update((current) => removePhase(current, phase.id)),
          },
        ]}
        className="-my-2.5 -mr-2.5 [&>button]:bg-transparent! [&>button]:text-faint! [&>button]:inset-ring-0! lg:my-0 lg:mr-0 lg:[&>button]:size-7! lg:[&>button]:rounded-[8px]! lg:[&>button]:text-[12px]!"
      />
    );

  const weekMenu = week
    ? [
        {
          label: week.light ? "Ne plus marquer « allégée »" : "Marquer la semaine « allégée »",
          icon: Pencil,
          onSelect: () => update((current) => setWeekLight(current, week.index, !week.light)),
        },
        {
          label: "Retirer la semaine",
          icon: Trash2,
          destructive: true,
          onSelect: () => {
            update((current) => removeWeek(current, week.index));
            setWeekIndex(Math.max(1, week.index - 1));
          },
        },
      ]
    : [];

  // Modèle (EDT-02) : « Base · 4 séances · dans l'ordre » (pas de dates).
  const weekMeta = week
    ? [
        draft ? weekRange(draft.startDate, week.index) : phaseOfWeek(plan.phases, week.index)?.name,
        `${week.sessions.length} séance${week.sessions.length > 1 ? "s" : ""}`,
        // Le sélecteur « Dans l'ordre | Jours fixes » le dit déjà ; en lecture seule, on l'écrit.
        readOnly
          ? week.scheduling === "fixed"
            ? "jours fixes"
            : draft
              ? "dans l'ordre, sans jour fixe"
              : "dans l'ordre"
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";
  const weekPhase = week ? phaseOfWeek(plan.phases, week.index) : null;

  const daysContext: DaysContext = {
    firstName: meta.athlete?.firstName ?? "le sportif",
    availableDays: meta.publishContext?.availableDays ?? [],
    startDate: draft?.startDate ?? null,
  };
  const dates = draft ? { startDate: draft.startDate, today: meta.today } : undefined;
  const switchMode = (mode: "ordered" | "fixed") => {
    if (!week || mode === week.scheduling) return;
    if (mode === "fixed") return setProposal(true);
    update((current) => ({
      ...current,
      weeks: current.weeks.map((item) => (item.index === week.index ? setWeekOrdered(item) : item)),
    }));
    setDayPicker(null);
    toast(`Semaine ${week.index} : dans l'ordre, sans jour fixe.`);
  };
  const fixDays = (days: Map<string, Weekday>, scope: ScheduleScope) => {
    if (!week) return;
    update((current) => {
      const weeks = current.weeks.map((item) =>
        item.index === week.index ? setWeekFixed(item, days) : item,
      );
      return {
        ...current,
        weeks:
          scope === "week"
            ? weeks
            : applyWeekSchedule(weeks, current.phases, week.index, scope, dates),
      };
    });
    setProposal(false);
    toast(
      scope === "week"
        ? `Jours fixés pour la semaine ${week.index}.`
        : "Jours fixés ; les semaines passées n'ont pas changé.",
    );
  };
  const applyDay = (key: string, choice: DayChoice, scope: ScheduleScope) => {
    if (!week) return;
    const slot = week.sessions.findIndex((item) => item.key === key);
    if (slot < 0) return;
    // Ce qui a vraiment changé ailleurs : semaines touchées et copies créées (semaines où la séance
    // n'était pas). Le message le dit, sans promettre plus.
    let others = 0;
    let copies = 0;
    update((current) => {
      const weeks = applySessionDay(
        current.weeks,
        current.phases,
        week.index,
        slot,
        choice,
        scope,
        dates,
      );
      weeks.forEach((item, i) => {
        const before = current.weeks[i];
        if (item === before || item.index === week.index) return;
        others += 1;
        copies += item.sessions.length - (before?.sessions.length ?? 0);
      });
      return { ...current, weeks };
    });
    setDayPicker(null);
    const title = week.sessions[slot]?.title ?? "La séance";
    toast(
      scope === "week"
        ? "Jour de la séance enregistré."
        : others === 0
          ? "Jour enregistré pour cette semaine : aucune autre semaine ne pouvait changer (passées ou rendez-vous du coach)."
          : copies > 0
            ? `« ${title} » est placée dans ${others} autre${others > 1 ? "s" : ""} semaine${others > 1 ? "s" : ""} (${copies} copie${copies > 1 ? "s" : ""} créée${copies > 1 ? "s" : ""}).`
            : `Jour appliqué à cette semaine et à ${others} autre${others > 1 ? "s" : ""}.`,
    );
  };
  // Semaines (hors celle-ci, non passées) que « Appliquer ce jour à » changera, par portée.
  const reachable = () => {
    const count = (inScope: (index: number) => boolean) =>
      plan.weeks.filter(
        (item) =>
          item.index !== week?.index &&
          inScope(item.index) &&
          !(dates && isPastWeek(dates.startDate, item.index, dates.today)),
      ).length;
    return {
      phase: weekPhase
        ? count((index) => weekPhase.weekFrom <= index && index <= weekPhase.weekTo)
        : 0,
      program: count(() => true),
    };
  };
  const openDayPicker = (key: string) => {
    if (readOnly) return;
    setSessionKey(key);
    setDayPicker({ key, sheet: !window.matchMedia("(min-width: 1024px)").matches });
  };
  const pickerSession = dayPicker ? ordered.find((item) => item.key === dayPicker.key) : undefined;
  const dayPickerView = (compact: boolean) =>
    pickerSession && week ? (
      <DayPicker
        key={pickerSession.key}
        session={pickerSession}
        week={week}
        phase={weekPhase}
        weeksCount={plan.weeks.length}
        context={daysContext}
        compact={compact}
        reachable={reachable()}
        onValidate={(choice, scope) => applyDay(pickerSession.key, choice, scope)}
        onCancel={() => setDayPicker(null)}
      />
    ) : null;
  const fixedWeek = week?.scheduling === "fixed";
  const modeSwitch = (size: "card" | "tall") =>
    readOnly || !week ? null : (
      <SegmentedControl
        label={`Organisation de la semaine ${week.index}`}
        size={size}
        value={week.scheduling}
        onChange={switchMode}
        options={[
          { value: "ordered", label: "Dans l'ordre" },
          { value: "fixed", label: "Jours fixes" },
        ]}
      />
    );

  const sessionCards = (mobile: boolean) =>
    ordered.map((item, i) => (
      <EditorSessionCard
        key={item.key}
        index={i + 1}
        title={item.title}
        discipline={item.content.discipline}
        sessionType={item.sessionType}
        summary={[sessionHeadline(item)]}
        coach={coachLabel(item)}
        selected={item.key === session?.key}
        readOnly={readOnly}
        onSelect={() => {
          setSessionKey(item.key);
          if (mobile) setLevel("session");
        }}
        onMoveUp={
          !readOnly && week?.scheduling === "ordered" && i > 0
            ? () => update((current) => moveSession(current, week.index, item.key, -1))
            : undefined
        }
        onMoveDown={
          !readOnly && week?.scheduling === "ordered" && i < ordered.length - 1
            ? () => update((current) => moveSession(current, week.index, item.key, 1))
            : undefined
        }
        dayPad={
          fixedWeek && week ? (
            <DayPad
              session={item}
              weekIndex={week.index}
              context={daysContext}
              selected={!mobile && item.key === session?.key}
              onOpen={() => openDayPicker(item.key)}
            />
          ) : undefined
        }
      />
    ));

  const addButtons = readOnly ? null : (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={addBlank}
        className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[15px] text-[13.5px] font-medium text-text-2 inset-ring-[1.5px] inset-ring-line transition-[scale,background-color] duration-150 hover:bg-surface-2 active:scale-[0.98]"
      >
        <Plus aria-hidden size={15} strokeWidth={2} />
        Ajouter une séance
      </button>
      <button
        type="button"
        onClick={() => setSheet("from-template")}
        className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[15px] text-[13.5px] font-medium text-text-2 inset-ring-[1.5px] inset-ring-line transition-[scale,background-color] duration-150 hover:bg-surface-2 active:scale-[0.98]"
      >
        <LayoutTemplate aria-hidden size={15} strokeWidth={1.8} />
        Depuis un modèle
      </button>
    </div>
  );

  const sessionPosition = session ? ordered.findIndex((item) => item.key === session.key) + 1 : 0;
  const sessionDetail = session ? (
    <SessionDetail session={session} position={sessionPosition} week={`Semaine ${week?.index}`} />
  ) : (
    <p className="text-[14px] text-muted">Choisis une séance pour voir son détail.</p>
  );

  const duplicateCurrent = () => {
    if (!week || !session) return;
    let created: string | null = null;
    update((current) => {
      const result = duplicateSession(current, week.index, session.key);
      created = result.key;
      return result.plan;
    });
    if (created) {
      setSessionKey(created);
      toast("Séance dupliquée.");
    }
  };

  // Ordinateur : « Modifier la séance » 40 px + copier + supprimer (maquette EDT-01).
  const sessionActions = session ? (
    readOnly ? (
      <p className="flex h-10 items-center justify-center gap-[7px] rounded-[11px] bg-surface-2 px-3 text-[13px] font-medium text-text-2">
        <Lock aria-hidden size={13} strokeWidth={2} />
        Duplique le modèle pour le modifier
      </p>
    ) : (
      <div className="flex gap-2">
        {editHref(session.key) ? (
          <button
            type="button"
            onClick={() => void openSession(session.key)}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-[11px] bg-cta px-4 text-[13.5px] font-semibold text-on-cta transition-[scale,background-color] duration-150 hover:bg-cta-hover active:scale-[0.98]"
          >
            Modifier la séance
          </button>
        ) : (
          <p className="flex flex-1 items-center text-[12.5px] text-muted">
            Le détail des séances d&apos;un modèle se modifie depuis un programme.
          </p>
        )}
        <button
          type="button"
          aria-label="Dupliquer la séance"
          onClick={duplicateCurrent}
          className="grid size-10 shrink-0 place-items-center rounded-[11px] text-text inset-ring inset-ring-field-ring transition-[scale,background-color] duration-150 hover:bg-surface-2 active:scale-95"
        >
          <Copy aria-hidden size={15} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          aria-label="Supprimer la séance"
          onClick={() => setSheet("delete-session")}
          className="grid size-10 shrink-0 place-items-center rounded-[11px] text-alert inset-ring inset-ring-field-ring transition-[scale,background-color] duration-150 hover:bg-surface-2 active:scale-95"
        >
          <Trash2 aria-hidden size={15} strokeWidth={1.8} />
        </button>
      </div>
    )
  ) : null;

  const programActions = (phone: boolean) =>
    readOnly && target.kind === "program" ? null : readOnly ? (
      <button
        type="button"
        onClick={copyCoory}
        disabled={pending}
        className={
          phone
            ? "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[12px] bg-cta px-4 text-[14.5px] font-semibold text-on-cta"
            : "inline-flex h-8 items-center gap-1.5 rounded-[9px] bg-cta px-3.5 text-[12.5px] font-semibold text-on-cta"
        }
      >
        <Copy aria-hidden size={13} strokeWidth={2} />
        Dupliquer dans Mes modèles
      </button>
    ) : (
      <>
        {target.kind === "program" ? (
          <>
            <Link
              href={meta.athleteHref ?? "#"}
              aria-disabled={!meta.publication}
              className={`${phone ? "inline-flex h-11 items-center gap-2 rounded-[12px] bg-surface px-3.5 text-[14px] font-semibold text-text inset-ring inset-ring-field-ring" : smallButton} ${meta.publication ? "" : "pointer-events-none text-faint"}`}
            >
              <Eye aria-hidden size={phone ? 16 : 13} strokeWidth={2} />
              Aperçu
            </Link>
            {phone ? null : meta.publication ? (
              // PDF tirés de la version PUBLIÉE (phase 5) : le brouillon en cours n'y est pas.
              <ProgramPdfMenu
                base={`${meta.base}/${target.programId}/pdf`}
                className={smallButton}
              />
            ) : (
              <button
                type="button"
                disabled
                title="Publie le programme pour générer les PDF."
                className={smallButton}
              >
                <FileDown aria-hidden size={13} strokeWidth={2} />
                PDF
              </button>
            )}
          </>
        ) : null}
        <MoreMenu
          label={
            target.kind === "program"
              ? "Plus d'actions sur le programme"
              : "Plus d'actions sur le modèle"
          }
          title={plan.title}
          items={menuItems}
        />
      </>
    );

  const sheets = (
    <>
      {week ? (
        <DuplicateWeekSheet
          open={sheet === "duplicate"}
          onClose={() => setSheet(null)}
          source={week.index}
          weeks={plan.weeks}
          phases={plan.phases}
          locked={locked}
          label={weekLabel}
          onConfirm={(targets) => {
            update((current) => duplicateWeekTo(current, week.index, targets));
            setSheet(null);
            toast(
              targets.length > 1
                ? `Semaine ${week.index} dupliquée vers ${targets.length} semaines.`
                : `Semaine ${week.index} dupliquée.`,
            );
          }}
        />
      ) : null}
      <SessionTemplateSheet
        open={sheet === "from-template"}
        onClose={() => setSheet(null)}
        templates={meta.sessionTemplates}
        onConfirm={(id) => {
          const template = meta.sessionTemplates.find((item) => item.id === id);
          if (!template || !week) return;
          let created = "";
          update((current) => {
            const result = addSession(current, week.index, template.body);
            created = result.key;
            return result.plan;
          });
          setSessionKey(created);
          setSheet(null);
          toast(`« ${template.title} » ajoutée à la semaine ${week.index}.`);
        }}
      />
      <TextSheet
        open={sheet === "rename"}
        onClose={() => setSheet(null)}
        title={target.kind === "program" ? "Renommer le programme" : "Renommer le modèle"}
        label="Titre"
        initial={plan.title}
        confirmLabel="Renommer"
        onConfirm={(title) => {
          update((current) => ({ ...current, title }));
          setSheet(null);
        }}
      />
      <TextSheet
        open={typeof sheet === "object" && sheet !== null && "renamePhase" in sheet}
        onClose={() => setSheet(null)}
        title="Renommer la phase"
        label="Nom de la phase"
        initial={
          typeof sheet === "object" && sheet !== null
            ? (plan.phases.find((phase) => phase.id === sheet.renamePhase)?.name ?? "")
            : ""
        }
        confirmLabel="Renommer"
        onConfirm={(name) => {
          if (typeof sheet === "object" && sheet !== null) {
            update((current) => renamePhase(current, sheet.renamePhase, name.slice(0, 40)));
          }
          setSheet(null);
        }}
      />
      <TextSheet
        open={sheet === "save-template"}
        onClose={() => setSheet(null)}
        title="Enregistrer comme modèle"
        label="Nom du modèle"
        initial={plan.title}
        confirmLabel="Enregistrer le modèle"
        hint="Le modèle garde les semaines, les phases et les séances, sans le sportif ni les dates."
        pending={pending}
        onConfirm={(title) =>
          target.kind === "program" &&
          startTransition(async () => {
            await editor.flush();
            const result = await saveProgramAsTemplate(organizationId, target.programId, title);
            setSheet(null);
            toast(result.ok ? "Modèle enregistré dans Mes modèles." : result.message);
          })
        }
      />
      <ConfirmDialog
        open={sheet === "archive"}
        onClose={() => setSheet(null)}
        title={target.kind === "program" ? "Archiver ce programme ?" : "Archiver ce modèle ?"}
        confirmLabel="Archiver"
        icon={Archive}
        pending={pending}
        onConfirm={() =>
          startTransition(async () => {
            await editor.flush();
            const result =
              target.kind === "program"
                ? await archiveProgram(organizationId, target.programId)
                : await archiveTemplate(organizationId, "program", target.templateId);
            if (!result.ok) return toast(result.message);
            toast(target.kind === "program" ? "Programme archivé." : "Modèle archivé.");
            router.push(target.kind === "program" ? meta.base : `${meta.base}?onglet=modeles`);
          })
        }
      >
        {target.kind === "program"
          ? "Il quitte la liste et l'espace du sportif. Ses versions publiées restent conservées."
          : "Il ne sera plus proposé. Les programmes déjà créés avec lui ne changent pas."}
      </ConfirmDialog>
      <ConfirmDialog
        open={sheet === "delete-session"}
        onClose={() => setSheet(null)}
        title="Supprimer cette séance ?"
        confirmLabel="Supprimer"
        icon={Trash2}
        onConfirm={() => {
          if (!week || !session) return;
          update((current) => removeSession(current, week.index, session.key));
          setSessionKey(ordered.find((item) => item.key !== session.key)?.key ?? null);
          setSheet(null);
          setLevel("week");
        }}
      >
        {session ? `« ${session.title} » sort du brouillon de la semaine ${week?.index}.` : null}
      </ConfirmDialog>
      {draft ? (
        <PublishSheet
          open={sheet === "publish"}
          onClose={() => setSheet(null)}
          version={nextVersion}
          weeks={plan.weeks.length}
          sessions={sessionCount}
          firstName={meta.athlete?.firstName ?? "Le sportif"}
          issues={issues}
          pending={pending}
          error={publishError}
          onConfirm={publish}
          onSee={(index) => {
            setSheet(null);
            chooseWeek(index);
          }}
        />
      ) : null}
    </>
  );

  // ---------------------------------------------------------------------------
  // Rendu
  // ---------------------------------------------------------------------------
  return (
    <>
      {/* Téléphone : le retour de la barre suit le niveau ouvert. */}
      <MobileBarTitle>
        {level === "weeks" ? (
          <Link
            href={target.kind === "program" ? meta.base : `${meta.base}?onglet=modeles`}
            className={barBackClass}
          >
            <ArrowLeft aria-hidden {...barBackIcon} className="shrink-0" />
            <span className="truncate">{target.kind === "program" ? "Programmes" : "Modèles"}</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setLevel(level === "session" ? "week" : "weeks")}
            className={barBackClass}
          >
            <ArrowLeft aria-hidden {...barBackIcon} className="shrink-0" />
            <span className="truncate">
              {level === "session" ? `Semaine ${week?.index}` : "Semaines"}
            </span>
          </button>
        )}
      </MobileBarTitle>

      {/* ---------------- Ordinateur ---------------- */}
      <div className="hidden min-h-0 flex-1 flex-col gap-3 lg:flex">
        <section className={`${card} flex items-center gap-3.5 py-4 pr-[18px] pl-5`}>
          {meta.athlete ? (
            <Avatar name={meta.athlete.name} photoPath={meta.athlete.photoPath} size="menu" />
          ) : (
            <span className="grid size-[46px] shrink-0 place-items-center rounded-[14px] bg-lib-lavender text-violet-text">
              <FileText aria-hidden size={20} strokeWidth={1.7} />
            </span>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex min-w-0 items-center gap-2.5">
              <h2 className="truncate text-[19px] leading-[1.2] font-semibold tracking-[-0.015em] text-text">
                {plan.title}
              </h2>
              {disciplinePill(plan.discipline)}
            </div>
            <p className="text-[13px] leading-[1.4] text-muted">{metaLine}</p>
          </div>
          {saveLabel}
          {statePill}
          {readOnly ? null : programActions(false)}
        </section>

        <div className="grid min-h-0 flex-1 grid-cols-[196px_minmax(0,1fr)_304px] gap-3">
          {/* Semaines */}
          <nav aria-label="Semaines" className={`${card} flex min-h-0 flex-col px-2.5 py-3.5`}>
            <p className="mb-2 flex items-baseline justify-between px-2 text-[15px] font-semibold text-text">
              Semaines{" "}
              <span className="text-[12.5px] font-medium text-faint tabular">
                {plan.weeks.length}
              </span>
            </p>
            <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain">
              {phaseGroups.map((group, g) => (
                <div key={group.phase?.id ?? `none-${g}`} className="flex flex-col gap-0.5">
                  {group.phase ? (
                    <div className="mt-2 flex items-center justify-between px-2 first:mt-0">
                      <span className="truncate text-[11px] font-semibold tracking-[0.06em] text-faint uppercase">
                        {group.phase.name} · S{group.phase.weekFrom}–{group.phase.weekTo}
                      </span>
                      {phaseMenu(group.phase)}
                    </div>
                  ) : null}
                  {group.weeks.map((item) => {
                    const active = item.index === week?.index;
                    return (
                      <button
                        key={item.index}
                        type="button"
                        onClick={() => chooseWeek(item.index)}
                        aria-current={active ? "true" : undefined}
                        className={`flex min-h-9 w-full items-center gap-2 rounded-[10px] px-2 py-1 text-left transition-colors duration-150 ${
                          active ? "bg-lib-lavender" : "hover:bg-surface-2"
                        }`}
                      >
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span
                            className={`flex items-center gap-1.5 text-[13.5px] leading-[1.3] text-text ${active ? "font-semibold" : "font-medium"}`}
                          >
                            Semaine {item.index}
                            {currentWeek === item.index ? (
                              <span
                                aria-label="en cours"
                                className="size-1.5 rounded-full bg-violet"
                              />
                            ) : null}
                          </span>
                          {draft ? (
                            <span className="truncate text-[11.5px] leading-[1.3] text-faint">
                              {weekRange(draft.startDate, item.index)}
                            </span>
                          ) : (
                            <span className="text-[11.5px] leading-[1.3] text-faint">
                              {item.sessions.length} séance{item.sessions.length > 1 ? "s" : ""}
                            </span>
                          )}
                        </span>
                        {item.light ? (
                          <span className={`${pill} h-5 bg-bg text-[10.5px] text-muted`}>
                            allégée
                          </span>
                        ) : null}
                        {item.scheduling === "fixed" ? (
                          <CalendarDays
                            aria-label="jours fixes"
                            size={14}
                            strokeWidth={1.8}
                            className="shrink-0 text-violet"
                          />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ))}
              {plan.weeks.some((item) => item.scheduling === "fixed") ? (
                <span className="mt-1.5 px-2 text-[11.5px] leading-[1.45] text-faint">
                  Violet = jours fixes.
                </span>
              ) : null}
            </div>
            {readOnly ? null : (
              <div className="mt-2 flex gap-1">
                <button
                  type="button"
                  disabled={plan.weeks.length >= 52}
                  onClick={() => update((current) => addWeek(current))}
                  className="inline-flex h-[30px] items-center gap-1 rounded-[8px] px-2 text-[13px] font-medium text-violet-text hover:bg-surface-2 disabled:text-faint"
                >
                  <Plus aria-hidden size={13} strokeWidth={2.2} /> Semaine
                </button>
                <button
                  type="button"
                  disabled={!canAddPhase}
                  onClick={() => update((current) => addPhase(current, nextPhaseName))}
                  className="inline-flex h-[30px] items-center gap-1 rounded-[8px] px-2 text-[13px] font-medium text-violet-text hover:bg-surface-2 disabled:text-faint"
                >
                  <Plus aria-hidden size={13} strokeWidth={2.2} /> Phase
                </button>
              </div>
            )}
          </nav>

          {/* La semaine */}
          <section
            aria-label={`Semaine ${week?.index}`}
            className={`${card} flex min-h-0 flex-col p-[18px]`}
          >
            {week ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className="text-[17px] leading-[1.25] font-semibold whitespace-nowrap text-text">
                        Semaine {week.index}
                      </h3>
                      {currentWeek === week.index ? (
                        <span
                          className={`${pill} h-[22px] bg-violet-soft font-medium text-violet-text`}
                        >
                          En cours
                        </span>
                      ) : null}
                      {weekPhase ? (
                        <span className={`${pill} h-[22px] bg-bg font-medium text-text-2`}>
                          {weekPhase.name}
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-[13px] text-muted">{weekMeta}</p>
                  </div>
                  {readOnly ? null : (
                    // Sélecteur des jours, Dupliquer et « ··· » sur une seule ligne (demande
                    // d'Antonino du 10/11 : gagner de la place sur ordinateur).
                    <div className="flex shrink-0 items-center gap-2">
                      {modeSwitch("card")}
                      <button
                        type="button"
                        onClick={() => setSheet("duplicate")}
                        className={smallButton}
                      >
                        <Copy aria-hidden size={13} strokeWidth={2} />
                        Dupliquer
                      </button>
                      <MoreMenu
                        label={`Plus d'actions sur la semaine ${week.index}`}
                        title={`Semaine ${week.index}`}
                        items={weekMenu}
                      />
                    </div>
                  )}
                </div>
                {fixedWeek ? (
                  <div className="mt-3 flex flex-col gap-2">
                    <DayStrip
                      week={week}
                      context={daysContext}
                      selectedKey={session?.key ?? null}
                      onPick={(key) => setSessionKey(key)}
                    />
                    {readOnly ? null : (
                      <p className="text-[12.5px] leading-[1.45] text-muted">
                        Clique sur le jour d&apos;une séance pour le changer. Les numéros suivent
                        l&apos;ordre des jours.
                      </p>
                    )}
                  </div>
                ) : null}
                <div className="mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pb-1">
                  {ordered.length === 0 ? (
                    <p className="rounded-[15px] bg-surface-2 px-4 py-6 text-center text-[13.5px] text-muted">
                      Aucune séance cette semaine.
                    </p>
                  ) : (
                    sessionCards(false)
                  )}
                </div>
                <div className="mt-3">{addButtons}</div>
              </>
            ) : null}
          </section>

          {/* La séance choisie */}
          <aside
            aria-label={dayPicker && !dayPicker.sheet ? "Jour de la séance" : "Séance choisie"}
            className={`${card} flex min-h-0 flex-col p-[18px] ${dayPicker && !dayPicker.sheet ? "inset-ring-[1.5px] inset-ring-violet/35" : ""}`}
          >
            {dayPicker && !dayPicker.sheet && pickerSession ? (
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {dayPickerView(true)}
              </div>
            ) : (
              <>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {sessionDetail}
                </div>
                {sessionActions ? <div className="mt-4">{sessionActions}</div> : null}
              </>
            )}
          </aside>
        </div>
      </div>

      {/* ---------------- Téléphone (EDT-03 à 05) ---------------- */}
      <div className="flex flex-col gap-3 lg:hidden">
        {level === "weeks" ? (
          <>
            <div className="flex flex-col gap-1.5 px-1">
              <h2 className="text-[24px] leading-[1.15] font-bold tracking-[-0.02em] text-text">
                {plan.title}
              </h2>
              <p className="text-[13.5px] text-muted">
                {[
                  meta.athlete?.name,
                  draft
                    ? `${dayMonth.format(asDate(draft.startDate))} → ${dayMonth.format(asDate(weekMonday(draft.startDate, plan.weeks.length + 1)))}`
                    : `${plan.weeks.length} semaines`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {phonePills}
              {saveLabel ? <span className="mt-0.5">{saveLabel}</span> : null}
            </div>
            <div className="flex gap-2">
              {readOnly ? (
                target.kind === "template" ? (
                  <button
                    type="button"
                    onClick={copyCoory}
                    disabled={pending}
                    className={`${phoneButton} bg-cta text-on-cta`}
                  >
                    Dupliquer dans Mes modèles
                  </button>
                ) : null
              ) : (
                <>
                  {target.kind === "program" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setPublishError(null);
                          setSheet("publish");
                        }}
                        className={`${phoneButton} bg-cta text-on-cta`}
                      >
                        Publier
                      </button>
                      <Link
                        href={meta.athleteHref ?? "#"}
                        aria-disabled={!meta.publication}
                        className={`${phoneButton} bg-surface inset-ring inset-ring-field-ring ${meta.publication ? "text-text" : "pointer-events-none text-faint"}`}
                      >
                        Aperçu
                      </Link>
                    </>
                  ) : null}
                  <MoreMenu
                    label={
                      target.kind === "program"
                        ? "Plus d'actions sur le programme"
                        : "Plus d'actions sur le modèle"
                    }
                    title={plan.title}
                    items={menuItems}
                  />
                </>
              )}
            </div>
            <label className="flex items-center gap-2.5 px-1">
              <ListFilter aria-hidden size={18} strokeWidth={2} className="shrink-0 text-muted" />
              <span className="sr-only">Semaine à afficher</span>
              <SelectField
                size="sm"
                className="flex-1"
                value={phoneWeek ?? ""}
                onChange={(event) =>
                  setPhoneWeek(event.target.value ? Number(event.target.value) : null)
                }
              >
                <option value="">Toutes les semaines</option>
                {plan.weeks.map((item) => (
                  <option key={item.index} value={item.index}>
                    {draft
                      ? `Semaine ${item.index} · ${weekRange(draft.startDate, item.index)}`
                      : `Semaine ${item.index}`}
                  </option>
                ))}
              </SelectField>
            </label>
            {phoneGroups.map((group, g) => (
              <div key={group.phase?.id ?? `none-${g}`} className="flex flex-col gap-3">
                {group.phase ? (
                  <div className="flex items-center justify-between px-1.5 pt-1">
                    <span className="text-[11.5px] font-semibold tracking-[0.06em] text-faint uppercase">
                      {group.phase.name} · semaines {group.phase.weekFrom} à {group.phase.weekTo}
                    </span>
                    {phaseMenu(group.phase)}
                  </div>
                ) : null}
                {group.weeks.map((item) => {
                  const itemPhase = phaseOfWeek(plan.phases, item.index);
                  return (
                    <button
                      key={item.index}
                      type="button"
                      onClick={() => chooseWeek(item.index)}
                      className={`flex flex-col gap-2.5 rounded-[20px] bg-surface px-4 pt-4 pb-3 text-left transition-[scale] duration-150 active:scale-[0.99] ${
                        currentWeek === item.index ? "inset-ring-[1.5px] inset-ring-violet/55" : ""
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="text-[16px] font-semibold text-text">
                            Semaine {item.index}
                          </span>
                          <span className="text-[12.5px] text-muted">
                            {[
                              draft ? weekRange(draft.startDate, item.index) : null,
                              itemPhase?.name,
                            ]
                              .filter(Boolean)
                              .join(" · ") ||
                              `${item.sessions.length} séance${item.sessions.length > 1 ? "s" : ""}`}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          {currentWeek === item.index ? (
                            <span
                              className={`${pill} bg-violet-soft text-[12px] font-medium text-violet-text`}
                            >
                              En cours
                            </span>
                          ) : null}
                          {item.light ? (
                            <span className={`${pill} bg-bg text-[12px] font-medium text-text`}>
                              allégée
                            </span>
                          ) : null}
                          <ChevronRight
                            aria-hidden
                            size={16}
                            strokeWidth={2}
                            className="text-faint"
                          />
                        </span>
                      </span>
                      {item.sessions.length > 0 ? (
                        <span className="flex flex-col border-t border-dlg-divider">
                          {orderedSessions(item).map((s, i) => (
                            <span
                              key={s.key}
                              className="flex min-h-[34px] min-w-0 items-center gap-2.5 border-b border-line text-[13.5px] font-medium text-text last:border-b-0"
                            >
                              <span className="w-[18px] shrink-0 text-[12px] font-semibold text-faint tabular">
                                {i + 1}
                              </span>
                              <span
                                aria-hidden
                                className={`size-[7px] shrink-0 rounded-full ${disciplineStyles[s.content.discipline].dot}`}
                              />
                              <span className="min-w-0 flex-1 truncate">{s.title}</span>
                              <span className="shrink-0 text-[12.5px] font-normal text-muted">
                                {sessionHeadline(s).split(" · ")[0]}
                              </span>
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-[13px] text-faint">Aucune séance</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </>
        ) : null}

        {level === "week" && week ? (
          <>
            <div className="flex flex-col gap-1.5 px-1">
              <h2 className="flex items-center gap-2 text-[24px] leading-[1.15] font-bold tracking-[-0.02em] text-text">
                Semaine {week.index}
                {currentWeek === week.index ? (
                  <span
                    className={`${pill} bg-violet-soft text-[12px] font-medium tracking-normal text-violet-text`}
                  >
                    En cours
                  </span>
                ) : null}
              </h2>
              <p className="text-[13.5px] text-muted">
                {[
                  draft ? weekRange(draft.startDate, week.index) : null,
                  weekPhase?.name,
                  readOnly
                    ? week.scheduling === "fixed"
                      ? "jours fixes"
                      : "dans l'ordre, sans jour fixe"
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            {modeSwitch("tall")}
            {fixedWeek ? <MiniDayStrip week={week} context={daysContext} /> : null}
            {readOnly ? null : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSheet("duplicate")}
                  className={`${phoneButton} gap-[7px] bg-surface text-text inset-ring inset-ring-field-ring`}
                >
                  <Copy aria-hidden size={15} strokeWidth={1.8} />
                  Dupliquer vers…
                </button>
                <MoreMenu
                  label={`Plus d'actions sur la semaine ${week.index}`}
                  title={`Semaine ${week.index}`}
                  items={[
                    {
                      label: "Ajouter depuis un modèle",
                      icon: LayoutTemplate,
                      onSelect: () => setSheet("from-template"),
                    },
                    ...weekMenu,
                  ]}
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              {ordered.length === 0 ? (
                <p className="rounded-[18px] bg-surface px-4 py-6 text-center text-[14px] text-muted">
                  Aucune séance cette semaine.
                </p>
              ) : (
                sessionCards(true)
              )}
            </div>
            {readOnly ? null : (
              <button
                type="button"
                aria-label="Ajouter une séance"
                onClick={addBlank}
                data-phone-fab=""
                className={phoneFabClass}
              >
                <Plus aria-hidden size={24} strokeWidth={2.2} />
              </button>
            )}
          </>
        ) : null}

        {level === "session" && session ? (
          <>
            <SessionDetail
              session={session}
              variant="page"
              position={sessionPosition}
              week={`Semaine ${week?.index}`}
            />
            {readOnly ? (
              sessionActions
            ) : (
              <div className="flex gap-2">
                {editHref(session.key) ? (
                  <button
                    type="button"
                    onClick={() => void openSession(session.key)}
                    className="inline-flex h-12 flex-1 items-center justify-center rounded-[13px] bg-cta px-4 text-[15px] font-semibold text-on-cta transition-[scale] duration-150 active:scale-[0.98]"
                  >
                    Modifier la séance
                  </button>
                ) : (
                  <p className="flex flex-1 items-center px-1 text-[13px] text-muted">
                    Le détail des séances d&apos;un modèle se modifie depuis un programme.
                  </p>
                )}
                <MoreMenu
                  label="Plus d'actions sur la séance"
                  title={session.title}
                  phoneSize="lg"
                  items={[
                    { label: "Dupliquer la séance", icon: Copy, onSelect: duplicateCurrent },
                    {
                      label: "Supprimer la séance",
                      icon: Trash2,
                      destructive: true,
                      onSelect: () => setSheet("delete-session"),
                    },
                  ]}
                />
              </div>
            )}
          </>
        ) : null}
      </div>

      {sheets}
      <Overlay
        open={Boolean(dayPicker?.sheet && pickerSession)}
        onClose={() => setDayPicker(null)}
        label="Jour de la séance"
        size="form"
      >
        <DialogBody>{dayPicker?.sheet ? dayPickerView(false) : null}</DialogBody>
      </Overlay>
      {week ? (
        <ProposeDaysDialog
          open={proposal}
          onClose={() => setProposal(false)}
          week={week}
          phase={weekPhase}
          context={daysContext}
          onFix={fixDays}
        />
      ) : null}
    </>
  );
}

// En-tête (ordinateur) : « Publier » pour un programme. Le bouton vit dans la carte d'en-tête de
// PageHeader ; il ouvre la fenêtre de l'éditeur par un événement de la page.
export function EditorHeaderActions({ base }: { base: string }) {
  const editor = useEditor();
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const { target, organizationId } = editor;
  const button =
    "inline-flex h-8 items-center gap-1.5 rounded-[9px] bg-cta px-3.5 text-[12.5px] font-semibold text-on-cta transition-[scale,background-color] duration-150 hover:bg-cta-hover active:scale-[0.97] disabled:opacity-60 max-lg:hidden";
  // Modèle Coory (lecture seule) : l'action principale est de le copier dans Mes modèles.
  if (editor.readOnly && target.kind === "template") {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await duplicateTemplate(organizationId, "program", target.templateId);
            if (!result.ok) return toast(result.message);
            toast("Modèle dupliqué dans Mes modèles.");
            router.push(`${base}/modeles/${result.templateId}`);
          })
        }
        className={button}
      >
        <Copy aria-hidden size={13} strokeWidth={2} />
        Dupliquer dans Mes modèles
      </button>
    );
  }
  if (editor.readOnly || target.kind !== "program") return null;
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(PUBLISH_EVENT))}
      className={button}
    >
      <Upload aria-hidden size={13} strokeWidth={2.2} />
      Publier
    </button>
  );
}

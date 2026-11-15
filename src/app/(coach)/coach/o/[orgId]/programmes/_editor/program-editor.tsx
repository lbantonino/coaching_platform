"use client";

import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ChevronRight,
  ClipboardList,
  Copy,
  Eye,
  FileDown,
  FileText,
  Flag,
  History,
  LayoutTemplate,
  ListFilter,
  Lock,
  Pencil,
  Plus,
  Shapes,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import {
  BackGuardProvider,
  BackLink,
  barBackClass,
  barBackIcon,
} from "@/components/layout/back-link";
import { MobileBarTitle, phoneFabClass } from "@/components/layout/mobile-bar";
import { EditorSessionCard } from "@/components/programs/editor-session-card";
import { useReorder } from "@/components/programs/use-reorder";
import { ProgramPdfMenu } from "@/components/programs/program-pdf-menu";
import { SessionDetail } from "@/components/programs/session-detail";
import { Avatar } from "@/components/ui/avatar";
import { dialogDisciplineIcons } from "@/components/ui/kit-icons";
import { MoreMenu, type MoreMenuItem } from "@/components/ui/more-menu";
import {
  ActionMenu,
  ConfirmDialog,
  DialogBody,
  Overlay,
  type ActionMenuItem,
} from "@/components/ui/overlay";
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
  moveSessionTo,
  phaseRangeBounds,
  removePhase,
  removeSession,
  removeWeek,
  renamePhase,
  setPhaseRange,
  setWeekLight,
  weekIsFull,
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
  dayApplicationReach,
  isPastWeek,
  orderedSessions,
  sessionMoment,
  sessionDay,
  setWeekFixed,
  setWeekOrdered,
  weekMonday,
  type ScheduleScope,
} from "@/domain/training/scheduling";
import {
  MAX_SESSIONS_PER_WEEK,
  sessionMomentLabels,
  type SessionBody,
  type SessionDiscipline,
  type SessionDraft,
  type Weekday,
} from "@/domain/training/session-v2";
import { sessionHeadline } from "@/domain/training/session-view";
import {
  archiveProgram,
  archiveTemplate,
  duplicateProgram,
  duplicateTemplate,
  publishProgram,
  saveProgramAsTemplate,
  unarchiveProgram,
} from "@/features/programs/actions";

import { openUseTemplate } from "../modeles/[templateId]/use-template-sheet";
import { DropLine, Handle } from "../_session/running-parts";
import { useSafeLeave } from "../_session/safe-leave";

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
  DatesSheet,
  DisciplineSheet,
  DuplicateWeekSheet,
  GoalSheet,
  PhaseRangeSheet,
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

// Téléphone : chaque niveau ouvert de la pile est aussi une étape de l'historique du navigateur, pour
// que le geste de retour de l'iPhone (balayage depuis le bord) remonte d'un niveau comme le retour de
// la barre, au lieu de quitter le programme (test d'Antonino sur iPhone, 15/11/2026). L'adresse garde
// ?semaine= (et ?seance=), comme au retour d'une séance. L'ordinateur n'a pas de niveaux : rien n'y
// change.
type EditorLevel = "weeks" | "week" | "session";
const LEVEL_STATE = "cooryEditorLevel";
const isPhone = () => !window.matchMedia("(min-width: 1024px)").matches;

function writeLevel(
  mode: "push" | "replace",
  level: EditorLevel,
  week: number | null,
  session: string | null,
) {
  if (!isPhone()) return;
  const url = new URL(window.location.href);
  url.searchParams.delete("semaine");
  url.searchParams.delete("seance");
  if (level !== "weeks" && week) url.searchParams.set("semaine", String(week));
  if (level === "session" && session) url.searchParams.set("seance", session);
  const href = `${url.pathname}${url.search}`;
  if (mode === "push") window.history.pushState({ [LEVEL_STATE]: level }, "", href);
  // Remplacer garde la marque « ouvert par la pile » : le retour de la barre reste un retour arrière.
  else
    window.history.replaceState(
      window.history.state?.[LEVEL_STATE] ? { [LEVEL_STATE]: level } : null,
      "",
      href,
    );
}

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
  sessionTemplates: (SessionTemplateOption & { body: SessionBody; version: number })[];
  // Venu de la fiche du sportif (?retour=, revue MVP du 13/11, B15) : le retour du téléphone y ramène.
  returnTo: { href: string; label: string } | null;
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

// Plage d'une phase dans la colonne des semaines : « S5–7 », ou « S4 » pour une seule semaine.
const phaseRangeShort = (phase: { weekFrom: number; weekTo: number }) =>
  phase.weekFrom === phase.weekTo ? `S${phase.weekFrom}` : `S${phase.weekFrom}–${phase.weekTo}`;

const isDraft = (plan: ProgramPlan | ProgramDraft): plan is ProgramDraft => "startDate" in plan;

// « Nouvelle séance » : les trois disciplines d'une séance, celle du programme en premier (un
// programme hybride garde l'ordre Running, Musculation, Hyrox).
type NewSessionDiscipline = Exclude<SessionDiscipline, "hybrid">;
const SESSION_DISCIPLINES: NewSessionDiscipline[] = ["running", "strength", "hyrox"];
const sessionDisciplinesFor = (main: Discipline): NewSessionDiscipline[] =>
  [...SESSION_DISCIPLINES].sort((a, b) => Number(b === main) - Number(a === main));
const disciplineHints: Record<NewSessionDiscipline, string> = {
  running: "Endurance, fractionné, sortie longue",
  strength: "Renfo, force, gainage",
  hyrox: "Stations, enchaînements, simulation",
};

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
  const { leave, dialog: leaveDialog } = useSafeLeave();
  const backHref =
    meta.returnTo?.href ?? (target.kind === "program" ? meta.base : `${meta.base}?onglet=modeles`);
  const backLabel = meta.returnTo?.label ?? (target.kind === "program" ? "Programmes" : "Modèles");
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
  // Glisser une séance par sa poignée (ordinateur, semaine « dans l'ordre ») : EDT-F06.
  const reorder = useReorder((from, to) => {
    if (week) update((current) => moveSessionTo(current, week.index, from, to));
  });
  const [sessionKey, setSessionKey] = useState<string | null>(
    ordered.find((item) => item.key === meta.focus.session)?.key ?? ordered[0]?.key ?? null,
  );
  const session = ordered.find((item) => item.key === sessionKey) ?? null;
  // Téléphone : le niveau ouvert de la pile.
  const [level, setLevel] = useState<EditorLevel>(meta.focus.week ? "week" : "weeks");

  const [sheet, setSheet] = useState<
    | null
    | "duplicate"
    | "from-template"
    | "add-session"
    | "rename"
    | "discipline"
    | "dates"
    | "goal"
    | "save-template"
    | "archive"
    | "publish"
    | "delete-session"
    | "remove-week"
    | "ordered"
    | { renamePhase: string }
    | { removePhase: string }
    | { phaseRange: string }
  >(null);
  const sheetPhase = (key: "renamePhase" | "removePhase" | "phaseRange") =>
    typeof sheet === "object" && sheet !== null && key in sheet
      ? (plan.phases.find((phase) => phase.id === (sheet as Record<string, string>)[key]) ?? null)
      : null;
  const [pending, startTransition] = useTransition();
  // Jours fixes (03b) : le choix du jour d'une séance (panneau à droite ou feuille du téléphone) et la
  // proposition en passant une semaine en « Jours fixes ».
  const [dayPicker, setDayPicker] = useState<{ key: string; sheet: boolean } | null>(null);
  const [proposal, setProposal] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [openedRevision] = useState(editor.revision);
  // Publié et rien n'a changé depuis : « Publier » le dit au lieu d'annoncer une version de plus.
  const unpublished =
    meta.publication !== null &&
    editor.revision > 0 &&
    editor.revision !== meta.publication.sourceRevision;
  const nothingToPublish = meta.publication !== null && !unpublished;
  const athleteFirstName = meta.athlete?.firstName ?? "Le sportif";
  const publishedNumber = meta.publication?.number ?? 0;
  // Téléphone : chaque niveau de la pile s'ouvre en haut de la page.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [level]);
  // Téléphone : le geste de retour (ou d'avance) du navigateur rouvre le niveau de cette étape.
  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      const params = new URLSearchParams(window.location.search);
      const index = Number(params.get("semaine")) || null;
      const target = index ? plan.weeks.find((item) => item.index === index) : undefined;
      const sessions = target ? orderedSessions(target) : [];
      const key = params.get("seance");
      const known = sessions.some((item) => item.key === key);
      const stored = (event.state as Record<string, unknown> | null)?.[LEVEL_STATE];
      if (target && target.index !== weekIndex) {
        setWeekIndex(target.index);
        setSessionKey(known ? key : (sessions[0]?.key ?? null));
      } else if (target && known) setSessionKey(key);
      setLevel(!target ? "weeks" : stored === "session" && known ? "session" : "week");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [plan.weeks, weekIndex]);
  // Remonter d'un niveau (retour de la barre, semaine retirée, séance supprimée) : un retour arrière
  // si ce niveau a été ouvert par la pile, sinon l'étape actuelle devient le niveau du dessus.
  const closeLevel = (parent: EditorLevel) => {
    if (isPhone() && window.history.state?.[LEVEL_STATE]) {
      window.history.back();
      return;
    }
    setLevel(parent);
    writeLevel("replace", parent, week?.index ?? null, sessionKey);
  };
  useEffect(() => {
    const open = () => {
      if (nothingToPublish)
        return toast(`Rien à publier : la version ${publishedNumber} est déjà à jour.`);
      setPublishError(null);
      setSheet("publish");
    };
    window.addEventListener(PUBLISH_EVENT, open);
    return () => window.removeEventListener(PUBLISH_EVENT, open);
  }, [nothingToPublish, publishedNumber, toast]);

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
    readOnly
      ? null
      : target.kind === "program"
        ? `${meta.base}/${target.programId}/seances/${key}${
            meta.returnTo ? `?editeur=${encodeURIComponent(meta.returnTo.href)}` : ""
          }`
        : `${meta.base}/modeles/${target.templateId}/seances/${key}`;

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
    writeLevel(level === "weeks" ? "push" : "replace", "week", index, null);
  };

  // « Ajouter une séance » : toutes les disciplines, quel que soit le programme (demande d'Antonino du
  // 11/11 : un programme running a aussi besoin de renfo jambes). La discipline du programme est
  // proposée en premier.
  // Une semaine a 14 séances au plus (D-164) : au-delà, le brouillon serait refusé (revue MVP, C12).
  const full = week ? weekIsFull(plan, week.index) : false;
  const tooMany = () => toast(`${MAX_SESSIONS_PER_WEEK} séances au plus par semaine.`);
  const addBlank = (discipline: NewSessionDiscipline) => {
    if (!week) return;
    if (full) return tooMany();
    let created: string | null = null;
    update((current) => {
      const result = addSession(current, week.index, blankSession(discipline, current.aimDefaults));
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
          // D-180 : un même programme change d'objectif dans l'année (marathon, force, Hyrox).
          { label: "Changer la discipline", icon: Shapes, onSelect: () => setSheet("discipline") },
          // Revue MVP du 13/11 (C3, C4) : les dates et l'objectif se changent après la création.
          { label: "Modifier les dates", icon: CalendarClock, onSelect: () => setSheet("dates") },
          { label: "Modifier l'objectif", icon: Flag, onSelect: () => setSheet("goal") },
          {
            label: "Archiver",
            icon: Archive,
            destructive: true,
            onSelect: () => setSheet("archive"),
          },
        ]
      : [
          { label: "Renommer", icon: Pencil, onSelect: () => setSheet("rename") },
          { label: "Changer la discipline", icon: Shapes, onSelect: () => setSheet("discipline") },
          {
            label: "Archiver le modèle",
            icon: Archive,
            destructive: true,
            onSelect: () => setSheet("archive"),
          },
        ];

  // Téléphone : les deux PDF (version publiée) dans « ··· », la ligne des boutons étant pleine.
  const pdfBase = target.kind === "program" ? `${meta.base}/${target.programId}/pdf` : null;
  const openPdf = (href: string) => window.open(href, "_blank", "noopener");
  const phoneMenuItems: MoreMenuItem[] =
    pdfBase && meta.publication
      ? [
          {
            label: "PDF : agenda du programme",
            icon: CalendarDays,
            onSelect: () => openPdf(`${pdfBase}/agenda`),
          },
          {
            label: "PDF : fiches et repères",
            icon: ClipboardList,
            onSelect: () => openPdf(`${pdfBase}/fiches`),
          },
          ...menuItems,
        ]
      : menuItems;

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
            label: "Modifier les semaines",
            icon: CalendarRange,
            onSelect: () => setSheet({ phaseRange: phase.id }),
          },
          {
            label: "Retirer la phase",
            icon: Trash2,
            destructive: true,
            onSelect: () => setSheet({ removePhase: phase.id }),
          },
        ]}
        className="-my-2.5 -mr-2.5 [&>button]:bg-transparent! [&>button]:text-muted! [&>button]:inset-ring-0! lg:my-0 lg:mr-0 lg:[&>button]:size-7! lg:[&>button]:rounded-[8px]! lg:[&>button]:text-[12px]!"
      />
    );

  const weekMenu = week
    ? [
        {
          label: week.light ? "Ne plus marquer « allégée »" : "Marquer la semaine « allégée »",
          icon: Pencil,
          onSelect: () => update((current) => setWeekLight(current, week.index, !week.light)),
        },
        ...(plan.weeks.length > 1
          ? [
              {
                label: "Retirer la semaine",
                icon: Trash2,
                destructive: true,
                onSelect: () => setSheet("remove-week"),
              },
            ]
          : []),
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
    firstName: meta.athlete?.firstName ?? "ton sportif",
    availableDays: meta.publishContext?.availableDays ?? [],
    startDate: draft?.startDate ?? null,
  };
  const dates = draft ? { startDate: draft.startDate, today: meta.today } : undefined;
  const switchMode = (mode: "ordered" | "fixed") => {
    if (!week || mode === week.scheduling) return;
    if (mode === "fixed") return setProposal(true);
    setSheet("ordered");
  };
  const toOrdered = () => {
    if (!week) return;
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
      ({ others, copies } = dayApplicationReach(current.weeks, weeks, week.index));
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
  // Plusieurs séances le même jour (D-164) : chaque carte dit son moment (« Matin », « Soir »…).
  const dayMoment = (item: SessionDraft): string | undefined => {
    if (!week || !fixedWeek) return undefined;
    const day = sessionDay(item);
    if (!day || week.sessions.filter((other) => sessionDay(other) === day).length < 2)
      return undefined;
    const moment = sessionMoment(item);
    return moment ? sessionMomentLabels[moment] : "Moment ?";
  };
  const pastWeekNote =
    week && !readOnly && meta.publication && locked(week.index) ? (
      <p className="mt-3 flex items-start gap-2.5 rounded-[12px] bg-warn-soft px-3 py-2.5 text-[12.5px] leading-[1.45] text-text-2 lg:mt-3">
        <History aria-hidden size={15} strokeWidth={2} className="mt-px shrink-0 text-warn" />
        <span>
          Semaine passée : {athleteFirstName} l&apos;a déjà vécue. Ce que tu changes ici remplacera
          son historique à la prochaine publication.
        </span>
      </p>
    ) : null;
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

  const draggable = !readOnly && week?.scheduling === "ordered" && ordered.length > 1;
  const sessionCards = (mobile: boolean) =>
    ordered.map((item, i) => {
      const card = (
        <EditorSessionCard
          key={item.key}
          index={i + 1}
          title={item.title}
          discipline={item.content.discipline}
          sessionType={item.sessionType}
          summary={[sessionHeadline(item)]}
          coach={coachLabel(item)}
          moment={dayMoment(item)}
          selected={item.key === session?.key}
          readOnly={readOnly}
          onSelect={() => {
            setSessionKey(item.key);
            if (mobile) {
              setLevel("session");
              if (week) writeLevel("push", "session", week.index, item.key);
            }
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
          handle={
            !mobile && draggable ? (
              <Handle
                label={`Déplacer « ${item.title} » (flèches haut et bas)`}
                props={reorder.handleProps(i, ordered.length)}
              />
            ) : undefined
          }
          dragging={!mobile && reorder.drag?.from === i}
        />
      );
      return mobile || !draggable ? (
        card
      ) : (
        <div key={item.key} data-reorder-row="" className="relative">
          {card}
          <DropLine at={reorder.dropMark(i)} />
        </div>
      );
    });

  const addButtons = readOnly ? null : (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => (full ? tooMany() : setSheet("add-session"))}
        aria-disabled={full}
        className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[15px] text-[13.5px] font-medium text-text-2 inset-ring-[1.5px] inset-ring-line transition-[scale,background-color] duration-150 hover:bg-surface-2 active:scale-[0.98]"
      >
        <Plus aria-hidden size={15} strokeWidth={2} />
        Ajouter une séance
      </button>
      <button
        type="button"
        onClick={() => (full ? tooMany() : setSheet("from-template"))}
        aria-disabled={full}
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
    if (full) return tooMany();
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
        {/* Depuis la phase 4, les séances de Mes modèles se modifient aussi (revue MVP, C19). */}
        <button
          type="button"
          onClick={() => void openSession(session.key)}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-[11px] bg-cta px-4 text-[13.5px] font-semibold text-on-cta transition-[scale,background-color] duration-150 hover:bg-cta-hover active:scale-[0.98]"
        >
          Modifier la séance
        </button>
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
      <ActionMenu
        open={sheet === "add-session"}
        onClose={() => setSheet(null)}
        title="Nouvelle séance"
        subtitle={week ? `Semaine ${week.index} · choisis la discipline` : undefined}
        items={sessionDisciplinesFor(plan.discipline).map((discipline): ActionMenuItem => ({
          label: disciplineLabels[discipline],
          description: disciplineHints[discipline],
          icon: dialogDisciplineIcons[discipline],
          tone: discipline,
          onSelect: () => addBlank(discipline),
        }))}
      />
      <SessionTemplateSheet
        open={sheet === "from-template"}
        onClose={() => setSheet(null)}
        templates={meta.sessionTemplates}
        onConfirm={(id) => {
          const template = meta.sessionTemplates.find((item) => item.id === id);
          if (!template || !week) return;
          setSheet(null);
          if (full) return tooMany();
          let created: string | null = null;
          update((current) => {
            // Le modèle d'origine est gardé (BR-10, revue MVP du 13/11, C23).
            const result = addSession(current, week.index, template.body, {
              sourceTemplate: { id: template.id, version: template.version },
            });
            created = result.key;
            return result.plan;
          });
          if (!created) return tooMany();
          setSessionKey(created);
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
        // Revue MVP du 13/11 (C21) : un programme publié garde son ancien titre jusqu'à la publication.
        hint={
          meta.publication
            ? "Le nouveau titre apparaîtra dans la fiche et les PDF à la prochaine publication."
            : undefined
        }
        onConfirm={(title) => {
          update((current) => ({ ...current, title }));
          setSheet(null);
        }}
      />
      <DisciplineSheet
        open={sheet === "discipline"}
        onClose={() => setSheet(null)}
        title="Changer la discipline"
        initial={plan.discipline}
        hint={
          meta.publication
            ? "La nouvelle discipline apparaîtra dans la fiche et les PDF à la prochaine publication."
            : undefined
        }
        onConfirm={(discipline) => {
          update((current) => ({ ...current, discipline }));
          setSheet(null);
        }}
      />
      {draft ? (
        <DatesSheet
          open={sheet === "dates"}
          onClose={() => setSheet(null)}
          startDate={draft.startDate}
          weeksCount={plan.weeks.length}
          others={meta.publishContext?.otherPublished ?? []}
          published={meta.publication !== null}
          onConfirm={(startDate) => {
            update((current) => ({ ...current, startDate }));
            setSheet(null);
            toast("Dates du programme modifiées.");
          }}
        />
      ) : null}
      {draft ? (
        <GoalSheet
          open={sheet === "goal"}
          onClose={() => setSheet(null)}
          goal={draft.goal}
          hyrox={
            plan.discipline === "hyrox" ||
            plan.weeks.some((item) => item.sessions.some((s) => s.content.discipline === "hyrox"))
          }
          onConfirm={(goal) => {
            update((current) => ({ ...current, goal }));
            setSheet(null);
            toast("Objectif du programme enregistré.");
          }}
        />
      ) : null}
      <TextSheet
        open={sheetPhase("renamePhase") !== null}
        onClose={() => setSheet(null)}
        title="Renommer la phase"
        label="Nom de la phase"
        initial={sheetPhase("renamePhase")?.name ?? ""}
        confirmLabel="Renommer"
        onConfirm={(name) => {
          const phase = sheetPhase("renamePhase");
          if (phase) update((current) => renamePhase(current, phase.id, name.slice(0, 40)));
          setSheet(null);
        }}
      />
      <PhaseRangeSheet
        open={sheetPhase("phaseRange") !== null}
        onClose={() => setSheet(null)}
        phase={sheetPhase("phaseRange")}
        bounds={(() => {
          const phase = sheetPhase("phaseRange");
          return phase ? phaseRangeBounds(plan, phase.id) : { minFrom: 1, maxTo: 1 };
        })()}
        label={(index) =>
          draft ? `Semaine ${index} · ${weekRange(draft.startDate, index)}` : `Semaine ${index}`
        }
        onConfirm={(from, to) => {
          const phase = sheetPhase("phaseRange");
          if (phase) {
            update((current) => setPhaseRange(current, phase.id, from, to));
            toast(`${phase.name} : semaines ${from} à ${to}.`);
          }
          setSheet(null);
        }}
      />
      <ConfirmDialog
        open={sheetPhase("removePhase") !== null}
        onClose={() => setSheet(null)}
        title={`Retirer la phase « ${sheetPhase("removePhase")?.name ?? ""} » ?`}
        confirmLabel="Retirer la phase"
        icon={Trash2}
        onConfirm={() => {
          const phase = sheetPhase("removePhase");
          if (phase) update((current) => removePhase(current, phase.id));
          setSheet(null);
        }}
      >
        Ses semaines et leurs séances restent dans le programme ; seule l&apos;étiquette de la phase
        disparaît.
      </ConfirmDialog>
      <ConfirmDialog
        open={sheet === "remove-week"}
        onClose={() => setSheet(null)}
        title={`Retirer la semaine ${week?.index ?? ""} ?`}
        confirmLabel="Retirer la semaine"
        icon={Trash2}
        onConfirm={() => {
          if (week) {
            update((current) => removeWeek(current, week.index));
            setWeekIndex(Math.max(1, week.index - 1));
            closeLevel("weeks");
          }
          setSheet(null);
        }}
      >
        {week && week.sessions.length > 0
          ? `Ses ${week.sessions.length} séance${week.sessions.length > 1 ? "s sont supprimées" : " est supprimée"} du brouillon, et les semaines suivantes remontent d'un cran.`
          : "Les semaines suivantes remontent d'un cran."}
      </ConfirmDialog>
      <ConfirmDialog
        open={sheet === "ordered"}
        onClose={() => setSheet(null)}
        title={`Semaine ${week?.index ?? ""} dans l'ordre ?`}
        confirmLabel="Retirer les jours"
        icon={CalendarDays}
        onConfirm={() => {
          toOrdered();
          setSheet(null);
        }}
      >
        Les jours fixés des séances sont retirés ; {athleteFirstName} fera les séances dans
        l&apos;ordre, au jour de son choix. Une séance avec le coach garde son rendez-vous.
      </ConfirmDialog>
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
          ? "Il quitte la liste des programmes et la fiche du sportif. Ses versions publiées restent conservées."
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
          closeLevel("week");
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
          // Le même retour que l'ordinateur (revue MVP du 13/11, C8) : la page d'où l'on vient, en
          // enregistrant d'abord ce qui attend (C7) ; venu de la fiche du sportif, elle (B15).
          <BackGuardProvider value={leave}>
            <BackLink href={backHref} label={backLabel} variant="bar" />
          </BackGuardProvider>
        ) : (
          <button
            type="button"
            onClick={() => closeLevel(level === "session" ? "week" : "weeks")}
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

        <div className="grid min-h-0 flex-1 grid-cols-[212px_minmax(0,1fr)_304px] gap-3">
          {/* Semaines */}
          <nav aria-label="Semaines" className={`${card} flex min-h-0 flex-col px-2.5 py-3.5`}>
            <p className="mb-2 flex items-baseline justify-between px-2 text-[15px] font-semibold text-text">
              Semaines{" "}
              <span className="text-[12.5px] font-medium text-faint tabular">
                {plan.weeks.length}
              </span>
            </p>
            {/* Carte aérée (demande d'Antonino du 11/11 : « tout est l'un sur l'autre ») : chaque phase
                est une section séparée par un filet, son nom en clair (plus de majuscules coupées) et
                sa plage à part ; des lignes de semaine de 44 px, la date en gris lisible. */}
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
              {phaseGroups.map((group, g) => (
                <div
                  key={group.phase?.id ?? `none-${g}`}
                  className={`flex flex-col gap-1 ${g > 0 ? "mt-3 border-t border-line pt-3" : ""}`}
                >
                  {group.phase ? (
                    <div
                      data-phase-header=""
                      className="mb-0.5 flex min-h-7 items-center gap-1.5 pr-0.5 pl-2"
                    >
                      <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-text-2">
                        {group.phase.name}
                      </span>
                      <span className="shrink-0 text-[12px] font-medium text-faint tabular">
                        {phaseRangeShort(group.phase)}
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
                        className={`flex min-h-11 w-full items-center gap-2 rounded-[11px] px-2.5 py-1.5 text-left transition-colors duration-150 ${
                          active ? "bg-lib-lavender" : "hover:bg-surface-2"
                        }`}
                      >
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
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
                            <span className="truncate text-[12px] leading-[1.3] text-muted">
                              {weekRange(draft.startDate, item.index)}
                            </span>
                          ) : (
                            <span className="text-[12px] leading-[1.3] text-muted">
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
              <div className="mt-2.5 flex gap-1 border-t border-line pt-2.5">
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
            className={`${card} @container flex min-h-0 flex-col p-[18px]`}
          >
            {week ? (
              <>
                {/* Colonne étroite (1280 px, menu déplié) : les boutons passent sous le titre au lieu
                    de le recouvrir (recette du 11/11, après l'élargissement de la colonne des
                    semaines). La place se mesure sur la colonne (requête de conteneur). */}
                <div className="flex flex-col gap-3 @min-[560px]:flex-row @min-[560px]:items-start @min-[560px]:justify-between">
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
                {pastWeekNote}
                <div
                  {...reorder.listProps}
                  className="mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pb-1"
                >
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
              {target.kind === "template" ? (
                // « Utiliser » (C25, D-178) : la fenêtre « Utiliser ce modèle » de la page.
                <button
                  type="button"
                  onClick={openUseTemplate}
                  className={`${phoneButton} bg-surface text-text inset-ring inset-ring-field-ring`}
                >
                  Utiliser
                </button>
              ) : null}
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
                ) : (
                  <UnarchiveButton phone />
                )
              ) : (
                <>
                  {target.kind === "program" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent(PUBLISH_EVENT))}
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
                    items={phoneMenuItems}
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
                      {group.phase.name} ·{" "}
                      {group.phase.weekFrom === group.phase.weekTo
                        ? `semaine ${group.phase.weekFrom}`
                        : `semaines ${group.phase.weekFrom} à ${group.phase.weekTo}`}
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
            {readOnly ? null : (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={plan.weeks.length >= 52}
                  onClick={() => {
                    update((current) => addWeek(current));
                    toast(`Semaine ${plan.weeks.length + 1} ajoutée.`);
                  }}
                  className={`${phoneButton} gap-[7px] bg-surface text-violet-text inset-ring inset-ring-field-ring disabled:text-faint`}
                >
                  <Plus aria-hidden size={16} strokeWidth={2.2} />
                  Semaine
                </button>
                <button
                  type="button"
                  disabled={!canAddPhase}
                  onClick={() => {
                    update((current) => addPhase(current, nextPhaseName));
                    toast(`Phase « ${nextPhaseName} » ajoutée.`);
                  }}
                  className={`${phoneButton} gap-[7px] bg-surface text-violet-text inset-ring inset-ring-field-ring disabled:text-faint`}
                >
                  <Plus aria-hidden size={16} strokeWidth={2.2} />
                  Phase
                </button>
              </div>
            )}
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
            {pastWeekNote}
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
                      onSelect: () => (full ? tooMany() : setSheet("from-template")),
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
                onClick={() => (full ? tooMany() : setSheet("add-session"))}
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
                <button
                  type="button"
                  onClick={() => void openSession(session.key)}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-[13px] bg-cta px-4 text-[15px] font-semibold text-on-cta transition-[scale] duration-150 active:scale-[0.98]"
                >
                  Modifier la séance
                </button>
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
      {leaveDialog}
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
  const secondary =
    "inline-flex h-8 items-center gap-1.5 rounded-[9px] bg-surface px-3.5 text-[12.5px] font-semibold text-text inset-ring inset-ring-field-ring transition-[scale,background-color] duration-150 hover:bg-surface-2 active:scale-[0.97] max-lg:hidden";
  // « Utiliser » un modèle de programme (revue MVP du 13/11, C25 ; D-178) : la fenêtre « Utiliser ce
  // modèle » de la page (choisir le sportif, puis le brouillon).
  const use =
    target.kind === "template" ? (
      <button type="button" onClick={openUseTemplate} className={secondary}>
        <Plus aria-hidden size={13} strokeWidth={2.2} />
        Utiliser
      </button>
    ) : null;
  // Modèle Coory (lecture seule) : l'action principale est de le copier dans Mes modèles.
  if (editor.readOnly && target.kind === "template") {
    return (
      <span className="flex items-center gap-2 max-lg:hidden">
        {use}
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
      </span>
    );
  }
  if (editor.readOnly && target.kind === "program") return <UnarchiveButton phone={false} />;
  if (target.kind === "template") return use;
  if (editor.readOnly) return null;
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

// Programme archivé : « Désarchiver » (phase 4) le remet en service (brouillon ou publié, comme avant).
function UnarchiveButton({ phone }: { phone: boolean }) {
  const editor = useEditor();
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const { target, organizationId } = editor;
  if (target.kind !== "program") return null;
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await unarchiveProgram(organizationId, target.programId);
          if (!result.ok) return toast(result.message);
          toast(
            result.status === "draft"
              ? "Programme désarchivé : il redevient un brouillon."
              : "Programme désarchivé : il est de nouveau publié.",
          );
          router.refresh();
        })
      }
      className={
        phone
          ? `${phoneButton} gap-2 bg-cta text-on-cta disabled:opacity-60`
          : "inline-flex h-8 items-center gap-1.5 rounded-[9px] bg-cta px-3.5 text-[12.5px] font-semibold text-on-cta transition-[scale,background-color] duration-150 hover:bg-cta-hover active:scale-[0.97] disabled:opacity-60 max-lg:hidden"
      }
    >
      <ArchiveRestore aria-hidden size={phone ? 16 : 13} strokeWidth={2} />
      Désarchiver
    </button>
  );
}

"use client";

import { ArrowLeft, Copy, LayoutTemplate, PenLine, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { barBackClass, barBackIcon } from "@/components/layout/back-link";
import { MobileBarTitle, phoneFabClass } from "@/components/layout/mobile-bar";
import { SessionBlocks } from "@/components/programs/session-detail";
import { MoreMenu } from "@/components/ui/more-menu";
import { ConfirmDialog, DialogBody, Overlay } from "@/components/ui/overlay";
import { SelectField } from "@/components/ui/select-field";
import { useToast } from "@/components/ui/toast";
import { disciplineLabels, disciplineStyles } from "@/domain/training/discipline";
import {
  duplicateSession,
  findSession,
  removeSession,
  replaceSession,
} from "@/domain/training/plan-edit";
import type { ProgramDraft } from "@/domain/training/program-plan";
import {
  RUN_SESSION_TYPES,
  addRepeat,
  addStep,
  findStep,
  removeStep,
  replaceStep,
  runningCounts,
  runningSummary,
} from "@/domain/training/running-edit";
import {
  HYROX_SESSION_TYPES,
  addBlock,
  addLine,
  duplicateItem as duplicateHyroxItem,
  findLine,
  hyroxCounts,
  hyroxSummary,
  hyroxTimeCap,
  insertSimulation,
  removeItem as removeHyroxItem,
  removeLine,
  replaceBlock,
  replaceLine,
} from "@/domain/training/hyrox-edit";
import { withEstimatedDuration } from "@/domain/training/session-duration";
import {
  canDuplicateAt,
  canRemoveAt,
  duplicateAt,
  removeAt,
} from "@/domain/training/session-items";
import type { CardActions } from "@/components/programs/session-cards";
import {
  SESSION_ITEMS_MAX,
  type HyroxBlock,
  type HyroxContent,
  type RunningContent,
  type SessionDraft,
  type StrengthContent,
} from "@/domain/training/session-v2";
import {
  addExercise,
  addSuperset,
  findExercise,
  removeExercise,
  removeItem as removeStrengthItem,
  replaceExercise,
  replaceGroup,
  strengthCounts,
  strengthSummary,
  type StrengthGroup,
} from "@/domain/training/strength-edit";
import {
  formatMinutes,
  formatSeconds,
  runningDistanceMeters,
  sessionHeadline,
} from "@/domain/training/session-view";
import { saveSessionAsTemplate } from "@/features/programs/actions";

import { useEditor } from "../_editor/editor-provider";
import { TextSheet } from "../_editor/editor-sheets";

import { programHref, sessionHref } from "./links";
import { SaveState, useSafeLeave } from "./safe-leave";
import { RunStepPanel, RunningList, type AthleteAims } from "./running-parts";
import {
  HyroxBlockPanel,
  HyroxLinePanel,
  HyroxList,
  SimulationSheet,
  type HyroxAthlete,
} from "./hyrox-parts";
import {
  ExercisePickerSheet,
  StrengthExercisePanel,
  BoundaryPanel,
  COOLDOWN,
  StrengthGroupPanel,
  StrengthList,
  WARMUP,
  type LibraryChoice,
  type StrengthAthlete,
} from "./strength-parts";

// Éditeur d'une séance du programme (04 à 06, tronc commun SESSION_EDITOR_SHELL, D-157). La séance
// vit dans le brouillon du programme : chaque modification l'enregistre (même fournisseur d'état que
// l'éditeur de programme). Ordinateur : carte titre, aperçu en direct, liste, panneau à droite.
// Téléphone : titre, totaux, liste, bouton +, et l'étape s'ouvre dans une feuille du bas.

export type SessionMeta = {
  base: string;
  programId: string;
  sessionKey: string;
  weekIndex: number;
  // Rang de la séance dans sa semaine (« Séance 2 »).
  position: number;
  athlete: AthleteAims;
  // Musculation : la Bibliothèque (choisir un exercice) et les max du sportif (% du max).
  strength: { athlete: StrengthAthlete; library: LibraryChoice[] } | null;
  // Hyrox : la division du sportif (charges officielles) et son sexe.
  hyrox: HyroxAthlete | null;
  // Venu de la fiche du sportif : « Terminer » et le retour y ramènent.
  returnTo: { href: string; label: string } | null;
  // Venu de l'éditeur du programme, lui-même ouvert depuis la fiche (B15) : son retour vers la fiche.
  editorReturn?: string | null;
};

const field =
  "min-h-11 w-full min-w-0 rounded-[11px] bg-surface px-3.5 py-2.5 text-[16px] leading-[1.45] text-text-2 inset-ring inset-ring-field-ring outline-none transition-shadow duration-150 placeholder:text-faint focus:inset-ring-[1.5px] focus:inset-ring-violet lg:text-[14px]";
const label = "text-[12.5px] font-semibold text-text-2";
const card = "rounded-[20px] bg-surface";

const isPhone = () => !window.matchMedia("(min-width: 1024px)").matches;

export function SessionEditor({ meta }: { meta: SessionMeta }) {
  const editor = useEditor<ProgramDraft>();
  const { plan, update, organizationId } = editor;
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const { leave, dialog: leaveDialog } = useSafeLeave();
  const found = findSession(plan, meta.sessionKey);
  const session = found?.session ?? null;
  const running = session?.content.discipline === "running" ? session.content : null;
  const strength = session?.content.discipline === "strength" ? session.content : null;
  const hyrox = session?.content.discipline === "hyrox" ? session.content : null;

  // Ordinateur : la première étape (ou le premier exercice) est ouverte dans le panneau ; téléphone :
  // rien tant qu'on ne touche pas.
  const [selected, setSelected] = useState<string | null>(() => {
    // Hyrox : le premier bloc (maquette 6a : le bloc se règle dans le panneau).
    if (hyrox) return hyrox.items.find((item) => item.kind === "block")?.id ?? null;
    const first = (running?.items ?? strength?.items ?? []).find((item) => item.kind !== "text");
    if (!first) return null;
    if (first.kind === "repeat") return first.steps[0]?.id ?? null;
    if (first.kind === "superset" || first.kind === "emom") return first.exercises[0]?.id ?? null;
    return first.id;
  });
  // Choisir un exercice : l'ajouter (dans un groupe s'il est donné) ou créer un superset.
  const [picker, setPicker] = useState<null | { multiple: boolean; groupId?: string }>(null);
  const [simulation, setSimulation] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialog, setDialog] = useState<null | "rename" | "template" | "delete">(null);

  const backHref = meta.returnTo?.href ?? programHref(meta);

  if (!session || !found) {
    return (
      <p className={`${card} p-6 text-[14px] text-muted`}>
        Cette séance n&apos;est plus dans le brouillon du programme.
      </p>
    );
  }

  // Chaque modification recalcule la durée estimée, sauf si le coach l'a corrigée (phase 4).
  const setSession = (change: (current: SessionDraft) => SessionDraft) =>
    update((current) => {
      const at = findSession(current, meta.sessionKey);
      return at ? replaceSession(current, withEstimatedDuration(change(at.session))) : current;
    });
  const setRunning = (content: RunningContent) =>
    setSession((current) => ({ ...current, content }));
  // Plafond d'une séance (au-delà, elle ne s'enregistrerait plus).
  const full = (session?.content.items.length ?? 0) >= SESSION_ITEMS_MAX;
  const tooMany = () => toast(`${SESSION_ITEMS_MAX} éléments au plus dans une séance.`);

  const setStrength = (change: (content: StrengthContent) => StrengthContent) =>
    setSession((current) =>
      current.content.discipline === "strength"
        ? { ...current, content: change(current.content) }
        : current,
    );
  const setHyrox = (change: (content: HyroxContent) => HyroxContent) =>
    setSession((current) =>
      current.content.discipline === "hyrox"
        ? { ...current, content: change(current.content) }
        : current,
    );
  const libraryMeta = new Map(meta.strength?.library.map((item) => [item.id, item.meta]) ?? []);

  const select = (id: string) => {
    setSelected(id);
    if (isPhone()) setSheetOpen(true);
  };
  const closePanel = () => {
    setSheetOpen(false);
    if (isPhone()) setSelected(null);
  };

  // Kilos estimés des cartes (décision du 17/11) : le max du sportif par exercice.
  const maxes = meta.strength
    ? Object.fromEntries(
        Object.entries(meta.strength.athlete.maxes).map(([id, max]) => [id, max.kg]),
      )
    : null;
  // « ⋯ » d'une carte, comme sur la page du programme : Dupliquer, Supprimer (avec « Annuler »).
  const cardActions: CardActions = {
    duplicate: (path) =>
      setSession((current) => ({ ...current, content: duplicateAt(current.content, path) })),
    remove: (path) => {
      const before = session.content;
      setSession((current) => ({ ...current, content: removeAt(current.content, path) }));
      // La carte ouverte (ou son groupe) disparaît : son panneau se ferme.
      if (selected && path.includes(selected)) {
        closePanel();
        setSelected(null);
      }
      toast("Étape supprimée.", {
        action: {
          label: "Annuler",
          onClick: () => setSession((current) => ({ ...current, content: before })),
        },
      });
    },
    canDuplicate: (path) => canDuplicateAt(session.content, path),
    canRemove: (path) => canRemoveAt(session.content, path),
  };

  const discipline = session.content.discipline;
  const kicker = `${disciplineLabels[discipline]} · Séance ${meta.position} · Semaine ${meta.weekIndex}`;
  const meters = running ? runningDistanceMeters(running) : null;
  const strengthCount = strength ? strengthCounts(strength) : null;
  const totals = [
    // Musculation : « Séries » d'abord (maquette 5a).
    ...(strengthCount ? [{ label: "Séries", value: String(strengthCount.sets) }] : []),
    {
      label: session.durationManual ? "Durée" : "Durée estimée",
      value: `${session.durationManual ? "" : "≈ "}${formatMinutes(session.durationMinutes * 60)}`,
    },
    ...(hyrox && hyroxTimeCap(hyrox)
      ? [{ label: "Limite", value: formatSeconds(hyroxTimeCap(hyrox) ?? 0) }]
      : []),
    ...(running
      ? [
          {
            label: "Distance",
            value: meters ? `≈ ${String(Math.round(meters / 100) / 10).replace(".", ",")} km` : "—",
          },
        ]
      : []),
  ];
  const summary = running
    ? runningSummary(running)
    : strength
      ? strengthSummary(strength)
      : hyrox
        ? hyroxSummary(hyrox)
        : sessionHeadline(session);
  const counts = running ? runningCounts(running) : null;
  const types: string[] = running
    ? [...new Set([...RUN_SESSION_TYPES, session.sessionType])]
    : hyrox
      ? [...new Set([...HYROX_SESSION_TYPES, session.sessionType])]
      : [session.sessionType];
  const hyroxCount = hyrox ? hyroxCounts(hyrox) : null;

  const step = running && selected ? findStep(running, selected) : null;
  const exercise = strength && selected ? findExercise(strength, selected) : null;
  const group =
    strength && selected && !exercise
      ? (strength.items.find(
          (item): item is StrengthGroup =>
            (item.kind === "superset" || item.kind === "emom") && item.id === selected,
        ) ?? null)
      : null;
  const strengthPanel =
    strength && exercise && meta.strength ? (
      <StrengthExercisePanel
        key={exercise.exercise.id}
        exercise={exercise.exercise}
        position={exercise.position}
        inGroup={exercise.group !== null}
        meta={
          exercise.exercise.exerciseId
            ? (libraryMeta.get(exercise.exercise.exerciseId) ?? null)
            : null
        }
        athlete={meta.strength.athlete}
        onChange={(next) => setStrength((current) => replaceExercise(current, next))}
        onDone={closePanel}
        onDelete={() => {
          setStrength((current) => removeExercise(current, exercise.exercise.id));
          closePanel();
          setSelected(null);
          toast("Exercice supprimé.");
        }}
      />
    ) : strength && (selected === WARMUP || selected === COOLDOWN) ? (
      <BoundaryPanel
        key={selected}
        kind={selected}
        text={strength[selected]}
        onChange={(text) => setStrength((current) => ({ ...current, [selected]: text }))}
        onDone={closePanel}
      />
    ) : strength && group ? (
      <StrengthGroupPanel
        key={group.id}
        group={group}
        onChange={(next) => setStrength((current) => replaceGroup(current, next))}
        onDone={closePanel}
        onDelete={() => {
          setStrength((current) => removeStrengthItem(current, group.id));
          closePanel();
          setSelected(null);
          toast(group.kind === "superset" ? "Superset supprimé." : "EMOM supprimé.");
        }}
      />
    ) : null;
  const hyroxLine = hyrox && selected ? findLine(hyrox, selected) : null;
  const hyroxBlock =
    hyrox && selected && !hyroxLine
      ? (hyrox.items.find(
          (item): item is HyroxBlock => item.kind === "block" && item.id === selected,
        ) ?? null)
      : null;
  const hyroxPanel =
    hyrox && meta.hyrox && hyroxLine ? (
      <HyroxLinePanel
        key={hyroxLine.line.id}
        line={hyroxLine.line}
        block={hyroxLine.block}
        blockPosition={hyroxLine.blockIndex + 1}
        linePosition={hyroxLine.index + 1}
        athlete={meta.hyrox}
        onChange={(next) => setHyrox((current) => replaceLine(current, next))}
        onDone={closePanel}
        onDelete={() => {
          setHyrox((current) => removeLine(current, hyroxLine.line.id));
          closePanel();
          setSelected(null);
          toast("Étape supprimée.");
        }}
      />
    ) : hyrox && meta.hyrox && hyroxBlock ? (
      <HyroxBlockPanel
        key={hyroxBlock.id}
        block={hyroxBlock}
        position={hyrox.items.findIndex((item) => item.id === hyroxBlock.id) + 1}
        athlete={meta.hyrox}
        onChange={(next) => setHyrox((current) => replaceBlock(current, next))}
        onSimulation={() => {
          setSheetOpen(false);
          setSimulation(true);
        }}
        onDone={closePanel}
        onDelete={() => {
          setHyrox((current) => removeHyroxItem(current, hyroxBlock.id));
          closePanel();
          setSelected(null);
          toast("Bloc supprimé.");
        }}
      />
    ) : null;
  const panel =
    strengthPanel ??
    hyroxPanel ??
    (running && step ? (
      <RunStepPanel
        key={step.step.id}
        step={step.step}
        place={{
          repeatTimes: step.repeat ? step.repeat.times : null,
          position: step.repeat
            ? step.index + 1
            : running.items.findIndex((item) => item.id === step.step.id) + 1,
        }}
        athlete={meta.athlete}
        defaultAim={plan.aimDefaults.running}
        onChange={(next) => setRunning(replaceStep(running, next))}
        onDone={closePanel}
        onDelete={() => {
          setRunning(removeStep(running, step.step.id));
          closePanel();
          setSelected(null);
          toast("Étape supprimée.");
        }}
      />
    ) : null);

  const menu = (phone: boolean) => (
    <MoreMenu
      label="Plus d'actions sur la séance"
      title={session.title}
      width={250}
      items={[
        ...(phone
          ? [{ label: "Renommer la séance", icon: PenLine, onSelect: () => setDialog("rename") }]
          : []),
        {
          label: "Enregistrer comme modèle",
          icon: LayoutTemplate,
          highlighted: true,
          onSelect: () => setDialog("template"),
        },
        {
          label: "Dupliquer la séance",
          icon: Copy,
          onSelect: () => {
            let created: string | null = null;
            update((current) => {
              const result = duplicateSession(current, meta.weekIndex, meta.sessionKey);
              created = result.key;
              return result.plan;
            });
            // Semaine pleine (14 séances, D-164) : rien n'est copié (revue MVP, C12).
            if (!created) return toast("14 séances au plus par semaine.");
            toast("Séance dupliquée.");
            // La copie s'ouvre avec les mêmes retours (fiche du sportif ou éditeur), B16.
            leave(sessionHref(meta, created, meta.returnTo?.href ?? null));
          },
        },
        {
          label: "Supprimer la séance",
          icon: Trash2,
          destructive: true,
          onSelect: () => setDialog("delete"),
        },
      ]}
    />
  );

  const durationField = (
    <DurationField
      minutes={session.durationMinutes}
      manual={session.durationManual === true}
      onChange={(minutes) =>
        setSession((current) => ({ ...current, durationMinutes: minutes, durationManual: true }))
      }
      onRecompute={() => setSession((current) => ({ ...current, durationManual: undefined }))}
    />
  );
  const titleFields = (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-6">
        {running || hyrox ? (
          <label className="flex flex-col gap-1.5 lg:flex-row lg:items-center lg:gap-3">
            <span className={`${label} whitespace-nowrap`}>Type de séance</span>
            <SelectField
              className="lg:w-[240px]"
              value={session.sessionType}
              onChange={(event) =>
                setSession((current) => ({ ...current, sessionType: event.target.value }))
              }
            >
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </SelectField>
          </label>
        ) : null}
        {durationField}
      </div>
      {/* Musculation : l'échauffement et le retour au calme sont des cartes de la liste (17/11). */}
      {strength ? null : (
        <div className="grid gap-2.5 lg:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-1.5">
            <span className={label}>Objectif</span>
            <input
              defaultValue={session.objective ?? ""}
              maxLength={200}
              placeholder="Tenir l'allure 10 km sur des efforts courts"
              onChange={(event) =>
                setSession((current) => ({
                  ...current,
                  objective: event.target.value.trim() || undefined,
                }))
              }
              className={field}
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1.5">
            <span className={label}>Conseil du coach</span>
            <input
              defaultValue={session.coachTip ?? ""}
              maxLength={1000}
              placeholder="Garde les 2 min de trot vraiment lentes."
              onChange={(event) =>
                setSession((current) => ({
                  ...current,
                  coachTip: event.target.value.trim() || undefined,
                }))
              }
              className={field}
            />
          </label>
        </div>
      )}
    </>
  );

  const list = running ? (
    <RunningList
      content={running}
      selectedId={selected}
      readOnly={false}
      onSelect={select}
      onChange={setRunning}
      onAddStep={(repeatId) => {
        if (!repeatId && full) return tooMany();
        const result = addStep(running, repeatId);
        setRunning(result.content);
        select(result.id);
      }}
      onAddRepeat={() => {
        if (full) return tooMany();
        const result = addRepeat(running);
        setRunning(result.content);
        select(result.id);
      }}
      actions={cardActions}
    />
  ) : strength ? (
    <StrengthList
      content={strength}
      selectedId={selected}
      readOnly={false}
      onSelect={select}
      onChange={setStrength}
      onAddExercise={(groupId) =>
        !groupId && full ? tooMany() : setPicker({ multiple: false, groupId })
      }
      onCreateSuperset={() => (full ? tooMany() : setPicker({ multiple: true }))}
      onRemoveItem={(id) => {
        setStrength((current) => removeStrengthItem(current, id));
        toast("Bloc supprimé.");
      }}
      {...(maxes ? { maxes } : {})}
      actions={cardActions}
    />
  ) : hyrox ? (
    <HyroxList
      content={hyrox}
      selectedId={selected}
      onSelect={select}
      onChange={setHyrox}
      onAddLine={(blockId) => {
        const result = addLine(hyrox, blockId);
        setHyrox(() => result.content);
        select(result.id);
      }}
      onAddBlock={() => {
        if (hyrox.items.length >= 20) return toast("20 blocs au plus dans une séance.");
        const result = addBlock(hyrox);
        setHyrox(() => result.content);
        select(result.id);
      }}
      onSimulation={() => setSimulation(true)}
      onDuplicate={(id) => {
        setHyrox((current) => duplicateHyroxItem(current, id));
        toast("Bloc dupliqué.");
      }}
      onRemove={(id) => {
        setHyrox((current) => removeHyroxItem(current, id));
        toast("Bloc supprimé.");
      }}
      actions={cardActions}
    />
  ) : (
    // Hybride : l'éditeur n'est pas dessiné (règle 5 du dossier de design) ; la séance se lit.
    <div className="flex flex-col gap-3">
      <SessionBlocks session={session} variant="panel" />
      <p className="rounded-[12px] bg-surface-2 px-3.5 py-3 text-[13px] leading-[1.45] text-text-2">
        L&apos;éditeur {disciplineLabels[discipline]} n&apos;existe pas encore : cette séance,
        reprise d&apos;un ancien programme, se lit ici. Tu peux la dupliquer ou la supprimer (menu «
        ··· »), et ajouter à sa place une séance Running, Musculation ou Hyrox.
      </p>
    </div>
  );

  return (
    <>
      {/* Téléphone : « ← Semaine 2 » dans la barre du haut (maquette 4b). */}
      <MobileBarTitle>
        <button type="button" onClick={() => leave(backHref)} className={barBackClass}>
          <ArrowLeft aria-hidden {...barBackIcon} className="shrink-0" />
          <span className="truncate">{meta.returnTo?.label ?? `Semaine ${meta.weekIndex}`}</span>
        </button>
      </MobileBarTitle>

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-3">
          {/* Carte titre (ordinateur) ; sur téléphone, le titre seul, puis les réglages sous la liste. */}
          <section
            className={`${card} relative z-[2] hidden flex-col gap-3.5 px-[22px] py-5 lg:flex`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-1">
                <span
                  className={`text-[11.5px] font-semibold tracking-[0.05em] uppercase ${disciplineStyles[discipline].text}`}
                >
                  {kicker}
                </span>
                <h2 className="text-[26px] leading-[1.15] font-bold tracking-[-0.025em] text-text">
                  {session.title}
                </h2>
              </div>
              <span className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => setDialog("rename")}
                  className="inline-flex h-8 items-center rounded-[9px] px-3 text-[12.5px] font-medium whitespace-nowrap text-text inset-ring inset-ring-field-ring transition-colors duration-150 hover:bg-surface-2"
                >
                  Renommer
                </button>
                {menu(false)}
              </span>
            </div>
            {titleFields}
          </section>

          <div className="flex items-start justify-between gap-3 px-1 lg:hidden">
            <div className="flex min-w-0 flex-col gap-[5px]">
              <span
                className={`text-[11.5px] font-semibold tracking-[0.05em] uppercase ${disciplineStyles[discipline].text}`}
              >
                {kicker}
              </span>
              <h2 className="text-[24px] leading-[1.15] font-bold tracking-[-0.02em] text-text">
                {session.title}
              </h2>
              {/* Téléphone : l'état de l'enregistrement, seulement quand il y a quelque chose à dire. */}
              <SaveState quietWhenSaved className="mt-0.5" />
            </div>
            {menu(true)}
          </div>

          {/* Aperçu en direct : un résumé écrit et deux totaux, jamais de graphique. */}
          <section className={`${card} hidden items-center gap-[22px] px-5 py-4 lg:flex`}>
            <div className="flex min-w-0 flex-1 items-baseline gap-2.5">
              <span className="shrink-0 text-[14px] font-semibold text-text">Aperçu en direct</span>
              <span className="truncate text-[12.5px] font-medium text-muted">{summary}</span>
            </div>
            <div className="flex shrink-0 gap-[22px]">
              {totals.map((total) => (
                <div key={total.label} className="flex flex-col gap-0.5">
                  <span className="text-[12px] text-muted">{total.label}</span>
                  <span className="text-[19px] font-bold tracking-[-0.01em] whitespace-nowrap text-text">
                    {total.value}
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section className={`${card} flex flex-col gap-2.5 px-4 py-3.5 lg:hidden`}>
            <div className="flex justify-between gap-2.5">
              {totals.map((total, index) => (
                <div
                  key={total.label}
                  className={`flex flex-col gap-px ${index ? "items-end" : ""}`}
                >
                  <span className="text-[12px] text-muted">{total.label}</span>
                  <span className="text-[17px] font-bold whitespace-nowrap text-text">
                    {total.value}
                  </span>
                </div>
              ))}
            </div>
            <span className="text-[12.5px] font-medium text-text-2">{summary}</span>
          </section>

          <section className="flex flex-col gap-3 lg:rounded-[20px] lg:bg-surface lg:p-[18px]">
            <div className="hidden items-center justify-between px-1 lg:flex">
              <h3 className="text-[15px] font-semibold text-text">
                {running ? "Étapes" : strength ? "Exercices" : hyrox ? "Blocs" : "Contenu"}
              </h3>
              {strength ? (
                <span className="text-[12.5px] font-medium text-faint">
                  Glisse pour changer l&apos;ordre
                </span>
              ) : null}
              {hyroxCount ? (
                <span className="text-[12.5px] font-medium text-faint">
                  {hyroxCount.blocks} bloc{hyroxCount.blocks > 1 ? "s" : ""} · {hyroxCount.lines}{" "}
                  étape
                  {hyroxCount.lines > 1 ? "s" : ""}
                </span>
              ) : null}
              {counts ? (
                <span className="text-[12.5px] font-medium text-faint">
                  {counts.blocks} bloc{counts.blocks > 1 ? "s" : ""} · {counts.steps} étape
                  {counts.steps > 1 ? "s" : ""} au total
                </span>
              ) : null}
            </div>
            {list}
          </section>

          {/* Téléphone : les réglages de la séance (type, objectif, conseil) sous la liste. */}
          <section className={`${card} flex flex-col gap-3 p-4 lg:hidden`}>
            <h3 className="text-[15px] font-semibold text-text">Réglages de la séance</h3>
            {titleFields}
          </section>
        </div>

        <aside
          aria-label="Modifier l'étape"
          className={`${card} hidden p-5 inset-ring-[1.5px] inset-ring-violet/35 lg:sticky lg:top-3 lg:block lg:max-h-[calc(100dvh-24px)] lg:overflow-y-auto lg:overscroll-contain`}
        >
          {panel ?? (
            <p className="text-[14px] leading-[1.5] text-muted">
              {running
                ? "Choisis une étape dans la liste pour la modifier."
                : strength
                  ? "Choisis un exercice dans la liste pour régler ses séries."
                  : hyrox
                    ? "Choisis un bloc ou une étape dans la liste pour la modifier."
                    : "Le panneau de modification arrive avec l'éditeur de cette discipline."}
            </p>
          )}
        </aside>
      </div>

      {strength ? (
        <button
          type="button"
          aria-label="Ajouter un exercice"
          data-phone-fab=""
          onClick={() => (full ? tooMany() : setPicker({ multiple: false }))}
          className={phoneFabClass}
        >
          <Plus aria-hidden size={24} strokeWidth={2.2} />
        </button>
      ) : null}
      {hyrox ? (
        <button
          type="button"
          aria-label="Ajouter un bloc"
          data-phone-fab=""
          onClick={() => {
            if (hyrox.items.length >= 20) return toast("20 blocs au plus dans une séance.");
            const result = addBlock(hyrox);
            setHyrox(() => result.content);
            select(result.id);
          }}
          className={phoneFabClass}
        >
          <Plus aria-hidden size={24} strokeWidth={2.2} />
        </button>
      ) : null}
      {hyrox && meta.hyrox ? (
        <SimulationSheet
          open={simulation}
          onClose={() => setSimulation(false)}
          athlete={meta.hyrox}
          onInsert={(loads, targets) => {
            const result = insertSimulation(
              hyrox,
              loads,
              meta.hyrox?.division ?? null,
              meta.hyrox?.sex ?? null,
              targets,
            );
            setHyrox(() => result.content);
            setSimulation(false);
            setSelected(result.id);
            toast("Simulation de course insérée.");
          }}
        />
      ) : null}
      {meta.strength ? (
        <ExercisePickerSheet
          open={picker !== null}
          onClose={() => setPicker(null)}
          title={
            picker?.multiple
              ? "Créer un superset"
              : picker?.groupId
                ? "Relier un exercice"
                : "Ajouter un exercice"
          }
          library={meta.strength.library}
          multiple={picker?.multiple ?? false}
          onPick={(picked) => {
            if (!strength || !picker) return;
            if (picker.multiple) {
              const result = addSuperset(strength, picked, plan.aimDefaults.strength);
              if (result) {
                setStrength(() => result.content);
                setSelected(result.id);
              }
            } else if (picked[0]) {
              const result = addExercise(
                strength,
                picked[0],
                picker.groupId,
                plan.aimDefaults.strength,
              );
              setStrength(() => result.content);
              setSelected(result.id);
              if (isPhone()) setSheetOpen(true);
            }
            setPicker(null);
          }}
        />
      ) : null}
      {running ? (
        <button
          type="button"
          aria-label="Ajouter une étape"
          data-phone-fab=""
          onClick={() => {
            if (full) return tooMany();
            const result = addStep(running);
            setRunning(result.content);
            select(result.id);
          }}
          className={phoneFabClass}
        >
          <Plus aria-hidden size={24} strokeWidth={2.2} />
        </button>
      ) : null}

      {/* Téléphone : l'étape s'ouvre dans une feuille du bas, avec le même panneau. */}
      <Overlay
        open={sheetOpen && panel !== null}
        onClose={closePanel}
        label={strength ? "Régler l'exercice" : hyroxBlock ? "Régler le bloc" : "Modifier l'étape"}
        size="form"
      >
        <DialogBody>{panel}</DialogBody>
      </Overlay>

      <TextSheet
        open={dialog === "rename"}
        onClose={() => setDialog(null)}
        title="Renommer la séance"
        label="Nom de la séance"
        initial={session.title}
        confirmLabel="Renommer"
        onConfirm={(title) => {
          setSession((current) => ({ ...current, title: title.slice(0, 80) }));
          setDialog(null);
        }}
      />
      <TextSheet
        open={dialog === "template"}
        onClose={() => setDialog(null)}
        title="Enregistrer comme modèle"
        label="Nom du modèle"
        initial={session.title}
        confirmLabel="Enregistrer le modèle"
        hint="Le modèle garde le contenu de la séance, sans jour ni rendez-vous. Le modifier ensuite ne change pas cette séance."
        pending={pending}
        onConfirm={(title) =>
          startTransition(async () => {
            const result = await saveSessionAsTemplate(organizationId, session, title);
            setDialog(null);
            toast(result.ok ? "Modèle enregistré dans Mes modèles." : result.message);
          })
        }
      />
      <ConfirmDialog
        open={dialog === "delete"}
        onClose={() => setDialog(null)}
        title="Supprimer cette séance ?"
        confirmLabel="Supprimer"
        icon={Trash2}
        pending={pending}
        onConfirm={() => {
          update((current) => removeSession(current, meta.weekIndex, meta.sessionKey));
          setDialog(null);
          toast("Séance supprimée du brouillon.");
          // Venu de la fiche, on y revient (B16) ; sinon l'éditeur, sur la semaine.
          leave(
            meta.returnTo?.href ??
              `${meta.base}/${meta.programId}?semaine=${meta.weekIndex}${
                meta.editorReturn ? `&retour=${encodeURIComponent(meta.editorReturn)}` : ""
              }`,
          );
        }}
      >
        « {session.title} » sort du brouillon de la semaine {meta.weekIndex}.
      </ConfirmDialog>
      {leaveDialog}
    </>
  );
}

// Durée de la séance (phase 4) : estimée d'après le contenu ; le coach peut l'écrire lui-même
// (elle ne bouge plus), puis revenir au calcul.
function DurationField({
  minutes,
  manual,
  onChange,
  onRecompute,
}: {
  minutes: number;
  manual: boolean;
  onChange: (minutes: number) => void;
  onRecompute: () => void;
}) {
  // Pendant la saisie, le texte tapé ; sinon, la durée de la séance (qui suit le contenu).
  const [typing, setTyping] = useState<string | null>(null);
  const [bad, setBad] = useState(false);
  return (
    <div className="flex flex-col gap-1.5 lg:flex-row lg:items-center lg:gap-3">
      <label htmlFor="session-duration" className={`${label} whitespace-nowrap`}>
        Durée
      </label>
      <span className="flex items-center gap-2.5">
        <span className="flex h-11 w-[120px] items-center gap-1.5 rounded-[11px] bg-surface px-3.5 inset-ring inset-ring-field-ring focus-within:inset-ring-[1.5px] focus-within:inset-ring-violet has-[[aria-invalid=true]]:inset-ring-alert">
          <input
            id="session-duration"
            inputMode="numeric"
            value={typing ?? String(minutes)}
            aria-invalid={bad}
            aria-describedby="session-duration-hint"
            onFocus={() => setTyping(String(minutes))}
            onBlur={() => {
              setTyping(null);
              setBad(false);
            }}
            onChange={(event) => {
              const text = event.target.value.replace(/\D/g, "").slice(0, 3);
              setTyping(text);
              const value = Number(text);
              const ok = text !== "" && value >= 5 && value <= 600;
              setBad(!ok && text !== "");
              if (ok) onChange(value);
            }}
            className="w-full min-w-0 bg-transparent text-[16px] font-medium text-text outline-none lg:text-[14px]"
          />
          <span className="text-[13px] font-medium text-muted">min</span>
        </span>
        <span id="session-duration-hint" className="text-[12.5px] text-muted">
          {bad ? (
            <span className="text-alert">Entre 5 et 600 min.</span>
          ) : manual ? (
            <>
              Écrite par toi.{" "}
              <button
                type="button"
                onClick={onRecompute}
                className="tap-44 font-semibold text-violet-text hover:underline"
              >
                Calculer d&apos;après le contenu
              </button>
            </>
          ) : (
            "Estimée d'après le contenu."
          )}
        </span>
      </span>
    </div>
  );
}

// En-tête (ordinateur) : « Enregistré » puis « Terminer », qui enregistre et revient au programme.
export function SessionHeaderActions({ href }: { href: string }) {
  const { leave, pending, dialog } = useSafeLeave();
  return (
    <span className="flex items-center gap-2.5 max-lg:hidden">
      <SaveState />
      {dialog}
      <button
        type="button"
        disabled={pending}
        onClick={() => leave(href)}
        className="inline-flex h-8 items-center rounded-[9px] bg-cta px-3.5 text-[12.5px] font-semibold whitespace-nowrap text-on-cta transition-[scale,background-color] duration-150 hover:bg-cta-hover active:scale-[0.97] disabled:opacity-60"
      >
        Terminer
      </button>
    </span>
  );
}

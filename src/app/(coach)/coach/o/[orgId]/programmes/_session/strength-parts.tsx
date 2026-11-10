"use client";

import { Clock, Link2, Minus, Plus, Search, Trash2, Unlink } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { useReorder } from "@/components/programs/use-reorder";
import { Checkbox } from "@/components/ui/checkbox";
import { dlgPrimaryButtonClass } from "@/components/ui/dialog-styles";
import { MoreMenu } from "@/components/ui/more-menu";
import { DialogFooter, Sheet } from "@/components/ui/overlay";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { kgFromPercent } from "@/domain/training/aims";
import type { StrengthContent, StrengthExercise, StrengthSet } from "@/domain/training/session-v2";
import {
  addSet,
  exerciseSummary,
  groupMeta,
  moveItem,
  parseQuickFill,
  parseReps,
  parseRest,
  quickFill,
  quickFillText,
  removeLastSet,
  repsText,
  restText,
  setLoadMode,
  ungroup,
  withComputedKg,
  type StrengthGroup,
} from "@/domain/training/strength-edit";

import { BASE, DropLine, Handle, SELECTED, field, label } from "./running-parts";

// Liste et panneaux de l'éditeur Musculation (05, MUS-01 à 03 ; sources CooryEditeurListe et
// CooryEditeurPanneau). Exercices avec vignette grise et résumé des séries ; superset relié par un
// trait visible ; EMOM en bloc. Charge en kg ou en % du max, au choix pour chaque exercice.

// Un exercice de la Bibliothèque, tel que le choix et le panneau en ont besoin.
export type LibraryChoice = { id: string; name: string; meta: string; search: string };
// Max du sportif par exercice (repère relié, D-155) avec sa date, pour « Max de Lucas : 20 kg ».
export type AthleteMax = {
  kg: number;
  estimated: boolean;
  fromKg: number;
  fromReps: number;
  date: string;
};
export type StrengthAthlete = { firstName: string; maxes: Record<string, AthleteMax> };

const GROUP_TINT = "bg-[color-mix(in_srgb,var(--strength-fill)_9%,var(--surface))]";
const dayMonth = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const kg = (value: number) => `${String(value).replace(".", ",")} kg`;

function ExerciseRow({
  exercise,
  summary,
  selected,
  child,
  onSelect,
  handle,
  drop,
  dragging,
  linked,
}: {
  exercise: StrengthExercise;
  summary: string;
  selected: boolean;
  child: boolean;
  onSelect: () => void;
  handle: ReactNode;
  drop: "before" | "after" | null;
  dragging: boolean;
  linked: boolean;
}) {
  return (
    <div
      data-reorder-row=""
      className={`relative flex items-center gap-3 bg-surface py-2 pr-3 pl-2 transition-[box-shadow,opacity] duration-150 ${
        child ? "min-h-[54px] rounded-[13px]" : "min-h-[58px] rounded-[14px]"
      } ${selected ? SELECTED : BASE} ${dragging ? "opacity-60" : ""}`}
    >
      {linked ? (
        <span
          aria-hidden
          className={`absolute top-1/2 -left-[15px] -mt-1 size-2 rounded-full bg-strength shadow-[0_0_0_2px_color-mix(in_srgb,var(--strength-fill)_9%,var(--surface))]`}
        />
      ) : null}
      <DropLine at={drop} />
      {handle}
      <span
        aria-hidden
        className={`shrink-0 bg-chip ${child ? "size-[38px] rounded-[10px]" : "size-[42px] rounded-[11px]"}`}
      />
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="flex min-w-0 flex-1 flex-col text-left after:absolute after:inset-0 after:rounded-[inherit] focus-visible:outline-none after:focus-visible:outline-2 after:focus-visible:outline-offset-2 after:focus-visible:outline-violet"
      >
        <span
          className={`truncate font-semibold text-text ${child ? "text-[14px]" : "text-[14.5px]"}`}
        >
          {exercise.name}
        </span>
        <span className={`text-[12.5px] leading-[1.4] text-muted ${child ? "mt-px" : "mt-0.5"}`}>
          {summary}
        </span>
      </button>
    </div>
  );
}

function Group({
  group,
  selectedId,
  readOnly,
  onSelect,
  onChange,
  onAdd,
  onRemove,
  handle,
  drop,
  dragging,
}: {
  group: StrengthGroup;
  selectedId: string | null;
  readOnly: boolean;
  onSelect: (id: string) => void;
  onChange: (content: (current: StrengthContent) => StrengthContent) => void;
  onAdd: () => void;
  onRemove: () => void;
  handle: ReactNode;
  drop: "before" | "after" | null;
  dragging: boolean;
}) {
  const inner = useReorder((from, to) =>
    onChange((current) => moveItem(current, from, to, group.id)),
  );
  const superset = group.kind === "superset";
  const Icon = superset ? Link2 : Clock;
  return (
    <div
      data-reorder-row=""
      className={`relative flex flex-col gap-2 rounded-[17px] p-2.5 transition-[opacity,box-shadow] duration-150 ${GROUP_TINT} ${
        selectedId === group.id ? SELECTED : ""
      } ${dragging ? "opacity-60" : ""}`}
    >
      <DropLine at={drop} />
      <div className="flex min-h-8 flex-wrap items-center gap-2.5 pt-0.5 pr-1 pl-1.5">
        {handle}
        <button
          type="button"
          onClick={() => onSelect(group.id)}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[8px] text-left focus-visible:outline-2 focus-visible:outline-violet"
        >
          <span className="flex items-center gap-[7px] text-[14px] font-semibold whitespace-nowrap text-strength">
            <Icon aria-hidden size={15} strokeWidth={2} />
            {superset ? "Superset" : "EMOM"}
          </span>
          <span className="min-w-0 flex-1 truncate text-[12.5px] text-text-2">
            {groupMeta(group)}
          </span>
        </button>
        {readOnly ? null : (
          <MoreMenu
            label={`Plus d'actions sur le ${superset ? "superset" : "bloc EMOM"}`}
            title={superset ? "Superset" : "EMOM"}
            width={230}
            items={[
              {
                label: superset ? "Défaire le superset" : "Défaire l'EMOM",
                icon: Unlink,
                onSelect: () => onChange((current) => ungroup(current, group.id)),
              },
              {
                label: superset ? "Supprimer le superset" : "Supprimer l'EMOM",
                icon: Trash2,
                destructive: true,
                onSelect: onRemove,
              },
            ]}
            className="-my-1.5 [&>button]:bg-transparent! [&>button]:text-faint! [&>button]:inset-ring-0! lg:[&>button]:size-8!"
          />
        )}
      </div>
      <div
        {...inner.listProps}
        className={`relative flex flex-col gap-1.5 ${superset ? "pl-6" : ""}`}
      >
        {superset ? (
          <span
            aria-hidden
            className="absolute top-[26px] bottom-[26px] left-2 w-0.5 rounded-[1px] bg-strength"
          />
        ) : null}
        {group.exercises.map((exercise, index) => (
          <ExerciseRow
            key={exercise.id}
            exercise={exercise}
            summary={
              group.kind === "emom"
                ? [
                    group.workSec ? `${group.workSec} s` : null,
                    exercise.cue ?? exerciseSummary(exercise, { inGroup: true }),
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : exerciseSummary(exercise, { inGroup: true })
            }
            child
            linked={superset}
            selected={selectedId === exercise.id}
            onSelect={() => onSelect(exercise.id)}
            drop={inner.dropMark(index)}
            dragging={inner.drag?.from === index}
            handle={
              readOnly ? null : (
                <Handle
                  label={`Déplacer « ${exercise.name} » (flèches haut et bas)`}
                  props={inner.handleProps(index, group.exercises.length)}
                />
              )
            }
          />
        ))}
      </div>
      {readOnly || group.exercises.length >= 6 ? null : (
        <button
          type="button"
          onClick={onAdd}
          className={`flex min-h-10 items-center gap-[7px] self-start rounded-[12px] px-3 text-[13px] font-medium text-strength transition-colors duration-150 hover:bg-surface/60 ${superset ? "ml-6" : ""}`}
        >
          <Plus aria-hidden size={14} strokeWidth={2} />
          {superset ? "Relier un exercice" : "Ajouter un exercice"}
        </button>
      )}
    </div>
  );
}

export function StrengthList({
  content,
  selectedId,
  readOnly,
  onSelect,
  onChange,
  onAddExercise,
  onCreateSuperset,
  onRemoveItem,
}: {
  content: StrengthContent;
  selectedId: string | null;
  readOnly: boolean;
  onSelect: (id: string) => void;
  onChange: (change: (current: StrengthContent) => StrengthContent) => void;
  onAddExercise: (groupId?: string) => void;
  onCreateSuperset: () => void;
  onRemoveItem: (id: string) => void;
}) {
  const outer = useReorder((from, to) => onChange((current) => moveItem(current, from, to)));
  const addButton =
    "inline-flex min-h-[46px] flex-[1_1_140px] items-center justify-center gap-[7px] rounded-[14px] text-[13.5px] font-medium whitespace-nowrap text-text-2 inset-ring-[1.5px] inset-ring-line transition-[scale,background-color] duration-150 hover:bg-surface-2 active:scale-[0.98]";
  return (
    <div className="flex flex-col gap-2">
      <div {...outer.listProps} className="flex flex-col gap-2">
        {content.items.map((item, index) => {
          const name =
            item.kind === "exercise"
              ? item.name
              : item.kind === "text"
                ? item.title
                : item.kind === "superset"
                  ? "Superset"
                  : "EMOM";
          const handle = readOnly ? null : (
            <Handle
              label={`Déplacer « ${name} » (flèches haut et bas)`}
              props={outer.handleProps(index, content.items.length)}
            />
          );
          const drop = outer.dropMark(index);
          const dragging = outer.drag?.from === index;
          if (item.kind === "exercise")
            return (
              <ExerciseRow
                key={item.id}
                exercise={item}
                summary={exerciseSummary(item)}
                child={false}
                linked={false}
                selected={selectedId === item.id}
                onSelect={() => onSelect(item.id)}
                handle={handle}
                drop={drop}
                dragging={dragging}
              />
            );
          if (item.kind === "superset" || item.kind === "emom")
            return (
              <Group
                key={item.id}
                group={item}
                selectedId={selectedId}
                readOnly={readOnly}
                onSelect={onSelect}
                onChange={onChange}
                onAdd={() => onAddExercise(item.id)}
                onRemove={() => onRemoveItem(item.id)}
                handle={handle}
                drop={drop}
                dragging={dragging}
              />
            );
          return (
            <div
              key={item.id}
              data-reorder-row=""
              className={`relative flex min-h-[58px] items-center gap-3 rounded-[14px] bg-surface py-2 pr-3 pl-2 ${BASE}`}
            >
              <DropLine at={drop} />
              {handle}
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[14.5px] font-semibold text-text">{item.title}</span>
                <span className="text-[12.5px] leading-[1.4] text-muted">
                  {[...item.lines, ...(item.repeat?.lines ?? [])].join(" · ")}
                </span>
              </span>
            </div>
          );
        })}
      </div>
      {readOnly ? null : (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onAddExercise()} className={addButton}>
            <Plus aria-hidden size={15} strokeWidth={2} />
            Ajouter un exercice
          </button>
          <button
            type="button"
            onClick={onCreateSuperset}
            disabled={content.items.length >= 40}
            className={addButton}
          >
            <Plus aria-hidden size={15} strokeWidth={2} />
            Créer un superset
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panneau « réglage des séries » d'un exercice
// ---------------------------------------------------------------------------
const cell =
  "h-10 w-full min-w-0 rounded-[10px] bg-surface px-2.5 text-[16px] font-medium text-text inset-ring inset-ring-field-ring outline-none transition-shadow duration-150 placeholder:text-faint focus:inset-ring-[1.5px] focus:inset-ring-violet aria-invalid:inset-ring-alert lg:text-[15px]";
const GRID =
  "grid grid-cols-[24px_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.7fr)] gap-1.5";

function SetRow({
  set,
  index,
  mode,
  maxKg,
  onChange,
}: {
  set: StrengthSet;
  index: number;
  mode: StrengthExercise["loadMode"];
  maxKg: number | null;
  onChange: (set: StrengthSet) => void;
}) {
  const [reps, setReps] = useState(repsText(set));
  const [load, setLoad] = useState(
    mode === "pct"
      ? set.pct !== undefined
        ? `${set.pct} %`
        : ""
      : set.kg !== undefined
        ? String(set.kg).replace(".", ",")
        : "",
  );
  const [rir, setRir] = useState(set.rir !== undefined ? String(set.rir) : "");
  const [bad, setBad] = useState<{ reps?: boolean; load?: boolean; rir?: boolean }>({});
  const warmup = set.type === "warmup";
  const computed =
    mode === "pct" && set.pct !== undefined && maxKg ? kgFromPercent(maxKg, set.pct) : null;

  const commitReps = (value: string) => {
    const parsed = parseReps(value);
    setBad((current) => ({ ...current, reps: !parsed }));
    if (!parsed) return;
    const next: StrengthSet = { ...set, repsMin: parsed.repsMin };
    if (parsed.repsMax !== undefined) next.repsMax = parsed.repsMax;
    else delete next.repsMax;
    onChange(next);
  };
  const commitLoad = (value: string) => {
    const text = value.replace("%", "").replace(",", ".").trim();
    if (!text) {
      // Sans charge : poids du corps (kg) ; en %, une série normale garde son % (règle du schéma).
      if (mode === "kg") {
        const next = { ...set };
        delete next.kg;
        setBad((current) => ({ ...current, load: false }));
        return onChange(next);
      }
      return setBad((current) => ({ ...current, load: !warmup }));
    }
    const number = Number(text);
    const ok =
      Number.isFinite(number) &&
      (mode === "pct" ? number >= 1 && number <= 150 : number >= 0 && number <= 1000);
    setBad((current) => ({ ...current, load: !ok }));
    if (!ok) return;
    onChange(
      mode === "pct"
        ? withComputedKg({ ...set, pct: Math.round(number) }, maxKg)
        : { ...set, kg: Math.round(number * 2) / 2 },
    );
  };
  const commitRir = (value: string) => {
    const text = value.replace("—", "").trim();
    if (!text) {
      const next = { ...set };
      delete next.rir;
      setBad((current) => ({ ...current, rir: false }));
      return onChange(next);
    }
    const number = Number(text);
    const ok = Number.isInteger(number) && number >= 0 && number <= 10;
    setBad((current) => ({ ...current, rir: !ok }));
    if (ok) onChange({ ...set, rir: number });
  };

  return (
    <div className={`${GRID} items-center`}>
      <span className="text-center text-[13px] font-semibold text-faint">{index + 1}</span>
      <button
        type="button"
        aria-label={`Série ${index + 1} : ${warmup ? "échauffement" : "normale"} (changer)`}
        onClick={() => {
          const next: StrengthSet = { ...set, type: warmup ? "normal" : "warmup" };
          // Une série normale en % a toujours son % : 70 % par défaut.
          if (mode === "pct" && !warmup && next.pct === undefined) next.pct = 70;
          onChange(next.type === "normal" && mode === "pct" ? withComputedKg(next, maxKg) : next);
        }}
        className={`h-10 truncate rounded-[10px] px-2.5 text-left text-[13px] font-medium transition-colors duration-150 ${
          warmup
            ? "bg-[color-mix(in_srgb,var(--strength-fill)_10%,var(--surface))] text-strength"
            : "bg-bg text-text"
        }`}
      >
        {warmup ? "Échauff." : "Normale"}
      </button>
      <input
        aria-label={`Répétitions de la série ${index + 1}`}
        inputMode="numeric"
        value={reps}
        aria-invalid={bad.reps ?? false}
        onChange={(event) => {
          setReps(event.target.value);
          commitReps(event.target.value);
        }}
        className={cell}
      />
      <span className="relative flex h-10 min-w-0 flex-col justify-center rounded-[10px] bg-surface px-2 inset-ring inset-ring-field-ring focus-within:inset-ring-[1.5px] focus-within:inset-ring-violet has-[[aria-invalid=true]]:inset-ring-alert">
        <input
          aria-label={
            mode === "pct"
              ? `% du max de la série ${index + 1}`
              : `Charge en kg de la série ${index + 1}`
          }
          inputMode="decimal"
          value={load}
          placeholder={mode === "kg" ? "—" : ""}
          aria-invalid={bad.load ?? false}
          onChange={(event) => {
            setLoad(event.target.value);
            commitLoad(event.target.value);
          }}
          className="w-full min-w-0 bg-transparent text-[16px] leading-[1.1] font-medium text-text outline-none placeholder:text-faint lg:text-[15px]"
        />
        {computed !== null ? (
          <span className="text-[10.5px] leading-[1.1] font-medium text-muted">
            ≈ {kg(computed)}
          </span>
        ) : null}
      </span>
      <input
        aria-label={`RIR de la série ${index + 1}`}
        inputMode="numeric"
        value={rir}
        placeholder="—"
        aria-invalid={bad.rir ?? false}
        onChange={(event) => {
          setRir(event.target.value);
          commitRir(event.target.value);
        }}
        className={cell}
      />
    </div>
  );
}

export function StrengthExercisePanel({
  exercise,
  position,
  inGroup,
  meta,
  athlete,
  onChange,
  onDone,
  onDelete,
}: {
  exercise: StrengthExercise;
  position: number;
  inGroup: boolean;
  meta: string | null;
  athlete: StrengthAthlete;
  onChange: (exercise: StrengthExercise) => void;
  onDone: () => void;
  onDelete: () => void;
}) {
  // Le panneau existe deux fois (colonne d'ordinateur, feuille du téléphone) : identifiant unique.
  const quickId = useId();
  const [quick, setQuick] = useState(quickFillText(exercise));
  const [quickError, setQuickError] = useState(false);
  // Les lignes du tableau repartent des séries quand leur nombre ou la charge change.
  const [version, setVersion] = useState(0);
  const [rest, setRest] = useState(
    exercise.restSec !== undefined ? restText(exercise.restSec) : "",
  );
  const [restError, setRestError] = useState(false);
  const max = exercise.exerciseId ? (athlete.maxes[exercise.exerciseId] ?? null) : null;
  const maxKg = max?.kg ?? null;
  const restructure = (next: StrengthExercise) => {
    onChange(next);
    setVersion((value) => value + 1);
  };

  const fill = () => {
    const parsed = parseQuickFill(quick);
    setQuickError(!parsed);
    if (parsed) restructure(quickFill(exercise, parsed));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-[3px]">
        <span className="text-[11.5px] font-semibold tracking-[0.05em] text-faint uppercase">
          Exercice {position} · Réglage des séries
        </span>
        <h2 className="text-[19px] leading-[1.2] font-bold tracking-[-0.015em] text-text">
          {exercise.name}
        </h2>
        <p className="text-[13px] text-muted">
          {meta ? `Bibliothèque · ${meta}` : "Exercice écrit à la main"}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={quickId} className={label}>
          Saisie rapide
        </label>
        <div className="flex gap-2">
          <input
            id={quickId}
            value={quick}
            aria-invalid={quickError}
            placeholder="3 séries de 8 à 10"
            onChange={(event) => setQuick(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                fill();
              }
            }}
            className={`${field} inset-ring-[1.5px] inset-ring-violet`}
          />
          <button
            type="button"
            onClick={fill}
            className="inline-flex h-11 shrink-0 items-center rounded-[11px] bg-cta px-3.5 text-[13.5px] font-semibold text-on-cta transition-[scale] duration-150 active:scale-[0.97]"
          >
            Remplir
          </button>
        </div>
        {quickError ? (
          <p className="text-[12.5px] text-alert">
            Écris par exemple « 3 séries de 8 à 10 » ou « 4 x 6 ».
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <span className={label}>Charge</span>
        <SegmentedControl
          label="Charge de l'exercice"
          value={exercise.loadMode}
          onChange={(mode) => restructure(setLoadMode(exercise, mode, maxKg))}
          options={[
            { value: "kg", label: "kg" },
            { value: "pct", label: "% du max" },
          ]}
        />
        {exercise.loadMode === "pct" ? (
          <p className="text-[12.5px] leading-[1.45] text-muted">
            {max
              ? max.estimated
                ? `Max estimé de ${athlete.firstName} : ${kg(max.kg)}, depuis ${kg(max.fromKg)} × ${max.fromReps} (repère du ${dayMonth.format(new Date(`${max.date}T00:00:00Z`))}). Les kg sont calculés.`
                : `Max de ${athlete.firstName} : ${kg(max.kg)} (repère du ${dayMonth.format(new Date(`${max.date}T00:00:00Z`))}). Les kg sont calculés.`
              : `Pas de max pour ${athlete.firstName} sur cet exercice : les kg ne sont pas calculés. Ajoute un repère relié à l'exercice dans sa fiche.`}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className={`${GRID} px-1 text-[11.5px] font-semibold text-faint`}>
          <span>#</span>
          <span>Type</span>
          <span>Répét.</span>
          <span>{exercise.loadMode === "pct" ? "% max" : "kg"}</span>
          <span>RIR</span>
        </div>
        {exercise.sets.map((set, index) => (
          <SetRow
            key={`${version}-${index}`}
            set={set}
            index={index}
            mode={exercise.loadMode}
            maxKg={maxKg}
            onChange={(next) =>
              onChange({
                ...exercise,
                sets: exercise.sets.map((current, i) => (i === index ? next : current)),
              })
            }
          />
        ))}
        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={exercise.sets.length >= 20}
            onClick={() => restructure(addSet(exercise))}
            className="flex min-h-9 items-center gap-[7px] px-1 text-[13px] font-medium text-violet-text disabled:text-faint"
          >
            <Plus aria-hidden size={14} strokeWidth={2} />
            Ajouter une série
          </button>
          {exercise.sets.length > 1 ? (
            <button
              type="button"
              onClick={() => restructure(removeLastSet(exercise))}
              className="flex min-h-9 items-center gap-[7px] px-1 text-[13px] font-medium text-muted hover:text-text"
            >
              <Minus aria-hidden size={14} strokeWidth={2} />
              Retirer la dernière
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {inGroup ? null : (
          <label className="flex min-w-0 flex-col gap-1.5">
            <span className={label}>Repos</span>
            <input
              value={rest}
              placeholder="90 s"
              aria-invalid={restError}
              onChange={(event) => {
                setRest(event.target.value);
                if (!event.target.value.trim()) {
                  setRestError(false);
                  return onChange({ ...exercise, restSec: undefined });
                }
                const seconds = parseRest(event.target.value);
                setRestError(seconds === null);
                if (seconds !== null) onChange({ ...exercise, restSec: seconds });
              }}
              className={field}
            />
          </label>
        )}
        <label className={`flex min-w-0 flex-col gap-1.5 ${inGroup ? "col-span-2" : ""}`}>
          <span className={label}>Tempo</span>
          <input
            defaultValue={exercise.tempo ?? ""}
            maxLength={20}
            placeholder="3-1-1-0"
            onChange={(event) =>
              onChange({ ...exercise, tempo: event.target.value.trim() || undefined })
            }
            className={field}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={label}>Consigne</span>
        <textarea
          defaultValue={exercise.cue ?? ""}
          maxLength={200}
          rows={2}
          placeholder="Genou avant au-dessus de la cheville, buste droit."
          onChange={(event) =>
            onChange({ ...exercise, cue: event.target.value.trim() || undefined })
          }
          className={`${field} h-auto min-h-11 resize-none py-2.5 leading-[1.45] font-normal text-text-2 lg:text-[15px]`}
        />
      </label>

      <PanelFooter primary="Valider l'exercice" onDone={onDone} onDelete={onDelete} />
    </div>
  );
}

function PanelFooter({
  primary,
  onDone,
  onDelete,
}: {
  primary: string;
  onDone: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-2 pt-1">
      <button
        type="button"
        onClick={onDone}
        className="inline-flex h-[46px] flex-1 items-center justify-center rounded-[12px] bg-cta px-4 text-[14.5px] font-semibold text-on-cta transition-[scale,background-color] duration-150 hover:bg-cta-hover active:scale-[0.98]"
      >
        {primary}
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="inline-flex h-[46px] items-center rounded-[12px] px-4 text-[14px] font-semibold text-alert inset-ring inset-ring-field-ring transition-[scale,background-color] duration-150 hover:bg-surface-2 active:scale-[0.98]"
      >
        Supprimer
      </button>
    </div>
  );
}

// Panneau d'un superset ou d'un EMOM (écran d'appoint, composants de l'app) : tours et repos, ou
// minutes et temps de travail.
export function StrengthGroupPanel({
  group,
  onChange,
  onDone,
  onDelete,
}: {
  group: StrengthGroup;
  onChange: (group: StrengthGroup) => void;
  onDone: () => void;
  onDelete: () => void;
}) {
  const superset = group.kind === "superset";
  const [first, setFirst] = useState(String(superset ? group.rounds : group.minutes));
  const [second, setSecond] = useState(
    superset
      ? group.restSec !== undefined
        ? restText(group.restSec)
        : ""
      : group.workSec !== undefined
        ? String(group.workSec)
        : "",
  );
  const [bad, setBad] = useState<{ first?: boolean; second?: boolean }>({});
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-[3px]">
        <span className="text-[11.5px] font-semibold tracking-[0.05em] text-faint uppercase">
          {superset ? "Exercices reliés" : "Toutes les minutes"}
        </span>
        <h2 className="text-[19px] leading-[1.2] font-bold tracking-[-0.015em] text-text">
          {superset ? "Superset" : "EMOM"}
        </h2>
        <p className="text-[13px] text-muted">
          {superset
            ? "Les exercices s'enchaînent sans pause ; le repos vient en fin de tour."
            : "Chaque minute : le travail, puis le repos jusqu'à la minute suivante."}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className={label}>{superset ? "Tours" : "Minutes"}</span>
          <input
            inputMode="numeric"
            value={first}
            aria-invalid={bad.first ?? false}
            onChange={(event) => {
              setFirst(event.target.value);
              const value = Number(event.target.value);
              const ok = Number.isInteger(value) && value >= 1 && value <= (superset ? 20 : 60);
              setBad((current) => ({ ...current, first: !ok }));
              if (ok)
                onChange(superset ? { ...group, rounds: value } : { ...group, minutes: value });
            }}
            className={field}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className={label}>{superset ? "Repos en fin de tour" : "Travail (s)"}</span>
          <input
            inputMode="numeric"
            value={second}
            placeholder={superset ? "90 s" : "20"}
            aria-invalid={bad.second ?? false}
            onChange={(event) => {
              const text = event.target.value;
              setSecond(text);
              if (!text.trim()) {
                setBad((current) => ({ ...current, second: false }));
                return onChange(
                  superset ? { ...group, restSec: undefined } : { ...group, workSec: undefined },
                );
              }
              if (superset) {
                const seconds = parseRest(text);
                setBad((current) => ({ ...current, second: seconds === null }));
                if (seconds !== null) onChange({ ...group, restSec: seconds });
              } else {
                const value = Number(text.replace(/\s*s$/, ""));
                const ok = Number.isInteger(value) && value >= 5 && value <= 60;
                setBad((current) => ({ ...current, second: !ok }));
                if (ok) onChange({ ...group, workSec: value });
              }
            }}
            className={field}
          />
        </label>
      </div>
      <PanelFooter primary="Valider" onDone={onDone} onDelete={onDelete} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Choisir un exercice dans la Bibliothèque (écran d'appoint) : un seul (ajouter, relier) ou
// plusieurs (créer un superset). Un nom absent de la Bibliothèque s'ajoute tel quel.
// ---------------------------------------------------------------------------
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export function ExercisePickerSheet({
  open,
  onClose,
  title,
  library,
  multiple,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  library: LibraryChoice[];
  multiple: boolean;
  onPick: (picked: { exerciseId?: string; name: string }[]) => void;
}) {
  const searchId = useId();
  const search = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  // Ordinateur : on tape tout de suite ; téléphone : pas de clavier par-dessus la liste à l'ouverture.
  useEffect(() => {
    if (!open || !window.matchMedia("(min-width: 1024px)").matches) return;
    const timer = window.setTimeout(() => search.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [open]);
  const [chosen, setChosen] = useState<LibraryChoice[]>([]);
  const [shown, setShown] = useState(open);
  if (open !== shown) {
    setShown(open);
    if (open) {
      setQuery("");
      setChosen([]);
    }
  }
  const needle = normalize(query.trim());
  // Mot par mot, comme la Bibliothèque : « squat goblet » trouve « Goblet squat ».
  const words = needle.split(/\s+/).filter(Boolean);
  const results = (
    words.length
      ? library.filter((item) => words.every((word) => item.search.includes(word)))
      : library
  ).slice(0, 60);
  const free = query.trim();
  const pick = (item: LibraryChoice) => {
    if (!multiple) return onPick([{ exerciseId: item.id, name: item.name }]);
    setChosen((current) =>
      current.some((entry) => entry.id === item.id)
        ? current.filter((entry) => entry.id !== item.id)
        : current.length < 6
          ? [...current, item]
          : current,
    );
  };
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      subtitle={
        multiple ? "Choisis au moins deux exercices, dans l'ordre où ils s'enchaînent." : undefined
      }
      tall
      footer={
        multiple ? (
          <DialogFooter
            onCancel={onClose}
            primary={
              <button
                type="button"
                disabled={chosen.length < 2}
                onClick={() =>
                  onPick(chosen.map((item) => ({ exerciseId: item.id, name: item.name })))
                }
                className={dlgPrimaryButtonClass}
              >
                {chosen.length >= 2 ? `Créer le superset (${chosen.length})` : "Créer le superset"}
              </button>
            }
          />
        ) : undefined
      }
    >
      <label htmlFor={searchId} className="relative flex items-center">
        <span className="sr-only">Rechercher un exercice</span>
        <Search
          aria-hidden
          size={16}
          strokeWidth={2}
          className="pointer-events-none absolute left-3.5 text-muted"
        />
        <input
          id={searchId}
          ref={search}
          type="search"
          value={query}
          placeholder="Rechercher un exercice"
          onChange={(event) => setQuery(event.target.value)}
          className={`${field} pl-10`}
        />
      </label>
      <ul className="m-0 flex list-none flex-col overflow-hidden rounded-[13px] p-0 inset-ring inset-ring-field-ring">
        {results.map((item) => {
          const selected = chosen.some((entry) => entry.id === item.id);
          return (
            <li key={item.id} className="border-b border-dlg-divider last:border-b-0">
              {multiple ? (
                <div className="px-3.5 py-1.5">
                  <Checkbox
                    checked={selected}
                    onChange={() => pick(item)}
                    label={
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-[14.5px] font-semibold text-text">
                          {item.name}
                        </span>
                        <span className="truncate text-[12.5px] text-muted">{item.meta}</span>
                      </span>
                    }
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => pick(item)}
                  className="flex min-h-[54px] w-full flex-col justify-center px-3.5 py-2 text-left transition-colors duration-150 hover:bg-surface-2"
                >
                  <span className="truncate text-[14.5px] font-semibold text-text">
                    {item.name}
                  </span>
                  <span className="truncate text-[12.5px] text-muted">{item.meta}</span>
                </button>
              )}
            </li>
          );
        })}
        {results.length === 0 ? (
          <li className="px-3.5 py-4 text-[13.5px] text-muted">
            Aucun exercice de la Bibliothèque ne correspond.
          </li>
        ) : null}
      </ul>
      {free && !multiple ? (
        <button
          type="button"
          onClick={() => onPick([{ name: free }])}
          className="flex min-h-11 items-center gap-2 self-start rounded-[11px] px-1 text-[13.5px] font-medium text-violet-text"
        >
          <Plus aria-hidden size={14} strokeWidth={2} />
          Ajouter « {free.slice(0, 80)} » sans fiche
        </button>
      ) : null}
    </Sheet>
  );
}

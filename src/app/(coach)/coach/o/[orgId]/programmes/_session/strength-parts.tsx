"use client";

import { Ellipsis, Minus, Plus, Search, Trash2, Unlink } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { CardMenu, type CardActions } from "@/components/programs/session-cards";
import { useReorder } from "@/components/programs/use-reorder";
import { Checkbox } from "@/components/ui/checkbox";
import { dlgPrimaryButtonClass } from "@/components/ui/dialog-styles";
import { MoreMenu } from "@/components/ui/more-menu";
import { DialogFooter, Sheet } from "@/components/ui/overlay";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { kgFromPercent } from "@/domain/training/aims";
import { sessionCards, type SessionCard, type StepCard } from "@/domain/training/session-cards";
import {
  isTimedExercise,
  type StrengthContent,
  type StrengthExercise,
  type StrengthSet,
} from "@/domain/training/session-v2";
import {
  addSet,
  moveItem,
  parseQuickFill,
  parseReps,
  parseRest,
  parseSeconds,
  quickFill,
  renameExercise,
  quickFillText,
  removeLastSet,
  repsText,
  restText,
  setExerciseMeasure,
  setLoadMode,
  ungroup,
  withComputedKg,
  type StrengthGroup,
} from "@/domain/training/strength-edit";

import { AddInside, EditorCard, EditorGroup, cardsByPath } from "./card-shell";
import { Handle, field, label } from "./running-parts";

// Liste et panneaux de l'éditeur Musculation (05, MUS-01 à 03 ; sources CooryEditeurListe et
// CooryEditeurPanneau). Exercices avec vignette grise et résumé des séries ; superset relié par un
// trait visible ; EMOM en bloc. Charge en kg ou en % du max, au choix pour chaque exercice.

// Un exercice de la Bibliothèque, tel que le choix et le panneau en ont besoin.
// `timed` : l'exercice se mesure en secondes (planche, gainage…, D-166).
export type LibraryChoice = {
  id: string;
  name: string;
  meta: string;
  search: string;
  timed: boolean;
};
// Max du sportif par exercice (repère relié, D-155) avec sa date, pour « Max de Lucas : 20 kg ».
export type AthleteMax = {
  kg: number;
  estimated: boolean;
  fromKg: number;
  fromReps: number;
  date: string;
};
export type StrengthAthlete = { firstName: string; maxes: Record<string, AthleteMax> };

const dayMonth = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const kg = (value: number) => `${String(value).replace(".", ",")} kg`;

// Une carte d'exercice (17/11) : la carte de la séance, avec la poignée, le « ⋯ » et l'appui qui l'ouvre.
function ExerciseRow({
  card,
  selected,
  onSelect,
  handle,
  drop,
  dragging,
  actions,
}: {
  card: StepCard;
  selected: boolean;
  onSelect: () => void;
  handle: ReactNode;
  drop: "before" | "after" | null;
  dragging: boolean;
  actions?: CardActions;
}) {
  return (
    <EditorCard
      card={card}
      discipline="strength"
      selected={selected}
      onSelect={onSelect}
      handle={handle}
      drop={drop}
      dragging={dragging}
      menu={
        <CardMenu
          title={card.title}
          path={card.path}
          {...(card.exerciseId ? { exerciseId: card.exerciseId } : {})}
          {...(actions ? { actions } : {})}
        />
      }
    />
  );
}

// La carte d'un exercice dans le modèle des cartes ; à défaut (jamais en pratique), son seul nom.
function cardAt(byPath: Map<string, SessionCard>, path: string[], title: string): StepCard {
  const found = byPath.get(path.join("/"));
  return found?.kind === "card"
    ? found
    : { kind: "card", role: "work", title, lines: [], sub: [], path };
}

function Group({
  group,
  byPath,
  selectedId,
  readOnly,
  onSelect,
  onChange,
  onAdd,
  onRemove,
  handle,
  drop,
  dragging,
  actions,
}: {
  group: StrengthGroup;
  byPath: Map<string, SessionCard>;
  selectedId: string | null;
  readOnly: boolean;
  onSelect: (id: string) => void;
  onChange: (content: (current: StrengthContent) => StrengthContent) => void;
  onAdd: () => void;
  onRemove: () => void;
  handle: ReactNode;
  drop: "before" | "after" | null;
  dragging: boolean;
  actions?: CardActions;
}) {
  const inner = useReorder((from, to) =>
    onChange((current) => moveItem(current, from, to, group.id)),
  );
  const superset = group.kind === "superset";
  const card = byPath.get(group.id);
  return (
    <EditorGroup
      title={superset ? "Superset" : "EMOM"}
      aside={card?.kind === "group" ? (card.aside ?? null) : null}
      footer={card?.kind === "group" ? (card.footer ?? null) : null}
      selected={selectedId === group.id}
      onSelect={() => onSelect(group.id)}
      handle={handle}
      drop={drop}
      dragging={dragging}
      menu={
        readOnly ? null : (
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
            button={{
              content: <Ellipsis aria-hidden size={18} strokeWidth={2} />,
              className:
                "-my-1.5 -mr-1 grid size-11 shrink-0 place-items-center rounded-[10px] text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-text lg:size-8 lg:rounded-[9px]",
            }}
          />
        )
      }
      add={
        readOnly || group.exercises.length >= 6 ? null : (
          <AddInside
            label={superset ? "Ajouter un exercice au superset" : "Ajouter un exercice"}
            onClick={onAdd}
          />
        )
      }
    >
      <div {...inner.listProps} className="flex flex-col gap-2">
        {group.exercises.map((exercise, index) => (
          <ExerciseRow
            key={exercise.id}
            card={cardAt(byPath, [group.id, exercise.id], exercise.name)}
            selected={selectedId === exercise.id}
            onSelect={() => onSelect(exercise.id)}
            drop={inner.dropMark(index)}
            dragging={inner.drag?.from === index}
            {...(readOnly ? {} : actions ? { actions } : {})}
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
    </EditorGroup>
  );
}

// L'échauffement et le retour au calme (décision d'Antonino du 17/11) : des cartes, la première et la
// dernière, comme dans la séance affichée ; un appui ouvre leur texte dans le panneau.
export const WARMUP = "warmup";
export const COOLDOWN = "cooldown";

function BoundaryCard({
  kind,
  byPath,
  selected,
  readOnly,
  onSelect,
}: {
  kind: typeof WARMUP | typeof COOLDOWN;
  byPath: Map<string, SessionCard>;
  selected: boolean;
  readOnly: boolean;
  onSelect: () => void;
}) {
  const title = kind === WARMUP ? "Échauffement" : "Retour au calme";
  const found = byPath.get(kind);
  const card: StepCard =
    found?.kind === "card"
      ? found
      : { kind: "card", role: kind, title, lines: [], sub: [], path: [kind] };
  if (readOnly && card.lines.length === 0) return null;
  return (
    <EditorCard
      card={card}
      discipline="strength"
      selected={selected}
      {...(readOnly ? {} : { onSelect })}
      empty="Aucun : touche pour en écrire un"
    />
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
  maxes,
  actions,
}: {
  content: StrengthContent;
  selectedId: string | null;
  readOnly: boolean;
  onSelect: (id: string) => void;
  onChange: (change: (current: StrengthContent) => StrengthContent) => void;
  onAddExercise: (groupId?: string) => void;
  onCreateSuperset: () => void;
  onRemoveItem: (id: string) => void;
  // Max du sportif par exercice (kg) : les kilos estimés des cartes (décision du 17/11).
  maxes?: Record<string, number>;
  // « ⋯ » d'une carte : Dupliquer, Supprimer (et « Voir dans la Bibliothèque » partout).
  actions?: CardActions;
}) {
  const outer = useReorder((from, to) => onChange((current) => moveItem(current, from, to)));
  const byPath = cardsByPath(sessionCards(content, maxes ? { maxes } : {}));
  const addButton =
    "inline-flex min-h-[46px] flex-[1_1_140px] items-center justify-center gap-[7px] rounded-[14px] text-[13.5px] font-medium whitespace-nowrap text-text-2 inset-ring-[1.5px] inset-ring-line transition-[scale,background-color] duration-150 hover:bg-surface-2 active:scale-[0.98]";
  return (
    <div className="flex flex-col gap-2">
      <BoundaryCard
        kind={WARMUP}
        byPath={byPath}
        selected={selectedId === WARMUP}
        readOnly={readOnly}
        onSelect={() => onSelect(WARMUP)}
      />
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
                card={cardAt(byPath, [item.id], item.name)}
                selected={selectedId === item.id}
                onSelect={() => onSelect(item.id)}
                handle={handle}
                drop={drop}
                dragging={dragging}
                {...(readOnly ? {} : actions ? { actions } : {})}
              />
            );
          if (item.kind === "superset" || item.kind === "emom")
            return (
              <Group
                key={item.id}
                group={item}
                byPath={byPath}
                selectedId={selectedId}
                readOnly={readOnly}
                onSelect={onSelect}
                onChange={onChange}
                onAdd={() => onAddExercise(item.id)}
                onRemove={() => onRemoveItem(item.id)}
                handle={handle}
                drop={drop}
                dragging={dragging}
                {...(actions ? { actions } : {})}
              />
            );
          // Un bloc de texte (séance reprise d'une ancienne version) : il se lit et se déplace.
          return (
            <EditorCard
              key={item.id}
              card={cardAt(byPath, [item.id], item.title)}
              discipline="strength"
              handle={handle}
              drop={drop}
              dragging={dragging}
            />
          );
        })}
      </div>
      <BoundaryCard
        kind={COOLDOWN}
        byPath={byPath}
        selected={selectedId === COOLDOWN}
        readOnly={readOnly}
        onSelect={() => onSelect(COOLDOWN)}
      />
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
// Plus de colonne RIR (décision d'Antonino du 17/11 : l'app ne l'affiche plus ; les valeurs déjà
// enregistrées restent dans la série, jamais affichées).
const SET_GRID = "grid grid-cols-[24px_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.8fr)] gap-1.5";

function SetRow({
  set,
  index,
  mode,
  timed,
  maxKg,
  onChange,
}: {
  set: StrengthSet;
  index: number;
  mode: StrengthExercise["loadMode"];
  // Exercice tenu (D-166) : la colonne dit le temps, en secondes.
  timed: boolean;
  maxKg: number | null;
  onChange: (set: StrengthSet) => void;
}) {
  // Exercice tenu : « 30–45 » (la colonne « Durée » et la mesure « Secondes » disent l'unité ; la
  // cellule est trop étroite pour « 30–45 s »).
  const [reps, setReps] = useState(timed ? repsText(set).replace(/ s$/, "") : repsText(set));
  const [load, setLoad] = useState(
    mode === "pct"
      ? set.pct !== undefined
        ? `${set.pct} %`
        : ""
      : set.kg !== undefined
        ? String(set.kg).replace(".", ",")
        : "",
  );
  const [bad, setBad] = useState<{ reps?: boolean; load?: boolean }>({});
  const warmup = set.type === "warmup";
  const computed =
    mode === "pct" && set.pct !== undefined && maxKg ? kgFromPercent(maxKg, set.pct) : null;

  const commitReps = (value: string) => {
    if (timed) {
      const seconds = parseSeconds(value);
      setBad((current) => ({ ...current, reps: !seconds }));
      if (!seconds) return;
      const next: StrengthSet = { ...set, seconds: seconds.seconds };
      if (seconds.secondsMax !== undefined) next.secondsMax = seconds.secondsMax;
      else delete next.secondsMax;
      delete next.repsMin;
      delete next.repsMax;
      return onChange(next);
    }
    const parsed = parseReps(value);
    setBad((current) => ({ ...current, reps: !parsed }));
    if (!parsed) return;
    const next: StrengthSet = { ...set, repsMin: parsed.repsMin };
    if (parsed.repsMax !== undefined) next.repsMax = parsed.repsMax;
    else delete next.repsMax;
    delete next.seconds;
    delete next.secondsMax;
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

  return (
    <div className={`${SET_GRID} items-center`}>
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
            ? "bg-[color-mix(in_srgb,var(--strength-fill)_10%,var(--surface))] text-strength-text"
            : "bg-bg text-text"
        }`}
      >
        {warmup ? "Échauff." : "Normale"}
      </button>
      <input
        aria-label={`${timed ? "Secondes" : "Répétitions"} de la série ${index + 1}`}
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
  const nameId = useId();
  const [nameInput, setNameInput] = useState(exercise.name);
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

  const timed = isTimedExercise(exercise);
  const fill = () => {
    const parsed = parseQuickFill(quick, timed);
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

      {/* Nom de l'exercice (D-179, demande d'Antonino) : seul le nom affiché change, l'exercice reste
          relié à la Bibliothèque. Laissé vide, il garde son nom. */}
      <div className="flex flex-col gap-2">
        <label htmlFor={nameId} className={label}>
          Nom de l&apos;exercice
        </label>
        <input
          id={nameId}
          value={nameInput}
          maxLength={80}
          onChange={(event) => {
            setNameInput(event.target.value);
            onChange(renameExercise(exercise, event.target.value));
          }}
          onBlur={() => {
            if (!nameInput.trim()) setNameInput(exercise.name);
          }}
          className={field}
        />
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
            placeholder={timed ? "3 séries de 30 s" : "3 séries de 8 à 10"}
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
            {timed
              ? "Écris par exemple « 3 séries de 30 s » ou « 3 x 45 s »."
              : "Écris par exemple « 3 séries de 8 à 10 », « 4 x 6 » ou « 3 x 30 s »."}
          </p>
        ) : null}
      </div>

      {/* Mesure (D-166) : répétitions, ou secondes pour un exercice tenu (planche, gainage,
          équilibre…). Le catalogue propose les secondes d'office pour ces exercices. */}
      <div className="flex flex-col gap-2">
        <span className={label}>Mesure</span>
        <SegmentedControl
          label="Mesure de l'exercice"
          value={timed ? "time" : "reps"}
          onChange={(value) => {
            const next = setExerciseMeasure(exercise, value === "time");
            setQuick(quickFillText(next));
            setQuickError(false);
            restructure(next);
          }}
          options={[
            { value: "reps", label: "Répétitions" },
            { value: "time", label: "Secondes" },
          ]}
        />
      </div>

      {timed ? null : (
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
      )}

      <div className="flex flex-col gap-1.5">
        <div className={`${SET_GRID} px-1 text-[11.5px] font-semibold text-faint`}>
          <span>#</span>
          <span>Type</span>
          <span>{timed ? "Durée" : "Répét."}</span>
          <span>{exercise.loadMode === "pct" ? "% max" : "kg"}</span>
        </div>
        {exercise.sets.map((set, index) => (
          <SetRow
            key={`${version}-${index}`}
            set={set}
            index={index}
            mode={exercise.loadMode}
            timed={timed}
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

// Panneau de l'échauffement ou du retour au calme (17/11 : ce sont des cartes de la liste) : son texte,
// écrit d'un trait. « Supprimer » le retire de la séance (sa carte redit « Aucun »).
export function BoundaryPanel({
  kind,
  text,
  onChange,
  onDone,
}: {
  kind: typeof WARMUP | typeof COOLDOWN;
  text: string | undefined;
  onChange: (text: string | undefined) => void;
  onDone: () => void;
}) {
  const title = kind === WARMUP ? "Échauffement" : "Retour au calme";
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[19px] leading-[1.2] font-bold tracking-[-0.015em] text-text">{title}</h2>
      <label className="flex flex-col gap-1.5">
        <span className={label}>Ce que fait le sportif</span>
        <textarea
          key={kind}
          defaultValue={text ?? ""}
          maxLength={300}
          rows={4}
          placeholder={
            kind === WARMUP
              ? "Mobilité hanches et épaules, 2 tours de 10 squats à vide"
              : "Étirements fessiers et dos, 5 min"
          }
          onChange={(event) => onChange(event.target.value.trim() || undefined)}
          className={`${field} h-auto resize-none py-2.5`}
        />
      </label>
      <PanelFooter
        primary="OK"
        onDone={onDone}
        onDelete={() => {
          onChange(undefined);
          onDone();
        }}
      />
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
  onPick: (picked: { exerciseId?: string; name: string; timed?: boolean }[]) => void;
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
    if (!multiple) return onPick([{ exerciseId: item.id, name: item.name, timed: item.timed }]);
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
                  onPick(
                    chosen.map((item) => ({
                      exerciseId: item.id,
                      name: item.name,
                      timed: item.timed,
                    })),
                  )
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

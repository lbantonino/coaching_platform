"use client";

import { Copy, Ellipsis, GripVertical, Plus, Sparkles, Trash2 } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

import { CardMenu, type CardActions } from "@/components/programs/session-cards";
import { useReorder } from "@/components/programs/use-reorder";
import { ChipGroup } from "@/components/ui/chip-group";
import { MoreMenu } from "@/components/ui/more-menu";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SelectField } from "@/components/ui/select-field";
import { maskPace } from "@/domain/training/clock-input";
import { hrZoneRange, paceRangeFromVma } from "@/domain/training/aims";
import { formatPace, paceToSpeedKmh, parsePace } from "@/domain/training/pace";
import {
  RUN_ROLE_LABELS,
  distanceField,
  duplicateItem,
  durationField,
  moveItem,
  parseDistance,
  parseDuration,
  removeItem,
  setRepeatTimes,
  renameStep,
  stepTitle,
  type RunItem,
} from "@/domain/training/running-edit";
import { sessionCards, type SessionCard, type StepCard } from "@/domain/training/session-cards";
import { RUN_ROLES, type RunStep, type RunningContent } from "@/domain/training/session-v2";

import { AddInside, EditorCard, EditorGroup, cardsByPath } from "./card-shell";

// Liste et panneau de l'éditeur Running (04, RUN-01 à 03 ; sources CooryEditeurListe et
// CooryEditeurPanneau). Étapes colorées par rôle : effort en couleur Running, récupération en gris,
// facile en gris clair ; bloc « Répéter N fois » en encadré teinté. Aucune barre ni courbe.

export type AthleteAims = { firstName: string; vmaKmh: number | null; hrMax: number | null };

export function Handle({
  label,
  props,
}: {
  label: string;
  props: ReturnType<ReturnType<typeof useReorder>["handleProps"]>;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      {...props}
      className="-my-2 -ml-1 grid h-11 w-6 shrink-0 cursor-grab touch-none place-items-center rounded-[8px] text-dlg-disabled focus-visible:outline-2 focus-visible:outline-violet active:cursor-grabbing"
    >
      <GripVertical aria-hidden size={14} strokeWidth={2.2} />
    </button>
  );
}

export function DropLine({ at }: { at: "before" | "after" | null }) {
  if (!at) return null;
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-x-2 h-0.5 rounded-full bg-violet ${at === "before" ? "-top-[5px]" : "-bottom-[5px]"}`}
    />
  );
}

// Une étape de la liste : poignée, barre de couleur, titre et détail, mesure à droite.
// Une étape (17/11) : la carte de la séance, avec la poignée, le « ⋯ » et l'appui qui l'ouvre.
function StepRow({
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
      discipline="running"
      selected={selected}
      onSelect={onSelect}
      handle={handle}
      drop={drop}
      dragging={dragging}
      menu={actions ? <CardMenu title={card.title} path={card.path} actions={actions} /> : null}
    />
  );
}

function cardAt(byPath: Map<string, SessionCard>, path: string[], title: string): StepCard {
  const found = byPath.get(path.join("/"));
  return found?.kind === "card"
    ? found
    : { kind: "card", role: "work", title, lines: [], sub: [], path };
}

// Nombre de répétitions : − 5 + (30 px, maquette).
function Stepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const button =
    "tap-44 grid h-full w-[30px] place-items-center text-muted transition-colors duration-150 enabled:hover:text-text disabled:text-dlg-disabled";
  return (
    <span className="relative flex h-[30px] items-center rounded-[9px] bg-surface text-[14px] font-semibold text-text inset-ring inset-ring-field-ring after:absolute after:-inset-y-[7px] after:inset-x-0">
      <button
        type="button"
        aria-label="Une répétition de moins"
        disabled={value <= 2}
        onClick={() => onChange(value - 1)}
        className={`${button} relative z-10`}
      >
        −
      </button>
      <span className="min-w-[22px] text-center" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label="Une répétition de plus"
        disabled={value >= 50}
        onClick={() => onChange(value + 1)}
        className={`${button} relative z-10`}
      >
        +
      </button>
    </span>
  );
}

// Bloc « Répéter N fois » : en-tête teinté (icône, stepper, « fois · 20 min », ···), étapes en dessous.
function RepeatGroup({
  item,
  byPath,
  selectedId,
  onSelect,
  onTimes,
  onAddStep,
  onMoveChild,
  onDuplicate,
  onRemove,
  readOnly,
  handle,
  drop,
  dragging,
  actions,
}: {
  item: Extract<RunItem, { kind: "repeat" }>;
  byPath: Map<string, SessionCard>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onTimes: (times: number) => void;
  onAddStep: () => void;
  onMoveChild: (from: number, to: number) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  readOnly: boolean;
  handle: ReactNode;
  drop: "before" | "after" | null;
  dragging: boolean;
  actions?: CardActions;
}) {
  const inner = useReorder(onMoveChild);
  const card = byPath.get(item.id);
  return (
    <EditorGroup
      title="Répéter"
      // Le nombre de fois se change ici (− 5 +), là où la séance l'écrit (« 5 fois »).
      aside={
        readOnly ? (
          `${item.times} fois`
        ) : (
          <span className="flex shrink-0 items-center gap-2 text-[13.5px] font-semibold text-text-2 lg:text-[12.5px]">
            <Stepper value={item.times} onChange={onTimes} />
            fois
          </span>
        )
      }
      footer={card?.kind === "group" ? (card.footer ?? null) : null}
      handle={handle}
      drop={drop}
      dragging={dragging}
      menu={
        readOnly ? null : (
          <MoreMenu
            label="Plus d'actions sur le bloc Répéter"
            title={`Répéter ${item.times} fois`}
            width={220}
            items={[
              { label: "Dupliquer le bloc", icon: Copy, onSelect: onDuplicate },
              { label: "Supprimer le bloc", icon: Trash2, destructive: true, onSelect: onRemove },
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
        readOnly || item.steps.length >= 10 ? null : (
          <AddInside label="Ajouter une étape" onClick={onAddStep} />
        )
      }
    >
      <div {...inner.listProps} className="flex flex-col gap-2">
        {item.steps.map((step, index) => (
          <StepRow
            key={step.id}
            card={cardAt(byPath, [item.id, step.id], stepTitle(step))}
            selected={selectedId === step.id}
            onSelect={() => onSelect(step.id)}
            drop={inner.dropMark(index)}
            dragging={inner.drag?.from === index}
            {...(readOnly ? {} : actions ? { actions } : {})}
            handle={
              readOnly ? null : (
                <Handle
                  label={`Déplacer « ${stepTitle(step)} » (flèches haut et bas)`}
                  props={inner.handleProps(index, item.steps.length)}
                />
              )
            }
          />
        ))}
      </div>
    </EditorGroup>
  );
}

export function RunningList({
  content,
  selectedId,
  readOnly,
  onSelect,
  onChange,
  onAddStep,
  onAddRepeat,
  actions,
}: {
  content: RunningContent;
  selectedId: string | null;
  readOnly: boolean;
  onSelect: (id: string) => void;
  onChange: (content: RunningContent) => void;
  onAddStep: (repeatId?: string) => void;
  onAddRepeat: () => void;
  // « ⋯ » d'une étape : Dupliquer, Supprimer (17/11, comme la page du programme).
  actions?: CardActions;
}) {
  const outer = useReorder((from, to) => onChange(moveItem(content, from, to)));
  const byPath = cardsByPath(sessionCards(content));
  const addButton =
    "inline-flex min-h-[46px] flex-[1_1_140px] items-center justify-center gap-[7px] rounded-[14px] text-[13.5px] font-medium whitespace-nowrap text-text-2 inset-ring-[1.5px] inset-ring-line transition-[scale,background-color] duration-150 hover:bg-surface-2 active:scale-[0.98]";
  return (
    <div className="flex flex-col gap-2">
      <div {...outer.listProps} className="flex flex-col gap-2">
        {content.items.map((item, index) => {
          const handle = readOnly ? null : (
            <Handle
              label={`Déplacer « ${item.kind === "step" ? stepTitle(item) : item.kind === "repeat" ? `Répéter ${item.times} fois` : item.title} » (flèches haut et bas)`}
              props={outer.handleProps(index, content.items.length)}
            />
          );
          const drop = outer.dropMark(index);
          const dragging = outer.drag?.from === index;
          if (item.kind === "step")
            return (
              <StepRow
                key={item.id}
                card={cardAt(byPath, [item.id], stepTitle(item))}
                selected={selectedId === item.id}
                onSelect={() => onSelect(item.id)}
                handle={handle}
                drop={drop}
                dragging={dragging}
                {...(readOnly ? {} : actions ? { actions } : {})}
              />
            );
          if (item.kind === "repeat")
            return (
              <RepeatGroup
                key={item.id}
                item={item}
                byPath={byPath}
                selectedId={selectedId}
                onSelect={onSelect}
                readOnly={readOnly}
                onTimes={(times) => onChange(setRepeatTimes(content, item.id, times))}
                onAddStep={() => onAddStep(item.id)}
                onMoveChild={(from, to) => onChange(moveItem(content, from, to, item.id))}
                onDuplicate={() => onChange(duplicateItem(content, item.id))}
                onRemove={() => onChange(removeItem(content, item.id))}
                handle={handle}
                drop={drop}
                dragging={dragging}
                {...(actions ? { actions } : {})}
              />
            );
          // Bloc texte (séance reprise de la v1) : lu tel quel.
          return (
            <EditorCard
              key={item.id}
              card={cardAt(byPath, [item.id], item.title)}
              discipline="running"
              handle={handle}
              drop={drop}
              dragging={dragging}
            />
          );
        })}
      </div>
      {readOnly ? null : (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onAddStep()} className={addButton}>
            <Plus aria-hidden size={15} strokeWidth={2} />
            Ajouter une étape
          </button>
          <button
            type="button"
            onClick={onAddRepeat}
            disabled={content.items.length >= 40}
            className={addButton}
          >
            <Plus aria-hidden size={15} strokeWidth={2} />
            Ajouter « Répéter »
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panneau « modifier une étape » (desktop à droite, feuille du bas sur téléphone)
// ---------------------------------------------------------------------------
export const label = "text-[12.5px] font-semibold text-text-2";
export const field =
  "h-11 w-full min-w-0 rounded-[11px] bg-surface px-3.5 text-[16px] font-medium text-text inset-ring inset-ring-field-ring outline-none transition-shadow duration-150 placeholder:text-faint focus:inset-ring-[1.5px] focus:inset-ring-violet aria-invalid:inset-ring-alert";

type PaceMode = "minkm" | "vma";

function paceFields(step: RunStep) {
  const pace = step.target?.kind === "pace" ? step.target : null;
  return {
    from: pace ? formatPace(pace.fromSecPerKm) : "",
    to: pace ? formatPace(pace.toSecPerKm) : "",
    vmaFrom: pace?.vmaPercent ? String(pace.vmaPercent.to) : "",
    vmaTo: pace?.vmaPercent ? String(pace.vmaPercent.from) : "",
  };
}

export function RunStepPanel({
  step,
  place,
  athlete,
  defaultAim = "pace",
  onChange,
  onDone,
  onDelete,
}: {
  step: RunStep;
  // Dans un bloc : « Bloc Répéter 5 fois · étape 1 » ; sinon « Étape 3 ».
  place: { repeatTimes: number | null; position: number };
  athlete: AthleteAims;
  // Façon de viser par défaut du programme (BR-12), pour une étape encore sans cible.
  defaultAim?: "pace" | "hr";
  onChange: (step: RunStep) => void;
  onDone: () => void;
  onDelete: () => void;
}) {
  // Le panneau existe deux fois (colonne d'ordinateur, feuille du téléphone) : identifiant unique.
  const nameId = useId();
  const [nameInput, setNameInput] = useState(step.label ?? "");
  const time = step.measure.type === "time" ? durationField(step.measure.seconds) : null;
  const distance = step.measure.type === "distance" ? distanceField(step.measure.meters) : null;
  const [measureInput, setMeasureInput] = useState(time?.value ?? distance?.value ?? "");
  const [measureError, setMeasureError] = useState(false);
  const [aim, setAim] = useState<"pace" | "hr">(
    step.target ? (step.target.kind === "hr" ? "hr" : "pace") : defaultAim,
  );
  const [paceMode, setPaceMode] = useState<PaceMode>(
    // Le % de VMA ne se recalcule que si la VMA du sportif est connue ; sinon, l'allure écrite.
    step.target?.kind === "pace" && step.target.vmaPercent && athlete.vmaKmh ? "vma" : "minkm",
  );
  const [pace, setPace] = useState(() => paceFields(step));
  const [paceError, setPaceError] = useState<string | null>(null);
  const [bpm, setBpm] = useState(() =>
    step.target?.kind === "hr" && step.target.bpmFrom !== undefined
      ? { from: String(step.target.bpmFrom), to: String(step.target.bpmTo) }
      : { from: "", to: "" },
  );
  const [bpmError, setBpmError] = useState<string | null>(null);
  const [note, setNote] = useState(step.note ?? "");

  const name = athlete.firstName;
  const zone = step.target?.kind === "hr" ? step.target.zone : null;

  const commitMeasure = (text: string, type = step.measure.type) => {
    if (type === "open") return onChange({ ...step, measure: { type: "open" } });
    const value = type === "time" ? parseDuration(text) : parseDistance(text);
    setMeasureError(value === null);
    if (value === null) return;
    onChange({
      ...step,
      measure:
        type === "time" ? { type: "time", seconds: value } : { type: "distance", meters: value },
    });
  };

  const switchMeasure = (type: RunStep["measure"]["type"]) => {
    if (type === step.measure.type) return;
    const next =
      type === "time"
        ? durationField(step.measure.type === "time" ? step.measure.seconds : 300).value
        : type === "distance"
          ? distanceField(1000).value
          : "";
    setMeasureInput(next);
    setMeasureError(false);
    commitMeasure(next, type);
  };

  // Allure : deux champs vides = sans cible ; en % de VMA, l'allure est calculée depuis la VMA.
  const commitPace = (next: typeof pace, mode: PaceMode = paceMode) => {
    if (mode === "minkm") {
      if (!next.from.trim() && !next.to.trim()) {
        setPaceError(null);
        return onChange({ ...step, target: undefined });
      }
      const from = parsePace(next.from || next.to);
      const to = parsePace(next.to || next.from);
      if (!from.ok || !to.ok) return setPaceError("Écris l'allure en min:s, par exemple 5:00.");
      setPaceError(null);
      return onChange({
        ...step,
        target: {
          kind: "pace",
          fromSecPerKm: Math.min(from.secPerKm, to.secPerKm),
          toSecPerKm: Math.max(from.secPerKm, to.secPerKm),
        },
      });
    }
    if (!next.vmaFrom.trim() && !next.vmaTo.trim()) {
      setPaceError(null);
      return onChange({ ...step, target: undefined });
    }
    const high = Number((next.vmaFrom || next.vmaTo).replace(",", "."));
    const low = Number((next.vmaTo || next.vmaFrom).replace(",", "."));
    if (![high, low].every((value) => Number.isFinite(value) && value >= 40 && value <= 130))
      return setPaceError("Un pourcentage de VMA entre 40 et 130.");
    if (!athlete.vmaKmh) return setPaceError(`Pas de VMA pour ${name} : écris l'allure en min/km.`);
    setPaceError(null);
    const range = paceRangeFromVma(athlete.vmaKmh, high, low);
    onChange({
      ...step,
      target: {
        kind: "pace",
        ...range,
        vmaPercent: { from: Math.min(high, low), to: Math.max(high, low) },
      },
    });
  };

  const commitBpm = (next: typeof bpm, zoneValue = zone) => {
    if (!zoneValue) return;
    if (!next.from.trim() && !next.to.trim()) {
      setBpmError(null);
      return onChange({ ...step, target: { kind: "hr", zone: zoneValue } });
    }
    const from = Number(next.from);
    const to = Number(next.to);
    if (
      ![from, to].every((value) => Number.isInteger(value) && value >= 30 && value <= 240) ||
      from > to
    )
      return setBpmError("Deux valeurs entre 30 et 240 bpm, la plus basse d'abord.");
    setBpmError(null);
    onChange({ ...step, target: { kind: "hr", zone: zoneValue, bpmFrom: from, bpmTo: to } });
  };

  // Sans FC max (TC-10) : pas de calcul ; la plage déjà écrite reste, et elle est enregistrée avec
  // la nouvelle zone (avant, elle restait affichée mais partait sans les bpm).
  const chooseZone = (value: number) => {
    const range = athlete.hrMax ? hrZoneRange(athlete.hrMax, value) : null;
    if (!range) return commitBpm(bpm, value);
    setBpm({ from: String(range.bpmFrom), to: String(range.bpmTo) });
    setBpmError(null);
    onChange({ ...step, target: { kind: "hr", zone: value, ...range } });
  };

  const switchAim = (value: "pace" | "hr") => {
    setAim(value);
    if (value === "pace") commitPace(pace);
    else onChange({ ...step, target: undefined });
  };

  const vmaShare =
    athlete.vmaKmh && step.target?.kind === "pace"
      ? Math.round(
          (paceToSpeedKmh((step.target.fromSecPerKm + step.target.toSecPerKm) / 2) /
            athlete.vmaKmh) *
            100,
        )
      : null;
  const vmaLabel = athlete.vmaKmh ? String(athlete.vmaKmh).replace(".", ",") : "";

  const hint: { text: string; recompute?: () => void } =
    aim === "hr"
      ? athlete.hrMax
        ? {
            text: `${zone ? `Z${zone} · c` : "C"}alculée depuis la FC max de ${name} : ${athlete.hrMax} bpm. Sans repère, écris la plage toi-même.`,
            recompute: zone ? () => chooseZone(zone) : undefined,
          }
        : { text: `Pas de FC max pour ${name} : écris la plage toi-même.` }
      : !athlete.vmaKmh
        ? { text: `Pas de VMA pour ${name} : écris l'allure toi-même.` }
        : step.target?.kind === "pace" && step.target.vmaPercent
          ? {
              text: `Calculée depuis la VMA de ${name} : ${vmaLabel} km/h (≈ ${vmaShare} % VMA). Tu peux la modifier.`,
              recompute: () => {
                const next = paceFields(step);
                setPaceMode("vma");
                setPace(next);
                commitPace(next, "vma");
              },
            }
          : vmaShare
            ? { text: `≈ ${vmaShare} % de la VMA de ${name} (${vmaLabel} km/h).` }
            : {
                text: `VMA de ${name} : ${vmaLabel} km/h. Choisis « % de VMA » pour calculer l'allure.`,
              };

  const unit =
    step.measure.type === "time"
      ? durationField(parseDuration(measureInput) ?? 60).unit
      : step.measure.type === "distance"
        ? (parseDistance(measureInput) ?? 1000) >= 1000
          ? "km"
          : "m"
        : "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-[3px]">
        <span className="text-[11.5px] font-semibold tracking-[0.05em] text-faint uppercase">
          {place.repeatTimes
            ? `Bloc Répéter ${place.repeatTimes} fois · étape ${place.position}`
            : `Étape ${place.position}`}
        </span>
        <h2 className="text-[19px] leading-[1.2] font-bold tracking-[-0.015em] text-text">
          {stepTitle(step)}
        </h2>
        {place.repeatTimes ? (
          <p className="text-[13px] text-muted">
            Le changement s&apos;applique aux {place.repeatTimes} répétitions.
          </p>
        ) : null}
      </div>

      {/* Nom de l'étape (D-179, demande d'Antonino) : vide, l'étape porte le nom de son type. */}
      <div className="flex flex-col gap-2">
        <label htmlFor={nameId} className={label}>
          Nom de l&apos;étape
        </label>
        <input
          id={nameId}
          value={nameInput}
          maxLength={60}
          placeholder={RUN_ROLE_LABELS[step.role]}
          onChange={(event) => {
            setNameInput(event.target.value);
            onChange(renameStep(step, event.target.value));
          }}
          className={field}
        />
      </div>

      <label className="flex flex-col gap-2">
        <span className={label}>Type d&apos;étape</span>
        <SelectField
          value={step.role}
          onChange={(event) => {
            const role = event.target.value as RunStep["role"];
            // Le nom suit le type tant que le coach n'en a pas écrit un autre.
            const custom =
              step.label && step.label !== RUN_ROLE_LABELS[step.role] ? step.label : undefined;
            onChange({ ...step, role, label: custom });
          }}
        >
          {RUN_ROLES.map((role) => (
            <option key={role} value={role}>
              {RUN_ROLE_LABELS[role]}
            </option>
          ))}
        </SelectField>
      </label>

      <div className="flex flex-col gap-2">
        <span className={label}>Mesure</span>
        <SegmentedControl
          label="Mesure de l'étape"
          value={step.measure.type}
          onChange={switchMeasure}
          options={[
            { value: "time", label: "Durée" },
            { value: "distance", label: "Distance" },
            { value: "open", label: "Libre" },
          ]}
        />
        {step.measure.type === "open" ? (
          <p className="text-[12.5px] leading-[1.45] text-muted">
            Sans durée ni distance : {name} s&apos;arrête quand l&apos;étape est faite.
          </p>
        ) : (
          <div className="flex h-[54px] items-center gap-2 rounded-[12px] bg-surface px-4 inset-ring-[1.5px] inset-ring-violet has-[[aria-invalid=true]]:inset-ring-alert">
            <input
              aria-label={step.measure.type === "time" ? "Durée de l'étape" : "Distance de l'étape"}
              value={measureInput}
              // Pavé décimal : sa virgule sert de « : » (« 2,30 »), un nombre seul = des minutes.
              inputMode="decimal"
              aria-invalid={measureError}
              onChange={(event) => {
                setMeasureInput(event.target.value);
                commitMeasure(event.target.value);
              }}
              className="min-w-0 flex-1 bg-transparent text-[22px] font-semibold tracking-[-0.01em] text-text outline-none"
            />
            <span className="text-[14px] font-medium text-muted">{unit}</span>
          </div>
        )}
        {measureError ? (
          <p className="text-[12.5px] text-alert">
            {step.measure.type === "time"
              ? "Écris la durée en min:s (2:00) ou en minutes (45)."
              : "Écris la distance en mètres (800) ou en km (1,5)."}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <span className={label}>Cible</span>
        <SegmentedControl
          label="Cible de l'étape"
          value={aim}
          onChange={switchAim}
          options={[
            { value: "pace", label: "Allure" },
            { value: "hr", label: "Zone de FC" },
          ]}
        />
        {aim === "pace" ? (
          <>
            <SelectField
              size="lg"
              aria-label="Façon d'écrire l'allure"
              value={paceMode}
              onChange={(event) => {
                const mode = event.target.value as PaceMode;
                setPaceMode(mode);
                setPaceError(null);
                if (mode === "minkm") {
                  // On garde l'allure calculée, sans le % (elle devient une allure écrite).
                  const next = paceFields(step);
                  setPace(next);
                  if (step.target?.kind === "pace")
                    onChange({ ...step, target: { ...step.target, vmaPercent: undefined } });
                } else commitPace(pace, "vma");
              }}
            >
              <option value="minkm">Allure en min/km</option>
              <option value="vma">% de VMA</option>
            </SelectField>
            <div className="flex items-center gap-2">
              <input
                aria-label={
                  paceMode === "minkm" ? "Allure la plus rapide" : "% de VMA le plus haut"
                }
                inputMode={paceMode === "minkm" ? "numeric" : "decimal"}
                placeholder={paceMode === "minkm" ? "5:00" : "95"}
                value={paceMode === "minkm" ? pace.from : pace.vmaFrom}
                aria-invalid={paceError !== null}
                onChange={(event) => {
                  // Le « : » d'une allure se pose tout seul (pavé numérique sans « : » sur iPhone).
                  const next = {
                    ...pace,
                    [paceMode === "minkm" ? "from" : "vmaFrom"]:
                      paceMode === "minkm" ? maskPace(event.target.value) : event.target.value,
                  };
                  setPace(next);
                  commitPace(next);
                }}
                className={field}
              />
              <span aria-hidden className="text-faint">
                –
              </span>
              <input
                aria-label={paceMode === "minkm" ? "Allure la plus lente" : "% de VMA le plus bas"}
                inputMode={paceMode === "minkm" ? "numeric" : "decimal"}
                placeholder={paceMode === "minkm" ? "5:10" : "90"}
                value={paceMode === "minkm" ? pace.to : pace.vmaTo}
                aria-invalid={paceError !== null}
                onChange={(event) => {
                  const next = {
                    ...pace,
                    [paceMode === "minkm" ? "to" : "vmaTo"]:
                      paceMode === "minkm" ? maskPace(event.target.value) : event.target.value,
                  };
                  setPace(next);
                  commitPace(next);
                }}
                className={field}
              />
              <span className="text-[13px] font-medium whitespace-nowrap text-muted">
                {paceMode === "minkm" ? "min/km" : "% VMA"}
              </span>
            </div>
            {paceError ? (
              <p className="text-[12.5px] text-alert">{paceError}</p>
            ) : paceMode === "vma" && step.target?.kind === "pace" ? (
              // En % de VMA : l'allure qui en sort, en min/km.
              <p className="text-[12.5px] text-muted">
                Soit {formatPace(step.target.fromSecPerKm)}–{formatPace(step.target.toSecPerKm)}{" "}
                min/km.
              </p>
            ) : null}
          </>
        ) : (
          <>
            <ChipGroup
              label="Zone de fréquence cardiaque"
              size="zone"
              value={zone ? String(zone) : ""}
              onChange={(value) => chooseZone(Number(value))}
              options={[1, 2, 3, 4, 5].map((value) => ({
                value: String(value),
                label: `Z${value}`,
              }))}
            />
            <div className="flex items-center gap-2">
              <input
                aria-label="FC la plus basse"
                inputMode="numeric"
                placeholder="161"
                disabled={!zone}
                value={bpm.from}
                aria-invalid={bpmError !== null}
                onChange={(event) => {
                  const next = { ...bpm, from: event.target.value };
                  setBpm(next);
                  commitBpm(next);
                }}
                className={`${field} disabled:bg-surface-2`}
              />
              <span aria-hidden className="text-faint">
                –
              </span>
              <input
                aria-label="FC la plus haute"
                inputMode="numeric"
                placeholder="175"
                disabled={!zone}
                value={bpm.to}
                aria-invalid={bpmError !== null}
                onChange={(event) => {
                  const next = { ...bpm, to: event.target.value };
                  setBpm(next);
                  commitBpm(next);
                }}
                className={`${field} disabled:bg-surface-2`}
              />
              <span className="text-[13px] font-medium text-muted">bpm</span>
            </div>
            {bpmError ? <p className="text-[12.5px] text-alert">{bpmError}</p> : null}
          </>
        )}
        <div className="flex items-center gap-2.5 rounded-[12px] bg-lib-lavender px-3 py-2.5">
          <Sparkles aria-hidden size={15} strokeWidth={0} className="shrink-0 fill-violet" />
          <span className="flex-1 text-[12.5px] leading-[1.45] text-text-2">{hint.text}</span>
          {hint.recompute ? (
            <button
              type="button"
              onClick={hint.recompute}
              className="tap-44 text-[12.5px] font-semibold whitespace-nowrap text-violet-text hover:underline"
            >
              Recalculer
            </button>
          ) : null}
        </div>
      </div>

      <label className="flex flex-col gap-2">
        <span className={label}>Note</span>
        <input
          value={note}
          maxLength={200}
          placeholder="Relâché, foulée rapide"
          onChange={(event) => {
            setNote(event.target.value);
            onChange({ ...step, note: event.target.value.trim() || undefined });
          }}
          className={`${field} font-normal text-text-2`}
        />
      </label>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onDone}
          className="inline-flex h-[46px] flex-1 items-center justify-center rounded-[12px] bg-cta px-4 text-[14.5px] font-semibold text-on-cta transition-[scale,background-color] duration-150 hover:bg-cta-hover active:scale-[0.98]"
        >
          Valider l&apos;étape
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex h-[46px] items-center rounded-[12px] px-4 text-[14px] font-semibold text-alert inset-ring inset-ring-field-ring transition-[scale,background-color] duration-150 hover:bg-surface-2 active:scale-[0.98]"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}

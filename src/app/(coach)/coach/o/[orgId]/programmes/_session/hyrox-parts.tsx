"use client";

import { Clock, Copy, Plus, Repeat2, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";

import { useReorder } from "@/components/programs/use-reorder";
import { MoreMenu } from "@/components/ui/more-menu";
import { DialogBody, Overlay } from "@/components/ui/overlay";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SelectField } from "@/components/ui/select-field";
import {
  HYROX_STATION_RULES,
  hyroxDivisionLabels,
  hyroxStationLabels,
  officialLoadKg,
  type AthleteSex,
} from "@/domain/training/hyrox-official";
import {
  HYROX_FORMAT_LABELS,
  applyLoads,
  blockHasStepper,
  blockIsRun,
  blockLabel,
  blockMeta,
  isErgStation,
  lineDetail,
  lineHasThumb,
  lineRight,
  lineTitle,
  moveItem,
  newLine,
  parseClock,
  setRounds,
} from "@/domain/training/hyrox-edit";
import { formatPace, parsePace } from "@/domain/training/pace";
import type { HyroxDivision } from "@/domain/training/program-plan";
import {
  HYROX_BLOCK_FORMATS,
  HYROX_STATIONS,
  type HyroxBlock,
  type HyroxContent,
  type HyroxLine,
  type HyroxStation,
} from "@/domain/training/session-v2";
import { formatClock } from "@/domain/training/session-view";

import { BASE, DropLine, Handle, SELECTED, field, label } from "./running-parts";

// Liste et panneaux de l'éditeur Hyrox (06, HYR-01 à 03 ; sources CooryEditeurListe et
// CooryEditeurPanneau). Blocs avec un format ; lignes Run (barre Running), Station (vignette),
// Ergomètre en min/500 m, Transition (barre grise). Aucune barre de séance ni courbe.

export type HyroxAthlete = { firstName: string; division: HyroxDivision | null; sex: AthleteSex };

const RUN_TINT = "bg-[color-mix(in_srgb,var(--run-fill)_9%,var(--surface))]";
const HYROX_TINT = "bg-[color-mix(in_srgb,var(--hyrox-fill)_9%,var(--surface))]";
const LINE_KINDS: { value: HyroxLine["kind"]; label: string }[] = [
  { value: "run", label: "Run" },
  { value: "station", label: "Station" },
  { value: "erg", label: "Ergomètre" },
  { value: "transition", label: "Transition" },
  { value: "exercise", label: "Autre mouvement" },
];

function LineRow({
  line,
  selected,
  onSelect,
  handle,
  drop,
  dragging,
}: {
  line: HyroxLine;
  selected: boolean;
  onSelect: () => void;
  handle: ReactNode;
  drop: "before" | "after" | null;
  dragging: boolean;
}) {
  const thumb = lineHasThumb(line);
  const right = lineRight(line);
  return (
    <div
      data-reorder-row=""
      className={`relative flex min-h-[54px] items-center gap-3 rounded-[13px] bg-surface py-2 pr-3 pl-2 transition-[box-shadow,opacity] duration-150 ${
        selected ? SELECTED : BASE
      } ${dragging ? "opacity-60" : ""}`}
    >
      <DropLine at={drop} />
      {handle}
      {thumb ? (
        <span aria-hidden className="size-[38px] shrink-0 rounded-[10px] bg-chip" />
      ) : (
        <span
          aria-hidden
          className={`h-[34px] w-1 shrink-0 rounded-[2px] ${line.kind === "run" ? "bg-run-fill" : "bg-dlg-disabled"}`}
        />
      )}
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="flex min-w-0 flex-1 items-center gap-3 text-left after:absolute after:inset-0 after:rounded-[inherit] focus-visible:outline-none after:focus-visible:outline-2 after:focus-visible:outline-offset-2 after:focus-visible:outline-violet"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-px">
          <span className="truncate text-[14px] font-semibold text-text">{lineTitle(line)}</span>
          <span className="text-[12.5px] leading-[1.4] text-muted">{lineDetail(line)}</span>
        </span>
        {right ? (
          <span className="text-[13.5px] font-semibold whitespace-nowrap text-text">{right}</span>
        ) : null}
      </button>
    </div>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const button =
    "relative z-10 grid h-full w-[30px] place-items-center text-muted transition-colors duration-150 enabled:hover:text-text disabled:text-dlg-disabled";
  return (
    <span className="relative flex h-[30px] items-center rounded-[9px] bg-surface text-[14px] font-semibold text-text inset-ring inset-ring-field-ring after:absolute after:inset-x-0 after:-inset-y-[7px]">
      <button
        type="button"
        aria-label="Un tour de moins"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
        className={button}
      >
        −
      </button>
      <span className="min-w-[22px] text-center" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label="Un tour de plus"
        disabled={value >= 50}
        onClick={() => onChange(value + 1)}
        className={button}
      >
        +
      </button>
    </span>
  );
}

function BlockGroup({
  block,
  selectedId,
  onSelect,
  onChange,
  onAddLine,
  onDuplicate,
  onRemove,
  handle,
  drop,
  dragging,
}: {
  block: HyroxBlock;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChange: (change: (current: HyroxContent) => HyroxContent) => void;
  onAddLine: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  handle: ReactNode;
  drop: "before" | "after" | null;
  dragging: boolean;
}) {
  const inner = useReorder((from, to) =>
    onChange((current) => moveItem(current, from, to, block.id)),
  );
  const run = blockIsRun(block);
  const Icon =
    block.format === "amrap" || block.format === "emom" || block.format === "for_time"
      ? Clock
      : Repeat2;
  const tone = run ? "text-run" : "text-hyrox";
  return (
    <div
      data-reorder-row=""
      className={`relative flex flex-col gap-2 rounded-[17px] p-2.5 transition-[opacity,box-shadow] duration-150 ${run ? RUN_TINT : HYROX_TINT} ${
        selectedId === block.id ? SELECTED : ""
      } ${dragging ? "opacity-60" : ""}`}
    >
      <DropLine at={drop} />
      <div className="flex min-h-8 flex-wrap items-center gap-2.5 pt-0.5 pr-1 pl-1.5">
        {handle}
        <button
          type="button"
          onClick={() => onSelect(block.id)}
          className={`flex items-center gap-[7px] rounded-[8px] text-[14px] font-semibold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-violet ${tone}`}
        >
          <Icon aria-hidden size={15} strokeWidth={2} />
          {blockLabel(block)}
        </button>
        {blockHasStepper(block) ? (
          <Stepper
            value={block.rounds ?? 1}
            onChange={(rounds) => onChange((current) => setRounds(current, block.id, rounds))}
          />
        ) : null}
        <button
          type="button"
          tabIndex={-1}
          onClick={() => onSelect(block.id)}
          className="min-w-0 flex-1 truncate text-left text-[12.5px] text-text-2"
        >
          {blockMeta(block)}
        </button>
        <MoreMenu
          label={`Plus d'actions sur le bloc ${blockLabel(block)}`}
          title={blockLabel(block)}
          width={220}
          items={[
            { label: "Dupliquer le bloc", icon: Copy, onSelect: onDuplicate },
            { label: "Supprimer le bloc", icon: Trash2, destructive: true, onSelect: onRemove },
          ]}
          className="-my-1.5 [&>button]:bg-transparent! [&>button]:text-faint! [&>button]:inset-ring-0! lg:[&>button]:size-8!"
        />
      </div>
      <div {...inner.listProps} className="flex flex-col gap-1.5">
        {block.lines.map((line, index) => (
          <LineRow
            key={line.id}
            line={line}
            selected={selectedId === line.id}
            onSelect={() => onSelect(line.id)}
            drop={inner.dropMark(index)}
            dragging={inner.drag?.from === index}
            handle={
              <Handle
                label={`Déplacer « ${lineTitle(line)} » (flèches haut et bas)`}
                props={inner.handleProps(index, block.lines.length)}
              />
            }
          />
        ))}
      </div>
      {block.lines.length >= 40 ? null : (
        <button
          type="button"
          onClick={onAddLine}
          className={`flex min-h-10 items-center gap-[7px] self-start rounded-[12px] px-3 text-[13px] font-medium transition-colors duration-150 hover:bg-surface/60 ${tone}`}
        >
          <Plus aria-hidden size={14} strokeWidth={2} />
          Ajouter une étape
        </button>
      )}
    </div>
  );
}

export function HyroxList({
  content,
  selectedId,
  onSelect,
  onChange,
  onAddLine,
  onAddBlock,
  onSimulation,
  onDuplicate,
  onRemove,
}: {
  content: HyroxContent;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChange: (change: (current: HyroxContent) => HyroxContent) => void;
  onAddLine: (blockId: string) => void;
  onAddBlock: () => void;
  onSimulation: () => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const outer = useReorder((from, to) => onChange((current) => moveItem(current, from, to)));
  const addButton =
    "inline-flex min-h-[46px] flex-[1_1_140px] items-center justify-center gap-[7px] rounded-[14px] text-[13.5px] font-medium whitespace-nowrap text-text-2 inset-ring-[1.5px] inset-ring-line transition-[scale,background-color] duration-150 hover:bg-surface-2 active:scale-[0.98]";
  return (
    <div className="flex flex-col gap-2">
      <div {...outer.listProps} className="flex flex-col gap-2">
        {content.items.map((item, index) => {
          const handle = (
            <Handle
              label={`Déplacer « ${item.kind === "block" ? blockLabel(item) : item.title} » (flèches haut et bas)`}
              props={outer.handleProps(index, content.items.length)}
            />
          );
          if (item.kind === "block")
            return (
              <BlockGroup
                key={item.id}
                block={item}
                selectedId={selectedId}
                onSelect={onSelect}
                onChange={onChange}
                onAddLine={() => onAddLine(item.id)}
                onDuplicate={() => onDuplicate(item.id)}
                onRemove={() => onRemove(item.id)}
                handle={handle}
                drop={outer.dropMark(index)}
                dragging={outer.drag?.from === index}
              />
            );
          return (
            <div
              key={item.id}
              data-reorder-row=""
              className={`relative flex min-h-[58px] items-center gap-3 rounded-[14px] bg-surface py-2 pr-3 pl-2 ${BASE}`}
            >
              <DropLine at={outer.dropMark(index)} />
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
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onAddBlock}
          disabled={content.items.length >= 20}
          className={addButton}
        >
          <Plus aria-hidden size={15} strokeWidth={2} />
          Ajouter un bloc
        </button>
        <button
          type="button"
          onClick={onSimulation}
          disabled={content.items.length >= 20}
          className={addButton}
        >
          <Plus aria-hidden size={15} strokeWidth={2} />
          Simulation de course
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panneaux
// ---------------------------------------------------------------------------
function Footer({
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

// Un champ texte avec son unité à droite (« 1:00 min »), lu par `parse` ; vide = sans valeur.
function UnitField({
  name,
  unit,
  initial,
  placeholder,
  parse,
  onValue,
  className = "",
}: {
  name: string;
  unit?: string;
  initial: string;
  placeholder?: string;
  parse: (text: string) => number | null;
  onValue: (value: number | undefined) => void;
  className?: string;
}) {
  const [text, setText] = useState(initial);
  const [bad, setBad] = useState(false);
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className={label}>{name}</span>
      <span className="flex h-11 items-center gap-2 rounded-[11px] bg-surface px-3 inset-ring inset-ring-field-ring focus-within:inset-ring-[1.5px] focus-within:inset-ring-violet has-[[aria-invalid=true]]:inset-ring-alert">
        <input
          value={text}
          placeholder={placeholder}
          aria-invalid={bad}
          inputMode="numeric"
          onChange={(event) => {
            setText(event.target.value);
            if (!event.target.value.trim()) {
              setBad(false);
              return onValue(undefined);
            }
            const value = parse(event.target.value);
            setBad(value === null);
            if (value !== null) onValue(value);
          }}
          className="min-w-0 flex-1 bg-transparent text-[16px] font-medium text-text outline-none placeholder:text-faint"
        />
        {unit ? <span className="text-[12.5px] font-medium text-faint">{unit}</span> : null}
      </span>
    </label>
  );
}

const intIn = (min: number, max: number) => (text: string) => {
  const value = Number(text.trim());
  return Number.isInteger(value) && value >= min && value <= max ? value : null;
};
const decimalIn = (min: number, max: number) => (text: string) => {
  const value = Number(text.trim().replace(",", "."));
  return Number.isFinite(value) && value >= min && value <= max ? Math.round(value * 2) / 2 : null;
};
const paceIn = (text: string) => {
  const parsed = parsePace(text);
  return parsed.ok ? parsed.secPerKm : null;
};
// Ergomètres : allure en min/500 m (1:00 à 5:00).
const pace500In = (text: string) => {
  const match = /^(\d):([0-5]\d)$/.exec(text.trim());
  if (!match) return null;
  const value = Number(match[1]) * 60 + Number(match[2]);
  return value >= 60 && value <= 300 ? value : null;
};
const clockOf = (seconds?: number) => (seconds ? formatClock(seconds) : "");

export function HyroxBlockPanel({
  block,
  position,
  athlete,
  onChange,
  onSimulation,
  onDone,
  onDelete,
}: {
  block: HyroxBlock;
  position: number;
  athlete: HyroxAthlete;
  onChange: (block: HyroxBlock) => void;
  onSimulation: () => void;
  onDone: () => void;
  onDelete: () => void;
}) {
  const amrap = block.format === "amrap";
  const sub = block.lines
    .map((line) =>
      line.kind === "run"
        ? `Run ${lineDetail(line).split(" · ")[0]}`
        : line.kind === "transition"
          ? "transition"
          : `${lineTitle(line).toLowerCase()}${line.kind === "station" && line.meters ? ` ${lineDetail(line).split(" · ")[0]}` : ""}`,
    )
    .join(" + ");
  const division = athlete.division ? hyroxDivisionLabels[athlete.division] : null;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-[3px]">
        <span className="text-[11.5px] font-semibold tracking-[0.05em] text-faint uppercase">
          Bloc {position}
        </span>
        <h2 className="text-[19px] leading-[1.2] font-bold tracking-[-0.015em] text-text">
          {blockLabel(block)}
          {block.format === "circuit" && block.rounds && block.rounds > 1
            ? ` · ${block.rounds} tours`
            : ""}
        </h2>
        <p className="line-clamp-2 text-[13px] text-muted">{sub}</p>
      </div>

      <label className="flex flex-col gap-2">
        <span className={label}>Format du bloc</span>
        <SelectField
          value={block.format}
          onChange={(event) =>
            onChange({ ...block, format: event.target.value as HyroxBlock["format"] })
          }
        >
          {HYROX_BLOCK_FORMATS.map((format) => (
            <option key={format} value={format}>
              {HYROX_FORMAT_LABELS[format]}
            </option>
          ))}
        </SelectField>
      </label>

      {block.format === "simple" ? (
        <label className="flex flex-col gap-1.5">
          <span className={label}>Nom du bloc</span>
          <input
            defaultValue={block.title ?? ""}
            maxLength={60}
            placeholder="Échauffement"
            onChange={(event) =>
              onChange({ ...block, title: event.target.value.trim() || undefined })
            }
            className={field}
          />
        </label>
      ) : null}

      {block.lines.some((line) => line.kind === "station") ? (
        <div className="flex flex-col gap-2">
          <span className={label}>Charges des stations</span>
          <SegmentedControl
            label="Charges des stations"
            value={block.loads}
            onChange={(loads) => onChange(applyLoads(block, loads, athlete.division, athlete.sex))}
            options={[
              { value: "coach", label: "Du coach" },
              { value: "official", label: "Officielles" },
            ]}
          />
          <p className="text-[12.5px] leading-[1.45] text-muted">
            {division
              ? `Officielles = catégorie de ${athlete.firstName} (${division}).`
              : `Officielles : choisis la catégorie de ${athlete.firstName} dans l'objectif du programme.`}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-x-2.5 gap-y-3">
        {block.format === "simple" || block.format === "simulation" ? null : (
          <UnitField
            name={amrap ? "Tours visés" : "Tours"}
            initial={String((amrap ? block.targetRounds : block.rounds) ?? "")}
            placeholder={amrap ? "4" : "1"}
            parse={intIn(1, amrap ? 100 : 50)}
            onValue={(value) =>
              onChange(amrap ? { ...block, targetRounds: value } : { ...block, rounds: value })
            }
          />
        )}
        {block.format === "circuit" || block.format === "intervals" ? (
          <UnitField
            name="Repos entre tours"
            unit="min"
            initial={clockOf(block.restSec)}
            placeholder="1:00"
            parse={parseClock}
            onValue={(value) => onChange({ ...block, restSec: value })}
          />
        ) : null}
        <UnitField
          name="Temps cible"
          unit="min"
          initial={clockOf(block.targetSec)}
          placeholder="25:00"
          parse={parseClock}
          onValue={(value) => onChange({ ...block, targetSec: value })}
        />
        <UnitField
          name={amrap ? "Durée de l'AMRAP" : "Limite de temps"}
          unit="min"
          initial={clockOf(block.timeCapSec)}
          placeholder="30:00"
          parse={parseClock}
          onValue={(value) => onChange({ ...block, timeCapSec: value })}
        />
      </div>

      <div className="flex items-center gap-2.5 rounded-[12px] bg-surface-2 p-3">
        <span aria-hidden className="size-2 shrink-0 rounded-full bg-hyrox-fill" />
        <span className="flex-1 text-[12.5px] leading-[1.45] text-text-2">
          Modèle prêt : <strong className="font-semibold text-text">Simulation de course</strong>, 8
          runs de 1 km et les 8 stations dans l&apos;ordre officiel.
        </span>
        <button
          type="button"
          onClick={onSimulation}
          className="tap-44 text-[12.5px] font-semibold whitespace-nowrap text-violet-text hover:underline"
        >
          Insérer
        </button>
      </div>

      <Footer primary="Valider le bloc" onDone={onDone} onDelete={onDelete} />
    </div>
  );
}

// Une ligne d'un bloc (écran d'appoint, composants de l'app) : champs selon son type.
export function HyroxLinePanel({
  line,
  block,
  blockPosition,
  linePosition,
  athlete,
  onChange,
  onDone,
  onDelete,
}: {
  line: HyroxLine;
  block: HyroxBlock;
  blockPosition: number;
  linePosition: number;
  athlete: HyroxAthlete;
  onChange: (line: HyroxLine) => void;
  onDone: () => void;
  onDelete: () => void;
}) {
  const official =
    line.kind === "station" && athlete.division
      ? officialLoadKg(line.station, athlete.division, athlete.sex)
      : null;
  const rounds =
    block.format === "circuit" || block.format === "intervals" ? (block.rounds ?? 1) : 1;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-[3px]">
        <span className="text-[11.5px] font-semibold tracking-[0.05em] text-faint uppercase">
          Bloc {blockPosition} · étape {linePosition}
        </span>
        <h2 className="text-[19px] leading-[1.2] font-bold tracking-[-0.015em] text-text">
          {lineTitle(line)}
        </h2>
        {rounds > 1 ? (
          <p className="text-[13px] text-muted">
            Le changement s&apos;applique aux {rounds} tours.
          </p>
        ) : null}
      </div>

      <label className="flex flex-col gap-2">
        <span className={label}>Type d&apos;étape</span>
        <SelectField
          value={line.kind}
          onChange={(event) =>
            onChange(newLine(event.target.value as HyroxLine["kind"], line.id, block.loads))
          }
        >
          {LINE_KINDS.map((kind) => (
            <option key={kind.value} value={kind.value}>
              {kind.label}
            </option>
          ))}
        </SelectField>
      </label>

      {line.kind === "station" ? (
        <label className="flex flex-col gap-2">
          <span className={label}>Station</span>
          <SelectField
            value={line.station}
            onChange={(event) => {
              const station = event.target.value as HyroxStation;
              const rule = HYROX_STATION_RULES[station];
              const load =
                block.loads === "official" && athlete.division
                  ? officialLoadKg(station, athlete.division, athlete.sex)
                  : null;
              onChange({
                id: line.id,
                kind: "station",
                station,
                ...(rule.meters !== undefined ? { meters: rule.meters } : {}),
                ...(rule.reps !== undefined ? { reps: rule.reps } : {}),
                loadSource: block.loads,
                ...(load !== null ? { loadKg: load } : {}),
              });
            }}
          >
            {HYROX_STATIONS.map((station) => (
              <option key={station} value={station}>
                {hyroxStationLabels[station]}
              </option>
            ))}
          </SelectField>
        </label>
      ) : null}
      {line.kind === "erg" ? (
        <label className="flex flex-col gap-2">
          <span className={label}>Machine</span>
          <SelectField
            value={line.machine}
            onChange={(event) =>
              onChange({ ...line, machine: event.target.value as typeof line.machine })
            }
          >
            <option value="skierg">SkiErg</option>
            <option value="rowing">Rameur</option>
            <option value="bike">Bike</option>
          </SelectField>
        </label>
      ) : null}
      {line.kind === "exercise" ? (
        <label className="flex flex-col gap-1.5">
          <span className={label}>Mouvement</span>
          <input
            defaultValue={line.name}
            maxLength={80}
            onChange={(event) =>
              event.target.value.trim() && onChange({ ...line, name: event.target.value.trim() })
            }
            className={field}
          />
        </label>
      ) : null}

      <div
        key={`${line.kind}-${line.kind === "station" ? line.station : ""}`}
        className="grid grid-cols-2 gap-x-2.5 gap-y-3"
      >
        {line.kind === "run" ? (
          <>
            <UnitField
              name="Distance"
              unit="m"
              initial={String(line.meters)}
              parse={intIn(10, 42_195)}
              onValue={(value) => value && onChange({ ...line, meters: value })}
            />
            <UnitField
              name="Allure"
              unit="min/km"
              initial={line.paceSecPerKm ? formatPace(line.paceSecPerKm) : ""}
              placeholder="5:45"
              parse={paceIn}
              onValue={(value) => onChange({ ...line, paceSecPerKm: value })}
            />
          </>
        ) : null}
        {line.kind === "station" ? (
          <>
            {line.reps !== undefined || HYROX_STATION_RULES[line.station].reps !== undefined ? (
              <UnitField
                name="Répétitions"
                initial={String(line.reps ?? "")}
                parse={intIn(1, 500)}
                onValue={(value) => onChange({ ...line, reps: value })}
              />
            ) : (
              <UnitField
                name="Distance"
                unit="m"
                initial={String(line.meters ?? "")}
                parse={intIn(1, 5000)}
                onValue={(value) => onChange({ ...line, meters: value })}
              />
            )}
            {isErgStation(line.station) ? (
              <UnitField
                name="Allure"
                unit="/500 m"
                initial={line.pacePer500m ? formatPace(line.pacePer500m) : ""}
                placeholder="2:10"
                parse={pace500In}
                onValue={(value) => onChange({ ...line, pacePer500m: value })}
              />
            ) : HYROX_STATION_RULES[line.station].loadKg ? (
              <UnitField
                name={line.station === "farmers_carry" ? "Charge par main" : "Charge"}
                unit="kg"
                initial={line.loadKg !== undefined ? String(line.loadKg).replace(".", ",") : ""}
                placeholder={official !== null ? String(official) : ""}
                parse={decimalIn(0, 500)}
                onValue={(value) => onChange({ ...line, loadKg: value, loadSource: "coach" })}
              />
            ) : null}
          </>
        ) : null}
        {line.kind === "erg" ? (
          <>
            <UnitField
              name="Distance"
              unit="m"
              initial={String(line.meters ?? "")}
              parse={intIn(1, 42_195)}
              onValue={(value) => onChange({ ...line, meters: value })}
            />
            <UnitField
              name="Allure"
              unit="/500 m"
              initial={line.pacePer500m ? formatPace(line.pacePer500m) : ""}
              placeholder="2:10"
              parse={pace500In}
              onValue={(value) => onChange({ ...line, pacePer500m: value })}
            />
          </>
        ) : null}
        {line.kind === "transition" ? (
          <UnitField
            name="Durée"
            unit="s"
            initial={String(line.seconds)}
            parse={intIn(1, 600)}
            onValue={(value) => value && onChange({ ...line, seconds: value })}
          />
        ) : null}
        {line.kind === "exercise" ? (
          <>
            <UnitField
              name="Répétitions"
              initial={String(line.reps ?? "")}
              parse={intIn(1, 500)}
              onValue={(value) => onChange({ ...line, reps: value })}
            />
            <UnitField
              name="Charge"
              unit="kg"
              initial={line.loadKg !== undefined ? String(line.loadKg) : ""}
              parse={decimalIn(0, 500)}
              onValue={(value) => onChange({ ...line, loadKg: value })}
            />
          </>
        ) : null}
        {line.kind === "run" || line.kind === "station" || line.kind === "erg" ? (
          <UnitField
            name="Temps cible"
            unit="min"
            initial={clockOf(line.targetSec)}
            placeholder="3:30"
            parse={parseClock}
            onValue={(value) => onChange({ ...line, targetSec: value })}
          />
        ) : null}
      </div>
      {line.kind === "station" && line.loadSource === "official" && official !== null ? (
        <p className="-mt-2 text-[12.5px] text-muted">
          Charge officielle de {athlete.firstName} : {official} kg
          {line.station === "farmers_carry" ? " par main" : ""}.
        </p>
      ) : null}

      <Footer primary="Valider l'étape" onDone={onDone} onDelete={onDelete} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feuille « Simulation de course » (6c) : 8 runs + 8 stations, un temps cible par partie.
// ---------------------------------------------------------------------------
export function SimulationSheet({
  open,
  onClose,
  athlete,
  onInsert,
}: {
  open: boolean;
  onClose: () => void;
  athlete: HyroxAthlete;
  onInsert: (loads: HyroxBlock["loads"], targets: (number | undefined)[]) => void;
}) {
  const [loads, setLoads] = useState<HyroxBlock["loads"]>(athlete.division ? "official" : "coach");
  const [times, setTimes] = useState<string[]>(() => Array.from({ length: 16 }, () => ""));
  // Chaque ouverture repart d'un tableau vide (ajusté pendant le rendu, sans effet).
  const [shown, setShown] = useState(open);
  if (open !== shown) {
    setShown(open);
    if (open) setTimes(Array.from({ length: 16 }, () => ""));
  }
  const parsed = times.map((text) => (text.trim() ? parseClock(text) : undefined));
  const total = parsed.reduce<number>((sum, value) => sum + (value ?? 0), 0);
  const division = athlete.division ? hyroxDivisionLabels[athlete.division] : null;
  const rows = HYROX_STATIONS.flatMap((station, index) => {
    const rule = HYROX_STATION_RULES[station];
    const load =
      loads === "official" && athlete.division
        ? officialLoadKg(station, athlete.division, athlete.sex)
        : null;
    const amount =
      rule.reps !== undefined
        ? `${rule.reps} répétitions`
        : `${(rule.meters ?? 0).toLocaleString("fr-BE")} m`;
    const detail = [
      amount,
      load !== null ? (station === "farmers_carry" ? `2 × ${load} kg` : `${load} kg`) : null,
    ]
      .filter(Boolean)
      .join(" · ");
    return [
      {
        key: `run-${index}`,
        label: `Run ${index + 1}`,
        detail: "1 km",
        dot: "bg-run-fill",
        station: false,
      },
      {
        key: station,
        label: hyroxStationLabels[station],
        detail,
        dot: isErgStation(station) ? "bg-faint" : "bg-hyrox-fill",
        station: true,
      },
    ];
  });
  return (
    <Overlay open={open} onClose={onClose} label="Simulation de course" size="form" tall>
      <DialogBody>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-[3px]">
            <span className="text-[11.5px] font-semibold tracking-[0.05em] text-faint uppercase">
              Modèle · Simulation de course
            </span>
            <h2 className="text-[19px] leading-[1.2] font-bold tracking-[-0.015em] text-text">
              Temps cible par partie
            </h2>
            <p className="text-[13px] text-muted">Ordre officiel HYROX. Corrige chaque ligne.</p>
          </div>
          <div className="flex flex-col gap-2">
            <span className={label}>Charges</span>
            <SegmentedControl
              label="Charges de la simulation"
              value={loads}
              onChange={setLoads}
              options={[
                { value: "official", label: "Officielles", disabled: !athlete.division },
                { value: "coach", label: "Mes charges" },
              ]}
            />
            <p className="text-[12.5px] leading-[1.45] text-muted">
              {division
                ? `Officielles = catégorie de ${athlete.firstName} (${division}). Un seul choix remplit toutes les stations ; corrige ensuite chaque ligne si besoin.`
                : `Choisis la catégorie de ${athlete.firstName} dans l'objectif du programme pour avoir les charges officielles.`}
            </p>
          </div>
          <div className="flex flex-col overflow-hidden rounded-[14px] inset-ring inset-ring-line">
            {rows.map((row, index) => (
              <label
                key={row.key}
                className={`flex min-h-10 items-center gap-2.5 border-b border-dlg-divider px-3 ${row.station ? "bg-surface-2" : "bg-surface"}`}
              >
                <span aria-hidden className={`size-[7px] shrink-0 rounded-full ${row.dot}`} />
                <span
                  className={`min-w-0 flex-1 truncate text-[13.5px] text-text ${row.station ? "font-semibold" : "font-medium"}`}
                >
                  {row.label}
                </span>
                <span className="text-[12.5px] whitespace-nowrap text-muted">{row.detail}</span>
                <input
                  aria-label={`Temps cible : ${row.label}`}
                  inputMode="numeric"
                  value={times[index]}
                  placeholder="—"
                  aria-invalid={times[index]?.trim() ? parsed[index] === null : false}
                  onChange={(event) =>
                    setTimes((current) =>
                      current.map((value, i) => (i === index ? event.target.value : value)),
                    )
                  }
                  className="h-[30px] w-[62px] shrink-0 rounded-[8px] bg-surface text-center text-[16px] font-semibold text-text inset-ring inset-ring-field-ring outline-none placeholder:text-faint focus:inset-ring-[1.5px] focus:inset-ring-violet aria-invalid:inset-ring-alert lg:text-[13.5px]"
                />
              </label>
            ))}
            <div className="flex min-h-12 items-center justify-between bg-cta px-3 text-on-cta">
              <span className="text-[14px] font-semibold">Temps cible total</span>
              <span className="text-[17px] font-bold">{total ? formatClock(total) : "—"}</span>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={parsed.some((value) => value === null)}
              onClick={() =>
                onInsert(
                  loads,
                  parsed.map((value) => value ?? undefined),
                )
              }
              className="inline-flex h-[46px] flex-1 items-center justify-center rounded-[12px] bg-cta px-4 text-[14.5px] font-semibold text-on-cta transition-[scale,background-color] duration-150 hover:bg-cta-hover active:scale-[0.98] disabled:opacity-60"
            >
              Insérer la simulation
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-[46px] items-center rounded-[12px] px-4 text-[14px] font-semibold text-text inset-ring inset-ring-field-ring transition-colors duration-150 hover:bg-surface-2"
            >
              Annuler
            </button>
          </div>
        </div>
      </DialogBody>
    </Overlay>
  );
}

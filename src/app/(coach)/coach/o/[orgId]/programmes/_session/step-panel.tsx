"use client";

import { useToast } from "@/components/ui/toast";
import {
  findLine,
  removeItem as removeHyroxItem,
  removeLine,
  replaceBlock,
  replaceLine,
} from "@/domain/training/hyrox-edit";
import { findStep, removeStep, replaceStep } from "@/domain/training/running-edit";
import type { SessionContent } from "@/domain/training/session-v2";
import {
  findExercise,
  removeExercise,
  removeItem as removeStrengthItem,
  replaceExercise,
  replaceGroup,
} from "@/domain/training/strength-edit";

import { HyroxBlockPanel, HyroxLinePanel, type HyroxAthlete } from "./hyrox-parts";
import { RunStepPanel, type AthleteAims } from "./running-parts";
import {
  BoundaryPanel,
  COOLDOWN,
  StrengthExercisePanel,
  StrengthGroupPanel,
  WARMUP,
  type StrengthAthlete,
} from "./strength-parts";

// Le réglage d'UNE étape d'une séance (étape de course, exercice, superset ou EMOM, échauffement, retour
// au calme, bloc ou étape Hyrox) : le panneau de droite de l'éditeur de séance, repris tel quel par la
// « Séance choisie » de l'éditeur de programme (demande d'Antonino du 24/11/2026, option A). Un seul
// endroit décide quel panneau montrer et comment il change la séance.

// Ce que les panneaux savent du sportif : zones et allures, maxima (% du max), catégorie Hyrox, et la
// fiche de Bibliothèque de chaque exercice (« Bibliothèque · Lombaires · Barre »).
export type StepPanelAthletes = {
  athlete: AthleteAims;
  strength: { athlete: StrengthAthlete; libraryMeta: ReadonlyMap<string, string> } | null;
  hyrox: HyroxAthlete | null;
};

export type StepTarget =
  "running" | "exercise" | "boundary" | "group" | "hyrox-line" | "hyrox-block";

// L'élément `selected` a-t-il un panneau dans cette séance, et lequel.
export function stepTarget(content: SessionContent, selected: string | null): StepTarget | null {
  if (!selected) return null;
  switch (content.discipline) {
    case "running":
      return findStep(content, selected) ? "running" : null;
    case "strength":
      if (findExercise(content, selected)) return "exercise";
      if (selected === WARMUP || selected === COOLDOWN) return "boundary";
      return content.items.some(
        (item) => (item.kind === "superset" || item.kind === "emom") && item.id === selected,
      )
        ? "group"
        : null;
    case "hyrox":
      if (findLine(content, selected)) return "hyrox-line";
      return content.items.some((item) => item.kind === "block" && item.id === selected)
        ? "hyrox-block"
        : null;
    default:
      return null;
  }
}

export function StepPanel({
  content,
  selected,
  athletes,
  defaultAim,
  setContent,
  onDone,
  onDeleted,
  onSimulation,
}: {
  content: SessionContent;
  selected: string;
  athletes: StepPanelAthletes;
  defaultAim: "pace" | "hr";
  // Changer la séance à partir de son contenu ACTUEL (la durée estimée suit, côté appelant).
  setContent: (change: (current: SessionContent) => SessionContent) => void;
  // « Valider … » : le panneau se ferme.
  onDone: () => void;
  // L'élément vient d'être supprimé : le panneau se ferme et plus rien n'est choisi.
  onDeleted: () => void;
  // Hyrox : « Simulation » d'un bloc (fenêtre de l'éditeur de séance).
  onSimulation: () => void;
}) {
  const toast = useToast();
  const deleted = (message?: string) => {
    onDeleted();
    if (message) toast(message);
  };

  if (content.discipline === "running") {
    const running = content;
    const step = findStep(running, selected);
    if (!step) return null;
    return (
      <RunStepPanel
        key={step.step.id}
        step={step.step}
        place={{
          repeatTimes: step.repeat ? step.repeat.times : null,
          position: step.repeat
            ? step.index + 1
            : running.items.findIndex((item) => item.id === step.step.id) + 1,
        }}
        athlete={athletes.athlete}
        defaultAim={defaultAim}
        onChange={(next) =>
          setContent((current) =>
            current.discipline === "running" ? replaceStep(current, next) : current,
          )
        }
        onDone={onDone}
        onDelete={() => {
          setContent((current) =>
            current.discipline === "running" ? removeStep(current, step.step.id) : current,
          );
          deleted("Étape supprimée.");
        }}
      />
    );
  }

  if (content.discipline === "strength") {
    const strength = content;
    const exercise = findExercise(strength, selected);
    const setStrength = (change: (current: typeof strength) => typeof strength) =>
      setContent((current) => (current.discipline === "strength" ? change(current) : current));
    if (exercise && athletes.strength) {
      return (
        <StrengthExercisePanel
          key={exercise.exercise.id}
          exercise={exercise.exercise}
          position={exercise.position}
          inGroup={exercise.group !== null}
          meta={
            exercise.exercise.exerciseId
              ? (athletes.strength.libraryMeta.get(exercise.exercise.exerciseId) ?? null)
              : null
          }
          athlete={athletes.strength.athlete}
          onChange={(next) => setStrength((current) => replaceExercise(current, next))}
          onDone={onDone}
          onDelete={() => {
            setStrength((current) => removeExercise(current, exercise.exercise.id));
            deleted("Exercice supprimé.");
          }}
        />
      );
    }
    if (selected === WARMUP || selected === COOLDOWN) {
      const kind = selected;
      return (
        <BoundaryPanel
          key={kind}
          kind={kind}
          text={strength[kind]}
          onChange={(text) => setStrength((current) => ({ ...current, [kind]: text }))}
          onDone={onDone}
          onDelete={() => {
            setStrength((current) => ({ ...current, [kind]: undefined }));
            deleted();
          }}
        />
      );
    }
    const group = strength.items.find(
      (item) => (item.kind === "superset" || item.kind === "emom") && item.id === selected,
    );
    if (group && (group.kind === "superset" || group.kind === "emom")) {
      return (
        <StrengthGroupPanel
          key={group.id}
          group={group}
          onChange={(next) => setStrength((current) => replaceGroup(current, next))}
          onDone={onDone}
          onDelete={() => {
            setStrength((current) => removeStrengthItem(current, group.id));
            deleted(group.kind === "superset" ? "Superset supprimé." : "EMOM supprimé.");
          }}
        />
      );
    }
    return null;
  }

  if (content.discipline === "hyrox" && athletes.hyrox) {
    const hyrox = content;
    const hyroxAthlete = athletes.hyrox;
    const setHyrox = (change: (current: typeof hyrox) => typeof hyrox) =>
      setContent((current) => (current.discipline === "hyrox" ? change(current) : current));
    const line = findLine(hyrox, selected);
    if (line) {
      return (
        <HyroxLinePanel
          key={line.line.id}
          line={line.line}
          block={line.block}
          blockPosition={line.blockIndex + 1}
          linePosition={line.index + 1}
          athlete={hyroxAthlete}
          onChange={(next) => setHyrox((current) => replaceLine(current, next))}
          onDone={onDone}
          onDelete={() => {
            setHyrox((current) => removeLine(current, line.line.id));
            deleted("Étape supprimée.");
          }}
        />
      );
    }
    const block = hyrox.items.find((item) => item.kind === "block" && item.id === selected);
    if (block && block.kind === "block") {
      return (
        <HyroxBlockPanel
          key={block.id}
          block={block}
          position={hyrox.items.findIndex((item) => item.id === block.id) + 1}
          athlete={hyroxAthlete}
          onChange={(next) => setHyrox((current) => replaceBlock(current, next))}
          onSimulation={onSimulation}
          onDone={onDone}
          onDelete={() => {
            setHyrox((current) => removeHyroxItem(current, block.id));
            deleted("Bloc supprimé.");
          }}
        />
      );
    }
  }
  return null;
}

"use client";

import { useId, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { dlgPrimaryButtonClass } from "@/components/ui/dialog-styles";
import { DialogBody, DialogFooter, Overlay, Sheet } from "@/components/ui/overlay";
import { RadioMark } from "@/components/ui/radio-choice";
import { SelectField } from "@/components/ui/select-field";
import { disciplineLabels, disciplineStyles, type Discipline } from "@/domain/training/discipline";
import type { Phase, Week } from "@/domain/training/program-plan";
import type { PublishIssue } from "@/domain/training/program-publication";

// Fenêtres de l'éditeur de programme (D-157), faites avec les composants de l'app (les 5 écrans non
// dessinés, décision d'Antonino du 09/11) : feuille du bas sur téléphone, fenêtre sur ordinateur.

const fieldClass =
  "h-[46px] w-full rounded-[12px] bg-surface px-3.5 text-[16px] font-medium text-text inset-ring inset-ring-field-ring outline-none focus:inset-ring-[1.5px] focus:inset-ring-violet lg:text-[15px]";

// Un nom à écrire : Renommer (programme, phase), Enregistrer comme modèle.
export function TextSheet({
  open,
  onClose,
  title,
  label,
  initial,
  confirmLabel,
  onConfirm,
  pending = false,
  hint,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  label: string;
  initial: string;
  confirmLabel: string;
  onConfirm: (value: string) => void;
  pending?: boolean;
  hint?: string;
}) {
  const id = useId();
  const [value, setValue] = useState(initial);
  // À chaque ouverture, le champ repart de la valeur actuelle (ajusté pendant le rendu, sans effet).
  const [shown, setShown] = useState(open);
  if (open !== shown) {
    setShown(open);
    if (open) setValue(initial);
  }
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <DialogFooter
          onCancel={onClose}
          primary={
            <button
              type="submit"
              form={id}
              disabled={!value.trim() || pending}
              className={dlgPrimaryButtonClass}
            >
              {confirmLabel}
            </button>
          }
        />
      }
    >
      <form
        id={id}
        onSubmit={(event) => {
          event.preventDefault();
          if (value.trim()) onConfirm(value.trim());
        }}
        className="flex flex-col gap-2"
      >
        <label htmlFor={`${id}-field`} className="text-[13.5px] font-semibold text-text">
          {label}
        </label>
        <input
          id={`${id}-field`}
          value={value}
          maxLength={120}
          onChange={(event) => setValue(event.target.value)}
          className={fieldClass}
        />
        {hint ? <p className="text-[12.5px] leading-[1.45] text-muted">{hint}</p> : null}
      </form>
    </Sheet>
  );
}

// « Modifier les semaines » d'une phase (TC-05 : « S5 à S9 ») : la première et la dernière semaine,
// dans les bornes que laissent les phases voisines (qui suivent la limite déplacée).
export function PhaseRangeSheet({
  open,
  onClose,
  phase,
  bounds,
  label,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  phase: Phase | null;
  bounds: { minFrom: number; maxTo: number };
  // « Semaine 5 · 23 – 29 nov. » (programme) ou « Semaine 5 » (modèle).
  label: (index: number) => string;
  onConfirm: (from: number, to: number) => void;
}) {
  const id = useId();
  const [range, setRange] = useState({ from: phase?.weekFrom ?? 1, to: phase?.weekTo ?? 1 });
  const [shown, setShown] = useState(open);
  if (open !== shown) {
    setShown(open);
    if (open && phase) setRange({ from: phase.weekFrom, to: phase.weekTo });
  }
  const weeks = (from: number, to: number) =>
    Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
  return (
    <Sheet
      open={open && phase !== null}
      onClose={onClose}
      title={`Semaines de la phase ${phase?.name ?? ""}`}
      footer={
        <DialogFooter
          onCancel={onClose}
          primary={
            <button type="submit" form={id} className={dlgPrimaryButtonClass}>
              Enregistrer
            </button>
          }
        />
      }
    >
      <form
        id={id}
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm(range.from, range.to);
        }}
        className="flex flex-col gap-4"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-[13.5px] font-semibold text-text">Première semaine</span>
            <SelectField
              value={range.from}
              onChange={(event) => {
                const from = Number(event.target.value);
                setRange((current) => ({ from, to: Math.max(from, current.to) }));
              }}
            >
              {weeks(bounds.minFrom, bounds.maxTo).map((index) => (
                <option key={index} value={index}>
                  {label(index)}
                </option>
              ))}
            </SelectField>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[13.5px] font-semibold text-text">Dernière semaine</span>
            <SelectField
              value={range.to}
              onChange={(event) =>
                setRange((current) => ({ ...current, to: Number(event.target.value) }))
              }
            >
              {weeks(range.from, bounds.maxTo).map((index) => (
                <option key={index} value={index}>
                  {label(index)}
                </option>
              ))}
            </SelectField>
          </label>
        </div>
        <p className="text-[12.5px] leading-[1.45] text-muted">
          Les séances ne bougent pas. Une phase voisine collée suit la limite et garde au moins une
          semaine.
        </p>
      </form>
    </Sheet>
  );
}

// « Dupliquer vers… » : les semaines qui reçoivent les séances de la semaine choisie.
export function DuplicateWeekSheet({
  open,
  onClose,
  source,
  weeks,
  phases,
  locked,
  label,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  source: number;
  weeks: Week[];
  phases: Phase[];
  // Semaines passées : jamais modifiées (BR-07).
  locked: (index: number) => boolean;
  label: (week: Week) => string;
  onConfirm: (targets: number[]) => void;
}) {
  const [targets, setTargets] = useState<number[]>([]);
  const [shown, setShown] = useState(open);
  if (open !== shown) {
    setShown(open);
    if (open) setTargets([]);
  }
  const toggle = (index: number) =>
    setTargets((current) =>
      current.includes(index) ? current.filter((i) => i !== index) : [...current, index],
    );
  const groups = phases.length
    ? [
        ...phases.map((phase) => ({
          name: phase.name,
          weeks: weeks.filter((w) => w.index >= phase.weekFrom && w.index <= phase.weekTo),
        })),
        {
          name: "Sans phase",
          weeks: weeks.filter(
            (w) => !phases.some((p) => w.index >= p.weekFrom && w.index <= p.weekTo),
          ),
        },
      ].filter((group) => group.weeks.length > 0)
    : [{ name: null, weeks }];
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Dupliquer la semaine ${source}`}
      subtitle="Ses séances remplacent celles des semaines choisies."
      footer={
        <DialogFooter
          onCancel={onClose}
          primary={
            <button
              type="button"
              disabled={targets.length === 0}
              onClick={() => onConfirm(targets)}
              className={dlgPrimaryButtonClass}
            >
              {targets.length > 1 ? `Dupliquer vers ${targets.length} semaines` : "Dupliquer"}
            </button>
          }
        />
      }
    >
      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <div key={group.name ?? "toutes"} className="flex flex-col">
            {group.name ? (
              <p className="mb-1 text-[11.5px] font-semibold tracking-[0.06em] text-faint uppercase">
                {group.name}
              </p>
            ) : null}
            {group.weeks.map((week) => {
              const disabled = week.index === source || locked(week.index);
              return (
                <Checkbox
                  key={week.index}
                  label={
                    <span className={disabled ? "text-faint" : ""}>
                      {label(week)}
                      {week.index === source
                        ? " · cette semaine"
                        : locked(week.index)
                          ? " · passée"
                          : ""}
                    </span>
                  }
                  checked={targets.includes(week.index)}
                  disabled={disabled}
                  onChange={() => toggle(week.index)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </Sheet>
  );
}

export type SessionTemplateOption = {
  id: string;
  title: string;
  discipline: Discipline;
  detail: string;
  source: "coory" | "mine";
};

// « Depuis un modèle » : choisir une séance modèle à copier dans la semaine.
export function SessionTemplateSheet({
  open,
  onClose,
  templates,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  templates: SessionTemplateOption[];
  onConfirm: (id: string) => void;
}) {
  const name = useId();
  const [chosen, setChosen] = useState<string | null>(null);
  const [shown, setShown] = useState(open);
  if (open !== shown) {
    setShown(open);
    if (open) setChosen(null);
  }
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Ajouter depuis un modèle"
      subtitle="La séance est copiée : modifier la copie ne change jamais le modèle."
      footer={
        <DialogFooter
          onCancel={onClose}
          primary={
            <button
              type="button"
              disabled={!chosen}
              onClick={() => chosen && onConfirm(chosen)}
              className={dlgPrimaryButtonClass}
            >
              Ajouter la séance
            </button>
          }
        />
      }
    >
      {templates.length === 0 ? (
        <p className="text-[14px] text-muted">Aucun modèle de séance pour l&apos;instant.</p>
      ) : (
        <fieldset className="m-0 flex flex-col overflow-hidden rounded-[13px] border-0 p-0 inset-ring inset-ring-field-ring">
          <legend className="sr-only">Modèle de séance</legend>
          {templates.map((template) => (
            <label
              key={template.id}
              className={`flex min-h-[58px] cursor-pointer items-center gap-3 border-b border-dlg-divider px-3.5 py-2 last:border-b-0 has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-violet ${
                chosen === template.id ? "bg-surface-2" : ""
              }`}
            >
              <input
                type="radio"
                name={name}
                value={template.id}
                checked={chosen === template.id}
                onChange={() => setChosen(template.id)}
                className="sr-only"
              />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[14.5px] font-semibold text-text">
                  {template.title}
                </span>
                <span className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-muted">
                  <span
                    aria-hidden
                    className={`size-1.5 shrink-0 rounded-full ${disciplineStyles[template.discipline].dot}`}
                  />
                  <span className="shrink-0">{disciplineLabels[template.discipline]}</span>
                  <span aria-hidden className="text-faint">
                    ·
                  </span>
                  <span className="truncate">{template.detail}</span>
                </span>
              </span>
              {template.source === "coory" ? (
                <span className="inline-flex h-6 shrink-0 items-center rounded-[12px] bg-violet-soft-2 px-[9px] text-[11.5px] font-semibold text-violet-text">
                  Coory
                </span>
              ) : null}
              <RadioMark checked={chosen === template.id} />
            </label>
          ))}
        </fieldset>
      )}
    </Sheet>
  );
}

// Publier (08, PUB-01 / 02, D-157) : fenêtre de 480 px sur ordinateur, feuille du bas sur téléphone.
// Le résumé de la version (semaines, séances, version créée), puis ce qui bloque et ce qui avertit,
// chacun avec « Voir » (la semaine concernée s'ouvre dans l'éditeur).
const ISSUE_HINTS: Record<PublishIssue["code"], string> = {
  no_session: "Un programme publié a au moins une séance.",
  overlap: "Change la date de début, ou archive l'autre programme.",
  empty_week: "Le sportif verra une semaine sans séance. Normal si c'est du repos.",
  moment_missing: "Indique le moment de chaque séance (matin, midi, après-midi, soir).",
  unavailable_day: "Vérifie ses disponibilités, ou change le jour de la séance.",
  pct_without_max: "Ajoute un repère relié à l'exercice dans sa fiche.",
  official_without_division: "Choisis la catégorie Hyrox dans l'objectif du programme.",
  hr_without_max: "Ajoute sa FC max dans ses repères, ou écris la plage en bpm.",
  coach_session_missing: "Recrée le rendez-vous dans l'Agenda, ou retire « avec le coach ».",
};

// Plusieurs avertissements du même genre : une seule ligne avec leur nombre (maquette 08, recette du
// 11/11 : la liste détaillée débordait de la fenêtre, surtout sur téléphone).
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
};

export function PublishSheet({
  open,
  onClose,
  version,
  weeks,
  sessions,
  firstName,
  issues,
  pending,
  error,
  onConfirm,
  onSee,
}: {
  open: boolean;
  onClose: () => void;
  version: number;
  weeks: number;
  sessions: number;
  firstName: string;
  issues: PublishIssue[];
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
  onSee: (weekIndex: number) => void;
}) {
  const blocking = issues.filter((issue) => issue.level === "blocking");
  const sorted = [...blocking, ...issues.filter((issue) => issue.level === "warning")];
  // Un groupe par genre d'avertissement, dans l'ordre (bloquants d'abord) ; « Voir » mène au premier.
  const groups = [...new Set(sorted.map((issue) => issue.code))].map((code) => {
    const items = sorted.filter((issue) => issue.code === code);
    const first = items[0] as PublishIssue;
    return {
      ...first,
      message: items.length > 1 ? ISSUE_GROUPS[code](items.length) : first.message,
    };
  });
  return (
    <Overlay open={open} onClose={onClose} label="Publier le programme" size="menu">
      <DialogBody>
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-[22px] leading-[1.2] font-bold tracking-[-0.015em] text-text">
              Publier le programme ?
            </h2>
            <p className="text-[14px] leading-[1.45] text-muted">
              {firstName} verra cette version dans son espace, et les PDF seront tirés de cette
              version.
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-2">
            {[
              { label: "Semaines", value: String(weeks) },
              { label: "Séances", value: String(sessions) },
              { label: "Version créée", value: `Version ${version}` },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col gap-0.5 rounded-[12px] bg-surface-2 px-3 py-2.5"
              >
                <dt className="truncate text-[12px] text-muted">{item.label}</dt>
                <dd className="truncate text-[17px] font-bold text-text">{item.value}</dd>
              </div>
            ))}
          </dl>
          {groups.length > 0 ? (
            <ul className="m-0 flex max-h-[232px] list-none flex-col gap-2 overflow-y-auto overscroll-contain p-0">
              {groups.map((issue, i) => (
                <li
                  key={i}
                  className="flex shrink-0 items-start gap-3 rounded-[14px] px-3.5 py-3 inset-ring inset-ring-line"
                >
                  <span
                    aria-hidden
                    className={`mt-px grid size-[22px] shrink-0 place-items-center rounded-full text-[12px] font-bold ${
                      issue.level === "blocking"
                        ? "bg-[color-mix(in_srgb,var(--alert)_14%,var(--surface))] text-alert"
                        : issue.code === "empty_week" || issue.code === "moment_missing"
                          ? "bg-surface-2 text-text"
                          : "bg-[color-mix(in_srgb,var(--warn)_18%,var(--surface))] text-warn"
                    }`}
                  >
                    !
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[14.5px] leading-[1.35] font-semibold text-text">
                      {issue.message}
                    </span>
                    <span className="text-[13px] leading-[1.45] text-muted">
                      {ISSUE_HINTS[issue.code]}
                    </span>
                  </span>
                  {issue.weekIndex ? (
                    <button
                      type="button"
                      onClick={() => issue.weekIndex && onSee(issue.weekIndex)}
                      className="tap-44 shrink-0 text-[13.5px] font-semibold text-violet-text hover:underline"
                    >
                      Voir
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="text-[12.5px] leading-[1.45] text-muted">
            {blocking.length > 0
              ? "À corriger avant de publier : le reste peut attendre."
              : sorted.length > 0
                ? `Rien n'est bloquant : tu peux publier et compléter ensuite (cela créera une version ${version + 1}).`
                : `Tout est prêt. Tu pourras continuer à modifier le brouillon ; publier à nouveau créera une version ${version + 1}.`}
          </p>
          {error ? (
            <p role="alert" className="text-[13.5px] font-medium text-alert">
              {error}
            </p>
          ) : null}
          <div className="flex shrink-0 flex-col-reverse gap-2 lg:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-12 w-full shrink-0 items-center justify-center rounded-[13px] px-4 text-[15px] font-semibold text-text inset-ring inset-ring-field-ring transition-colors duration-150 hover:bg-surface-2 lg:w-auto lg:flex-1"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={blocking.length > 0 || pending}
              onClick={onConfirm}
              className="inline-flex h-12 w-full shrink-0 items-center justify-center rounded-[13px] bg-cta px-4 text-[15px] font-semibold text-on-cta transition-[scale,background-color] duration-150 hover:bg-cta-hover active:scale-[0.98] disabled:opacity-50 lg:w-auto lg:flex-1"
            >
              {pending ? "Publication…" : `Publier la version ${version}`}
            </button>
          </div>
        </div>
      </DialogBody>
    </Overlay>
  );
}

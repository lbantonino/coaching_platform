"use client";

import { useId, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { dlgPrimaryButtonClass } from "@/components/ui/dialog-styles";
import { DialogBody, DialogFooter, Overlay, Sheet } from "@/components/ui/overlay";
import { RadioMark } from "@/components/ui/radio-choice";
import { SelectField } from "@/components/ui/select-field";
import { disciplineLabels, disciplineStyles, type Discipline } from "@/domain/training/discipline";
import { hyroxDivisionLabels } from "@/domain/training/hyrox-official";
import {
  HYROX_DIVISIONS,
  type HyroxDivision,
  type Phase,
  type ProgramGoal,
  type Week,
} from "@/domain/training/program-plan";
import type { PublishIssue } from "@/domain/training/program-publication";
import { periodsOverlap, programEnd } from "@/domain/training/program-status";

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
  overlap: "Change ses dates (menu « ··· », Modifier les dates), ou archive l'autre programme.",
  empty_week: "Une semaine sans séance. Normal si c'est du repos.",
  moment_missing: "Indique le moment de chaque séance (matin, midi, après-midi, soir).",
  unavailable_day: "Vérifie ses disponibilités, ou change le jour de la séance.",
  pct_without_max: "Ajoute un repère relié à l'exercice dans sa fiche.",
  official_without_division:
    "Choisis la catégorie Hyrox avec « Modifier l'objectif » (menu « ··· » du programme).",
  hr_without_max: "Ajoute sa FC max dans ses repères, ou écris la plage en bpm.",
  coach_session_missing:
    "Recrée le rendez-vous dans l'Agenda : sinon la séance s'affiche « Rendez-vous supprimé ».",
  coach_date_mismatch:
    "Les dates du programme ont changé : vérifie le rendez-vous dans l'Agenda, ou les dates.",
  incomplete_session: "Ouvre la séance pour lui donner son titre et son contenu.",
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
  coach_date_mismatch: (n) => `${n} rendez-vous du coach hors de leur semaine.`,
  incomplete_session: (n) => `${n} séances à compléter.`,
};

export function PublishSheet({
  open,
  onClose,
  version,
  weeks,
  sessions,
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
            {/* MVP coach seul (D-167) : pas d'espace sportif, rien n'est « vu » par le sportif. */}
            <p className="text-[14px] leading-[1.45] text-muted">
              Les PDF seront tirés de cette version.
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

const dayMonthYear = new Intl.DateTimeFormat("fr-BE", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const longDay = (iso: string) => dayMonthYear.format(new Date(`${iso}T00:00:00Z`));
const shiftDays = (iso: string, days: number) => {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};
// Les semaines se lisent du lundi au dimanche (C-9) : une date choisie revient au lundi de sa semaine.
const mondayOf = (iso: string) =>
  shiftDays(iso, -((new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7));

// « Modifier les dates » (revue MVP du 13/11, C3) : le programme commence un autre lundi ; ses
// semaines gardent leurs séances. Les dates chevauchant un autre programme publié du sportif sont
// signalées tout de suite (la publication serait refusée).
export function DatesSheet({
  open,
  onClose,
  startDate,
  weeksCount,
  others,
  published,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  startDate: string;
  weeksCount: number;
  // Les autres programmes PUBLIÉS du sportif.
  others: { title: string; startDate: string; weeksCount: number }[];
  // Le programme a déjà une version publiée : la fiche et les PDF changeront à la publication.
  published: boolean;
  onConfirm: (startDate: string) => void;
}) {
  const id = useId();
  const [value, setValue] = useState(startDate);
  const [shown, setShown] = useState(open);
  if (open !== shown) {
    setShown(open);
    if (open) setValue(startDate);
  }
  const snapped = /^\d{4}-\d{2}-\d{2}$/.test(value) ? mondayOf(value) : startDate;
  const end = shiftDays(programEnd(snapped, weeksCount), -1);
  const overlapping = others.filter((other) =>
    periodsOverlap({ startDate: snapped, weeksCount }, other),
  );
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Modifier les dates"
      footer={
        <DialogFooter
          onCancel={onClose}
          primary={
            <button
              type="submit"
              form={id}
              disabled={snapped === startDate}
              className={dlgPrimaryButtonClass}
            >
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
          if (snapped !== startDate) onConfirm(snapped);
        }}
        className="flex flex-col gap-3"
      >
        <label htmlFor={`${id}-start`} className="text-[13.5px] font-semibold text-text">
          Date de début
        </label>
        <input
          id={`${id}-start`}
          type="date"
          value={value}
          onChange={(event) => event.target.value && setValue(event.target.value)}
          className={fieldClass}
        />
        <p className="text-[12.5px] leading-[1.45] text-muted">
          Du {longDay(snapped)} au {longDay(end)} · {weeksCount} semaine{weeksCount > 1 ? "s" : ""}
          {snapped !== value ? " · les semaines commencent le lundi" : ""}. Les séances restent dans
          leurs semaines.
          {published ? " La fiche et les PDF changeront à la prochaine publication." : ""}
        </p>
        {overlapping.length > 0 ? (
          <p
            role="alert"
            className="rounded-[12px] bg-warn-soft px-3 py-2.5 text-[12.5px] leading-[1.45] text-text-2"
          >
            Ces dates chevauchent {overlapping.map((other) => `« ${other.title} »`).join(", ")},
            déjà publié : la publication sera refusée tant que les dates se chevauchent.
          </p>
        ) : null}
      </form>
    </Sheet>
  );
}

// « Modifier l'objectif » (revue MVP du 13/11, C4) : la course visée et, pour l'Hyrox, la catégorie
// qui donne les charges officielles. Avant, elle ne se choisissait qu'à la création.
export function GoalSheet({
  open,
  onClose,
  goal,
  hyrox,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  goal: ProgramGoal | undefined;
  // Le programme a des séances Hyrox (ou c'est sa discipline) : la catégorie compte.
  hyrox: boolean;
  onConfirm: (goal: ProgramGoal | undefined) => void;
}) {
  const id = useId();
  const initial = () => ({
    raceName: goal?.raceName ?? "",
    raceDate: goal?.raceDate ?? "",
    division: goal?.hyroxDivision ?? ("" as HyroxDivision | ""),
    note: goal?.note ?? "",
  });
  const [values, setValues] = useState(initial);
  const [shown, setShown] = useState(open);
  if (open !== shown) {
    setShown(open);
    if (open) setValues(initial());
  }
  const set = (change: Partial<ReturnType<typeof initial>>) =>
    setValues((current) => ({ ...current, ...change }));
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Modifier l'objectif"
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
          const next: ProgramGoal = {
            ...(values.raceName.trim() ? { raceName: values.raceName.trim() } : {}),
            ...(values.raceDate ? { raceDate: values.raceDate } : {}),
            // Sans séance Hyrox, la catégorie n'est pas proposée : celle déjà choisie reste.
            ...(hyrox
              ? values.division
                ? { hyroxDivision: values.division }
                : {}
              : goal?.hyroxDivision
                ? { hyroxDivision: goal.hyroxDivision }
                : {}),
            ...(values.note.trim() ? { note: values.note.trim() } : {}),
          };
          onConfirm(Object.keys(next).length > 0 ? next : undefined);
        }}
        className="flex flex-col gap-4"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-[13.5px] font-semibold text-text">
              Course <span className="font-normal text-faint">(facultatif)</span>
            </span>
            <input
              value={values.raceName}
              maxLength={120}
              placeholder="HYROX Gand"
              onChange={(event) => set({ raceName: event.target.value })}
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[13.5px] font-semibold text-text">Date de la course</span>
            <input
              type="date"
              value={values.raceDate}
              onChange={(event) => set({ raceDate: event.target.value })}
              className={fieldClass}
            />
          </label>
        </div>
        {hyrox ? (
          <label className="flex flex-col gap-2">
            <span className="text-[13.5px] font-semibold text-text">Catégorie Hyrox</span>
            <SelectField
              value={values.division}
              onChange={(event) => set({ division: event.target.value as HyroxDivision | "" })}
            >
              <option value="">Choisir la catégorie</option>
              {HYROX_DIVISIONS.map((division) => (
                <option key={division} value={division}>
                  {hyroxDivisionLabels[division]}
                </option>
              ))}
            </SelectField>
            <span className="text-[12.5px] leading-[1.45] text-muted">
              Elle donne les charges officielles des stations, recalculées à chaque publication.
            </span>
          </label>
        ) : null}
        <label className="flex flex-col gap-2">
          <span className="text-[13.5px] font-semibold text-text">
            Note <span className="font-normal text-faint">(facultatif)</span>
          </span>
          <textarea
            value={values.note}
            maxLength={300}
            rows={3}
            onChange={(event) => set({ note: event.target.value })}
            className={`${fieldClass} h-auto min-h-[84px] resize-y py-3 leading-[1.5] font-normal`}
          />
        </label>
      </form>
    </Sheet>
  );
}

"use client";

import { CircleAlert, TriangleAlert } from "lucide-react";
import { useId, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { dlgPrimaryButtonClass } from "@/components/ui/dialog-styles";
import { DialogFooter, Sheet } from "@/components/ui/overlay";
import { RadioMark } from "@/components/ui/radio-choice";
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

// Publier (08, PUB-01 / 02) : le résumé de la version, ce qui bloque et ce qui avertit.
export function PublishSheet({
  open,
  onClose,
  version,
  summary,
  issues,
  pending,
  error,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  version: number;
  summary: { label: string; value: string }[];
  issues: PublishIssue[];
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
}) {
  const blocking = issues.filter((issue) => issue.level === "blocking");
  const warnings = issues.filter((issue) => issue.level === "warning");
  return (
    <Sheet
      open={open}
      onClose={onClose}
      size="menu"
      title={`Publier la version ${version}`}
      subtitle="Le sportif verra cette version ; tu pourras continuer à modifier le brouillon."
      footer={
        <DialogFooter
          onCancel={onClose}
          primary={
            <button
              type="button"
              disabled={blocking.length > 0 || pending}
              onClick={onConfirm}
              className={dlgPrimaryButtonClass}
            >
              {pending ? "Publication…" : `Publier la version ${version}`}
            </button>
          }
        />
      }
    >
      <div className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-2">
          {summary.map((item) => (
            <div
              key={item.label}
              className="flex flex-col gap-0.5 rounded-[12px] bg-surface-2 px-3.5 py-2.5"
            >
              <dt className="text-[12px] text-muted">{item.label}</dt>
              <dd className="truncate text-[14.5px] font-semibold text-text">{item.value}</dd>
            </div>
          ))}
        </dl>
        {blocking.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {blocking.map((issue, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-[13.5px] leading-[1.45] text-alert"
              >
                <CircleAlert aria-hidden size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                {issue.message}
              </li>
            ))}
          </ul>
        ) : null}
        {warnings.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-semibold text-text">À vérifier (ne bloque pas)</p>
            <ul className="flex max-h-[180px] flex-col gap-2 overflow-y-auto">
              {warnings.map((issue, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-[13px] leading-[1.45] text-text-2"
                >
                  <TriangleAlert
                    aria-hidden
                    size={15}
                    strokeWidth={2}
                    className="mt-0.5 shrink-0 text-warn"
                  />
                  {issue.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="text-[13.5px] font-medium text-alert">
            {error}
          </p>
        ) : null}
      </div>
    </Sheet>
  );
}

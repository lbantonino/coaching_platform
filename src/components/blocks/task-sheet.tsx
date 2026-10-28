"use client";

import { Check, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createContext,
  useActionState,
  useCallback,
  useContext,
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import { buttonClass } from "@/components/ui/button";
import {
  checkboxChipClass,
  errorTextClass,
  inputClass,
  labelClass,
  textareaClass,
} from "@/components/ui/form-styles";
import { ConfirmDialog, Sheet } from "@/components/ui/overlay";
import { segmentedGroupClass, segmentedItemClass } from "@/components/ui/segmented";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  TASK_CATEGORIES,
  TASK_NOTES_MAX,
  TASK_TITLE_MAX,
  taskCategoryLabels,
  type TaskCategory,
  type TaskFormValues,
} from "@/domain/tasks/task-form";
import type { TaskFormState } from "@/features/tasks/actions";

// Fenêtre « Nouvelle tâche » / « Modifier la tâche » (4e, D-59), la même sur toutes les pages coach :
// « Créer → Tâche », le bouton de la page Tâches, et un appui sur une tâche (page Tâches, carte du
// tableau de bord). On reste sur la page ; un toast confirme. La suppression passe par une
// confirmation (prompt §9).
export type EditableTask = {
  id: string;
  title: string;
  priority: "high" | "normal";
  dueOn: string | null;
  category: TaskCategory | null;
  athleteId: string | null;
  notes: string | null;
};

type Athlete = { id: string; name: string };
type CreateAction = (previous: TaskFormState, formData: FormData) => Promise<TaskFormState>;
type UpdateAction = (
  taskId: string,
  previous: TaskFormState,
  formData: FormData,
) => Promise<TaskFormState>;

// Ouvre la fenêtre : sans argument pour une nouvelle tâche, avec la tâche pour la modifier.
const OpenContext = createContext<((task?: EditableTask) => void) | null>(null);

export function useOpenTaskSheet() {
  return useContext(OpenContext);
}

export function TaskSheetProvider({
  create,
  update,
  remove,
  loadAthletes,
  children,
}: {
  create: CreateAction;
  update: UpdateAction;
  remove: (taskId: string) => Promise<{ ok: boolean }>;
  loadAthletes: () => Promise<Athlete[]>;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [task, setTask] = useState<EditableTask | null>(null);
  const [athletes, setAthletes] = useState<Athlete[] | null>(null);
  // Une clé par ouverture : le formulaire repart de la tâche ouverte, jamais de la précédente.
  const [opening, setOpening] = useState(0);
  const openSheet = useCallback(
    (next?: EditableTask) => {
      setTask(next ?? null);
      setOpening((value) => value + 1);
      setAthletes(null);
      setOpen(true);
      loadAthletes().then(setAthletes, () => setAthletes([]));
    },
    [loadAthletes],
  );
  const close = useCallback(() => setOpen(false), []);

  return (
    <OpenContext.Provider value={openSheet}>
      {children}
      <Sheet
        open={open}
        onClose={close}
        title={task ? "Modifier la tâche" : "Nouvelle tâche"}
        subtitle={task ? undefined : "Ce que tu dois faire, et pour quand."}
      >
        {open && athletes === null ? (
          <p className="flex items-center gap-2 text-[14px] text-muted">
            <Spinner /> Chargement…
          </p>
        ) : open && athletes ? (
          <TaskForm
            key={opening}
            task={task}
            athletes={athletes}
            action={task ? update.bind(null, task.id) : create}
            remove={remove}
            onDone={close}
          />
        ) : null}
      </Sheet>
    </OpenContext.Provider>
  );
}

const initial: TaskFormState = { error: null, attempt: 0, values: null, saved: false };

function TaskForm({
  task,
  athletes,
  action,
  remove,
  onDone,
}: {
  task: EditableTask | null;
  athletes: Athlete[];
  action: CreateAction;
  remove: (taskId: string) => Promise<{ ok: boolean }>;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const [confirming, setConfirming] = useState(false);
  const [deleting, startDelete] = useTransition();
  const router = useRouter();
  const toast = useToast();
  useEffect(() => {
    if (!state.saved) return;
    toast(task ? "Tâche enregistrée." : "Tâche ajoutée.");
    onDone();
    router.refresh();
  }, [state, task, toast, onDone, router]);

  const values: TaskFormValues = state.values ?? {
    title: task?.title ?? "",
    priority: task?.priority ?? "normal",
    dueOn: task?.dueOn ?? "",
    category: task?.category ?? "",
    athleteId: task?.athleteId ?? "",
    notes: task?.notes ?? "",
  };
  // Le sportif d'une tâche peut avoir été archivé depuis : il reste proposé pour cette tâche.
  const known = athletes.some((athlete) => athlete.id === values.athleteId);

  const confirmDelete = () => {
    if (!task) return;
    startDelete(async () => {
      const { ok } = await remove(task.id);
      setConfirming(false);
      if (!ok) {
        toast("La tâche n'a pas pu être supprimée. Réessaie.");
        return;
      }
      toast("Tâche supprimée.");
      onDone();
      router.refresh();
    });
  };

  return (
    <>
      <form key={state.attempt} action={formAction} className="flex flex-col gap-5" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="task-title" className={labelClass}>
            Tâche
          </label>
          <input
            id="task-title"
            name="title"
            required
            maxLength={TASK_TITLE_MAX}
            autoComplete="off"
            defaultValue={values.title}
            placeholder="Ex. : Relancer Sophie pour la facture"
            className={inputClass}
          />
        </div>

        <fieldset className="flex flex-col gap-1.5">
          <legend className={`${labelClass} mb-1.5`}>
            Associée à <span className="font-normal text-muted">(facultatif)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "", label: "Rien" },
              ...TASK_CATEGORIES.map((value) => ({
                value,
                label: taskCategoryLabels[value],
              })),
            ].map((option) => (
              <label key={option.value || "none"} className={checkboxChipClass}>
                <input
                  type="radio"
                  name="category"
                  value={option.value}
                  defaultChecked={values.category === option.value}
                  className="sr-only"
                />
                <Check
                  aria-hidden
                  size={14}
                  strokeWidth={2.4}
                  className="hidden group-has-checked:block"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-athlete" className={labelClass}>
              Sportif <span className="font-normal text-muted">(facultatif)</span>
            </label>
            <select
              id="task-athlete"
              name="athleteId"
              defaultValue={values.athleteId}
              className={inputClass}
            >
              <option value="">Aucun</option>
              {!known && values.athleteId ? (
                <option value={values.athleteId}>Sportif archivé</option>
              ) : null}
              {athletes.map((athlete) => (
                <option key={athlete.id} value={athlete.id}>
                  {athlete.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-due" className={labelClass}>
              Échéance <span className="font-normal text-muted">(facultatif)</span>
            </label>
            <input
              id="task-due"
              name="dueOn"
              type="date"
              defaultValue={values.dueOn}
              className={inputClass}
            />
          </div>
        </div>

        <fieldset className="flex flex-col gap-1.5">
          <legend className={`${labelClass} mb-1.5`}>Priorité</legend>
          <div className={segmentedGroupClass}>
            {(
              [
                { value: "normal", label: "Normale" },
                { value: "high", label: "Haute" },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className="flex-1 cursor-pointer rounded-[9px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent sm:flex-none"
              >
                <input
                  type="radio"
                  name="priority"
                  value={option.value}
                  defaultChecked={values.priority === option.value}
                  className="peer sr-only"
                />
                <span className={segmentedItemClass}>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="task-notes" className={labelClass}>
            Note <span className="font-normal text-muted">(facultatif)</span>
          </label>
          <textarea
            id="task-notes"
            name="notes"
            maxLength={TASK_NOTES_MAX}
            defaultValue={values.notes}
            placeholder="Ex. : la facture est dans Documents"
            className={textareaClass}
          />
        </div>

        <div className="flex flex-col gap-3">
          {state.error ? (
            <p role="alert" className={errorTextClass}>
              {state.error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2.5 [&>*]:flex-1 sm:[&>*]:flex-none">
            <button type="submit" disabled={pending} className={buttonClass()}>
              {pending ? "Enregistrement…" : task ? "Enregistrer" : "Ajouter la tâche"}
            </button>
            {task ? (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className={buttonClass({ variant: "outline" })}
              >
                <Trash2 aria-hidden size={15} strokeWidth={1.8} />
                Supprimer
              </button>
            ) : null}
          </div>
        </div>
      </form>
      {task ? (
        <ConfirmDialog
          open={confirming}
          onClose={() => setConfirming(false)}
          onConfirm={confirmDelete}
          pending={deleting}
          title="Supprimer cette tâche ?"
          confirmLabel={deleting ? "Suppression…" : "Supprimer"}
        >
          « {task.title} » disparaîtra de tes tâches. Ce n&apos;est pas réversible.
        </ConfirmDialog>
      ) : null}
    </>
  );
}

// Bouton rouge « Nouvelle tâche » (page Tâches).
export function NewTaskButton() {
  const open = useOpenTaskSheet();
  return (
    <button type="button" disabled={!open} onClick={() => open?.()} className={buttonClass()}>
      <Plus aria-hidden size={16} strokeWidth={2} />
      Nouvelle tâche
    </button>
  );
}

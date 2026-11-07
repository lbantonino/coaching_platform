"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createContext,
  useActionState,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import {
  DlgChips,
  DlgDate,
  DlgField,
  DlgFieldset,
  DlgSegmented,
  DlgSelect,
} from "@/components/ui/dialog-fields";
import {
  dlgDestructiveLinkClass,
  dlgErrorClass,
  dlgFormGridClass,
  dlgInputClass,
  dlgPrimaryButtonClass,
  dlgTextareaClass,
} from "@/components/ui/dialog-styles";
import { ConfirmDialog, DialogBody, DialogFooter, Sheet } from "@/components/ui/overlay";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { Quoted } from "@/components/ui/quoted";
import { TASK_NOTES_MAX, TASK_TITLE_MAX, type TaskFormValues } from "@/domain/tasks/task-form";
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
  listId: string | null;
  athleteId: string | null;
  notes: string | null;
};

type Athlete = { id: string; name: string };
// Liste du coach (kit « Coory Pages », 01, D-129) : « Associée à » propose ses listes.
type TaskListOption = { id: string; name: string };
type CreateAction = (previous: TaskFormState, formData: FormData) => Promise<TaskFormState>;
type UpdateAction = (
  taskId: string,
  previous: TaskFormState,
  formData: FormData,
) => Promise<TaskFormState>;

// Ouvre la fenêtre : sans argument pour une nouvelle tâche, avec la tâche pour la modifier ; `preset`
// préremplit une nouvelle tâche (ex. la liste ouverte sur la page Tâches).
type OpenTask = (task?: EditableTask, preset?: { listId?: string }) => void;
const OpenContext = createContext<OpenTask | null>(null);

export function useOpenTaskSheet() {
  return useContext(OpenContext);
}

export function TaskSheetProvider({
  create,
  update,
  remove,
  loadAthletes,
  loadLists,
  children,
}: {
  create: CreateAction;
  update: UpdateAction;
  remove: (taskId: string) => Promise<{ ok: boolean }>;
  loadAthletes: () => Promise<Athlete[]>;
  loadLists: () => Promise<TaskListOption[]>;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [task, setTask] = useState<EditableTask | null>(null);
  const [preset, setPreset] = useState<{ listId?: string }>({});
  const [options, setOptions] = useState<{ athletes: Athlete[]; lists: TaskListOption[] } | null>(
    null,
  );
  // Une clé par ouverture : le formulaire repart de la tâche ouverte, jamais de la précédente.
  const [opening, setOpening] = useState(0);
  const openSheet = useCallback<OpenTask>(
    (next, wanted) => {
      setTask(next ?? null);
      setPreset(wanted ?? {});
      setOpening((value) => value + 1);
      setOptions(null);
      setOpen(true);
      Promise.all([loadAthletes().catch(() => []), loadLists().catch(() => [])]).then(
        ([athletes, lists]) => setOptions({ athletes, lists }),
      );
    },
    [loadAthletes, loadLists],
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
        bare
      >
        {open && options === null ? (
          <DialogBody>
            <p className="flex items-center gap-2 text-[14px] text-muted">
              <Spinner /> Chargement…
            </p>
          </DialogBody>
        ) : open && options ? (
          <TaskForm
            key={opening}
            task={task}
            preset={preset}
            athletes={options.athletes}
            lists={options.lists}
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
  preset,
  athletes,
  lists,
  action,
  remove,
  onDone,
}: {
  task: EditableTask | null;
  preset: { listId?: string };
  athletes: Athlete[];
  lists: TaskListOption[];
  action: CreateAction;
  remove: (taskId: string) => Promise<{ ok: boolean }>;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const formId = useId();
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
    listId: task?.listId ?? preset.listId ?? "",
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
      {/* Kit (03, 19) : grille de 12 colonnes dans le corps qui défile ; les boutons sont dans le pied
          fixe, reliés au formulaire par son id. */}
      <DialogBody>
        <form
          id={formId}
          key={state.attempt}
          action={formAction}
          className={dlgFormGridClass}
          noValidate
        >
          <DlgField label="Tâche" htmlFor="task-title">
            <input
              id="task-title"
              name="title"
              required
              maxLength={TASK_TITLE_MAX}
              autoComplete="off"
              defaultValue={values.title}
              placeholder="Ex. : Relancer Sophie pour la facture"
              className={dlgInputClass}
            />
          </DlgField>

          {/* « Associée à » : une des listes du coach (décision 8) ; sans liste, rien à choisir. */}
          {lists.length > 0 ? (
            <DlgFieldset legend="Associée à" optional>
              <DlgChips
                name="listId"
                defaultValue={values.listId}
                options={[
                  { value: "", label: "Rien" },
                  ...lists.map((list) => ({ value: list.id, label: list.name })),
                ]}
              />
            </DlgFieldset>
          ) : null}

          <DlgField label="Sportif" htmlFor="task-athlete" optional half>
            <DlgSelect id="task-athlete" name="athleteId" defaultValue={values.athleteId}>
              <option value="">Aucun</option>
              {!known && values.athleteId ? (
                <option value={values.athleteId}>Sportif archivé</option>
              ) : null}
              {athletes.map((athlete) => (
                <option key={athlete.id} value={athlete.id}>
                  {athlete.name}
                </option>
              ))}
            </DlgSelect>
          </DlgField>
          <DlgField label="Échéance" htmlFor="task-due" optional half>
            <DlgDate id="task-due" name="dueOn" defaultValue={values.dueOn} />
          </DlgField>

          <DlgFieldset legend="Priorité">
            <DlgSegmented
              name="priority"
              fit
              defaultValue={values.priority}
              options={[
                { value: "normal", label: "Normale" },
                { value: "high", label: "Haute" },
              ]}
            />
          </DlgFieldset>

          <DlgField label="Note" htmlFor="task-notes" optional>
            <textarea
              id="task-notes"
              name="notes"
              maxLength={TASK_NOTES_MAX}
              defaultValue={values.notes}
              placeholder="Ex. : la facture est dans Documents"
              className={dlgTextareaClass}
            />
          </DlgField>

          {state.error ? (
            <p role="alert" className={dlgErrorClass}>
              {state.error}
            </p>
          ) : null}
        </form>
      </DialogBody>
      <DialogFooter
        onCancel={onDone}
        destructive={
          task ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className={dlgDestructiveLinkClass}
            >
              <Trash2 aria-hidden size={16} strokeWidth={1.9} />
              Supprimer
            </button>
          ) : null
        }
        primary={
          <button type="submit" form={formId} disabled={pending} className={dlgPrimaryButtonClass}>
            {pending ? "Enregistrement…" : task ? "Enregistrer" : "Ajouter la tâche"}
          </button>
        }
      />
      {task ? (
        <ConfirmDialog
          open={confirming}
          onClose={() => setConfirming(false)}
          onConfirm={confirmDelete}
          pending={deleting}
          title="Supprimer cette tâche ?"
          confirmLabel={deleting ? "Suppression…" : "Supprimer"}
        >
          <Quoted>{task.title}</Quoted> disparaîtra de tes tâches. Ce n&apos;est pas réversible.
        </ConfirmDialog>
      ) : null}
    </>
  );
}

"use client";

import {
  Calendar,
  Check,
  Clock,
  List,
  ListChecks,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from "react";

import { useOpenTaskSheet, type EditableTask } from "@/components/blocks/task-sheet";
import { BackLink } from "@/components/layout/back-link";
import { MobileBarTitle, phoneFabClass } from "@/components/layout/mobile-bar";
import { ConfirmDialog, MenuDialog, MenuSeparator, type MenuAnchor } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { LIST_COLORS, listColorLabels, type ListColor } from "@/domain/tasks/lists";
import { inTab, type TaskTab } from "@/domain/tasks/buckets";
import { dayShortLabel } from "@/lib/format";

// Page Tâches, kit « Coory Pages », page 01 (D-129).
// Ordinateur : une carte en deux colonnes. À gauche (270 px, 240 sous 1 280 px) : les 4 vues
// « intelligentes » en tuiles 2 × 2, « MES LISTES » et « + Nouvelle liste » (saisie dans la ligne).
// À droite : le titre de la vue (couleur de la liste), son nombre, les tâches et l'ajout rapide.
// Téléphone : deux écrans. Sans vue : l'accueil (tuiles, « Mes listes » en carte). Avec une vue :
// « ‹ Listes » dans la barre, le titre, les onglets défilants des vues et des listes, la carte des
// tâches. Bouton flottant « + » : l'ajout rapide.
// Cocher une tâche la fait passer dans « Terminées » (et la décocher la rend) ; les nombres suivent
// tout de suite, puis la page se recalcule.

export type TasksViewTask = {
  id: string;
  title: string;
  high: boolean;
  dueOn: string | null;
  done: boolean;
  athleteName: string | null;
  list: { id: string; name: string; color: ListColor } | null;
  edit: EditableTask;
};

type TaskListItem = { id: string; name: string; color: ListColor };

type Actions = {
  setDone: (taskId: string, done: boolean) => Promise<{ ok: boolean }>;
  quickAdd: (title: string, view: unknown) => Promise<{ ok: boolean; error?: string }>;
  createList: (name: string) => Promise<{ ok: boolean; error?: string; id?: string }>;
  updateList: (
    listId: string,
    change: { name?: string; color?: string },
  ) => Promise<{ ok: boolean; error?: string }>;
  deleteList: (listId: string) => Promise<{ ok: boolean; error?: string }>;
  deleteTask: (taskId: string) => Promise<{ ok: boolean }>;
  deleteDone: () => Promise<{ ok: boolean; count: number }>;
};

const SMART: { key: TaskTab; label: string; icon: LucideIcon; tile: string; empty: string }[] = [
  {
    key: "aujourdhui",
    label: "Aujourd'hui",
    icon: Calendar,
    tile: "bg-violet",
    empty: "Rien à faire aujourd'hui.",
  },
  { key: "avenir", label: "À venir", icon: Clock, tile: "bg-list-ink", empty: "Rien à venir." },
  {
    key: "toutes",
    label: "Toutes",
    icon: ListChecks,
    tile: "bg-text-2",
    empty: "Aucune tâche à faire.",
  },
  {
    key: "terminees",
    label: "Terminées",
    icon: Check,
    tile: "bg-faint",
    empty: "Aucune tâche terminée.",
  },
];

// Pastille (fond) et titre (texte lisible) de chaque couleur de liste.
const dot: Record<ListColor, string> = {
  indigo: "bg-list-indigo",
  amber: "bg-list-amber",
  teal: "bg-list-teal",
  rose: "bg-list-rose",
  violet: "bg-list-violet",
  ink: "bg-list-ink",
};
const ink: Record<ListColor, string> = {
  indigo: "text-list-indigo-text",
  amber: "text-list-amber-text",
  teal: "text-list-teal-text",
  rose: "text-list-rose-text",
  violet: "text-list-violet-text",
  ink: "text-list-ink-text",
};

const href = (view: string) => `/coach/taches?vue=${view}`;
const plural = (n: number) => `${n} tâche${n > 1 ? "s" : ""}`;
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

export function TasksView({
  view,
  today,
  tasks,
  lists,
  actions,
}: {
  // null : sur téléphone, l'accueil des listes ; sur ordinateur, « Toutes ».
  view: string | null;
  today: string;
  tasks: TasksViewTask[];
  lists: TaskListItem[];
  actions: Actions;
}) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  // Suppression (demande d'Antonino du 14/11) : une tâche depuis sa ligne, ou toutes les terminées.
  const [removed, setRemoved] = useState<ReadonlySet<string>>(new Set());
  const [removingTask, setRemovingTask] = useState<TasksViewTask | null>(null);
  const [clearing, setClearing] = useState(false);
  const [deleting, startDeleting] = useTransition();
  const [draft, setDraft] = useState("");
  const [adding, startAdding] = useTransition();
  const [, startTransition] = useTransition();
  const quickInput = useRef<HTMLInputElement>(null);
  const openTask = useOpenTaskSheet();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const toast = useToast();

  const current = view ?? "toutes";
  const smart = SMART.find((item) => item.key === current);
  const list = smart ? null : (lists.find((item) => item.id === current) ?? null);
  // Vue inconnue (liste supprimée…) : « Toutes ».
  const shownView = (smart ?? list) ? current : "toutes";

  const shown = tasks
    .filter((task) => !removed.has(task.id))
    .map((task) => ({ ...task, done: done[task.id] ?? task.done }));
  const inView = (task: TasksViewTask, key: string) => {
    const smartKey = SMART.find((item) => item.key === key)?.key;
    if (smartKey) return smartKey === "toutes" ? !task.done : inTab(task, smartKey, today);
    return !task.done && task.list?.id === key;
  };
  const count = (key: string) => shown.filter((task) => inView(task, key)).length;
  const rows = shown.filter((task) => inView(task, shownView));
  const title = smart?.label ?? list?.name ?? "Toutes";
  const canQuickAdd = shownView !== "terminees";
  const canClear = shownView === "terminees" && rows.length > 0;

  const removeTask = (task: TasksViewTask) =>
    startDeleting(async () => {
      const { ok } = await actions.deleteTask(task.id);
      setRemovingTask(null);
      if (!ok) {
        toast("La tâche n'a pas pu être supprimée. Réessaie.");
        return;
      }
      setRemoved((value) => new Set(value).add(task.id));
      toast("Tâche supprimée.");
      router.refresh();
    });
  const clearDone = () =>
    startDeleting(async () => {
      const ids = rows.map((task) => task.id);
      const result = await actions.deleteDone();
      setClearing(false);
      if (!result.ok) {
        toast("Les tâches n'ont pas pu être supprimées. Réessaie.");
        return;
      }
      setRemoved((value) => new Set([...value, ...ids]));
      toast(`${plural(result.count)} supprimée${result.count > 1 ? "s" : ""}.`);
      router.refresh();
    });
  const clearButton = canClear ? (
    <button
      type="button"
      onClick={() => setClearing(true)}
      className="tap-44 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[9px] px-2.5 text-[13px] leading-[normal] font-medium text-status-danger transition-[background-color] duration-150 hover:bg-dlg-danger-soft"
    >
      <Trash2 aria-hidden size={14} strokeWidth={1.8} />
      Tout supprimer
    </button>
  ) : null;

  // « + Nouvelle tâche » (en-tête, bouton flottant) : le curseur dans l'ajout rapide. Depuis
  // « Terminées » ou l'accueil du téléphone, on passe d'abord dans « Toutes » (?ajout=1).
  useEffect(() => {
    const focus = () => {
      if (!canQuickAdd || (view === null && window.matchMedia("(max-width: 1023px)").matches)) {
        router.push(`${href("toutes")}&ajout=1`, { scroll: false });
        return;
      }
      quickInput.current?.focus();
    };
    window.addEventListener("coory:quick-add-task", focus);
    return () => window.removeEventListener("coory:quick-add-task", focus);
  }, [canQuickAdd, view, router]);
  useEffect(() => {
    if (params.get("ajout") !== "1") return;
    quickInput.current?.focus();
    const rest = new URLSearchParams(params.toString());
    rest.delete("ajout");
    router.replace(`${pathname}?${rest.toString()}`, { scroll: false });
  }, [params, pathname, router]);

  const toggle = (task: TasksViewTask) => {
    const next = !task.done;
    setDone((value) => ({ ...value, [task.id]: next }));
    startTransition(async () => {
      const { ok } = await actions.setDone(task.id, next);
      if (!ok) {
        setDone((value) => ({ ...value, [task.id]: !next }));
        toast("Le changement n'a pas pu être enregistré. Réessaie.");
        return;
      }
      router.refresh();
      toast(next ? "Tâche terminée." : "Tâche rouverte.", {
        action: {
          label: "Annuler",
          onClick: () =>
            startTransition(async () => {
              setDone((value) => ({ ...value, [task.id]: !next }));
              await actions.setDone(task.id, !next);
              router.refresh();
            }),
        },
      });
    });
  };

  const addQuick = () => {
    const text = draft.trim();
    if (!text) return;
    startAdding(async () => {
      const result = await actions.quickAdd(
        text,
        list ? { listId: list.id } : (shownView as TaskTab),
      );
      if (!result.ok) {
        toast(result.error ?? "La tâche n'a pas pu être ajoutée. Réessaie.");
        return;
      }
      setDraft("");
      router.refresh();
      quickInput.current?.focus();
    });
  };

  const taskRows = (
    <ul className="flex flex-col">
      {rows.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          today={today}
          showList={!list}
          onToggle={() => toggle(task)}
          onOpen={openTask ? () => openTask(task.edit) : undefined}
          onDelete={() => setRemovingTask(task)}
        />
      ))}
      {canQuickAdd ? (
        <li className="flex items-center gap-4 border-t border-line px-[18px] py-3.5 transition-colors duration-150 focus-within:bg-status-accent-soft/40 lg:px-6">
          <span
            aria-hidden
            className="size-[22px] shrink-0 rounded-full inset-ring-[1.5px] inset-ring-line-2"
          />
          <input
            ref={quickInput}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addQuick();
              } else if (event.key === "Escape") {
                setDraft("");
                event.currentTarget.blur();
              }
            }}
            disabled={adding}
            maxLength={140}
            aria-label="Nouvelle tâche"
            placeholder="Nouvelle tâche"
            enterKeyHint="done"
            className="-my-3.5 min-w-0 flex-1 bg-transparent py-3.5 text-[16px] leading-[normal] font-medium text-text outline-none placeholder:font-normal placeholder:text-faint lg:text-[15px]"
          />
        </li>
      ) : null}
    </ul>
  );

  const empty =
    rows.length === 0 && !canQuickAdd ? (
      <p className="border-t border-line px-6 py-6 text-[14px] text-muted">{smart?.empty}</p>
    ) : rows.length === 0 && smart ? (
      <p className="sr-only">{smart.empty}</p>
    ) : null;

  return (
    <>
      {/* ---------------- Ordinateur : la carte en deux colonnes ---------------- */}
      {/* Grand écran (D-135) : la liste ne dépasse pas 1 100 px (270 + 1 100), le reste en fond. */}
      <section
        aria-label="Tâches"
        className="flex min-h-[640px] w-full max-w-[1370px] flex-1 overflow-hidden rounded-[20px] bg-surface inset-ring inset-ring-line max-lg:hidden"
      >
        <div className="flex w-[240px] shrink-0 flex-col gap-[18px] border-r border-line bg-surface-2/60 px-3.5 py-[18px] xl:w-[270px]">
          <SmartTiles current={shownView} count={count} />
          <ListsPanel
            lists={lists}
            current={shownView}
            count={count}
            actions={actions}
            variant="column"
          />
        </div>
        {/* Plafond de lecture (kit, PROPOSED) : 1 100 px, aligné à gauche avec son titre. */}
        <div className="flex w-full max-w-[1100px] min-w-0 flex-1 flex-col">
          <div className="flex items-baseline justify-between gap-4 px-6 pt-6 pb-4">
            <h2
              className={`min-w-0 truncate text-[26px] leading-[1.1] font-bold tracking-[-0.025em] ${
                list ? ink[list.color] : "text-text"
              }`}
            >
              {title}
            </h2>
            <span className="flex shrink-0 items-center gap-3">
              {clearButton}
              <span className="text-[13.5px] leading-[normal] text-muted tabular">
                {plural(rows.length)}
              </span>
            </span>
          </div>
          <div className="flex-1">
            {empty}
            {taskRows}
          </div>
        </div>
      </section>

      {/* ---------------- Téléphone ---------------- */}
      {view === null ? (
        // Accueil des listes (1b).
        <div className="flex flex-col gap-[22px] lg:hidden">
          <SmartTiles current={null} count={count} />
          <div className="flex flex-col gap-3">
            <h2 className="px-1 text-[20px] leading-[normal] font-bold tracking-[-0.02em]">
              Mes listes
            </h2>
            <ListsPanel
              lists={lists}
              current={null}
              count={count}
              actions={actions}
              variant="card"
            />
          </div>
        </div>
      ) : (
        // Une vue ouverte (1c).
        <div className="-mb-7 flex flex-1 flex-col gap-3.5 lg:hidden">
          <MobileBarTitle>
            <BackLink href="/coach/taches" label="Listes" variant="bar" />
          </MobileBarTitle>
          <div className="flex items-baseline justify-between gap-3 px-1">
            <h2
              className={`min-w-0 truncate text-[28px] leading-[1.1] font-bold tracking-[-0.025em] ${
                list ? ink[list.color] : "text-text"
              }`}
            >
              {title}
            </h2>
            <span className="flex shrink-0 items-center gap-2">
              {clearButton}
              <span className="text-[14px] text-muted tabular">{plural(rows.length)}</span>
            </span>
          </div>
          <nav
            aria-label="Listes"
            className="-mx-3.5 -my-1 flex gap-1.5 overflow-x-auto overscroll-x-contain px-3.5 pt-1 pb-1.5 [scrollbar-width:none]"
          >
            {[
              ...SMART.map((item) => ({ key: item.key, label: item.label, color: item.tile })),
              ...lists.map((item) => ({ key: item.id, label: item.name, color: dot[item.color] })),
            ].map((item) => {
              const active = item.key === shownView;
              return (
                <Link
                  key={item.key}
                  href={href(item.key)}
                  scroll={false}
                  aria-current={active ? "page" : undefined}
                  className={`tap-44 flex h-9 shrink-0 items-center gap-[7px] rounded-full px-[13px] text-[13.5px] leading-[normal] font-medium whitespace-nowrap ${
                    active ? "bg-cta text-on-cta" : "bg-surface text-text"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`size-2 rounded-full ${active ? "bg-on-cta" : item.color}`}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <section
            aria-label={title}
            className="flex min-h-[50vh] flex-1 flex-col rounded-t-[20px] bg-surface pb-28 inset-ring inset-ring-line [&>ul>li:first-child]:border-t-0"
          >
            {empty}
            {taskRows}
          </section>
        </div>
      )}

      {/* Téléphone : bouton flottant « + » (ajout rapide). */}
      <button
        type="button"
        aria-label="Nouvelle tâche"
        data-phone-fab=""
        onClick={() => window.dispatchEvent(new Event("coory:quick-add-task"))}
        className={phoneFabClass}
      >
        <Plus aria-hidden size={24} strokeWidth={2.2} />
      </button>

      <ConfirmDialog
        open={removingTask !== null}
        onClose={() => setRemovingTask(null)}
        onConfirm={() => removingTask && removeTask(removingTask)}
        title="Supprimer cette tâche ?"
        confirmLabel="Supprimer"
        pending={deleting}
      >
        « {removingTask?.title} » sera supprimée définitivement.
      </ConfirmDialog>
      <ConfirmDialog
        open={clearing}
        onClose={() => setClearing(false)}
        onConfirm={clearDone}
        title={
          rows.length > 1
            ? `Supprimer les ${rows.length} tâches terminées ?`
            : "Supprimer la tâche terminée ?"
        }
        confirmLabel="Tout supprimer"
        pending={deleting}
      >
        {rows.length > 1
          ? "Elles seront supprimées définitivement."
          : "Elle sera supprimée définitivement."}
      </ConfirmDialog>
    </>
  );
}

// « + Nouvelle tâche » de l'en-tête (ordinateur) : l'ajout rapide de la vue en cours (décision 10).
export function QuickAddButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("coory:quick-add-task"))}
      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[9px] bg-cta px-3.5 text-[12.5px] leading-[normal] font-medium whitespace-nowrap text-on-cta transition-[scale,opacity] duration-150 hover:opacity-90 active:scale-[0.98] max-lg:hidden"
    >
      <Plus aria-hidden size={14} strokeWidth={2.2} />
      Nouvelle tâche
    </button>
  );
}

function SmartTiles({
  current,
  count,
}: {
  current: string | null;
  count: (key: string) => number;
}) {
  return (
    <nav aria-label="Vues des tâches" className="grid grid-cols-2 gap-2.5 lg:gap-2">
      {SMART.map((item) => {
        const active = item.key === current;
        return (
          <Link
            key={item.key}
            href={href(item.key)}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col gap-3.5 rounded-[16px] p-3.5 transition-[background-color,box-shadow] duration-150 lg:gap-2.5 lg:rounded-[14px] lg:p-3 ${
              active
                ? "bg-status-accent-soft inset-ring-[1.5px] inset-ring-violet"
                : "bg-surface inset-ring inset-ring-line hover:bg-surface-2"
            }`}
          >
            <span className="flex items-center justify-between">
              <span
                aria-hidden
                className={`grid size-[26px] place-items-center rounded-full text-white ${item.tile}`}
              >
                <item.icon size={13} strokeWidth={2.2} />
              </span>
              <span className="text-[20px] leading-none font-bold tracking-[-0.02em] text-text tabular">
                {count(item.key)}
              </span>
            </span>
            <span className="text-[13px] leading-[normal] font-semibold whitespace-nowrap text-text-2">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

// « MES LISTES » (ordinateur) ou la carte « Mes listes » (téléphone), avec « + Nouvelle liste ».
function ListsPanel({
  lists,
  current,
  count,
  actions,
  variant,
}: {
  lists: TaskListItem[];
  current: string | null;
  count: (key: string) => number;
  actions: Actions;
  variant: "column" | "card";
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const [menu, setMenu] = useState<{ list: TaskListItem; anchor: MenuAnchor } | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [removing, setRemoving] = useState<TaskListItem | null>(null);
  const router = useRouter();
  const toast = useToast();
  const card = variant === "card";

  const create = () => {
    const text = name.trim();
    if (!text) {
      setCreating(false);
      return;
    }
    startTransition(async () => {
      const result = await actions.createList(text);
      if (!result.ok) {
        toast(result.error ?? "La liste n'a pas pu être créée. Réessaie.");
        return;
      }
      setName("");
      setCreating(false);
      toast(`Liste « ${text} » créée.`);
      router.refresh();
    });
  };
  const change = (list: TaskListItem, patch: { name?: string; color?: string }) =>
    startTransition(async () => {
      const result = await actions.updateList(list.id, patch);
      if (!result.ok) {
        toast(result.error ?? "La liste n'a pas pu être modifiée. Réessaie.");
        return;
      }
      router.refresh();
    });
  const remove = (list: TaskListItem) =>
    startTransition(async () => {
      const result = await actions.deleteList(list.id);
      setRemoving(null);
      if (!result.ok) {
        toast(result.error ?? "La liste n'a pas pu être supprimée. Réessaie.");
        return;
      }
      toast(`Liste « ${list.name} » supprimée. Ses tâches restent, sans liste.`);
      router.push("/coach/taches?vue=toutes", { scroll: false });
      router.refresh();
    });

  const keyHandler =
    (onEnter: () => void, onEscape: () => void) => (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        onEnter();
      } else if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onEscape();
      }
    };

  const rowClass = card
    ? "flex min-h-14 items-center gap-3 border-t border-line px-4 text-[15.5px] leading-[normal] font-medium first:border-t-0"
    : "flex min-h-10 items-center gap-3 rounded-[10px] px-2.5 text-[14px] leading-[normal] font-medium";
  const pastille = card ? "size-[30px]" : "size-6";

  const newList = creating ? (
    <div className={`${rowClass} ${card ? "" : "bg-surface"}`}>
      <span
        aria-hidden
        className={`grid shrink-0 place-items-center rounded-full bg-faint/30 ${pastille}`}
      >
        <List size={card ? 15 : 13} strokeWidth={2.2} className="text-white" />
      </span>
      <input
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={keyHandler(create, () => {
          setName("");
          setCreating(false);
        })}
        onBlur={() => {
          if (!name.trim()) setCreating(false);
        }}
        disabled={pending}
        maxLength={40}
        aria-label="Nom de la liste"
        placeholder="Nom de la liste"
        className="min-w-0 flex-1 bg-transparent text-[16px] leading-[normal] font-medium text-text outline-none placeholder:font-normal placeholder:text-faint lg:text-[14px]"
      />
    </div>
  ) : null;

  const addButton = (
    <button
      type="button"
      onClick={() => setCreating(true)}
      className={`flex items-center gap-2 self-start rounded-[8px] font-semibold text-violet-text transition-opacity duration-150 hover:opacity-80 ${
        card ? "min-h-11 px-1 text-[15px]" : "min-h-9 px-2.5 text-[13.5px]"
      }`}
    >
      <Plus aria-hidden size={15} strokeWidth={2.2} />
      Nouvelle liste
    </button>
  );

  return (
    <div className={`flex flex-col ${card ? "gap-2" : "min-h-0 flex-1 gap-0.5"}`}>
      {card ? null : (
        <h2 className="px-2.5 pb-1.5 text-[12px] leading-[normal] font-semibold tracking-[0.04em] text-faint uppercase">
          Mes listes
        </h2>
      )}
      <ul
        aria-label="Mes listes"
        className={
          card
            ? "flex flex-col overflow-hidden rounded-[18px] bg-surface inset-ring inset-ring-line empty:hidden"
            : "flex flex-col gap-0.5"
        }
      >
        {lists.map((item) => {
          const active = item.id === current;
          return (
            <li
              key={item.id}
              className={`group/list relative flex items-center ${card ? "border-t border-line first:border-t-0" : ""}`}
            >
              {renaming === item.id ? (
                <div className={`${rowClass} min-w-0 flex-1 border-t-0`}>
                  <span
                    aria-hidden
                    className={`shrink-0 rounded-full ${pastille} ${dot[item.color]}`}
                  />
                  <input
                    autoFocus
                    defaultValue={item.name}
                    onKeyDown={keyHandler(
                      () => {
                        const value = (document.activeElement as HTMLInputElement).value;
                        setRenaming(null);
                        if (value.trim() && value.trim() !== item.name)
                          change(item, { name: value });
                      },
                      () => setRenaming(null),
                    )}
                    onBlur={(event) => {
                      const value = event.target.value;
                      setRenaming(null);
                      if (value.trim() && value.trim() !== item.name) change(item, { name: value });
                    }}
                    maxLength={40}
                    aria-label={`Nouveau nom de la liste ${item.name}`}
                    className="min-w-0 flex-1 bg-transparent text-[16px] leading-[normal] font-medium text-text outline-none lg:text-[14px]"
                  />
                </div>
              ) : (
                <Link
                  href={href(item.id)}
                  scroll={false}
                  aria-current={active ? "page" : undefined}
                  className={`${rowClass} min-w-0 flex-1 ${card ? "border-t-0 pr-14" : "pr-9"} ${
                    active
                      ? "bg-status-accent-soft"
                      : card
                        ? "active:bg-surface-2"
                        : "hover:bg-surface"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`grid shrink-0 place-items-center rounded-full ${pastille} ${dot[item.color]}`}
                  >
                    <List size={card ? 15 : 13} strokeWidth={2.2} className="text-white" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  <span className="shrink-0 text-[13px] font-medium text-faint tabular group-hover/list:lg:invisible group-focus-within/list:lg:invisible">
                    {count(item.id)}
                  </span>
                </Link>
              )}
              {renaming === item.id ? null : (
                <button
                  type="button"
                  aria-label={`Options de la liste ${item.name}`}
                  onClick={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    setMenu({
                      list: item,
                      anchor: {
                        x: Math.round(rect.left - 8),
                        y: Math.round(rect.bottom + 6),
                        side: "top",
                        width: 264,
                      },
                    });
                  }}
                  className={`absolute top-1/2 grid -translate-y-1/2 place-items-center rounded-[8px] text-muted transition-[opacity,background-color] duration-150 hover:bg-surface-2 hover:text-text ${
                    card
                      ? "right-2 size-11"
                      : "right-1 size-8 lg:opacity-0 lg:group-hover/list:opacity-100 lg:focus-visible:opacity-100"
                  }`}
                >
                  <MoreHorizontal aria-hidden size={17} strokeWidth={1.8} />
                </button>
              )}
            </li>
          );
        })}
        {card && creating ? (
          <li className="border-t border-line first:border-t-0">{newList}</li>
        ) : null}
      </ul>
      {card ? null : newList}
      {card ? null : <span aria-hidden className="flex-1" />}
      {creating ? null : addButton}

      {/* Menu d'une liste (décision 9) : renommer, couleur, supprimer. */}
      <MenuDialog
        open={menu !== null}
        onClose={() => setMenu(null)}
        anchor={menu?.anchor}
        title={menu?.list.name}
      >
        {menu ? (
          <>
            <button
              type="button"
              onClick={() => {
                setRenaming(menu.list.id);
                setMenu(null);
              }}
              className="flex h-[46px] w-full shrink-0 items-center gap-2.5 rounded-[9px] px-3 text-left text-[15px] leading-[normal] font-medium text-text transition-[background-color] duration-150 hover:bg-dlg-tile md:h-9 md:px-2.5 md:text-[13px]"
            >
              <Pencil aria-hidden size={15} strokeWidth={1.9} />
              Renommer
            </button>
            <fieldset className="flex flex-col gap-2 px-3 py-2 md:px-2.5">
              <legend className="mb-2 text-[13px] leading-[normal] font-medium text-muted md:text-[12px]">
                Couleur
              </legend>
              <div className="flex flex-wrap gap-2">
                {LIST_COLORS.map((color) => (
                  <label
                    key={color}
                    className={`grid size-9 cursor-pointer place-items-center rounded-full has-checked:ring-2 has-checked:ring-violet has-checked:ring-offset-2 has-checked:ring-offset-dlg has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent md:size-7 ${dot[color]}`}
                  >
                    <input
                      type="radio"
                      name="list-color"
                      value={color}
                      checked={menu.list.color === color}
                      onChange={() => {
                        change(menu.list, { color });
                        setMenu({ ...menu, list: { ...menu.list, color } });
                      }}
                      aria-label={listColorLabels[color]}
                      className="sr-only"
                    />
                  </label>
                ))}
              </div>
            </fieldset>
            <MenuSeparator />
            <button
              type="button"
              onClick={() => {
                setRemoving(menu.list);
                setMenu(null);
              }}
              className="flex h-[46px] w-full shrink-0 items-center gap-2.5 rounded-[9px] px-3 text-left text-[15px] leading-[normal] font-semibold text-status-danger transition-[background-color] duration-150 hover:bg-dlg-danger-soft md:h-9 md:px-2.5 md:text-[13px]"
            >
              <Trash2 aria-hidden size={15} strokeWidth={1.8} />
              Supprimer la liste
            </button>
          </>
        ) : null}
      </MenuDialog>
      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && remove(removing)}
        title={`Supprimer la liste « ${removing?.name ?? ""} » ?`}
        confirmLabel="Supprimer"
        pending={pending}
      >
        Ses tâches restent dans tes tâches, sans liste.
      </ConfirmDialog>
    </div>
  );
}

function TaskRow({
  task,
  today,
  showList,
  onToggle,
  onOpen,
  onDelete,
}: {
  task: TasksViewTask;
  today: string;
  showList: boolean;
  onToggle: () => void;
  onOpen?: () => void;
  onDelete?: () => void;
}) {
  const due = task.dueOn
    ? task.dueOn < today && !task.done
      ? { text: "En retard", tone: "text-status-danger" }
      : task.dueOn === today
        ? { text: "Aujourd'hui", tone: "text-violet-text" }
        : { text: dayShortLabel(task.dueOn, today), tone: "text-muted" }
    : null;
  const meta =
    task.athleteName || (showList && task.list) ? (
      <span className="flex min-w-0 items-center gap-3 text-[14px] leading-[normal] text-muted lg:text-[13.5px]">
        {task.athleteName ? (
          <span className="flex min-w-0 items-center gap-[7px] whitespace-nowrap">
            <span
              aria-hidden
              className="grid size-[18px] shrink-0 place-items-center rounded-full bg-status-accent-soft text-[8.5px] font-semibold text-violet-text max-lg:hidden"
            >
              {initials(task.athleteName)}
            </span>
            <span className="truncate">{task.athleteName}</span>
          </span>
        ) : null}
        {showList && task.list ? (
          <span className="flex min-w-0 items-center gap-[5px] text-[12.5px] font-medium whitespace-nowrap text-text-2 max-lg:hidden">
            <span
              aria-hidden
              className={`size-[7px] shrink-0 rounded-full ${dot[task.list.color]}`}
            />
            <span className="truncate">{task.list.name}</span>
          </span>
        ) : null}
        {/* Téléphone : l'échéance et « Haute » sur la ligne du sportif (kit). */}
        {due ? (
          <span className={`shrink-0 font-medium lg:hidden ${due.tone}`}>{due.text}</span>
        ) : null}
        {task.high && !task.done ? (
          <span className="h-[26px] shrink-0 rounded-[8px] bg-status-warn-soft px-2 text-[13px] leading-[26px] font-medium text-status-warn lg:hidden">
            Haute
          </span>
        ) : null}
      </span>
    ) : null;

  return (
    <li className="flex items-center gap-4 border-t border-line px-[18px] py-3.5 transition-colors duration-150 hover:bg-surface-2/50 lg:px-6">
      <button
        type="button"
        role="checkbox"
        aria-checked={task.done}
        aria-label={`Tâche faite : ${task.title}`}
        onClick={onToggle}
        className="-m-2.5 grid size-11 shrink-0 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-accent lg:size-[42px]"
      >
        <span
          className={`grid size-6 place-items-center rounded-full transition-[background-color,box-shadow] duration-200 lg:size-[22px] ${
            task.done ? "bg-violet text-white" : "inset-ring-[1.5px] inset-ring-line-2"
          }`}
        >
          {task.done ? <Check aria-hidden size={13} strokeWidth={3} /> : null}
        </span>
      </button>
      <button
        type="button"
        onClick={onOpen}
        disabled={!onOpen}
        className="flex min-w-0 flex-1 flex-col gap-[5px] rounded-[6px] text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        <span
          className={`text-[16px] leading-[1.3] font-medium lg:truncate lg:text-[15px] ${
            task.done ? "text-faint line-through" : "text-text"
          }`}
        >
          {task.title}
        </span>
        {meta}
      </button>
      {task.high && !task.done ? (
        <span className="h-[26px] shrink-0 rounded-[8px] bg-status-warn-soft px-2.5 text-[13px] leading-[26px] font-medium text-status-warn max-lg:hidden">
          Haute
        </span>
      ) : null}
      {due ? (
        <span
          className={`w-[92px] shrink-0 text-right text-[13px] leading-[normal] font-medium whitespace-nowrap max-lg:hidden ${due.tone}`}
        >
          {due.text}
        </span>
      ) : (
        <span aria-hidden className="w-[92px] shrink-0 max-lg:hidden" />
      )}
      {onDelete ? (
        <button
          type="button"
          aria-label={`Supprimer la tâche : ${task.title}`}
          onClick={onDelete}
          className="tap-44 -mr-1.5 grid size-9 shrink-0 place-items-center rounded-full text-faint transition-[background-color,color] duration-150 hover:bg-dlg-danger-soft hover:text-status-danger focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Trash2 aria-hidden size={16} strokeWidth={1.8} />
        </button>
      ) : null}
    </li>
  );
}

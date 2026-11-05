"use client";

import {
  Check,
  CheckCheck,
  Coins,
  Eye,
  EyeOff,
  Flag,
  ListChecks,
  MailOpen,
  MessageSquare,
  MoreHorizontal,
  SquareCheck,
  Trash2,
  UserPen,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type MouseEvent } from "react";

import { Avatar } from "@/components/ui/avatar";
import { MenuDialog, MenuSeparator, type MenuAnchor } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";

// Page Notifications, kit « Coory Pages », page 03 (D-128). La page serveur calcule les sections ;
// ici : les onglets (Toutes · Non lues · Masquées), la sélection (cases + actions groupées), le menu
// « ··· » de chaque ligne et « Annuler » (5 s) après chaque action. Les changements s'affichent
// tout de suite (état local), puis la page se recalcule (la cloche et le menu suivent).
//
// Ordinateur : une barre d'outils en carte (titre, onglets, « Sélectionner », « Tout marquer comme
// lu ») ; les sections en deux colonnes à partir de 1 100 px (gauche : messages, tâches, fiches ;
// droite : séances à encaisser, compétitions). Téléphone : onglets + deux boutons ronds (✓✓,
// sélectionner), une colonne, et en sélection une barre noire fixe « Lu · Masquer · Supprimer ».

export type SectionId = "messages" | "tasks" | "profiles" | "unpaid" | "competitions";

export type NotificationItem = {
  key: string;
  read: boolean;
  dismissed: boolean;
  href: string;
  title: string;
  sub: string;
  person?: {
    name: string;
    photoPath: string | null;
    sex: "female" | "male" | "unspecified" | null;
  };
  tags?: { label: string; tone: "warn" | "neutral" }[];
  right?: { text: string; strong?: boolean };
  menuSubtitle: string;
};

export type NotificationSection = {
  id: SectionId;
  title: string;
  link?: { href: string; label: string };
  items: NotificationItem[];
};

type Result = Promise<{ ok: boolean }>;
type Actions = {
  setRead: (keys: string[], read: boolean) => Result;
  dismiss: (keys: string[]) => Result;
  restore: (keys: string[]) => Result;
  remove: (keys: string[]) => Result;
  undelete: (keys: string[]) => Result;
};

type Tab = "all" | "unread" | "hidden";
type Override = { read?: boolean; dismissed?: boolean; deleted?: boolean };

const icons: Record<SectionId, LucideIcon> = {
  messages: MessageSquare,
  tasks: ListChecks,
  profiles: UserPen,
  unpaid: Coins,
  competitions: Flag,
};

// Une seule colonne (sous 1 100 px) : messages, séances, tâches, compétitions, fiches (kit).
const order: Record<SectionId, string> = {
  messages: "order-1",
  unpaid: "order-2",
  tasks: "order-3",
  competitions: "order-4",
  profiles: "order-5",
};
const leftColumn: SectionId[] = ["messages", "tasks", "profiles"];

const plural = (n: number, one: string, many: string) => (n > 1 ? many : one);

export function NotificationsView({
  sections,
  actions,
}: {
  sections: NotificationSection[];
  actions: Actions;
}) {
  const [tab, setTab] = useState<Tab>("all");
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [menu, setMenu] = useState<{ item: NotificationItem; anchor: MenuAnchor } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  // État affiché de chaque ligne : celui du serveur, corrigé par les actions en cours.
  const shown = sections.map((section) => ({
    ...section,
    items: section.items
      .map((item) => ({ ...item, ...overrides[item.key] }))
      .filter((item) => !item.deleted),
  }));
  const isUnread = (item: NotificationItem) => !item.read && !item.dismissed;
  const visibleIn = (item: NotificationItem, which: Tab) =>
    which === "hidden" ? item.dismissed : which === "unread" ? isUnread(item) : !item.dismissed;
  const unreadTotal = shown.reduce(
    (sum, section) => sum + section.items.filter(isUnread).length,
    0,
  );
  const hiddenTotal = shown.reduce(
    (sum, section) => sum + section.items.filter((item) => item.dismissed).length,
    0,
  );
  const visible = shown
    .map((section) => ({ ...section, items: section.items.filter((i) => visibleIn(i, tab)) }))
    // Hors « Toutes », les sections vides se cachent.
    .filter((section) => tab === "all" || section.items.length > 0);
  const visibleKeys = visible.flatMap((section) => section.items.map((item) => item.key));
  const chosen = visibleKeys.filter((key) => selected.has(key));
  const allChosen = visibleKeys.length > 0 && chosen.length === visibleKeys.length;

  const stopSelecting = () => {
    setSelecting(false);
    setSelected(new Set());
  };
  const changeTab = (next: Tab) => {
    setTab(next);
    setSelected(new Set());
  };

  // Applique un changement tout de suite, l'enregistre, puis propose « Annuler » (5 s).
  const run = ({
    keys,
    change,
    save,
    done,
    undo,
  }: {
    keys: string[];
    change: Override;
    save: () => Result;
    done: string;
    undo: { change: Override; save: () => Result };
  }) => {
    if (keys.length === 0) return;
    const before = Object.fromEntries(keys.map((key) => [key, overrides[key]]));
    const patch = (next: (key: string) => Override | undefined) =>
      setOverrides((current) => {
        const copy = { ...current };
        for (const key of keys) {
          const value = next(key);
          if (value) copy[key] = value;
          else delete copy[key];
        }
        return copy;
      });
    startTransition(async () => {
      patch((key) => ({ ...overrides[key], ...change }));
      const { ok } = await save();
      if (!ok) {
        patch((key) => before[key]);
        toast("Le changement n'a pas pu être enregistré. Réessaie.");
        return;
      }
      router.refresh();
      toast(done, {
        action: {
          label: "Annuler",
          onClick: () =>
            startTransition(async () => {
              patch((key) => ({ ...overrides[key], ...change, ...undo.change }));
              const restored = await undo.save();
              if (!restored.ok) toast("L'annulation n'a pas pu être enregistrée. Réessaie.");
              router.refresh();
            }),
        },
      });
    });
  };

  const markRead = (keys: string[], read: boolean, done?: string) =>
    run({
      keys,
      change: { read },
      save: () => actions.setRead(keys, read),
      done:
        done ??
        (read
          ? keys.length > 1
            ? `${keys.length} notifications marquées comme lues.`
            : "Notification marquée comme lue."
          : "Notification marquée comme non lue."),
      undo: { change: { read: !read }, save: () => actions.setRead(keys, !read) },
    });
  const hide = (keys: string[]) =>
    run({
      keys,
      change: { dismissed: true },
      save: () => actions.dismiss(keys),
      done: `${keys.length > 1 ? `${keys.length} notifications masquées` : "Notification masquée"}.`,
      undo: { change: { dismissed: false }, save: () => actions.restore(keys) },
    });
  const unhide = (keys: string[]) =>
    run({
      keys,
      change: { dismissed: false },
      save: () => actions.restore(keys),
      done: `${keys.length > 1 ? `${keys.length} notifications affichées` : "Notification affichée"} à nouveau.`,
      undo: { change: { dismissed: true }, save: () => actions.dismiss(keys) },
    });
  const remove = (keys: string[]) =>
    run({
      keys,
      change: { deleted: true },
      save: () => actions.remove(keys),
      done: `${keys.length > 1 ? `${keys.length} notifications supprimées` : "Notification supprimée"}.`,
      undo: { change: { deleted: false }, save: () => actions.undelete(keys) },
    });

  // « Tout marquer comme lu » : les non lues affichées (hors masquées).
  const unreadKeys = shown.flatMap((section) =>
    section.items.filter(isUnread).map((item) => item.key),
  );
  const readAll = () => markRead(unreadKeys, true, "Tout est marqué comme lu.");

  // Actions groupées sur la sélection, puis on quitte la sélection.
  const bulk = (action: "read" | "hide" | "delete") => {
    const keys = chosen;
    stopSelecting();
    if (action === "read") {
      const unread = shown
        .flatMap((section) => section.items)
        .filter((item) => keys.includes(item.key) && !item.read)
        .map((item) => item.key);
      markRead(unread.length > 0 ? unread : keys, true);
    } else if (action === "hide") {
      if (tab === "hidden") unhide(keys);
      else hide(keys);
    } else remove(keys);
  };

  // Ouvrir une notification non lue, c'est l'avoir lue : on l'enregistre, PUIS on y va (en même
  // temps, le recalcul de la page après l'enregistrement pouvait annuler la navigation). Cmd / Ctrl
  // (nouvel onglet) : le lien garde son comportement.
  const open = (item: NotificationItem, event: MouseEvent<HTMLAnchorElement>) => {
    if (item.read || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) {
      return;
    }
    event.preventDefault();
    setOverrides((current) => ({ ...current, [item.key]: { ...current[item.key], read: true } }));
    startTransition(async () => {
      await actions.setRead([item.key], true);
      router.push(item.href);
    });
  };

  const toggle = (key: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const toggleAll = () => setSelected(allChosen ? new Set() : new Set(visibleKeys));

  const openMenu = (item: NotificationItem, button: HTMLElement) => {
    const rect = button.getBoundingClientRect();
    setMenu({
      item,
      anchor: {
        x: Math.round(Math.max(12, rect.right - 220)),
        y: Math.round(rect.bottom + 6),
        side: "top",
        width: 220,
      },
    });
  };

  const tabs: { value: Tab; label: string; count?: number }[] = [
    { value: "all", label: "Toutes" },
    { value: "unread", label: "Non lues", count: unreadTotal },
    { value: "hidden", label: "Masquées", count: hiddenTotal || undefined },
  ];
  const hideLabel = tab === "hidden" ? "Afficher" : "Masquer";

  return (
    <div className="flex w-full max-w-[1400px] flex-col gap-3 lg:gap-4">
      {/* Barre d'outils. Ordinateur : une carte ; téléphone : une rangée sous la barre du haut. */}
      <div className="flex items-center gap-2 lg:min-h-[60px] lg:gap-3 lg:rounded-[20px] lg:bg-surface lg:py-3 lg:pr-3.5 lg:pl-[22px]">
        {selecting ? (
          <>
            <button
              type="button"
              role="checkbox"
              aria-checked={allChosen}
              onClick={toggleAll}
              className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-[13px] bg-surface px-3.5 text-left text-[14px] leading-[normal] font-semibold text-text lg:h-auto lg:flex-none lg:rounded-[8px] lg:bg-transparent lg:px-0"
            >
              <Box checked={allChosen} />
              {chosen.length > 0
                ? `${chosen.length} ${plural(chosen.length, "sélectionnée", "sélectionnées")}`
                : "Tout sélectionner"}
            </button>
            <span aria-hidden className="flex-1 max-lg:hidden" />
            <div className="flex items-center gap-2 max-lg:hidden">
              <ToolButton
                icon={CheckCheck}
                tone="soft"
                disabled={chosen.length === 0 || pending}
                onClick={() => bulk("read")}
              >
                Marquer comme lu
              </ToolButton>
              <ToolButton
                icon={tab === "hidden" ? Eye : EyeOff}
                tone="soft"
                disabled={chosen.length === 0 || pending}
                onClick={() => bulk("hide")}
              >
                {hideLabel}
              </ToolButton>
              <ToolButton
                icon={Trash2}
                tone="danger"
                disabled={chosen.length === 0 || pending}
                onClick={() => bulk("delete")}
              >
                Supprimer
              </ToolButton>
            </div>
            <button
              type="button"
              onClick={stopSelecting}
              className="h-11 shrink-0 rounded-[13px] bg-surface px-3.5 text-[14px] leading-[normal] font-medium text-muted transition-colors duration-150 hover:text-text lg:h-9 lg:rounded-[10px] lg:bg-transparent lg:px-3 lg:text-[12.5px]"
            >
              Annuler
            </button>
          </>
        ) : (
          <>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 max-lg:hidden">
              <p className="truncate text-[15px] leading-[normal] font-semibold">
                {unreadTotal > 0
                  ? `${unreadTotal} ${plural(unreadTotal, "notification non lue", "notifications non lues")}`
                  : "Tout est lu"}
              </p>
              <p className="truncate text-[12.5px] leading-[normal] text-muted">
                Ce qui demande ton attention aujourd&apos;hui
              </p>
            </div>
            <div
              role="group"
              aria-label="Filtrer les notifications"
              className="grid h-11 min-w-0 flex-1 grid-cols-3 gap-0.5 rounded-[13px] bg-surface p-[3px] lg:flex lg:h-9 lg:flex-none lg:rounded-[10px] lg:bg-dlg-tile"
            >
              {tabs.map((item) => {
                const active = tab === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => changeTab(item.value)}
                    className={`tap-44 flex min-w-0 items-center justify-center gap-1.5 rounded-[10px] px-1 text-[13px] max-[359px]:text-[12px] leading-[normal] font-medium whitespace-nowrap transition-[background-color,color,box-shadow] duration-150 lg:rounded-[8px] lg:px-3 lg:text-[12.5px] ${
                      active
                        ? "bg-cta text-on-cta lg:bg-surface lg:text-text lg:shadow-[0_1px_2px_rgba(22,18,40,0.10)]"
                        : "text-muted hover:text-text"
                    }`}
                  >
                    {item.label}
                    {/* Le nombre : sur ordinateur (le téléphone n'a pas la place, kit). */}
                    {item.count ? (
                      <span className="text-muted tabular max-lg:sr-only">{item.count}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <span aria-hidden className="h-[22px] w-px shrink-0 bg-line-2 max-lg:hidden" />
            {/* Téléphone : deux boutons ronds ; ordinateur : boutons avec leur texte. */}
            <button
              type="button"
              aria-label="Tout marquer comme lu"
              disabled={unreadKeys.length === 0 || pending}
              onClick={readAll}
              className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-surface text-violet-text transition-[scale,opacity] duration-150 active:scale-95 disabled:text-faint lg:hidden"
            >
              <CheckCheck aria-hidden size={18} strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label="Sélectionner"
              onClick={() => setSelecting(true)}
              className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-surface text-text transition-[scale] duration-150 active:scale-95 lg:hidden"
            >
              <SquareCheck aria-hidden size={18} strokeWidth={1.8} />
            </button>
            <div className="flex items-center gap-2 max-lg:hidden">
              <ToolButton icon={SquareCheck} tone="outline" onClick={() => setSelecting(true)}>
                Sélectionner
              </ToolButton>
              <ToolButton
                icon={CheckCheck}
                tone="accent"
                disabled={unreadKeys.length === 0 || pending}
                onClick={readAll}
              >
                Tout marquer comme lu
              </ToolButton>
            </div>
          </>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-[22px] bg-surface px-5 py-8 text-center text-[14px] leading-[1.45] text-muted lg:rounded-[20px]">
          {tab === "hidden"
            ? "Aucune notification masquée."
            : tab === "unread"
              ? "Tout est lu. Rien de nouveau pour l'instant."
              : "Rien à signaler."}
        </p>
      ) : (
        <div className="flex flex-col gap-3 min-[68.75rem]:grid min-[68.75rem]:grid-cols-2 min-[68.75rem]:items-start min-[68.75rem]:gap-4">
          {[leftColumn, null].map((column, index) => (
            <div
              key={index}
              className="contents min-[68.75rem]:flex min-[68.75rem]:flex-col min-[68.75rem]:gap-4"
            >
              {visible
                .filter((section) =>
                  column ? column.includes(section.id) : !leftColumn.includes(section.id),
                )
                .map((section) => (
                  <Section
                    key={section.id}
                    section={section}
                    unread={
                      shown.find((s) => s.id === section.id)?.items.filter(isUnread).length ?? 0
                    }
                    selecting={selecting}
                    selected={selected}
                    onToggle={toggle}
                    onOpen={open}
                    onMenu={openMenu}
                  />
                ))}
            </div>
          ))}
        </div>
      )}

      {/* Téléphone, sélection : la barre d'actions noire, fixe en bas (et la place pour elle). */}
      {selecting ? (
        <>
          <span aria-hidden className="h-24 lg:hidden" />
          <div className="fixed inset-x-3 bottom-[max(28px,env(safe-area-inset-bottom))] z-30 grid grid-cols-3 gap-1.5 rounded-[18px] bg-cta p-2 shadow-[0_18px_40px_-12px_rgba(22,18,40,0.5)] lg:hidden">
            {(
              [
                ["read", "Lu", CheckCheck],
                ["hide", hideLabel, tab === "hidden" ? Eye : EyeOff],
                ["delete", "Supprimer", Trash2],
              ] as const
            ).map(([action, label, Icon]) => (
              <button
                key={action}
                type="button"
                disabled={chosen.length === 0 || pending}
                onClick={() => bulk(action)}
                className={`flex h-[52px] flex-col items-center justify-center gap-[3px] rounded-[12px] text-[12px] leading-[normal] transition-[opacity,scale] duration-150 active:scale-[0.97] disabled:opacity-45 ${
                  action === "delete"
                    ? "bg-status-danger font-semibold text-white"
                    : "bg-on-cta/10 font-medium text-on-cta"
                }`}
              >
                <Icon aria-hidden size={18} strokeWidth={1.9} />
                {label}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {/* Menu « ··· » (kit, M-MENU) : sur ordinateur, sous le bouton, aligné à droite, actions
          seules ; sur téléphone, feuille du bas avec le nom de la ligne. */}
      <MenuDialog
        open={menu !== null}
        onClose={() => setMenu(null)}
        anchor={menu?.anchor}
        title={menu?.item.title}
      >
        {menu ? (
          <>
            <MenuRow
              icon={menu.item.read ? MailOpen : CheckCheck}
              onSelect={() => {
                setMenu(null);
                markRead([menu.item.key], !menu.item.read);
              }}
            >
              {menu.item.read ? "Marquer comme non lu" : "Marquer comme lu"}
            </MenuRow>
            <MenuRow
              icon={menu.item.dismissed ? Eye : EyeOff}
              onSelect={() => {
                setMenu(null);
                if (menu.item.dismissed) unhide([menu.item.key]);
                else hide([menu.item.key]);
              }}
            >
              {menu.item.dismissed ? "Afficher à nouveau" : "Masquer"}
            </MenuRow>
            <MenuSeparator />
            <MenuRow
              icon={Trash2}
              destructive
              onSelect={() => {
                setMenu(null);
                remove([menu.item.key]);
              }}
            >
              Supprimer
            </MenuRow>
          </>
        ) : null}
      </MenuDialog>
    </div>
  );
}

// Ligne du menu « ··· » : 46 px sur téléphone, 36 sur ordinateur (kit) ; « Supprimer » en rouge.
function MenuRow({
  icon: Icon,
  destructive = false,
  onSelect,
  children,
}: {
  icon: LucideIcon;
  destructive?: boolean;
  onSelect: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex h-[46px] w-full shrink-0 items-center gap-2.5 rounded-[9px] px-3 text-left text-[15px] leading-[normal] transition-[background-color] duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-dlg-accent md:h-9 md:px-2.5 md:text-[13px] ${
        destructive
          ? "font-semibold text-status-danger hover:bg-dlg-danger-soft"
          : "font-medium text-text hover:bg-dlg-tile"
      }`}
    >
      <Icon aria-hidden size={15} strokeWidth={destructive ? 1.8 : 2} className="shrink-0" />
      {children}
    </button>
  );
}

// Case de sélection dessinée (la vraie case est le bouton qui l'entoure, role="checkbox").
function Box({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid size-6 shrink-0 place-items-center rounded-[7px] transition-colors duration-150 lg:size-5 lg:rounded-[6px] ${
        checked ? "bg-violet text-white" : "bg-surface inset-ring-[1.5px] inset-ring-line-2"
      }`}
    >
      {checked ? <Check size={13} strokeWidth={3} /> : null}
    </span>
  );
}

function ToolButton({
  icon: Icon,
  tone,
  disabled = false,
  onClick,
  children,
}: {
  icon: LucideIcon;
  tone: "outline" | "accent" | "soft" | "danger";
  disabled?: boolean;
  onClick: () => void;
  children: string;
}) {
  const tones = {
    outline: "text-text inset-ring inset-ring-line-2 hover:bg-surface-2",
    accent: "bg-status-accent-soft text-violet-text disabled:bg-dlg-tile disabled:text-faint",
    soft: "bg-dlg-tile text-text hover:bg-dlg-tile-hover",
    danger: "bg-dlg-danger-soft font-semibold text-status-danger",
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-9 shrink-0 items-center gap-[7px] rounded-[10px] px-3 text-[12.5px] leading-[normal] font-medium whitespace-nowrap transition-[background-color,opacity] duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${tones[tone]}`}
    >
      <Icon aria-hidden size={15} strokeWidth={tone === "accent" ? 2 : 1.8} />
      {children}
    </button>
  );
}

function Section({
  section,
  unread,
  selecting,
  selected,
  onToggle,
  onOpen,
  onMenu,
}: {
  section: NotificationSection;
  unread: number;
  selecting: boolean;
  selected: Set<string>;
  onToggle: (key: string) => void;
  onOpen: (item: NotificationItem, event: MouseEvent<HTMLAnchorElement>) => void;
  onMenu: (item: NotificationItem, button: HTMLElement) => void;
}) {
  const Icon = icons[section.id];
  const titleId = `notif-${section.id}`;
  return (
    <section
      aria-labelledby={titleId}
      className={`${order[section.id]} flex min-w-0 flex-col rounded-[22px] bg-surface px-2.5 pt-4 pb-2 lg:rounded-[20px] lg:px-3.5 lg:pt-[18px] lg:pb-2.5 lg:inset-ring lg:inset-ring-line`}
    >
      <div className="flex items-center gap-2 px-2 pb-2.5 lg:pb-3">
        <h2
          id={titleId}
          className="min-w-0 text-[16px] leading-[normal] font-semibold tracking-[-0.01em] lg:text-[15.5px]"
        >
          {section.title}
        </h2>
        {unread > 0 ? (
          <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-accent px-1.5 text-[11px] leading-none font-semibold text-white tabular">
            {unread}
            <span className="sr-only"> {plural(unread, "non lue", "non lues")}</span>
          </span>
        ) : null}
        <span aria-hidden className="flex-1" />
        {section.link ? (
          <Link
            href={section.link.href}
            className="shrink-0 rounded-[4px] text-[12px] leading-[normal] font-medium whitespace-nowrap text-violet-text hover:underline max-lg:hidden"
          >
            {section.link.label}
          </Link>
        ) : null}
      </div>
      {section.items.length === 0 ? (
        <p className="flex items-center gap-2.5 border-t border-line px-2 pt-3 pb-2.5 text-[14px] leading-[normal] text-faint lg:text-[13px]">
          <Icon aria-hidden size={15} strokeWidth={1.8} className="shrink-0" />
          Rien à signaler.
        </p>
      ) : (
        <ul className="flex flex-col">
          {section.items.map((item) => (
            <Row
              key={item.key}
              item={item}
              selecting={selecting}
              checked={selected.has(item.key)}
              onToggle={() => onToggle(item.key)}
              onOpen={(event) => onOpen(item, event)}
              onMenu={(button) => onMenu(item, button)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function Row({
  item,
  selecting,
  checked,
  onToggle,
  onOpen,
  onMenu,
}: {
  item: NotificationItem;
  selecting: boolean;
  checked: boolean;
  onToggle: () => void;
  onOpen: (event: MouseEvent<HTMLAnchorElement>) => void;
  onMenu: (button: HTMLElement) => void;
}) {
  const unread = !item.read && !item.dismissed;
  // Le texte de la ligne : un lien (ouvrir, et marquer lue) ou, en sélection, la case à cocher. Il
  // couvre toute la ligne (after:inset-0) ; le menu « ··· » passe au-dessus.
  const body = (
    <>
      <span className="flex items-baseline gap-2">
        <span
          className={`min-w-0 flex-1 truncate text-[14.5px] leading-[normal] font-semibold lg:text-[13.5px] ${
            item.read ? "text-muted" : "text-text"
          }`}
        >
          {unread ? <span className="sr-only">Non lue : </span> : null}
          {item.title}
        </span>
        {item.right ? (
          <span
            className={`shrink-0 whitespace-nowrap tabular lg:hidden ${
              item.right.strong
                ? "text-[14.5px] font-semibold text-text"
                : "text-[12.5px] text-faint"
            }`}
          >
            {item.right.text}
          </span>
        ) : null}
      </span>
      {item.sub ? (
        <span className="truncate text-[13px] leading-[normal] text-muted lg:text-[12.5px]">
          {item.sub}
        </span>
      ) : null}
    </>
  );
  const bodyClass =
    "flex min-w-0 flex-1 flex-col gap-[3px] text-left outline-none after:absolute after:inset-0 after:rounded-[12px] focus-visible:after:outline-2 focus-visible:after:outline-offset-[-2px] focus-visible:after:outline-accent lg:gap-0.5";

  return (
    <li
      className={`relative flex min-h-[62px] items-center gap-2.5 border-t border-line px-1.5 py-2.5 transition-colors duration-150 lg:min-h-0 lg:gap-3 lg:rounded-[12px] lg:px-2 ${
        checked ? "bg-status-accent-soft/60" : "hover:bg-surface-2/60"
      }`}
    >
      {selecting ? <Box checked={checked} /> : null}
      <span
        aria-hidden
        className={`size-[7px] shrink-0 rounded-full ${unread ? "bg-violet" : "bg-transparent"}`}
      />
      {item.person ? (
        <Avatar
          name={item.person.name}
          photoPath={item.person.photoPath}
          sex={item.person.sex}
          size="notif"
        />
      ) : null}
      {selecting ? (
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          onClick={onToggle}
          className={bodyClass}
        >
          {body}
        </button>
      ) : (
        <Link href={item.href} onClick={onOpen} className={bodyClass}>
          {body}
        </Link>
      )}
      {item.tags?.map((tag) => (
        <span
          key={tag.label}
          className={`h-[22px] shrink-0 rounded-[7px] px-2 text-[11.5px] leading-[22px] font-medium whitespace-nowrap max-lg:hidden ${
            tag.tone === "warn"
              ? "bg-status-warn-soft text-status-warn"
              : "bg-status-neutral-soft text-text-2"
          }`}
        >
          {tag.label}
        </span>
      ))}
      {item.right ? (
        <span
          className={`shrink-0 whitespace-nowrap tabular max-lg:hidden ${
            item.right.strong
              ? "text-[15px] leading-[normal] font-semibold text-text"
              : "text-[12.5px] leading-[normal] text-faint"
          }`}
        >
          {item.right.text}
        </span>
      ) : null}
      {selecting ? null : (
        <button
          type="button"
          aria-label={`Plus d'actions : ${item.title}`}
          onClick={(event) => onMenu(event.currentTarget)}
          className="relative z-10 grid h-11 w-10 shrink-0 place-items-center rounded-[10px] text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-text lg:size-[30px] lg:rounded-[8px]"
        >
          <MoreHorizontal aria-hidden size={18} strokeWidth={1.8} />
        </button>
      )}
    </li>
  );
}

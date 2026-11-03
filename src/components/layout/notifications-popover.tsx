"use client";

import {
  Bell,
  CheckCheck,
  Coins,
  Flag,
  ListChecks,
  MessageSquare,
  UserPen,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useEffectEvent, useId, useRef, useState } from "react";

import { useOpenTaskSheet } from "@/components/blocks/task-sheet";
import { Avatar } from "@/components/ui/avatar";
import { CountBadge } from "@/components/ui/count-badge";
import type {
  NotificationPreview,
  PreviewItem,
  PreviewKind,
} from "@/features/notifications/preview";

import { useShell } from "./shell-context";

// Cloche de l'en-tête (demande d'Antonino du 02/11), sur ordinateur ET sur téléphone : au lieu d'ouvrir
// la page Notifications, elle déplie un popover juste dessous, relié à elle par une languette aux
// courbes douces (façon iOS) qui se fond dans le bord de la carte. Il « sort » de la cloche : à
// l'ouverture, il se déplie depuis elle (le cadre visible part du bouton et s'agrandit jusqu'à la
// carte), et la cloche reste teintée tant qu'il est ouvert. Aligné sur la droite de la cloche ;
// sur un écran étroit, il prend la largeur de l'écran (12 px de marge) et la pointe vise toujours la
// cloche. Sections de la page
// Notifications (messages non lus, tâches du jour ou en retard, séances à encaisser, fiches à
// compléter, compétitions), 3 éléments chacune (non lus d'abord), un lien « Voir tout » par section ;
// une section vide n'est pas montrée. Les données sont lues à chaque ouverture (action serveur). Ouvrir
// un élément le marque lu (comme sur la page) et le mène là où on s'en occupe ; une tâche s'ouvre dans
// sa fenêtre. Popover natif du navigateur (attribut popover) : clic dehors et Échap le ferment, le
// focus revient sur la cloche.
const icons: Record<PreviewKind, LucideIcon> = {
  messages: MessageSquare,
  tasks: ListChecks,
  unpaid: Coins,
  profiles: UserPen,
  competitions: Flag,
};

// Ordinateur : 32 px avec filet (outils de l'en-tête) ; téléphone : 40 px dans la carte des outils.
const bellClass = {
  desktop:
    "relative inline-flex size-8 shrink-0 items-center justify-center rounded-[9px] border border-line text-text-2 transition-colors duration-150 hover:bg-selected-hover aria-expanded:border-violet-line aria-expanded:bg-selected aria-expanded:text-violet-text",
  phone:
    "relative inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-text-2 transition-colors duration-150 hover:bg-selected-hover aria-expanded:bg-selected aria-expanded:text-violet-text",
};
const GUTTER = 12;
// Marge des pages sur téléphone (px-3.5 du corps de page) : l'aperçu s'aligne sur les cartes.
const PAGE_GUTTER = 14;
// La languette : 30 × 10 px, son sommet à 4 px sous la cloche.
const TAB_W = 30;
const TAB_H = 10;
const GAP = TAB_H + 4;
// Distance minimale du milieu de la languette au bord droit de la carte : le coin arrondi (20 px), la
// moitié de la languette (15 px) et un peu d'air.
const TAB_INSET = 20 + TAB_W / 2 + 6;
// Son contour (ouvert : le bas se fond dans la carte) et sa surface (fermée, elle recouvre le filet de
// la carte sous elle). Chaque côté est une courbe en S : épaule creuse, sommet arrondi.
const TAB_EDGE = "M0 10.5 C7 10.5 10 9 12.6 3.6 C13.6 1.6 16.4 1.6 17.4 3.6 C20 9 23 10.5 30 10.5";
const TAB_FILL = `${TAB_EDGE} L30 12 L0 12 Z`;

export function NotificationsPopover({
  notifications,
  phone = false,
}: {
  notifications: NonNullable<ReturnType<typeof useShell>["notifications"]>;
  phone?: boolean;
}) {
  const { notificationCount = 0 } = useShell();
  const panelId = useId();
  const titleId = useId();
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NotificationPreview | null>(null);
  const [failed, setFailed] = useState(false);
  const openTask = useOpenTaskSheet();

  const load = async () => {
    try {
      setData(await notifications.load());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  };

  // À chaque ouverture, les données du moment.
  const refresh = useEffectEvent(() => void load());

  useEffect(() => {
    const element = panel.current;
    if (!element) return;
    // Avant l'affichage : sous la cloche, bord droit aligné sur le sien sans sortir de l'écran, hauteur
    // limitée à l'écran ; --arrow-x : de son bord droit au milieu de la cloche (la pointe).
    const onBeforeToggle = (event: Event) => {
      if ((event as ToggleEvent).newState !== "open" || !button.current) return;
      const box = button.current.getBoundingClientRect();
      const center = box.left + box.width / 2;
      // Téléphone (02/11, essai sur iPhone Pro Max) : toute la largeur des cartes de la page (16 px de
      // chaque côté), quelle que soit la taille de l'écran.
      // Ordinateur : 380 px ; la languette doit rester sur la partie droite du haut de la carte, hors
      // du coin arrondi : la carte dépasse donc la cloche vers la droite s'il le faut.
      const width = phone
        ? window.innerWidth - PAGE_GUTTER * 2
        : Math.min(380, window.innerWidth - GUTTER * 2);
      const right = phone
        ? PAGE_GUTTER
        : Math.max(
            GUTTER,
            Math.min(
              window.innerWidth - box.right,
              window.innerWidth - center - TAB_INSET,
              window.innerWidth - GUTTER - width,
            ),
          );
      element.style.width = `${width}px`;
      element.style.top = `${box.bottom + GAP}px`;
      element.style.right = `${right}px`;
      element.style.setProperty(
        "--arrow-x",
        `${window.innerWidth - right - (box.left + box.width / 2)}px`,
      );
      element.style.setProperty(
        "--max-h",
        `${Math.min(600, window.innerHeight - box.bottom - GAP - GUTTER)}px`,
      );
    };
    const onToggle = (event: Event) => {
      const isOpen = (event as ToggleEvent).newState === "open";
      setOpen(isOpen);
      if (!isOpen) return;
      refresh();
      // Il sort de la cloche : le cadre visible part du bouton et s'agrandit jusqu'à toute la carte
      // (ombre et languette comprises), 280 ms, sans rebond.
      if (!button.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const from = button.current.getBoundingClientRect();
      const to = element.getBoundingClientRect();
      element.animate(
        [
          {
            clipPath: `inset(${from.top - to.top}px ${to.right - from.right}px ${to.bottom - from.bottom}px ${from.left - to.left}px round 12px)`,
            opacity: 0.4,
          },
          { clipPath: "inset(-24px -48px -64px -48px round 20px)", opacity: 1 },
        ],
        { duration: 280, easing: "cubic-bezier(0.32, 0.72, 0, 1)" },
      );
    };
    element.addEventListener("beforetoggle", onBeforeToggle);
    element.addEventListener("toggle", onToggle);
    return () => {
      element.removeEventListener("beforetoggle", onBeforeToggle);
      element.removeEventListener("toggle", onToggle);
    };
  }, [phone]);

  // Ouvrir un élément : il est lu (sans attendre le serveur), le popover se ferme.
  const choose = (item: PreviewItem) => {
    if (!item.read) void notifications.setRead([item.key], true);
    panel.current?.hidePopover();
    if (item.task) openTask?.(item.task);
  };

  const sections = data?.sections.filter((section) => section.total > 0) ?? [];

  return (
    <>
      <button
        ref={button}
        type="button"
        popoverTarget={panelId}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={
          notificationCount > 0 ? `Notifications, ${notificationCount} à voir` : "Notifications"
        }
        className={bellClass[phone ? "phone" : "desktop"]}
      >
        <Bell aria-hidden size={phone ? 16 : 14} strokeWidth={1.8} />
        <CountBadge
          count={notificationCount}
          className={`absolute ${phone ? "top-1 right-1" : "-top-1.5 -right-1.5"}`}
        />
      </button>
      <div
        ref={panel}
        id={panelId}
        popover="auto"
        role="dialog"
        aria-labelledby={titleId}
        // L'ouverture est animée en JavaScript (ci-dessus) ; la fermeture est un simple fondu de 150 ms.
        className="fixed inset-auto m-0 overflow-visible border-0 bg-transparent p-0 text-text transition-[opacity,display,overlay] transition-discrete duration-150 ease-out not-open:opacity-0 backdrop:bg-popover-scrim motion-reduce:transition-none"
      >
        {/* La languette, posée sur le bord haut de la carte, juste sous la cloche. */}
        <svg
          aria-hidden
          width={TAB_W}
          height={12}
          viewBox={`0 0 ${TAB_W} 12`}
          className="absolute -top-[10px] z-10 overflow-visible"
          style={{ right: `calc(var(--arrow-x) - ${TAB_W / 2}px)` }}
        >
          <path d={TAB_FILL} className="fill-popover" />
          <path d={TAB_EDGE} fill="none" strokeWidth={1} className="stroke-popover-line" />
        </svg>
        {/* En sombre, un gris plus clair que les cartes et la page assombrie derrière (::backdrop) : il se
            détache, quelle que soit la page (02/11). */}
        <div className="flex max-h-[var(--max-h)] flex-col overflow-hidden rounded-[20px] border border-popover-line bg-popover shadow-[0_16px_48px_rgba(0,0,0,0.28)]">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line-soft px-4 py-3">
            <h2 id={titleId} className="text-[14px] font-semibold">
              Notifications
              {notificationCount > 0 ? (
                <span className="ml-1.5 font-normal text-muted tabular">{notificationCount}</span>
              ) : null}
            </h2>
            <Link
              href="/coach/notifications"
              onClick={() => panel.current?.hidePopover()}
              className="rounded-md text-[12px] font-medium text-violet-text hover:underline"
            >
              Tout voir
            </Link>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {failed && !data ? (
              <div className="flex flex-col items-start gap-2 px-4 py-5 text-[13px] text-muted">
                Les notifications n&apos;ont pas pu être chargées.
                <button
                  type="button"
                  onClick={() => void load()}
                  className="font-medium text-violet-text hover:underline"
                >
                  Réessayer
                </button>
              </div>
            ) : !data ? (
              <div aria-busy="true" className="flex flex-col gap-3 px-4 py-4">
                <span className="sr-only">Chargement des notifications…</span>
                {[0, 1, 2].map((row) => (
                  <span key={row} className="flex items-center gap-3">
                    <span className="size-6 shrink-0 animate-pulse-soft rounded-full bg-surface-2" />
                    <span className="h-3 flex-1 animate-pulse-soft rounded-[6px] bg-surface-2" />
                  </span>
                ))}
              </div>
            ) : sections.length === 0 ? (
              <p className="flex items-center gap-2.5 px-4 py-6 text-[13px] text-muted">
                <CheckCheck aria-hidden size={16} strokeWidth={1.8} className="text-ok" />
                Tout est à jour.
              </p>
            ) : (
              sections.map((section) => {
                const Icon = icons[section.kind];
                const headingId = `${panelId}-${section.kind}`;
                return (
                  <section
                    key={section.kind}
                    aria-labelledby={headingId}
                    className="border-b border-line-soft px-2 py-2 last:border-b-0"
                  >
                    <h3
                      id={headingId}
                      className="flex items-center gap-2 px-2 pt-1 pb-1.5 text-[12px] font-medium text-muted"
                    >
                      <Icon aria-hidden size={14} strokeWidth={1.8} />
                      <span className="flex-1">{section.title}</span>
                      {section.unread > 0 ? (
                        <CountBadge count={section.unread} tone="soft" />
                      ) : null}
                    </h3>
                    <ul>
                      {section.items.map((item) => (
                        <li key={item.key}>
                          <PreviewRow item={item} onChoose={() => choose(item)} />
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={section.more.href}
                      onClick={() => panel.current?.hidePopover()}
                      className="mx-2 mt-0.5 mb-1 inline-flex rounded-md text-[12px] font-medium text-violet-text hover:underline"
                    >
                      {section.more.label}
                      {section.total > section.items.length ? ` (${section.total})` : ""}
                    </Link>
                  </section>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Une ligne : point violet si non lue, photo pour un message, titre et détail, et à droite l'heure, le
// montant ou « J-3 ».
function PreviewRow({ item, onChoose }: { item: PreviewItem; onChoose: () => void }) {
  const className =
    "flex w-full min-w-0 items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors duration-150 hover:bg-selected-hover focus-visible:bg-selected-hover";
  const body = (
    <>
      {item.person ? (
        <Avatar
          name={item.person.name}
          photoPath={item.person.photoPath}
          sex={item.person.sex}
          size="2xs"
        />
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex min-w-0 items-center gap-2">
          {item.read ? null : (
            <>
              <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-accent" />
              <span className="sr-only">Non lue : </span>
            </>
          )}
          <span
            className={`truncate text-[13px] ${item.read ? "text-muted" : "font-medium text-text"}`}
          >
            {item.title}
          </span>
        </span>
        <span className="truncate text-[12px] text-muted">{item.sub}</span>
      </span>
      {item.meta ? (
        <span className="shrink-0 text-[11.5px] text-muted tabular">{item.meta}</span>
      ) : null}
    </>
  );
  return item.href ? (
    <Link href={item.href} onClick={onChoose} className={className}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onChoose} className={className}>
      {body}
    </button>
  );
}

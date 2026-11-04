"use client";

import {
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Columns3,
  LayoutGrid,
  Rows3,
  Square,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { MobileBarTitle, MobileBarTool } from "@/components/layout/mobile-bar";
import {
  MenuDialog,
  MenuSectionTitle,
  MenuSelectedMark,
  MenuShortcut,
  MenuTile,
  menuRowClass,
  type MenuAnchor,
} from "@/components/ui/overlay";
import type { Discipline } from "@/domain/training/discipline";

import { hoursLabel as hoursText } from "./coaching-hours";
import { GOTO_EVENT, VISIBLE_EVENT, type VisibleDays } from "./scroll-to-day";

// Commandes de la page Agenda, à la façon de Google Agenda (D-78, maquette agenda-v1 validée par
// Antonino le 01/11) : menu des vues (ordinateur, au centre de la barre du haut, raccourcis J S M L,
// T pour aujourd'hui, ← → pour la période), cases Individuelles / Collectives, petit calendrier du mois
// (panneau de gauche ; sur téléphone, déplié sous « Novembre ▾ » avec des points), barre de l'agenda
// du téléphone et sa feuille « Vue et filtres ».

export type AgendaViewItem = {
  key: "jour" | "3jours" | "semaine" | "mois" | "liste";
  label: string;
  href: string;
  active: boolean;
};

const shortcuts: Record<string, AgendaViewItem["key"]> = {
  j: "jour",
  s: "semaine",
  m: "mois",
  l: "liste",
};
const icons: Record<AgendaViewItem["key"], LucideIcon> = {
  liste: Rows3,
  jour: Square,
  "3jours": Columns3,
  semaine: CalendarDays,
  mois: LayoutGrid,
};
const typing = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName));

// Ordinateur : « Semaine ▾ » (avec l'icône de la vue, comme sur téléphone) ouvre le choix de la vue ;
// raccourcis clavier comme Google Agenda.
export function AgendaViewMenu({
  items,
  prevHref,
  nextHref,
  todayHref,
}: {
  items: AgendaViewItem[];
  prevHref: string;
  nextHref: string;
  todayHref: string;
}) {
  const router = useRouter();
  // Kit (boîte 16, ordinateur) : menu ancré de 280 px, centré sous « Semaine ⌄ », à 8 px sous la
  // barre du haut ; voile derrière ; lignes de 50 px avec le raccourci clavier.
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const current = items.find((item) => item.active) ?? items[0];
  const CurrentIcon = icons[current.key];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || typing(event.target)) return;
      if (document.querySelector("dialog[open]")) return;
      const key = event.key.toLowerCase();
      const view = shortcuts[key];
      const target = view
        ? items.find((item) => item.key === view)?.href
        : key === "t"
          ? todayHref
          : event.key === "ArrowLeft"
            ? prevHref
            : event.key === "ArrowRight"
              ? nextHref
              : null;
      if (target) {
        event.preventDefault();
        router.push(target, { scroll: false });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [items, prevHref, nextHref, todayHref, router]);

  const openMenu = () => {
    const button = trigger.current?.getBoundingClientRect();
    if (!button) return;
    const bar = trigger.current?.closest("header")?.getBoundingClientRect();
    setAnchor({
      x: Math.round(button.left + button.width / 2 - 140),
      y: Math.round((bar?.bottom ?? button.bottom) + 8),
      side: "top",
      width: 280,
    });
  };
  const close = () => setAnchor(null);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        aria-label={`Vue : ${current.label}. Changer de vue`}
        onClick={openMenu}
        className="flex h-8 items-center gap-2 rounded-lg border border-line pr-2.5 pl-3 text-[12px] font-medium text-text transition-colors duration-150 hover:bg-selected-hover"
      >
        <CurrentIcon aria-hidden size={14} strokeWidth={1.8} className="text-violet-text" />
        {current.label}
        <ChevronDown aria-hidden size={13} strokeWidth={2} className="text-muted" />
      </button>
      <MenuDialog open={anchor !== null} onClose={close} label="Vue et filtres" anchor={anchor}>
        <div role="menu" aria-label="Vue de l'agenda" className="flex flex-col gap-0.5">
          {items.map((item) => {
            const letter = Object.entries(shortcuts).find(([, view]) => view === item.key)?.[0];
            return (
              <Link
                key={item.key}
                href={item.href}
                scroll={false}
                role="menuitemradio"
                aria-checked={item.active}
                onClick={close}
                className={menuRowClass({ selected: item.active, anchored: true })}
              >
                <MenuTile icon={icons[item.key]} />
                <span className="min-w-0 flex-1 text-[15.5px] leading-[normal] font-semibold text-text">
                  {item.label}
                </span>
                {letter ? <MenuShortcut>{letter.toUpperCase()}</MenuShortcut> : null}
                {item.active ? <MenuSelectedMark /> : null}
              </Link>
            );
          })}
        </div>
      </MenuDialog>
    </>
  );
}

// Cases Individuelles / Collectives (comme « Mes agendas » de Google). Toutes les deux cochées :
// toutes les séances ; on ne peut pas décocher la dernière.
export type AgendaKind = "toutes" | "individuelles" | "collectives";

export function AgendaFilters({
  kind,
  hrefs,
  large = false,
}: {
  kind: AgendaKind;
  hrefs: Record<AgendaKind, string>;
  large?: boolean;
}) {
  const router = useRouter();
  // La case change tout de suite (sans attendre l'agenda rechargé) ; elle suit ensuite l'adresse.
  const [shown, setShown] = useState(kind);
  const [seen, setSeen] = useState(kind);
  if (seen !== kind) {
    setSeen(kind);
    setShown(kind);
  }
  const individual = shown !== "collectives";
  const group = shown !== "individuelles";
  const go = (nextIndividual: boolean, nextGroup: boolean) => {
    const next: AgendaKind =
      nextIndividual && nextGroup ? "toutes" : nextIndividual ? "individuelles" : "collectives";
    setShown(next);
    router.replace(hrefs[next], { scroll: false });
  };
  // Feuille du téléphone (kit, 16) : lignes de 50 px, case de 22 px violette, pastille de couleur à
  // droite (individuelles en violet, collectives en violet clair).
  if (large) {
    const row = (
      label: string,
      checked: boolean,
      onlyOne: boolean,
      toggle: () => void,
      dot: string,
    ) => (
      <label
        className={`flex min-h-[50px] cursor-pointer items-center gap-3.5 rounded-[14px] px-3 py-1.5 ${
          onlyOne ? "cursor-default" : ""
        }`}
        title={onlyOne ? "Au moins un type de séance reste affiché" : undefined}
      >
        <span className="relative grid size-[22px] shrink-0 place-items-center">
          <input
            type="checkbox"
            checked={checked}
            disabled={onlyOne}
            onChange={toggle}
            className="peer absolute inset-0 m-0 size-full cursor-pointer appearance-none rounded-[7px] border-[1.5px] border-dlg-check-line bg-dlg transition-colors duration-150 checked:border-dlg-accent checked:bg-dlg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dlg-accent disabled:cursor-default"
          />
          <Check
            aria-hidden
            size={13}
            strokeWidth={3}
            className="pointer-events-none relative hidden text-white peer-checked:block"
          />
        </span>
        <span className="min-w-0 flex-1 text-[15.5px] leading-[normal] font-medium text-text">
          {label}
        </span>
        <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${dot}`} />
      </label>
    );
    return (
      <fieldset className="flex flex-col gap-0.5">
        <legend className="contents">
          <MenuSectionTitle>SÉANCES</MenuSectionTitle>
        </legend>
        {row(
          "Individuelles",
          individual,
          individual && !group,
          () => go(!individual, group),
          "bg-dlg-accent",
        )}
        {row(
          "Collectives",
          group,
          group && !individual,
          () => go(individual, !group),
          "bg-dlg-group-dot",
        )}
      </fieldset>
    );
  }
  const box = (label: string, checked: boolean, onlyOne: boolean, toggle: () => void) => (
    <label
      className={`flex cursor-pointer items-center gap-3 ${
        large
          ? "min-h-11 px-1 text-[15px]"
          : "h-8 rounded-lg px-1.5 text-[13px] hover:bg-selected-hover"
      } ${onlyOne ? "cursor-default" : ""}`}
      title={onlyOne ? "Au moins un type de séance reste affiché" : undefined}
    >
      {/* Case native (visible, cliquable, au clavier), dessinée par les jetons ; la coche passe
          dessus sans capter le clic. */}
      <span className="relative grid size-4 shrink-0 place-items-center">
        <input
          type="checkbox"
          checked={checked}
          disabled={onlyOne}
          onChange={toggle}
          className="peer size-4 cursor-pointer appearance-none rounded-[4px] border-[1.5px] border-line-2 transition-colors duration-150 checked:border-accent checked:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet disabled:cursor-default"
        />
        <Check
          aria-hidden
          size={12}
          strokeWidth={3}
          className="pointer-events-none invisible absolute text-on-accent peer-checked:visible"
        />
      </span>
      <span className="text-text-2">{label}</span>
    </label>
  );
  return (
    <fieldset className="flex flex-col">
      <legend
        className={`${large ? "px-1 pb-1" : "px-1.5 pb-1"} text-[12px] font-medium text-muted`}
      >
        Séances
      </legend>
      {box("Individuelles", individual, individual && !group, () => go(!individual, group))}
      {box("Collectives", group, group && !individual, () => go(individual, !group))}
    </fieldset>
  );
}

// Petit calendrier du mois. Aujourd'hui en gras violet et un peu plus grand, sans rond (02/11) ; la
// semaine affichée surlignée en gris (02/11, toujours) ; le jour affiché cerclé hors de cette semaine ; la semaine
// affichée surlignée ; un jour ouvre cette date (dans la vue en cours). `dayHref` : adresse modèle où
// « __DATE__ » est remplacé par la date. `dots` (téléphone) : les disciplines du jour en petits points.
// Glisser le calendrier sur le côté change de mois (02/11), comme les flèches, sans limite.
const monthTitle = new Intl.DateTimeFormat("fr-BE", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const monthOnly = new Intl.DateTimeFormat("fr-BE", { month: "long", timeZone: "UTC" });
const dayMonth = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const shortDay = new Intl.DateTimeFormat("fr-BE", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
// « Cette semaine », ou « semaine du 9 au 15 nov. » (« du 26 oct. au 1 nov. » à cheval sur deux mois).
function weekName(monday: string, today: string): string {
  const todayDate = utc(today);
  todayDate.setUTCDate(todayDate.getUTCDate() - ((todayDate.getUTCDay() + 6) % 7));
  if (iso(todayDate) === monday) return "Cette semaine";
  const sunday = utc(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  const from =
    monday.slice(0, 7) === iso(sunday).slice(0, 7)
      ? String(utc(monday).getUTCDate())
      : dayMonth.format(utc(monday));
  return `Semaine du ${from} au ${dayMonth.format(sunday)}`;
}
const utc = (day: string) => new Date(`${day}T00:00:00Z`);
const iso = (date: Date) => date.toISOString().slice(0, 10);
// La rangée des mois (jusqu'à quatre ans) s'ouvre sur le mois affiché, au centre.
const centerActiveMonth = (row: HTMLDivElement | null) => {
  const active = row?.querySelector<HTMLElement>("[aria-current]");
  if (row && active)
    row.scrollLeft = active.offsetLeft - (row.clientWidth - active.offsetWidth) / 2;
};
const dotClass: Record<Discipline, string> = {
  running: "bg-run-fill",
  strength: "bg-strength-fill",
  hyrox: "bg-hyrox-fill",
  hybrid: "bg-hybrid-fill",
};

export function AgendaMiniMonth({
  month: initialMonth,
  today,
  selected,
  weekStart,
  dayHref,
  dots,
}: {
  month: string;
  today: string;
  selected: string | null;
  weekStart: string | null;
  dayHref: string;
  dots?: Record<string, Discipline[]>;
}) {
  const [month, setMonth] = useState(initialMonth);
  // Sens du dernier changement de mois : le nouveau mois arrive de ce côté.
  const [from, setFrom] = useState<"left" | "right" | null>(null);
  // Une autre période affichée : le petit calendrier revient sur son mois (ajusté au rendu).
  const [shownFor, setShownFor] = useState(initialMonth);
  if (shownFor !== initialMonth) {
    setShownFor(initialMonth);
    setMonth(initialMonth);
    setFrom(null);
  }
  const press = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const first = utc(`${month}-01`);
  const start = new Date(first);
  start.setUTCDate(1 - ((first.getUTCDay() + 6) % 7));
  const shift = (direction: number) => {
    const next = new Date(first);
    next.setUTCMonth(next.getUTCMonth() + direction);
    setFrom(direction > 0 ? "right" : "left");
    setMonth(iso(next).slice(0, 7));
  };
  const weekEnd = weekStart ? iso(new Date(utc(weekStart).getTime() + 6 * 86_400_000)) : null;
  const title = monthTitle.format(first);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between pl-1.5">
        <span className="text-[13px] font-medium">
          {title.charAt(0).toUpperCase() + title.slice(1)}
        </span>
        <span className="flex">
          <button
            type="button"
            aria-label="Mois précédent"
            onClick={() => shift(-1)}
            className="grid size-8 place-items-center rounded-lg text-muted transition-colors duration-150 hover:bg-selected-hover hover:text-text"
          >
            <ChevronLeft aria-hidden size={15} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            aria-label="Mois suivant"
            onClick={() => shift(1)}
            className="grid size-8 place-items-center rounded-lg text-muted transition-colors duration-150 hover:bg-selected-hover hover:text-text"
          >
            <ChevronRight aria-hidden size={15} strokeWidth={1.8} />
          </button>
        </span>
      </div>
      <div
        key={month}
        aria-label={`Calendrier, ${title}`}
        role="group"
        // Glisser sur le côté (au moins 40 px, nettement plus horizontal que vertical) change de mois ;
        // le navigateur garde le défilement vertical.
        onPointerDown={(event) => {
          press.current = { x: event.clientX, y: event.clientY };
          swiped.current = false;
        }}
        onPointerUp={(event) => {
          const origin = press.current;
          press.current = null;
          if (!origin) return;
          const dx = event.clientX - origin.x;
          const dy = event.clientY - origin.y;
          if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
          swiped.current = true;
          shift(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => {
          press.current = null;
        }}
        // Un glissé n'est pas un appui sur le jour où il finit.
        onClickCapture={(event) => {
          if (!swiped.current) return;
          event.preventDefault();
          event.stopPropagation();
          swiped.current = false;
        }}
        className={`grid touch-pan-y grid-cols-7 transition-[opacity,translate] duration-200 ease-out select-none motion-reduce:transition-none ${
          from === "right"
            ? "starting:translate-x-6 starting:opacity-0"
            : from === "left"
              ? "starting:-translate-x-6 starting:opacity-0"
              : ""
        }`}
      >
        {["L", "M", "M", "J", "V", "S", "D"].map((day, index) => (
          <span
            key={index}
            aria-hidden
            className="grid h-7 place-items-center text-[10.5px] text-faint"
          >
            {day}
          </span>
        ))}
        {Array.from({ length: 42 }, (_, index) => {
          const date = new Date(start);
          date.setUTCDate(start.getUTCDate() + index);
          const day = iso(date);
          const inMonth = day.slice(0, 7) === month;
          const isToday = day === today;
          const inWeek = weekStart && weekEnd ? day >= weekStart && day <= weekEnd : false;
          const weekday = (date.getUTCDay() + 6) % 7;
          const dayDots = dots?.[day] ?? [];
          return (
            <Link
              key={day}
              href={dayHref.replace("__DATE__", day)}
              scroll={false}
              draggable={false}
              aria-label={date.toLocaleDateString("fr-BE", {
                weekday: "long",
                day: "numeric",
                month: "long",
                timeZone: "UTC",
              })}
              aria-current={day === selected ? "date" : undefined}
              className={`flex flex-col items-center ${dots ? "h-11" : "h-8"} ${
                inWeek
                  ? `bg-bar lg:bg-chip ${weekday === 0 ? "rounded-l-full" : ""} ${weekday === 6 ? "rounded-r-full" : ""}`
                  : ""
              }`}
            >
              <span
                className={`grid size-7 place-items-center rounded-full tabular transition-colors duration-150 ${
                  isToday
                    ? "text-[15px] font-bold text-violet-text"
                    : `text-[11.5px] ${
                        day === selected && !inWeek
                          ? "text-text ring-[1.5px] ring-violet-line"
                          : day === selected
                            ? "font-semibold text-text"
                            : inMonth
                              ? "text-text-2 hover:bg-selected-hover"
                              : "text-faint"
                      }`
                }`}
              >
                {date.getUTCDate()}
              </span>
              {dots ? (
                <span aria-hidden className="flex h-1.5 gap-[2px]">
                  {dayDots.slice(0, 3).map((discipline, i) => (
                    <span key={i} className={`size-1 rounded-full ${dotClass[discipline]}`} />
                  ))}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Téléphone : barre de l'agenda sous la barre Coory. « Novembre ▾ » déplie le petit calendrier (avec
// des points, aujourd'hui en gras violet) et les mois suivants ; « 3 jours ▾ » ouvre la feuille
// « Vue et filtres ». Dans le menu du mois, au-dessus du petit calendrier (02/11), les heures de
// coaching de la semaine affichée : masquées au premier regard, elles suivent les jours qu'on fait
// défiler (elles ne sont plus sous la grille).
export function AgendaPhoneBar({
  monthLabel,
  hours,
  views,
  kind,
  kindHrefs,
  mini,
  months,
  todayLink,
}: {
  monthLabel: string;
  // Heures de coaching à l'ouverture (filtres compris) : la semaine du premier jour visible (Jour,
  // 3 jours, Semaine), sinon la période affichée avec son nom (Mois, Liste).
  hours: { weekStart: string; minutes: number } | { label: string; minutes: number };
  views: AgendaViewItem[];
  kind: AgendaKind;
  kindHrefs: Record<AgendaKind, string>;
  mini: Parameters<typeof AgendaMiniMonth>[0];
  months: { label: string; year?: string; href: string; active: boolean }[];
  // « Aujourd'hui » : la vue en cours à la date du jour, et la colonne où la grille glisse (Jour,
  // 3 jours, Semaine ; null pour Mois et Liste, qui se rouvrent).
  todayLink: { href: string; column: string | null };
}) {
  const [unfolded, setUnfolded] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const pathname = usePathname();
  const search = useSearchParams();
  // Nouvelle adresse (une vue, un jour, un mois choisis) : on referme ce qui était ouvert.
  const location = `${pathname}?${search.toString()}`;
  const [seen, setSeen] = useState(location);
  if (seen !== location) {
    setSeen(location);
    setUnfolded(false);
    setSheetOpen(false);
  }
  // Mois déplié : la bande de la semaine de la vue Jour se cache (02/11), elle revient en le repliant.
  useEffect(() => {
    const html = document.documentElement;
    html.toggleAttribute("data-agenda-month", unfolded);
    return () => html.removeAttribute("data-agenda-month");
  }, [unfolded]);
  const current = views.find((view) => view.active) ?? views[0];
  const CurrentIcon = icons[current.key];
  // Le mois suit les jours qu'on fait défiler (comme Google Agenda).
  const [visibleMonth, setVisibleMonth] = useState<string | null>(null);
  const [visibleWeek, setVisibleWeek] = useState<{ weekStart: string; minutes: number } | null>(
    null,
  );
  const opening = `${monthLabel}:${"weekStart" in hours ? hours.weekStart : hours.label}:${hours.minutes}`;
  const [labelFor, setLabelFor] = useState(opening);
  if (labelFor !== opening) {
    setLabelFor(opening);
    setVisibleMonth(null);
    setVisibleWeek(null);
  }
  const shownHours = visibleWeek ?? hours;
  const hoursLabel =
    "weekStart" in shownHours ? weekName(shownHours.weekStart, mini.today) : shownHours.label;
  useEffect(() => {
    const onVisible = (event: Event) => {
      const { date, weekStart, weekMinutes } = (event as CustomEvent<VisibleDays>).detail;
      const name = monthOnly.format(utc(date));
      setVisibleMonth(name.charAt(0).toUpperCase() + name.slice(1));
      setVisibleWeek({ weekStart, minutes: weekMinutes });
    };
    window.addEventListener(VISIBLE_EVENT, onVisible);
    return () => window.removeEventListener(VISIBLE_EVENT, onVisible);
  }, []);
  return (
    <div className="shrink-0 lg:hidden">
      {/* Dans la barre du haut (02/11, pour laisser la place au calendrier) : le mois à la place du nom
          de la page, et l'icône de la vue juste avant l'assistant IA. */}
      <MobileBarTitle>
        <button
          type="button"
          aria-expanded={unfolded}
          onClick={() => setUnfolded((value) => !value)}
          className="flex h-11 min-w-0 items-center gap-0.5 rounded-xl text-[17px] font-semibold tracking-tight"
        >
          <span className="truncate">{visibleMonth ?? monthLabel}</span>
          <ChevronDown
            aria-hidden
            size={16}
            strokeWidth={2.2}
            className={`shrink-0 text-muted transition-transform duration-200 ${unfolded ? "rotate-180" : ""}`}
          />
        </button>
      </MobileBarTitle>
      <MobileBarTool>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label={`Vue : ${current.label}. Vue et filtres`}
          title={current.label}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-violet-text transition-colors duration-150 hover:bg-selected-hover active:bg-selected-hover"
        >
          <CurrentIcon aria-hidden size={19} strokeWidth={1.8} />
        </button>
      </MobileBarTool>
      {unfolded ? (
        <div className="px-3 pt-1 pb-2">
          {/* Heures totales de coaching de la semaine affichée, au-dessus du mois (02/11). */}
          <p className="mb-3 flex h-11 items-center gap-2.5 rounded-xl bg-surface px-3 text-[13px] text-text-2">
            <Clock3 aria-hidden size={16} strokeWidth={1.8} className="shrink-0 text-violet-text" />
            <span className="min-w-0 flex-1 truncate">
              Heures totales · {hoursLabel.charAt(0).toLowerCase() + hoursLabel.slice(1)}
            </span>
            <span className="shrink-0 text-[15px] font-semibold text-text tabular">
              {hoursText(shownHours.minutes)}
            </span>
          </p>
          {/* La semaine affichée, en gris : elle suit les jours qu'on fait défiler. */}
          <AgendaMiniMonth {...mini} weekStart={visibleWeek?.weekStart ?? mini.weekStart} />
          <div
            ref={centerActiveMonth}
            className="-mx-3 mt-2 flex items-center gap-2 overflow-x-auto px-3 [scrollbar-width:none]"
          >
            {months.map((month) => (
              <span key={month.href} className="contents">
                {month.year ? (
                  <span className="shrink-0 px-1 text-[14px] font-semibold">{month.year}</span>
                ) : null}
                <Link
                  href={month.href}
                  scroll={false}
                  aria-current={month.active ? "date" : undefined}
                  className={`h-9 shrink-0 rounded-full border px-4 text-[13px] leading-[34px] ${
                    month.active
                      ? "border-violet-line bg-violet-soft font-medium text-violet-text"
                      : "border-line text-text-2"
                  }`}
                >
                  {month.label}
                </Link>
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {/* Kit (boîte 16, téléphone) : feuille « Vue et filtres » : Aujourd'hui (tuile violette, la
          date à droite), VUE (lignes de 62 px, coche violette sur la vue en cours), SÉANCES (cases). */}
      <MenuDialog open={sheetOpen} onClose={() => setSheetOpen(false)} title="Vue et filtres">
        {/* Aujourd'hui (demande d'Antonino du 02/11) : la grille y glisse sans recharger quand elle
            contient ce jour ; sinon la vue se rouvre à la date du jour. */}
        <Link
          href={todayLink.href}
          scroll={false}
          onClick={(event) => {
            const column = todayLink.column;
            if (column && document.querySelector(`[data-day-col][data-date="${column}"]`)) {
              event.preventDefault();
              window.dispatchEvent(new CustomEvent(GOTO_EVENT, { detail: column }));
            }
            setSheetOpen(false);
          }}
          className={menuRowClass()}
        >
          <MenuTile icon={CalendarCheck} tone="accent" />
          <span className="min-w-0 flex-1 text-[15.5px] leading-[normal] font-semibold text-dlg-accent-ink">
            Aujourd&apos;hui
          </span>
          <span className="shrink-0 text-[12.5px] leading-[normal] font-semibold whitespace-nowrap text-dlg-accent">
            {shortDay.format(utc(mini.today))}
          </span>
        </Link>
        <MenuSectionTitle>VUE</MenuSectionTitle>
        <nav aria-label="Vue de l'agenda" className="flex flex-col gap-0.5">
          {views.map((view) => (
            <Link
              key={view.key}
              href={view.href}
              scroll={false}
              aria-current={view.active ? "page" : undefined}
              className={menuRowClass({ selected: view.active })}
            >
              <MenuTile icon={icons[view.key]} />
              <span className="min-w-0 flex-1 text-[15.5px] leading-[normal] font-semibold text-text">
                {view.label}
              </span>
              {view.active ? <MenuSelectedMark /> : null}
            </Link>
          ))}
        </nav>
        <AgendaFilters kind={kind} hrefs={kindHrefs} large />
      </MenuDialog>
    </div>
  );
}

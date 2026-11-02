"use client";

import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  LayoutGrid,
  Rows3,
  Square,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { Discipline } from "@/domain/training/discipline";

import { VISIBLE_EVENT } from "./scroll-to-day";

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
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const current = items.find((item) => item.active) ?? items[0];
  const CurrentIcon = icons[current.key];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
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
    const onPointer = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [items, prevHref, nextHref, todayHref, router]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Vue : ${current.label}. Changer de vue`}
        onClick={() => setOpen((value) => !value)}
        className="flex h-8 items-center gap-2 rounded-lg border border-line pr-2.5 pl-3 text-[12px] font-medium text-text transition-colors duration-150 hover:bg-selected-hover"
      >
        <CurrentIcon aria-hidden size={14} strokeWidth={1.8} className="text-violet-text" />
        {current.label}
        <ChevronDown aria-hidden size={13} strokeWidth={2} className="text-muted" />
      </button>
      {open ? (
        <div
          role="menu"
          aria-label="Vue de l'agenda"
          className="absolute top-10 left-1/2 z-50 w-52 -translate-x-1/2 rounded-xl border border-line bg-surface p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
        >
          {items.map((item) => {
            const letter = Object.entries(shortcuts).find(([, view]) => view === item.key)?.[0];
            return (
              <Link
                key={item.key}
                href={item.href}
                scroll={false}
                role="menuitemradio"
                aria-checked={item.active}
                onClick={() => setOpen(false)}
                className={`flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors duration-150 ${
                  item.active
                    ? "bg-selected font-medium text-text"
                    : "text-text-2 hover:bg-selected-hover"
                }`}
              >
                <Check
                  aria-hidden
                  size={14}
                  strokeWidth={2}
                  className={item.active ? "text-violet-text" : "opacity-0"}
                />
                <span className="flex-1">{item.label}</span>
                {letter ? (
                  <kbd aria-hidden className="font-sans text-[11px] text-faint">
                    {letter.toUpperCase()}
                  </kbd>
                ) : null}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
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

// Petit calendrier du mois. Aujourd'hui dans un rond violet ; le jour affiché cerclé ; la semaine
// affichée surlignée ; un jour ouvre cette date (dans la vue en cours). `dayHref` : adresse modèle où
// « __DATE__ » est remplacé par la date. `dots` (téléphone) : les disciplines du jour en petits points.
const monthTitle = new Intl.DateTimeFormat("fr-BE", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const monthOnly = new Intl.DateTimeFormat("fr-BE", { month: "long", timeZone: "UTC" });
const utc = (day: string) => new Date(`${day}T00:00:00Z`);
const iso = (date: Date) => date.toISOString().slice(0, 10);
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
  // Une autre période affichée : le petit calendrier revient sur son mois (ajusté au rendu).
  const [shownFor, setShownFor] = useState(initialMonth);
  if (shownFor !== initialMonth) {
    setShownFor(initialMonth);
    setMonth(initialMonth);
  }
  const first = utc(`${month}-01`);
  const start = new Date(first);
  start.setUTCDate(1 - ((first.getUTCDay() + 6) % 7));
  const shift = (direction: number) => {
    const next = new Date(first);
    next.setUTCMonth(next.getUTCMonth() + direction);
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
      <div className="grid grid-cols-7" aria-label={`Calendrier, ${title}`} role="group">
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
              aria-label={date.toLocaleDateString("fr-BE", {
                weekday: "long",
                day: "numeric",
                month: "long",
                timeZone: "UTC",
              })}
              aria-current={day === selected ? "date" : undefined}
              className={`flex flex-col items-center ${dots ? "h-11" : "h-8"} ${
                inWeek
                  ? `bg-violet-soft ${weekday === 0 ? "rounded-l-full" : ""} ${weekday === 6 ? "rounded-r-full" : ""}`
                  : ""
              }`}
            >
              <span
                className={`grid size-7 place-items-center rounded-full text-[11.5px] tabular transition-colors duration-150 ${
                  isToday
                    ? "bg-accent font-semibold text-on-accent"
                    : day === selected && !inWeek
                      ? "text-text ring-[1.5px] ring-violet-line"
                      : inMonth
                        ? "text-text-2 hover:bg-selected-hover"
                        : "text-faint"
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
// des points, aujourd'hui dans un rond violet) et les mois suivants ; « 3 jours ▾ » ouvre la feuille
// « Vue et filtres ».
export function AgendaPhoneBar({
  monthLabel,
  views,
  kind,
  kindHrefs,
  mini,
  months,
}: {
  monthLabel: string;
  views: AgendaViewItem[];
  kind: AgendaKind;
  kindHrefs: Record<AgendaKind, string>;
  mini: Parameters<typeof AgendaMiniMonth>[0];
  months: { label: string; year?: string; href: string; active: boolean }[];
}) {
  const [unfolded, setUnfolded] = useState(false);
  const sheet = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const search = useSearchParams();
  // Nouvelle adresse (une vue, un jour, un mois choisis) : on referme ce qui était ouvert.
  const location = `${pathname}?${search.toString()}`;
  const [seen, setSeen] = useState(location);
  if (seen !== location) {
    setSeen(location);
    setUnfolded(false);
  }
  useEffect(() => {
    sheet.current?.close();
  }, [location]);
  const current = views.find((view) => view.active) ?? views[0];
  const CurrentIcon = icons[current.key];
  // Le mois suit les jours qu'on fait défiler (comme Google Agenda).
  const [visibleMonth, setVisibleMonth] = useState<string | null>(null);
  const [labelFor, setLabelFor] = useState(monthLabel);
  if (labelFor !== monthLabel) {
    setLabelFor(monthLabel);
    setVisibleMonth(null);
  }
  useEffect(() => {
    const onVisible = (event: Event) => {
      const date = (event as CustomEvent<string>).detail;
      const name = monthOnly.format(utc(date));
      setVisibleMonth(name.charAt(0).toUpperCase() + name.slice(1));
    };
    window.addEventListener(VISIBLE_EVENT, onVisible);
    return () => window.removeEventListener(VISIBLE_EVENT, onVisible);
  }, []);
  return (
    <div className="shrink-0 lg:hidden">
      <div className="flex h-14 items-center justify-between px-3">
        <button
          type="button"
          aria-expanded={unfolded}
          onClick={() => setUnfolded((value) => !value)}
          className="flex h-11 items-center gap-1.5 rounded-xl pr-1 pl-1.5 text-[18px] font-semibold tracking-tight"
        >
          {visibleMonth ?? monthLabel}
          <ChevronDown
            aria-hidden
            size={16}
            strokeWidth={2.2}
            className={`text-muted transition-transform duration-200 ${unfolded ? "rotate-180" : ""}`}
          />
        </button>
        <button
          type="button"
          onClick={() => sheet.current?.showModal()}
          aria-label={`Vue : ${current.label}. Vue et filtres`}
          className="flex h-11 items-center gap-1.5 rounded-xl border border-line pr-2.5 pl-3 text-[13px] font-medium"
        >
          <CurrentIcon aria-hidden size={16} strokeWidth={1.8} className="text-violet-text" />
          {current.label}
          <ChevronDown aria-hidden size={13} strokeWidth={2} className="text-muted" />
        </button>
      </div>
      {unfolded ? (
        <div className="px-3 pb-2">
          <AgendaMiniMonth {...mini} />
          <div className="-mx-3 mt-2 flex items-center gap-2 overflow-x-auto px-3 [scrollbar-width:none]">
            {months.map((month) => (
              <span key={month.href} className="contents">
                {month.year ? (
                  <span className="shrink-0 px-1 text-[14px] font-semibold">{month.year}</span>
                ) : null}
                <Link
                  href={month.href}
                  scroll={false}
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
      <dialog
        ref={sheet}
        aria-label="Vue et filtres"
        onClick={(event) => {
          if (event.target === event.currentTarget) sheet.current?.close();
        }}
        className="fixed inset-x-0 top-auto bottom-0 m-0 w-full max-w-none translate-none rounded-t-[24px] border-t border-line bg-surface px-4 pt-2 pb-[max(20px,env(safe-area-inset-bottom))] text-text transition-[translate,display,overlay] transition-discrete duration-[260ms] ease-[cubic-bezier(0.32,0.72,0,1)] backdrop:bg-black/45 not-open:translate-y-full starting:open:translate-y-full motion-reduce:transition-none lg:hidden"
      >
        <div aria-hidden className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-2" />
        <p className="px-1 pb-1 text-[12px] font-medium text-muted">Vue</p>
        <nav aria-label="Vue de l'agenda" className="flex flex-col">
          {views.map((view) => {
            const Icon = icons[view.key];
            return (
              <Link
                key={view.key}
                href={view.href}
                scroll={false}
                aria-current={view.active ? "page" : undefined}
                className={`flex min-h-12 items-center gap-3.5 rounded-xl px-3 text-[15px] ${
                  view.active ? "bg-selected font-medium" : "text-text-2"
                }`}
              >
                <Icon
                  aria-hidden
                  size={20}
                  strokeWidth={1.7}
                  className={view.active ? "text-violet-text" : "text-muted"}
                />
                {view.label}
              </Link>
            );
          })}
        </nav>
        <div className="my-2 border-t border-line-soft" />
        <AgendaFilters kind={kind} hrefs={kindHrefs} large />
      </dialog>
    </div>
  );
}

"use client";

import { Check, ChevronLeft, ChevronsUpDown, Minus, Plus, Search } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

import {
  RECURRENCE_WEEKDAYS,
  SET_POSITIONS,
  describeRule,
  normalizeRule,
  recurrenceRuleSchema,
  weekdayOfDate,
  weeklyRule,
  type RecurrenceFreq,
  type RecurrenceRule,
  type RecurrenceWeekday,
  type SetPosition,
} from "@/domain/sessions/recurrence";
import { foldText } from "@/domain/documents/documents";
import type { SessionFormInput } from "@/features/sessions/schemas";

// Pièces de la fenêtre « Nouvelle séance » façon Calendrier d'Apple (D-204) : puces de date et
// d'heure, interrupteur, lignes et options de la feuille du téléphone, menus déroulants et cases de la
// bulle de l'ordinateur, écran « Personnalisé ». Le formulaire lui-même : session-apple-fields.tsx.

export type Athlete = { id: string; name: string };
export type Layout = "sheet" | "popover";

export const MAX_DURATION = 480;
export const MIN_DURATION = 15;
export const toMinutes = (time: string) => {
  const match = /^(\d{2}):(\d{2})/.exec(time);
  return match ? Number(match[1]) * 60 + Number(match[2]) : Number.NaN;
};
export const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

const isoDay = /^\d{4}-\d{2}-\d{2}$/;
const dayShort = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const dayLong = new Intl.DateTimeFormat("fr-BE", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
// « 24 nov. 2026 » (téléphone) ; « mer. 25 nov. 2026 » (ordinateur, comme le Mac).
export const formatDay = (iso: string, long = false) =>
  isoDay.test(iso) ? (long ? dayLong : dayShort).format(new Date(`${iso}T00:00:00Z`)) : "—";

export function initialRule(v: SessionFormInput): RecurrenceRule | null {
  if (!v.repeatsWeekly) return null;
  try {
    const parsed = recurrenceRuleSchema.safeParse(v.recurrence ? JSON.parse(v.recurrence) : null);
    if (parsed.success) return normalizeRule(parsed.data);
  } catch {
    // Règle illisible : chaque semaine, le jour du début.
  }
  return weeklyRule(v.startsOn);
}

// « La séance aura lieu chaque semaine le mardi, sans date de fin. »
export function recurrenceSentence(rule: RecurrenceRule, startsOn: string, endsOn: string | null) {
  const text = describeRule(rule, startsOn, endsOn);
  return `La séance aura lieu ${text.charAt(0).toLowerCase()}${text.slice(1)}${endsOn ? "." : ", sans date de fin."}`;
}

// --- Classes partagées ---------------------------------------------------------------------------
export const chipClass =
  "inline-flex h-9 min-w-0 items-center rounded-[10px] bg-dlg-tile px-2.5 text-[16px] font-medium text-text tabular-nums outline-none focus-visible:outline-2 focus-visible:outline-violet lg:h-8 lg:rounded-[8px] lg:text-[13.5px]";
export const cardClass = "overflow-hidden rounded-[16px] bg-surface";
// Séparateur en retrait, comme les listes groupées de l'iPhone.
export const rowClass =
  "relative flex min-h-[52px] items-center justify-between gap-3 px-4 py-1.5 after:absolute after:right-0 after:bottom-0 after:left-4 after:h-px after:bg-line last:after:hidden lg:min-h-11";
export const sectionTitleClass = "px-4 pt-3 pb-1.5 text-[13px] font-semibold text-muted";
export const timeChipClass = "cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden";
export const segmentedClass = "grid rounded-[10px] bg-dlg-segment p-0.5";
export const segmentClass = (on: boolean) =>
  `rounded-[8px] px-3 font-semibold transition-colors duration-150 ${
    on ? "bg-dlg-segment-active text-text shadow-sm" : "text-muted hover:text-text"
  }`;

// Ouvre le sélecteur du système au clic (Chrome n'ouvre sinon que par son icône).
export const openPicker = (event: MouseEvent<HTMLInputElement>) => {
  try {
    event.currentTarget.showPicker();
  } catch {
    // Navigateur sans showPicker : le champ s'ouvre comme d'habitude.
  }
};

// Date en puce (« 24 nov. 2026 », comme l'iPhone) : le vrai champ date, transparent, la recouvre ; un
// toucher ou un clic ouvre le calendrier du système.
export function DateChip({
  label,
  value,
  min,
  long = false,
  onChange,
}: {
  label: string;
  value: string;
  min?: string;
  long?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <span
      className={`${chipClass} relative has-focus-visible:outline-2 has-focus-visible:outline-violet`}
    >
      <span aria-hidden className={value ? "" : "text-muted"}>
        {value ? formatDay(value, long) : "Choisir"}
      </span>
      <input
        type="date"
        aria-label={label}
        value={value}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        onClick={openPicker}
        className="absolute inset-0 size-full cursor-pointer opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:size-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
      />
    </span>
  );
}

// Interrupteur de l'iPhone (téléphone).
export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet ${
        checked ? "bg-violet" : "bg-dlg-tile inset-ring inset-ring-line"
      }`}
    >
      <span
        aria-hidden
        className={`absolute top-[3px] left-[3px] size-6 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

// Case à cocher du Mac (bulle de l'ordinateur) : « Jour entier », « Appliquer la TVA ».
export function MacCheck({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex min-h-8 items-center gap-2 rounded-[6px] text-[13.5px] text-text outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
    >
      <span
        aria-hidden
        className={`grid size-[18px] place-items-center rounded-[5px] transition-colors duration-150 ${
          checked ? "bg-violet text-white" : "bg-dlg-tile inset-ring inset-ring-line-2"
        }`}
      >
        {checked ? <Check size={12} strokeWidth={3.2} /> : null}
      </span>
      {label}
    </button>
  );
}

// Ligne qui ouvre un sous-écran (« Récurrence     Jamais ⌃⌄ »). `valueOnly` : la valeur tient lieu
// de libellé (« Choisir un sportif »), le libellé reste le nom de la ligne pour les lecteurs d'écran.
export function MenuRow({
  label,
  value,
  onOpen,
  icon,
  muted = false,
  valueOnly = false,
}: {
  label: string;
  value: string;
  onOpen: () => void;
  icon?: ReactNode;
  muted?: boolean;
  valueOnly?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${label} : ${value}`}
      className={`${rowClass} w-full text-left transition-colors duration-150 hover:bg-dlg-tile/40`}
    >
      <span
        className={`flex min-w-0 items-center gap-3 text-[16px] lg:text-[14px] ${
          valueOnly && muted ? "text-muted" : "text-text"
        }`}
      >
        {icon}
        <span className="truncate">{valueOnly ? value : label}</span>
      </span>
      <span
        className={`flex min-w-0 shrink-0 items-center gap-1 text-[16px] lg:text-[14px] ${muted ? "text-muted" : "text-text-2"}`}
      >
        {valueOnly ? null : <span className="truncate">{value}</span>}
        <ChevronsUpDown aria-hidden size={16} strokeWidth={2} className="shrink-0 text-muted" />
      </span>
    </button>
  );
}

// Option d'une liste de sous-écran, cochée comme sur l'iPhone.
export function OptionRow({
  label,
  selected,
  onSelect,
  trailing,
  multiple = false,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  trailing?: ReactNode;
  multiple?: boolean;
}) {
  return (
    <button
      type="button"
      role={multiple ? "menuitemcheckbox" : "menuitemradio"}
      aria-checked={selected}
      onClick={onSelect}
      className={`${rowClass} w-full text-left text-[16px] text-text transition-colors duration-150 hover:bg-dlg-tile/40 lg:text-[14px]`}
    >
      <span className="min-w-0 truncate">{label}</span>
      <span className="flex items-center gap-2 text-violet">
        {trailing}
        {selected ? <Check aria-hidden size={18} strokeWidth={2.4} /> : null}
      </span>
    </button>
  );
}

export function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="relative flex items-center justify-center px-4 pt-3 pb-3">
      <button
        type="button"
        onClick={onBack}
        aria-label="Retour"
        className="absolute left-4 grid size-11 place-items-center rounded-full bg-surface text-text inset-ring inset-ring-line transition-colors duration-150 hover:bg-dlg-tile"
      >
        <ChevronLeft aria-hidden size={20} strokeWidth={2} />
      </button>
      <h3 className="text-[17px] font-semibold text-text">{title}</h3>
    </div>
  );
}

// Menu déroulant du Mac (« Jamais ⌃⌄ » puis la liste cochée sous le bouton). Échap ou un clic à côté
// le referment sans fermer la fenêtre. `search` : champ de recherche en tête (liste des sportifs).
export type PopupItem =
  { kind: "option"; value: string; label: string; trailing?: ReactNode } | { kind: "separator" };

export function PopupSelect({
  label,
  valueLabel,
  muted = false,
  items,
  selected,
  onSelect,
  search = false,
}: {
  label: string;
  valueLabel: string;
  muted?: boolean;
  items: PopupItem[];
  selected: string | null;
  onSelect: (value: string) => void;
  search?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const box = useRef<HTMLSpanElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away, true);
    return () => document.removeEventListener("pointerdown", away, true);
  }, [open]);
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !open) return;
    event.preventDefault();
    event.stopPropagation();
    setOpen(false);
    button.current?.focus();
  };
  const shown = items.filter(
    (item) =>
      !search ||
      !query.trim() ||
      (item.kind === "option" && foldText(item.label).includes(foldText(query.trim()))),
  );
  return (
    <span ref={box} className="relative inline-flex min-w-0" onKeyDown={onKeyDown}>
      <button
        ref={button}
        type="button"
        aria-label={`${label} : ${valueLabel}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current);
          setQuery("");
        }}
        className={`${chipClass} gap-1 font-normal ${open ? "text-violet-text" : muted ? "text-muted" : ""}`}
      >
        <span className="truncate">{valueLabel}</span>
        <ChevronsUpDown aria-hidden size={14} strokeWidth={2} className="shrink-0 text-muted" />
      </button>
      {open ? (
        <span
          role="menu"
          aria-label={label}
          className="absolute top-full left-0 z-30 mt-1 flex max-h-[300px] min-w-[230px] flex-col overflow-y-auto rounded-[12px] bg-popover p-1 shadow-[var(--lib-menu-shadow)]"
        >
          {search ? (
            <label className="mx-1 mt-1 mb-1 flex h-8 shrink-0 items-center gap-2 rounded-[8px] bg-dlg-tile px-2.5 text-muted">
              <Search aria-hidden size={14} strokeWidth={2} />
              <input
                type="search"
                aria-label="Rechercher un sportif"
                placeholder="Rechercher"
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-full min-w-0 flex-1 bg-transparent text-[13.5px] text-text outline-none placeholder:text-faint"
              />
            </label>
          ) : null}
          {shown.map((item, index) =>
            item.kind === "separator" ? (
              <span
                key={`separator-${index}`}
                role="separator"
                className="mx-2 my-1 h-px shrink-0 bg-popover-line"
              />
            ) : (
              <button
                key={item.value}
                type="button"
                role="menuitemradio"
                aria-checked={selected === item.value}
                onClick={() => {
                  onSelect(item.value);
                  setOpen(false);
                  button.current?.focus();
                }}
                className="flex min-h-8 shrink-0 items-center gap-2 rounded-[8px] px-2 text-left text-[13.5px] text-text transition-colors duration-100 hover:bg-dlg-tile"
              >
                <span className="grid w-4 shrink-0 place-items-center text-violet">
                  {selected === item.value ? (
                    <Check aria-hidden size={14} strokeWidth={2.6} />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.trailing}
              </button>
            ),
          )}
        </span>
      ) : null}
    </span>
  );
}

// --- Écran « Personnalisé » ----------------------------------------------------------------------
const WEEKDAY_LETTERS: Record<RecurrenceWeekday, string> = {
  mon: "L",
  tue: "M",
  wed: "M",
  thu: "J",
  fri: "V",
  sat: "S",
  sun: "D",
};
const WEEKDAY_NAMES: Record<RecurrenceWeekday, string> = {
  mon: "lundi",
  tue: "mardi",
  wed: "mercredi",
  thu: "jeudi",
  fri: "vendredi",
  sat: "samedi",
  sun: "dimanche",
};
const POSITION_NAMES: Record<SetPosition, string> = {
  1: "1er",
  2: "2e",
  3: "3e",
  4: "4e",
  [-1]: "dernier",
};
const MONTHS_SHORT = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];
const FREQ_LABELS: Record<RecurrenceFreq, string> = {
  daily: "Jour",
  weekly: "Semaine",
  monthly: "Mois",
  yearly: "Année",
};
const FREQ_UNITS: Record<RecurrenceFreq, [string, string]> = {
  daily: ["jour", "jours"],
  weekly: ["semaine", "semaines"],
  monthly: ["mois", "mois"],
  yearly: ["an", "ans"],
};

// La règle par défaut d'une fréquence, calée sur la date de début.
function ruleForFreq(freq: RecurrenceFreq, interval: number, startsOn: string): RecurrenceRule {
  switch (freq) {
    case "daily":
      return { freq, interval };
    case "weekly":
      return { freq, interval, weekdays: [weekdayOfDate(startsOn)] };
    case "monthly":
      return { freq, interval, monthDays: [Number(startsOn.slice(8, 10))] };
    case "yearly":
      return { freq, interval, months: [Number(startsOn.slice(5, 7))] };
  }
}

// Jamais vide : le dernier choix restant ne se décoche pas.
const toggle = <T,>(list: T[], value: T): T[] =>
  list.includes(value)
    ? list.length > 1
      ? list.filter((item) => item !== value)
      : list
    : [...list, value];

// Comme Apple : fréquence, « Tous les N », jours de la semaine, jours du mois (« Chaque ») ou « Le 2e
// mardi », mois de l'année ; la phrase résume la règle. Feuille du téléphone : cartes ; bulle de
// l'ordinateur : libellés à gauche, « ‹ Retour ».
export function CustomRule({
  rule,
  startsOn,
  onChange,
  onBack,
  layout,
}: {
  rule: RecurrenceRule;
  startsOn: string;
  onChange: (rule: RecurrenceRule) => void;
  onBack: () => void;
  layout: Layout;
}) {
  const popover = layout === "popover";
  const [one, many] = FREQ_UNITS[rule.freq];
  const monthMode = rule.setPos !== undefined ? "on" : "each";
  const toggleClass = (on: boolean) =>
    `grid place-items-center font-semibold transition-colors duration-150 ${
      popover ? "h-8 rounded-[8px] text-[13px]" : "h-10 rounded-[10px] text-[14.5px]"
    } ${on ? "bg-violet text-white" : "bg-dlg-tile text-text hover:bg-dlg-tile-hover"}`;
  const stepClass = `grid place-items-center bg-dlg-tile text-text hover:bg-dlg-tile-hover ${
    popover ? "size-8 rounded-[8px]" : "size-10 rounded-[10px]"
  }`;

  const frequency = (
    <div
      role="radiogroup"
      aria-label="Fréquence"
      className={`${segmentedClass} grid-cols-4 ${popover ? "h-8" : "h-10"}`}
    >
      {(Object.keys(FREQ_LABELS) as RecurrenceFreq[]).map((freq) => (
        <button
          key={freq}
          type="button"
          role="radio"
          aria-checked={rule.freq === freq}
          onClick={() => onChange(ruleForFreq(freq, rule.interval, startsOn))}
          className={`${segmentClass(rule.freq === freq)} ${popover ? "text-[13px]" : "text-[14px]"}`}
        >
          {FREQ_LABELS[freq]}
        </button>
      ))}
    </div>
  );
  const interval = (
    <span className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Moins"
        onClick={() => onChange({ ...rule, interval: Math.max(1, rule.interval - 1) })}
        className={stepClass}
      >
        <Minus aria-hidden size={popover ? 15 : 18} />
      </button>
      <span
        className={`text-center font-semibold text-text tabular-nums ${popover ? "min-w-[88px] text-[13.5px]" : "min-w-[96px] text-[15.5px]"}`}
      >
        {rule.interval} {rule.interval > 1 ? many : one}
      </span>
      <button
        type="button"
        aria-label="Plus"
        onClick={() => onChange({ ...rule, interval: Math.min(99, rule.interval + 1) })}
        className={stepClass}
      >
        <Plus aria-hidden size={popover ? 15 : 18} />
      </button>
    </span>
  );
  const weekdays = (
    <div className="grid grid-cols-7 gap-1.5">
      {RECURRENCE_WEEKDAYS.map((day) => (
        <button
          key={day}
          type="button"
          aria-pressed={(rule.weekdays ?? []).includes(day)}
          aria-label={WEEKDAY_NAMES[day]}
          onClick={() => onChange({ ...rule, weekdays: toggle(rule.weekdays ?? [], day) })}
          className={toggleClass((rule.weekdays ?? []).includes(day))}
        >
          {WEEKDAY_LETTERS[day]}
        </button>
      ))}
    </div>
  );
  const monthModeSwitch = (
    <div
      role="radiogroup"
      aria-label="Jour du mois"
      className={`${segmentedClass} grid-cols-2 ${popover ? "h-8" : "h-10"}`}
    >
      {(
        [
          ["each", "Chaque"],
          ["on", "Le"],
        ] as const
      ).map(([mode, label]) => (
        <button
          key={mode}
          type="button"
          role="radio"
          aria-checked={monthMode === mode}
          onClick={() =>
            onChange(
              mode === "each"
                ? {
                    freq: "monthly",
                    interval: rule.interval,
                    monthDays: [Number(startsOn.slice(8, 10))],
                  }
                : {
                    freq: "monthly",
                    interval: rule.interval,
                    setPos: Math.min(
                      Math.ceil(Number(startsOn.slice(8, 10)) / 7),
                      4,
                    ) as SetPosition,
                    setWeekday: weekdayOfDate(startsOn),
                  },
            )
          }
          className={`${segmentClass(monthMode === mode)} ${popover ? "text-[13px]" : "text-[14px]"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
  const monthDays =
    monthMode === "each" ? (
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
          <button
            key={day}
            type="button"
            aria-pressed={(rule.monthDays ?? []).includes(day)}
            onClick={() => onChange({ ...rule, monthDays: toggle(rule.monthDays ?? [], day) })}
            className={toggleClass((rule.monthDays ?? []).includes(day))}
          >
            {day}
          </button>
        ))}
      </div>
    ) : (
      <SetPosPicker rule={rule} onChange={onChange} compact={popover} />
    );
  const months = (
    <div className="grid grid-cols-4 gap-1.5">
      {MONTHS_SHORT.map((label, index) => (
        <button
          key={label}
          type="button"
          aria-pressed={(rule.months ?? []).includes(index + 1)}
          onClick={() => onChange({ ...rule, months: toggle(rule.months ?? [], index + 1) })}
          className={toggleClass((rule.months ?? []).includes(index + 1))}
        >
          {label}
        </button>
      ))}
    </div>
  );
  const sentence = recurrenceSentence(rule, startsOn, null).replace(", sans date de fin.", ".");

  if (popover) {
    const labelClass = "pt-1.5 text-right text-[13.5px] text-muted";
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-8 items-center gap-1 rounded-[8px] bg-dlg-tile px-2.5 text-[13.5px] text-text hover:bg-dlg-tile-hover"
          >
            <ChevronLeft aria-hidden size={15} strokeWidth={2} />
            Retour
          </button>
          <h3 className="text-[16px] font-semibold text-text">Récurrence personnalisée</h3>
        </div>
        <div className="grid grid-cols-[104px_minmax(0,1fr)] items-start gap-x-3 gap-y-2.5">
          <span className={labelClass}>Fréquence</span>
          {frequency}
          <span className={labelClass}>{rule.freq === "weekly" ? "Toutes les" : "Tous les"}</span>
          {interval}
          {rule.freq === "weekly" ? (
            <>
              <span className={labelClass}>Les jours</span>
              {weekdays}
            </>
          ) : null}
          {rule.freq === "monthly" ? (
            <>
              <span className={labelClass}>Le jour</span>
              <div className="flex flex-col gap-2">
                {monthModeSwitch}
                {monthDays}
              </div>
            </>
          ) : null}
          {rule.freq === "yearly" ? (
            <>
              <span className={labelClass}>Les mois</span>
              {months}
            </>
          ) : null}
          <span />
          <p className="text-[12.5px] leading-[1.45] text-muted">{sentence}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SubHeader title="Personnalisé" onBack={onBack} />
      <div className="mx-4 flex flex-col gap-4">
        <div className={`${cardClass} p-3`}>
          <p className="pb-2 text-[15px] font-semibold text-text">Fréquence</p>
          {frequency}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[15px] text-text">
              {rule.freq === "weekly" ? "Toutes les" : "Tous les"}
            </span>
            {interval}
          </div>
        </div>
        {rule.freq === "weekly" ? (
          <div className={`${cardClass} p-3`}>
            <p className="pb-2 text-[15px] font-semibold text-text">Les jours</p>
            {weekdays}
          </div>
        ) : null}
        {rule.freq === "monthly" ? (
          <div className={`${cardClass} flex flex-col gap-3 p-3`}>
            {monthModeSwitch}
            {monthDays}
          </div>
        ) : null}
        {rule.freq === "yearly" ? (
          <div className={`${cardClass} p-3`}>
            <p className="pb-2 text-[15px] font-semibold text-text">Les mois</p>
            {months}
          </div>
        ) : null}
        <p className="px-1 text-[13px] leading-[1.45] text-muted">{sentence}</p>
      </div>
    </>
  );
}

// « Le 2e mardi » / « le dernier lundi » : deux listes.
function SetPosPicker({
  rule,
  onChange,
  compact,
}: {
  rule: RecurrenceRule;
  onChange: (rule: RecurrenceRule) => void;
  compact: boolean;
}) {
  const selectClass = `flex-1 bg-dlg-tile px-3 text-text outline-none focus-visible:outline-2 focus-visible:outline-violet ${
    compact ? "h-8 rounded-[8px] text-[13.5px]" : "h-10 rounded-[10px] text-[16px]"
  }`;
  return (
    <div className="flex gap-2">
      <select
        aria-label="Position dans le mois"
        value={String(rule.setPos ?? 1)}
        onChange={(event) =>
          onChange({ ...rule, setPos: Number(event.target.value) as SetPosition })
        }
        className={selectClass}
      >
        {SET_POSITIONS.map((position) => (
          <option key={position} value={String(position)}>
            {POSITION_NAMES[position]}
          </option>
        ))}
      </select>
      <select
        aria-label="Jour de la semaine"
        value={rule.setWeekday ?? "mon"}
        onChange={(event) =>
          onChange({ ...rule, setWeekday: event.target.value as RecurrenceWeekday })
        }
        className={selectClass}
      >
        {RECURRENCE_WEEKDAYS.map((day) => (
          <option key={day} value={day}>
            {WEEKDAY_NAMES[day]}
          </option>
        ))}
      </select>
    </div>
  );
}

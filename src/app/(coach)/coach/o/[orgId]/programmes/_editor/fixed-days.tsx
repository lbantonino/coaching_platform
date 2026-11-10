"use client";

import { ChevronDown, Lock } from "lucide-react";
import { useState } from "react";

import { ChipGroup } from "@/components/ui/chip-group";
import { DialogBody, Overlay } from "@/components/ui/overlay";
import { RadioMark } from "@/components/ui/radio-choice";
import { SelectField } from "@/components/ui/select-field";
import { Switch } from "@/components/ui/switch";
import { disciplineLabels, disciplineStyles } from "@/domain/training/discipline";
import type { Phase, Week } from "@/domain/training/program-plan";
import {
  orderedSessions,
  plannedDate,
  proposeWeekDays,
  sessionDay,
  weekdayLabels,
  weekdayOf,
  type ScheduleScope,
} from "@/domain/training/scheduling";
import { WEEKDAYS, type SessionDraft, type Weekday } from "@/domain/training/session-v2";
import { formatMinutes, formatSeconds } from "@/domain/training/session-view";

// Jours fixes (03b, FIX-01 à 05 ; sources CooryJoursFixes, CooryJourPicker, CooryJourPropose).
// « Dans l'ordre » : le sportif fait ses séances dans l'ordre, au jour de son choix. « Jours fixes » :
// chaque séance a un jour (et une heure facultative) ; la numérotation suit l'ordre des jours. Une
// séance avec le coach garde le jour de son rendez-vous (cadenas).

export type DaysContext = {
  firstName: string;
  // Jours où le sportif est disponible (vide = non renseigné : tous les jours possibles).
  availableDays: readonly Weekday[];
  // Programme : le lundi de la semaine 1 (numéros des jours) ; modèle : pas de dates.
  startDate: string | null;
};

// Un jour de séance est un jour de la semaine (« lundi »), jamais une date : la même séance garde
// son jour d'une semaine à l'autre. Demande d'Antonino du 10/11 : le CHOIX du jour (panneau de
// droite, feuille, proposition) ne montre que les noms des jours ; la carte de la semaine (bandeau
// des jours, pavés des séances) montre aussi la date de cette semaine-là (« Lun 16 »).
const dayNumber = (startDate: string | null, weekIndex: number, day: Weekday) =>
  startDate ? String(Number(plannedDate(startDate, weekIndex, day).slice(8, 10))) : null;
const weekdayFull: Record<Weekday, string> = {
  mon: "Lundi",
  tue: "Mardi",
  wed: "Mercredi",
  thu: "Jeudi",
  fri: "Vendredi",
  sat: "Samedi",
  sun: "Dimanche",
};
const unavailable = (context: DaysContext, day: Weekday) =>
  context.availableDays.length > 0 && !context.availableDays.includes(day);
const pillTint: Record<SessionDraft["content"]["discipline"], string> = {
  running: "bg-[color-mix(in_srgb,var(--run-fill)_14%,var(--surface))]",
  strength: "bg-[color-mix(in_srgb,var(--strength-fill)_14%,var(--surface))]",
  hyrox: "bg-[color-mix(in_srgb,var(--hyrox-fill)_14%,var(--surface))]",
  hybrid: "bg-[color-mix(in_srgb,var(--hybrid-fill)_14%,var(--surface))]",
};
export const coachTime = (session: SessionDraft) => session.withCoach?.time ?? null;

// Pavé du jour à gauche d'une carte (62 × 56 sur ordinateur, 58 × 58 sur téléphone).
export function DayPad({
  session,
  weekIndex,
  context,
  selected,
  onOpen,
}: {
  session: SessionDraft;
  weekIndex: number;
  context: DaysContext;
  selected: boolean;
  onOpen: () => void;
}) {
  const day = sessionDay(session);
  const coach = Boolean(session.withCoach);
  const number = session.withCoach
    ? String(Number(session.withCoach.date.slice(8, 10)))
    : day
      ? dayNumber(context.startDate, weekIndex, day)
      : null;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={
        coach
          ? `Jour verrouillé par le rendez-vous du coach : ${day ? weekdayFull[day] : ""}`
          : `Changer le jour de la séance (${day ? weekdayFull[day] : "sans jour"})`
      }
      className={`relative z-10 flex size-[58px] shrink-0 flex-col items-center justify-center gap-px rounded-[13px] transition-[scale] duration-150 active:scale-[0.96] lg:h-14 lg:w-[62px] lg:rounded-[12px] ${
        selected
          ? "bg-cta text-on-cta"
          : coach
            ? "bg-violet-soft text-violet-text"
            : "bg-bg text-text"
      }`}
    >
      {number ? (
        <>
          <span className="text-[10.5px] font-semibold tracking-[0.06em] uppercase opacity-90">
            {day ? weekdayLabels[day] : ""}
          </span>
          <span className="flex items-center gap-[3px] text-[18px] leading-none font-bold">
            {number}
            {coach ? (
              <Lock aria-hidden size={11} strokeWidth={2.4} />
            ) : (
              <ChevronDown aria-hidden size={12} strokeWidth={2.4} />
            )}
          </span>
        </>
      ) : (
        // Modèle (pas de dates) ou séance sans jour : le nom du jour, ou « — ».
        <>
          <span className="text-[17px] leading-none font-bold">
            {day ? weekdayLabels[day] : "—"}
          </span>
          <span className="flex items-center gap-[3px] text-[10.5px] font-semibold opacity-80">
            {day ? null : "Jour"}
            {coach ? (
              <Lock aria-hidden size={11} strokeWidth={2.4} />
            ) : (
              <ChevronDown aria-hidden size={12} strokeWidth={2.4} />
            )}
          </span>
        </>
      )}
    </button>
  );
}

// Bandeau des 7 jours (ordinateur) : jour, pastille « S1 » de la couleur de la discipline, heure du
// rendez-vous ; « Repos » ; « Indisponible » hachuré. La séance choisie a un anneau violet.
export function DayStrip({
  week,
  context,
  selectedKey,
  onPick,
}: {
  week: Week;
  context: DaysContext;
  selectedKey: string | null;
  onPick: (key: string) => void;
}) {
  const ordered = orderedSessions(week);
  return (
    <div className="grid grid-cols-7 gap-[5px]">
      {WEEKDAYS.map((day) => {
        const sessions = ordered
          .map((session, index) => ({ session, n: index + 1 }))
          .filter(({ session }) => sessionDay(session) === day);
        const off = unavailable(context, day);
        const first = sessions[0]?.session;
        const selected = sessions.some(({ session }) => session.key === selectedKey);
        return (
          <div
            key={day}
            className={`flex min-h-[82px] min-w-0 flex-col gap-[3px] rounded-[12px] p-2 ${
              off && !first
                ? "bg-[repeating-linear-gradient(135deg,var(--surface-2)_0_6px,var(--bg)_6px_12px)]"
                : first
                  ? pillTint[first.content.discipline]
                  : "bg-surface inset-ring inset-ring-line"
            } ${selected ? "inset-ring-[1.5px] inset-ring-violet" : ""}`}
          >
            <span
              className={`truncate text-[11.5px] font-semibold ${off ? "text-faint" : "text-text-2"}`}
            >
              {weekdayLabels[day]}
              {dayNumber(context.startDate, week.index, day)
                ? ` ${dayNumber(context.startDate, week.index, day)}`
                : ""}
            </span>
            {sessions.map(({ session, n }) => (
              <button
                key={session.key}
                type="button"
                onClick={() => onPick(session.key)}
                aria-label={`Séance ${n} : ${session.title}`}
                className={`flex h-6 min-w-8 items-center justify-center self-start rounded-[8px] px-2 text-[12px] font-bold ${disciplineStyles[session.content.discipline].number}`}
              >
                S{n}
              </button>
            ))}
            {first && coachTime(first) ? (
              <span className="text-[10.5px] font-medium text-text-2">{coachTime(first)}</span>
            ) : first?.fixedTime ? (
              <span className="text-[10.5px] font-medium text-text-2">{first.fixedTime}</span>
            ) : null}
            {!first ? (
              <span className={`text-[11px] font-medium ${off ? "text-faint" : "text-text-2"}`}>
                {off ? "Indisponible" : "Repos"}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// Mini-bandeau (téléphone, maquette FIX-03) : lettre, date, carré 26 × 22 avec le numéro de la séance.
export function MiniDayStrip({ week, context }: { week: Week; context: DaysContext }) {
  const ordered = orderedSessions(week);
  return (
    <div className="grid grid-cols-7 gap-0.5 rounded-[18px] bg-surface px-2 py-2.5">
      {WEEKDAYS.map((day) => {
        const index = ordered.findIndex((session) => sessionDay(session) === day);
        const session = ordered[index];
        const off = unavailable(context, day);
        return (
          <span key={day} className="flex flex-col items-center gap-1 py-1">
            <span
              className={`text-[11px] font-semibold ${off ? "text-dlg-disabled" : "text-text"}`}
            >
              {weekdayLabels[day].charAt(0)}
            </span>
            <span className={`text-[15px] font-bold ${off ? "text-dlg-disabled" : "text-text"}`}>
              {dayNumber(context.startDate, week.index, day) ?? "·"}
            </span>
            <span
              className={`grid h-[22px] w-[26px] place-items-center rounded-[7px] text-[11px] font-bold ${
                session
                  ? `${disciplineStyles[session.content.discipline].number}`
                  : off
                    ? "bg-bg text-dlg-disabled"
                    : "bg-surface-2 text-dlg-disabled"
              }`}
            >
              {session ? index + 1 : off ? "×" : ""}
            </span>
          </span>
        );
      })}
    </div>
  );
}

// Heures proposées (toutes les 30 min, de 6:00 à 21:30).
const TIMES = Array.from({ length: 32 }, (_, i) => {
  const minutes = 6 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${minutes % 60 ? "30" : "00"}`;
});

export type DayChoice = { day: Weekday | null; time?: string; athleteCanMove: boolean };

// Choisir le jour d'une séance (FIX-02 compact dans le panneau ; FIX-05 complet en feuille).
export function DayPicker({
  session,
  week,
  phase,
  weeksCount,
  context,
  compact,
  reachable,
  onValidate,
  onCancel,
}: {
  session: SessionDraft;
  week: Week;
  phase: Phase | null;
  weeksCount: number;
  context: DaysContext;
  compact: boolean;
  // Autres semaines à venir que ce choix changera, par portée.
  reachable: { phase: number; program: number };
  onValidate: (choice: DayChoice, scope: ScheduleScope) => void;
  onCancel: () => void;
}) {
  const ordered = orderedSessions(week);
  const position = ordered.findIndex((item) => item.key === session.key) + 1;
  const [day, setDay] = useState<Weekday | null>(sessionDay(session));
  const [time, setTime] = useState(session.fixedTime ?? "");
  const [scope, setScope] = useState<ScheduleScope>(phase ? "phase" : "week");
  const [canMove, setCanMove] = useState(session.athleteCanMove);
  const offDays = WEEKDAYS.filter((item) => unavailable(context, item));
  const taken = ordered
    .map((item, index) => ({ day: sessionDay(item), n: index + 1, key: item.key }))
    .filter((item) => item.key !== session.key && item.day !== null);
  const scopes: { value: ScheduleScope; label: string; sub: string }[] = [
    { value: "week", label: "Cette semaine seulement", sub: `Semaine ${week.index}` },
    ...(phase
      ? [
          {
            value: "phase" as const,
            label: `Toute la phase ${phase.name}`,
            sub: `Semaines ${phase.weekFrom} à ${phase.weekTo}`,
          },
        ]
      : []),
    {
      value: "program",
      label: "Tout le programme",
      sub: `${weeksCount} semaine${weeksCount > 1 ? "s" : ""}`,
    },
  ];

  if (session.withCoach) {
    return (
      <div className="flex flex-col gap-3">
        <Heading session={session} position={position} week={week.index} />
        <p className="flex items-start gap-2 rounded-[12px] bg-surface-2 px-3.5 py-3 text-[13px] leading-[1.45] text-text-2">
          <Lock aria-hidden size={14} strokeWidth={2} className="mt-0.5 shrink-0" />
          Séance avec le coach : son jour est celui du rendez-vous. Pour la déplacer, change le
          rendez-vous dans l&apos;Agenda.
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-[46px] items-center justify-center rounded-[12px] px-4 text-[14px] font-semibold text-text inset-ring inset-ring-field-ring"
        >
          Fermer
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${compact ? "gap-3" : "gap-4"}`}>
      <Heading session={session} position={position} week={week.index} />
      <div className="flex flex-col gap-2">
        <span className="text-[12.5px] font-semibold text-text-2">Jour de la séance</span>
        <div className="grid grid-cols-7 gap-[5px]">
          {WEEKDAYS.map((item) => {
            const off = unavailable(context, item);
            const chosen = day === item;
            const others = taken.filter((entry) => entry.day === item);
            return (
              <button
                key={item}
                type="button"
                aria-pressed={chosen}
                onClick={() => setDay(item)}
                className={`flex flex-col items-center justify-center gap-px rounded-[11px] transition-[scale,background-color] duration-150 active:scale-[0.96] ${
                  compact ? "h-[52px]" : "h-[62px]"
                } ${
                  chosen
                    ? "bg-cta text-on-cta"
                    : off
                      ? "bg-surface-2 text-dlg-disabled"
                      : "bg-surface text-text inset-ring inset-ring-field-ring"
                }`}
              >
                <span
                  className={`text-[15px] leading-none font-bold ${off && !chosen ? "line-through" : ""}`}
                >
                  {weekdayLabels[item]}
                </span>
                <span
                  className={`h-3 text-[9.5px] font-semibold whitespace-nowrap ${
                    chosen ? "text-on-cta" : off ? "text-dlg-disabled" : "text-violet-text"
                  }`}
                >
                  {chosen
                    ? `S${position}`
                    : off
                      ? "indispo"
                      : others.map((entry) => `S${entry.n}`).join(" ")}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-1 text-[12px] leading-[1.45] text-muted">
          {offDays.length > 0 ? (
            <span>
              <strong className="font-semibold text-text">
                {offDays.map((item) => `${weekdayLabels[item]}.`).join(", ")}
              </strong>{" "}
              {context.firstName}{" "}
              {offDays.length > 1 ? "n'est pas disponible ces jours-là" : "est indisponible"}{" "}
              (onglet Disponibilités).
            </span>
          ) : null}
          {!compact && taken.length > 0 ? (
            <span>
              <strong className="font-semibold text-text">
                {taken.map((entry) => `S${entry.n}`).join(", ")}
              </strong>{" "}
              = jour déjà pris par une autre séance. Possible, Coory te prévient.
            </span>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        aria-pressed={day === null}
        onClick={() => setDay(null)}
        className={`flex items-center gap-3 rounded-[13px] px-3.5 py-3 text-left inset-ring ${
          day === null ? "bg-surface-2 inset-ring-field-ring" : "inset-ring-field-ring"
        }`}
      >
        <RadioMark checked={day === null} />
        <span className="flex flex-1 flex-col gap-px">
          <span className="text-[13.5px] font-semibold text-text">Sans jour</span>
          <span className="text-[12px] text-muted">
            Dans l&apos;ordre, au choix de {context.firstName}.
          </span>
        </span>
      </button>

      {compact ? null : (
        <label className="flex flex-col gap-2">
          <span className="text-[12.5px] font-semibold text-text-2">
            Heure <span className="font-normal text-faint">(facultatif)</span>
          </span>
          <SelectField
            value={time}
            disabled={day === null}
            onChange={(event) => setTime(event.target.value)}
          >
            <option value="">Pas d&apos;heure</option>
            {TIMES.map((value) => (
              <option key={value} value={value}>
                {value.replace(":", " h ")}
              </option>
            ))}
          </SelectField>
        </label>
      )}

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-2 text-[12.5px] font-semibold text-text-2">
          Appliquer ce jour à
        </legend>
        <div className="flex flex-col overflow-hidden rounded-[13px] inset-ring inset-ring-line">
          {scopes.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-3 border-b border-dlg-divider px-3.5 py-1.5 last:border-b-0 has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-violet ${
                compact ? "min-h-[42px]" : "min-h-12"
              } ${scope === option.value ? "bg-surface-2" : ""}`}
            >
              <input
                type="radio"
                name={`scope-${session.key}`}
                checked={scope === option.value}
                onChange={() => setScope(option.value)}
                className="sr-only"
              />
              <RadioMark checked={scope === option.value} />
              <span className="flex flex-1 flex-col gap-px">
                <span className="text-[13.5px] font-semibold text-text">{option.label}</span>
                <span className="text-[12px] text-muted">{option.sub}</span>
              </span>
            </label>
          ))}
        </div>
        {scope !== "week" ? (
          <p className="mt-1 text-[12px] leading-[1.45] text-muted">
            {reachable[scope] > 0
              ? `${reachable[scope]} autre${reachable[scope] > 1 ? "s" : ""} semaine${reachable[scope] > 1 ? "s" : ""} : la séance y passe à ce jour, ou y est copiée si elle n'y est pas encore. Les semaines passées ne changent pas.`
              : "Aucune autre semaine à venir : seule cette semaine change."}
          </p>
        ) : null}
      </fieldset>

      <Switch
        checked={canMove}
        onChange={setCanMove}
        label={`${context.firstName} peut déplacer la séance`}
        description="Dans la même semaine. Tu reçois une notification."
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() =>
            onValidate(
              { day, time: day && time ? time : undefined, athleteCanMove: canMove },
              scope,
            )
          }
          className="inline-flex h-[46px] flex-1 items-center justify-center rounded-[12px] bg-cta px-4 text-[14.5px] font-semibold text-on-cta transition-[scale,background-color] duration-150 hover:bg-cta-hover active:scale-[0.98]"
        >
          Valider
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-[46px] items-center rounded-[12px] px-4 text-[14px] font-semibold text-text inset-ring inset-ring-field-ring transition-colors duration-150 hover:bg-surface-2"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

function Heading({
  session,
  position,
  week,
}: {
  session: SessionDraft;
  position: number;
  week: number;
}) {
  const discipline = session.content.discipline;
  return (
    <div className="flex flex-col gap-[3px]">
      <span className="flex items-center gap-[7px] text-[11.5px] font-semibold tracking-[0.05em] text-faint uppercase">
        <span
          aria-hidden
          className={`size-[7px] rounded-full ${disciplineStyles[discipline].dot}`}
        />
        Séance {position} · Semaine {week}
      </span>
      <h2 className="text-[19px] leading-[1.2] font-bold tracking-[-0.015em] text-text">
        {session.title}
      </h2>
      <p className="text-[13px] text-muted">
        {disciplineLabels[discipline]} · {session.sessionType} · ≈{" "}
        {(discipline === "running" ? formatMinutes : formatSeconds)(session.durationMinutes * 60)}
      </p>
    </div>
  );
}

// « Fixer les jours » (FIX-01) : Coory propose un jour par séance ; le coach corrige puis applique.
export function ProposeDaysDialog({
  open,
  onClose,
  week,
  phase,
  context,
  onFix,
}: {
  open: boolean;
  onClose: () => void;
  week: Week;
  phase: Phase | null;
  context: DaysContext;
  onFix: (days: Map<string, Weekday>, scope: ScheduleScope) => void;
}) {
  const [days, setDays] = useState(() => proposeWeekDays(week.sessions, context.availableDays));
  const [scope, setScope] = useState<ScheduleScope>("week");
  const [shown, setShown] = useState(open);
  if (open !== shown) {
    setShown(open);
    if (open) {
      setDays(proposeWeekDays(week.sessions, context.availableDays));
      setScope("week");
    }
  }
  const coachDays = new Map(
    week.sessions.flatMap((session) =>
      session.withCoach
        ? [[weekdayOf(session.withCoach.date), session.withCoach.time ?? ""] as const]
        : [],
    ),
  );
  const label = (day: Weekday) => weekdayFull[day];
  return (
    <Overlay
      open={open}
      onClose={onClose}
      label={`Fixer les jours, semaine ${week.index}`}
      size="form"
    >
      <DialogBody>
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-[21px] leading-[1.2] font-bold tracking-[-0.015em] text-text">
              Fixer les jours · semaine {week.index}
            </h2>
            <p className="text-[14px] leading-[1.45] text-muted">
              Coory propose un jour par séance d&apos;après les disponibilités de{" "}
              {context.firstName} et tes rendez-vous. Change-les si besoin.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[12.5px] font-semibold text-text-2">
              Disponibilités de {context.firstName}
            </span>
            <div className="grid grid-cols-7 gap-[5px]">
              {WEEKDAYS.map((day) => {
                const off = unavailable(context, day);
                const coach = coachDays.get(day);
                return (
                  <span
                    key={day}
                    className={`flex h-[46px] flex-col items-center justify-center rounded-[10px] ${
                      coach !== undefined
                        ? "bg-violet-soft text-violet-text"
                        : off
                          ? "bg-surface-2 text-faint"
                          : "bg-[color-mix(in_srgb,var(--ok)_10%,var(--surface))] text-text"
                    }`}
                  >
                    <span className="text-[12px] font-semibold">{weekdayLabels[day]}</span>
                    <span className="text-[10.5px] font-medium whitespace-nowrap opacity-90">
                      {coach !== undefined
                        ? `coach${coach ? ` ${coach}` : ""}`
                        : off
                          ? "indispo"
                          : "dispo"}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
          <ul className="m-0 flex list-none flex-col overflow-hidden rounded-[14px] p-0 inset-ring inset-ring-line">
            {orderedSessions(week).map((session, index) => {
              const discipline = session.content.discipline;
              return (
                <li
                  key={session.key}
                  className="flex min-h-[58px] items-center gap-3 border-b border-dlg-divider px-3.5 py-2 last:border-b-0"
                >
                  <span
                    className={`grid size-[26px] shrink-0 place-items-center rounded-full text-[12px] font-bold ${disciplineStyles[discipline].number}`}
                  >
                    {index + 1}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px] font-semibold text-text">
                      {session.title}
                    </span>
                    <span className="truncate text-[12px] text-muted">
                      {session.withCoach
                        ? "Avec le coach"
                        : `${disciplineLabels[discipline]} · ${session.sessionType}`}
                    </span>
                  </span>
                  {session.withCoach ? (
                    <span className="flex h-[38px] items-center gap-1.5 rounded-[10px] bg-surface-2 px-3 text-[14px] font-semibold text-text">
                      {label(weekdayOf(session.withCoach.date))}
                      {session.withCoach.time ? ` · ${session.withCoach.time}` : ""}
                      <Lock aria-hidden size={12} strokeWidth={2} className="text-faint" />
                    </span>
                  ) : (
                    <SelectField
                      size="sm"
                      aria-label={`Jour de ${session.title}`}
                      className="w-[112px] shrink-0"
                      value={days.get(session.key) ?? ""}
                      onChange={(event) =>
                        setDays((current) => {
                          const next = new Map(current);
                          if (event.target.value)
                            next.set(session.key, event.target.value as Weekday);
                          else next.delete(session.key);
                          return next;
                        })
                      }
                    >
                      <option value="">Sans jour</option>
                      {WEEKDAYS.map((day) => (
                        <option key={day} value={day}>
                          {label(day)}
                        </option>
                      ))}
                    </SelectField>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="flex flex-col gap-2">
            <span className="text-[12.5px] font-semibold text-text-2">Appliquer à</span>
            <ChipGroup
              label="Appliquer à"
              value={scope}
              onChange={setScope}
              options={[
                { value: "week", label: "Cette semaine" },
                ...(phase
                  ? [
                      {
                        value: "phase" as const,
                        label: `Phase ${phase.name} · S${phase.weekFrom} – ${phase.weekTo}`,
                      },
                    ]
                  : []),
                { value: "program", label: "Tout le programme" },
              ]}
            />
            <p className="text-[12.5px] leading-[1.45] text-muted">
              Les semaines déjà passées ne changent pas. Les autres séances avec le coach gardent
              leur rendez-vous.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onFix(days, scope)}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-[13px] bg-cta px-4 text-[15px] font-semibold text-on-cta transition-[scale,background-color] duration-150 hover:bg-cta-hover active:scale-[0.98]"
            >
              Fixer les jours
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-[13px] px-4 text-[15px] font-semibold text-text inset-ring inset-ring-field-ring transition-colors duration-150 hover:bg-surface-2"
            >
              Garder dans l&apos;ordre
            </button>
          </div>
        </div>
      </DialogBody>
    </Overlay>
  );
}

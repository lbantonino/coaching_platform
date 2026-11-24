"use client";

import { Check, ChevronRight, Dumbbell, MapPin, Plus, Search, User, Users, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { useMoney } from "@/components/blocks/money-context";
import { currencySymbol } from "@/domain/billing/money";
import { parseAmount } from "@/domain/billing/payments";
import { foldText } from "@/domain/documents/documents";
import {
  RECURRENCE_PRESETS,
  normalizeRule,
  presetLabels,
  presetOf,
  presetRule,
  weeklyRule,
  type RecurrenceRule,
} from "@/domain/sessions/recurrence";
import { disciplineLabels, type Discipline } from "@/domain/training/discipline";
import {
  defaultVatIncluded,
  formatDuration,
  type SessionFormInput,
  type SessionKind,
} from "@/features/sessions/schemas";

import {
  CustomRule,
  DateChip,
  MAX_DURATION,
  MIN_DURATION,
  MacCheck,
  MenuRow,
  OptionRow,
  PopupSelect,
  SubHeader,
  Switch,
  cardClass,
  chipClass,
  formatDay,
  initialRule,
  openPicker,
  recurrenceSentence,
  rowClass,
  sectionTitleClass,
  segmentClass,
  segmentedClass,
  timeChipClass,
  toMinutes,
  toTime,
  type Athlete,
  type Layout,
  type PopupItem,
} from "./session-apple-parts";
import { SESSION_DISCIPLINES, priceSentence, useSessionVat } from "./session-form-parts";

// « Nouvelle séance » façon Calendrier d'Apple (D-204, maquette validée par Antonino le 24/11/2026 :
// docs/design/maquettes/2026-11-24-nouvelle-seance-apple/). Téléphone (et fenêtre centrée) : feuille
// du bas, ✕, bascule Individuelle / Collective, ✓ ; cartes groupées (Titre ; Début, Fin, Récurrence ;
// Lieu ; Sportif ; Options ; Paiement ; Note) ; les listes (Récurrence, Personnalisé, Fin de la
// répétition, Sportif, Discipline) s'ouvrent DANS la feuille, comme sur l'iPhone. Ordinateur : bulle
// accrochée au créneau, comme le Mac : titre sélectionné, lieu, libellés à gauche, menus déroulants,
// « Échap pour annuler » et « Ajouter ». Mêmes champs envoyés et mêmes règles que l'ancienne fenêtre :
// seule la forme change (action serveur, TVA, nouveau sportif de D-35, D-52, D-163).

type Screen = "main" | "repeat" | "custom" | "repeat-end" | "athletes" | "discipline";

// Ce que la grille de l'agenda montre pendant la saisie (séance provisoire, ordinateur).
export type SessionDraft = {
  date: string;
  time: string;
  duration: number;
  title: string;
  allDay: boolean;
};

const NEW_ATHLETE = "__new__";

export function SessionAppleFields({
  formAction,
  pending,
  error,
  values: v,
  athletes,
  submitLabel,
  onCancel,
  layout,
  onDraft,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  error: string | null;
  values: SessionFormInput;
  athletes: Athlete[];
  submitLabel: string;
  onCancel: () => void;
  layout: Layout;
  onDraft?: (draft: SessionDraft) => void;
}) {
  const formId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const { currency, format } = useMoney();
  const vat = useSessionVat(v);
  const popover = layout === "popover";

  const [screen, setScreen] = useState<Screen>("main");
  const [kind, setKind] = useState<SessionKind>(v.kind === "group" ? "group" : "individual");
  const [title, setTitle] = useState(v.title);
  const [location, setLocation] = useState(v.location);
  const [startsOn, setStartsOn] = useState(v.startsOn);
  const [startTime, setStartTime] = useState(v.startTime);
  const [duration, setDuration] = useState(Number(v.durationMinutes) || 60);
  const [allDay, setAllDay] = useState(v.allDay === true);
  const [rule, setRule] = useState<RecurrenceRule | null>(() => initialRule(v));
  const [endsOn, setEndsOn] = useState(v.endsOn);
  const [athleteId, setAthleteId] = useState(v.athleteId);
  const [newClient, setNewClient] = useState(v.newClient);
  const [newAthleteName, setNewAthleteName] = useState(v.newAthleteName);
  const [athleteIds, setAthleteIds] = useState<string[]>(v.athleteIds);
  const [discipline, setDiscipline] = useState(v.discipline);
  const [price, setPrice] = useState(v.price);
  const [paymentMethod, setPaymentMethod] = useState(v.paymentMethod || "transfer");
  const [notes, setNotes] = useState(v.notes);
  const [search, setSearch] = useState("");

  // Ordinateur : le titre est déjà sélectionné, comme le Calendrier du Mac.
  useEffect(() => {
    if (popover) titleRef.current?.select();
  }, [popover]);

  const start = toMinutes(startTime);
  const end = start + duration;
  const endTime = Number.isNaN(start) ? "" : toTime(Math.min(end, 24 * 60 - 1));
  const timeProblem = allDay
    ? null
    : Number.isNaN(start)
      ? "Indique l'heure de début."
      : duration < MIN_DURATION
        ? "La fin doit venir au moins 15 min après le début."
        : duration > MAX_DURATION
          ? "Une séance dure 8 h au plus."
          : end > 24 * 60
            ? "La séance doit finir avant minuit."
            : null;
  const preset = presetOf(rule, startsOn);
  const priceCents = parseAmount(price);
  const athleteName = athletes.find((athlete) => athlete.id === athleteId)?.name ?? null;
  // Séance individuelle sans titre : le nom du sportif (décision du 24/11, maquette validée).
  const fallbackTitle =
    kind === "individual" ? (newClient ? newAthleteName.trim() : (athleteName ?? "")) : "";
  const sentTitle = title.trim() || fallbackTitle;
  const sentence = rule ? recurrenceSentence(rule, startsOn, endsOn || null) : null;
  const disciplineLabel = discipline ? disciplineLabels[discipline as Discipline] : "Non précisée";
  const enrolledLabel =
    athleteIds.length === 0
      ? "Aucun"
      : `${athleteIds.length} inscrit${athleteIds.length > 1 ? "s" : ""}`;
  const priceLabel = kind === "group" ? "Prix pour toute la séance" : "Prix de la séance";
  const priceHint =
    priceCents === null
      ? "Sans prix, la séance ne compte pas dans l'encaissé."
      : priceSentence(priceCents, vat, format);

  // La grille de l'agenda suit la saisie (séance provisoire à son heure, avec son titre).
  useEffect(() => {
    onDraft?.({ date: startsOn, time: startTime, duration, title: sentTitle, allDay });
  }, [onDraft, startsOn, startTime, duration, sentTitle, allDay]);

  // Changer le début garde « chaque semaine » (ou « chaque mois »…) sur le nouveau jour ; une règle
  // personnalisée reste telle quelle (comme Apple).
  const changeStartsOn = (next: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(next)) return;
    if (rule && preset !== "custom" && preset !== "never") setRule(presetRule(preset, next));
    setStartsOn(next);
  };
  const changeEndTime = (next: string) => {
    const minutes = toMinutes(next);
    if (!Number.isNaN(minutes) && !Number.isNaN(start)) setDuration(minutes - start);
  };
  const chooseRecurrence = (value: string) => {
    if (value === "never") setRule(null);
    else if (value === "custom") {
      if (!rule) setRule(weeklyRule(startsOn));
      setScreen("custom");
    } else setRule(presetRule(value as (typeof RECURRENCE_PRESETS)[number], startsOn));
  };
  const chooseAthlete = (value: string) => {
    if (value === NEW_ATHLETE) {
      setNewClient(true);
      setNewAthleteName((current) => current || search.trim());
    } else {
      setNewClient(false);
      setAthleteId(value);
    }
  };
  const toggleEnrolled = (id: string) =>
    setAthleteIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  const choosePayment = (method: "transfer" | "cash") => {
    setPaymentMethod(method);
    vat.setIncluded(defaultVatIncluded(method));
  };

  const submitDisabled = pending || timeProblem !== null;

  const hidden = (
    <>
      <input type="hidden" name="stay" value="1" />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="title" value={sentTitle} />
      <input type="hidden" name="location" value={location} />
      <input type="hidden" name="startsOn" value={startsOn} />
      <input type="hidden" name="startTime" value={startTime} />
      <input type="hidden" name="durationMinutes" value={String(duration)} />
      {allDay ? <input type="hidden" name="allDay" value="on" /> : null}
      {rule ? <input type="hidden" name="repeatsWeekly" value="on" /> : null}
      <input
        type="hidden"
        name="recurrence"
        value={rule ? JSON.stringify(normalizeRule(rule)) : ""}
      />
      <input type="hidden" name="endsOn" value={rule ? endsOn : ""} />
      {kind === "individual" ? (
        <>
          <input type="hidden" name="athleteId" value={newClient ? "" : athleteId} />
          {newClient ? <input type="hidden" name="newClient" value="on" /> : null}
          <input type="hidden" name="newAthleteName" value={newClient ? newAthleteName : ""} />
        </>
      ) : (
        athleteIds.map((id) => <input key={id} type="hidden" name="athleteIds" value={id} />)
      )}
      <input type="hidden" name="discipline" value={discipline} />
      <input type="hidden" name="price" value={price} />
      <input type="hidden" name="paymentMethod" value={paymentMethod} />
      {vat.apply ? <input type="hidden" name="applyVat" value="on" /> : null}
      <input type="hidden" name="vatRate" value={vat.rateText} />
      {vat.included ? <input type="hidden" name="vatIncluded" value="on" /> : null}
      <input type="hidden" name="notes" value={notes} />
    </>
  );

  // --- Pièces communes aux deux formes -----------------------------------------------------------
  const kindSwitch = (
    <div
      role="radiogroup"
      aria-label="Type de séance"
      className={`${segmentedClass} min-w-0 grid-cols-2 ${popover ? "h-8 w-fit" : "h-11 flex-1 rounded-[12px] p-1"}`}
    >
      {(["individual", "group"] as const).map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={kind === option}
          onClick={() => setKind(option)}
          className={`${segmentClass(kind === option)} ${popover ? "text-[13.5px]" : "rounded-[9px] text-[15px]"}`}
        >
          {option === "individual" ? "Individuelle" : "Collective"}
        </button>
      ))}
    </div>
  );
  const startTimeInput = (
    <input
      type="time"
      aria-label="Heure de début"
      value={startTime}
      required
      step={300}
      onChange={(event) => setStartTime(event.target.value)}
      onClick={openPicker}
      className={`${chipClass} ${timeChipClass}`}
    />
  );
  const endTimeInput = (
    <input
      type="time"
      aria-label="Heure de fin"
      aria-invalid={timeProblem !== null}
      value={endTime}
      step={300}
      onChange={(event) => changeEndTime(event.target.value)}
      onClick={openPicker}
      className={`${chipClass} ${timeChipClass} ${timeProblem ? "text-alert line-through" : ""}`}
    />
  );
  const priceInput = (
    <input
      aria-label={priceLabel}
      inputMode="decimal"
      autoComplete="off"
      placeholder={popover ? "65" : "Ex. : 65"}
      value={price}
      onChange={(event) => setPrice(event.target.value)}
      className={`${chipClass} w-24 text-right font-normal lg:w-20`}
    />
  );
  const paymentSwitch = (
    <span
      role="radiogroup"
      aria-label="Paiement"
      className={`${segmentedClass} grid-cols-2 ${popover ? "h-8" : "h-9"}`}
    >
      {(
        [
          ["transfer", "Virement"],
          ["cash", "Espèces"],
        ] as const
      ).map(([method, label]) => (
        <button
          key={method}
          type="button"
          role="radio"
          aria-checked={paymentMethod === method}
          onClick={() => choosePayment(method)}
          className={`${segmentClass(paymentMethod === method)} ${popover ? "text-[13px]" : "text-[14px]"}`}
        >
          {label}
        </button>
      ))}
    </span>
  );
  const vatRateInput = (
    <span className="flex items-center gap-1.5">
      <input
        id={`${formId}-vat`}
        aria-label="Taux de TVA"
        inputMode="decimal"
        autoComplete="off"
        value={vat.rateText}
        onChange={(event) => vat.setRateText(event.target.value)}
        className={`${chipClass} w-20 text-right font-normal lg:w-16`}
      />
      <span className="text-[15px] text-muted lg:text-[13.5px]">%</span>
    </span>
  );
  const timeNote = timeProblem ? (
    <p className={`text-[13px] text-alert ${popover ? "" : "-mt-1 px-4"}`}>{timeProblem}</p>
  ) : null;
  // Réponse du serveur en tête du contenu : visible sans défiler.
  const errorBanner = error ? (
    <p
      role="alert"
      className="rounded-[12px] bg-alert-soft px-4 py-3 text-[14px] leading-[1.4] font-medium text-alert lg:text-[13px]"
    >
      {error}
    </p>
  ) : null;
  const recurrenceItems: PopupItem[] = [
    { kind: "option", value: "never", label: presetLabels.never },
    { kind: "separator" },
    ...RECURRENCE_PRESETS.map((option): PopupItem => ({
      kind: "option",
      value: option,
      label: presetLabels[option],
    })),
    { kind: "separator" },
    { kind: "option", value: "custom", label: `${presetLabels.custom}…` },
  ];

  // --- Téléphone : sous-écrans de la feuille ------------------------------------------------------
  const back = () => setScreen("main");
  const subScreens: Record<Exclude<Screen, "main">, ReactNode> = {
    repeat: (
      <>
        <SubHeader title="Récurrence" onBack={back} />
        <div role="menu" aria-label="Récurrence" className={`${cardClass} mx-4`}>
          <OptionRow
            label={presetLabels.never}
            selected={preset === "never"}
            onSelect={() => {
              chooseRecurrence("never");
              back();
            }}
          />
          {RECURRENCE_PRESETS.map((option) => (
            <OptionRow
              key={option}
              label={presetLabels[option]}
              selected={preset === option}
              onSelect={() => {
                chooseRecurrence(option);
                back();
              }}
            />
          ))}
          <OptionRow
            label={`${presetLabels.custom}…`}
            selected={preset === "custom"}
            onSelect={() => chooseRecurrence("custom")}
            trailing={<ChevronRight aria-hidden size={16} className="text-muted" />}
          />
        </div>
      </>
    ),
    custom: rule ? (
      <CustomRule rule={rule} startsOn={startsOn} onChange={setRule} onBack={back} layout="sheet" />
    ) : null,
    "repeat-end": (
      <>
        <SubHeader title="Fin de la répétition" onBack={back} />
        <div role="menu" aria-label="Fin de la répétition" className={`${cardClass} mx-4`}>
          <OptionRow
            label="Jamais"
            selected={endsOn === ""}
            onSelect={() => {
              setEndsOn("");
              back();
            }}
          />
          <div className={rowClass}>
            <span className="text-[16px] text-text">À une date</span>
            <DateChip
              label="Date de fin de la répétition"
              value={endsOn}
              min={startsOn}
              onChange={setEndsOn}
            />
          </div>
        </div>
      </>
    ),
    athletes: (
      <>
        <SubHeader title={kind === "individual" ? "Sportif" : "Sportifs inscrits"} onBack={back} />
        <div className="mx-4 flex flex-col gap-3">
          <label className="flex h-11 items-center gap-2.5 rounded-[12px] bg-surface px-3.5 text-muted inset-ring inset-ring-line focus-within:inset-ring-[1.5px] focus-within:inset-ring-violet">
            <Search aria-hidden size={17} strokeWidth={2} className="shrink-0" />
            <input
              type="search"
              aria-label="Rechercher un sportif"
              placeholder="Rechercher"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-text outline-none placeholder:text-faint"
            />
          </label>
          <div
            role="menu"
            aria-label={kind === "individual" ? "Sportif" : "Sportifs inscrits"}
            className={`${cardClass} max-h-[50dvh] overflow-y-auto`}
          >
            {kind === "individual" ? (
              <OptionRow
                label="Nouveau sportif"
                selected={newClient}
                onSelect={() => {
                  chooseAthlete(NEW_ATHLETE);
                  back();
                }}
                trailing={<Plus aria-hidden size={16} className="text-violet" />}
              />
            ) : null}
            {athletes
              .filter((athlete) => foldText(athlete.name).includes(foldText(search.trim())))
              .map((athlete) =>
                kind === "individual" ? (
                  <OptionRow
                    key={athlete.id}
                    label={athlete.name}
                    selected={!newClient && athleteId === athlete.id}
                    onSelect={() => {
                      chooseAthlete(athlete.id);
                      back();
                    }}
                  />
                ) : (
                  <OptionRow
                    key={athlete.id}
                    multiple
                    label={athlete.name}
                    selected={athleteIds.includes(athlete.id)}
                    onSelect={() => toggleEnrolled(athlete.id)}
                  />
                ),
              )}
            {athletes.length === 0 ? (
              <p className="px-4 py-4 text-[14px] text-muted">
                Aucun sportif actif pour l&apos;instant.
              </p>
            ) : null}
          </div>
          {kind === "group" ? (
            <button
              type="button"
              onClick={back}
              className="inline-flex h-11 items-center justify-center rounded-[12px] bg-cta px-4 text-[15px] font-semibold text-on-cta"
            >
              OK
            </button>
          ) : null}
        </div>
      </>
    ),
    discipline: (
      <>
        <SubHeader title="Discipline" onBack={back} />
        <div role="menu" aria-label="Discipline" className={`${cardClass} mx-4`}>
          <OptionRow
            label="Non précisée"
            selected={discipline === ""}
            onSelect={() => {
              setDiscipline("");
              back();
            }}
          />
          {SESSION_DISCIPLINES.map((option: Discipline) => (
            <OptionRow
              key={option}
              label={disciplineLabels[option]}
              selected={discipline === option}
              onSelect={() => {
                setDiscipline(option);
                back();
              }}
            />
          ))}
        </div>
      </>
    ),
  };

  // --- Téléphone : la feuille --------------------------------------------------------------------
  const sheet = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2.5 px-4 pt-3 pb-3">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Annuler"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-text inset-ring inset-ring-line transition-colors duration-150 hover:bg-dlg-tile"
        >
          <X aria-hidden size={20} strokeWidth={2} />
        </button>
        {kindSwitch}
        <button
          type="submit"
          form={formId}
          disabled={submitDisabled}
          aria-label={submitLabel}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-cta text-on-cta transition-[scale,opacity] duration-150 active:scale-95 disabled:opacity-50"
        >
          <Check aria-hidden size={20} strokeWidth={2.4} />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 pb-8 [&>*]:shrink-0">
        {errorBanner}
        <div className={cardClass}>
          <input
            ref={titleRef}
            aria-label="Titre"
            placeholder={fallbackTitle || "Titre (ex. : Coaching force)"}
            maxLength={120}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="h-[52px] w-full bg-transparent px-4 text-[17px] text-text outline-none placeholder:text-faint"
          />
        </div>
        <div className={cardClass}>
          <div className={rowClass}>
            <span className="text-[16px] text-text">Début</span>
            <span className="flex min-w-0 flex-wrap items-center justify-end gap-2">
              <DateChip label="Date de début" value={startsOn} onChange={changeStartsOn} />
              {allDay ? null : startTimeInput}
            </span>
          </div>
          <div className={rowClass}>
            <span className="flex shrink-0 flex-col whitespace-nowrap">
              <span className="text-[16px] text-text">Fin</span>
              {timeProblem || allDay ? null : (
                <span className="text-[12.5px] text-muted">Durée : {formatDuration(duration)}</span>
              )}
            </span>
            <span className="flex min-w-0 flex-wrap items-center justify-end gap-2">
              <span className={`${chipClass} text-text-2`}>{formatDay(startsOn)}</span>
              {allDay ? null : endTimeInput}
            </span>
          </div>
          <div className={rowClass}>
            <span className="text-[16px] text-text">Jour entier</span>
            <Switch checked={allDay} onChange={setAllDay} label="Jour entier" />
          </div>
          <MenuRow
            label="Récurrence"
            value={presetLabels[preset]}
            muted={preset === "never"}
            onOpen={() => setScreen("repeat")}
          />
          {rule ? (
            <MenuRow
              label="Fin de la répétition"
              value={endsOn ? formatDay(endsOn) : "Jamais"}
              muted={!endsOn}
              onOpen={() => setScreen("repeat-end")}
            />
          ) : null}
        </div>
        {timeNote}
        {sentence ? (
          <p className="-mt-1 px-4 text-[12.5px] leading-[1.45] text-muted">{sentence}</p>
        ) : null}
        <div>
          <p className={sectionTitleClass}>Lieu</p>
          <div className={cardClass}>
            <label className={rowClass}>
              <MapPin aria-hidden size={18} strokeWidth={1.8} className="shrink-0 text-muted" />
              <input
                aria-label="Lieu"
                placeholder="Ex. : piste, salle, parc"
                maxLength={120}
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="h-11 min-w-0 flex-1 bg-transparent text-[16px] text-text outline-none placeholder:text-faint"
              />
            </label>
          </div>
        </div>
        <div>
          <p className={sectionTitleClass}>
            {kind === "individual" ? "Sportif" : "Sportifs inscrits"}
          </p>
          <div className={cardClass}>
            {kind === "group" ? (
              <MenuRow
                label="Sportifs inscrits"
                value={enrolledLabel}
                muted={athleteIds.length === 0}
                icon={<Users aria-hidden size={18} strokeWidth={1.8} className="text-muted" />}
                onOpen={() => setScreen("athletes")}
              />
            ) : newClient ? (
              <div className={rowClass}>
                <User aria-hidden size={18} strokeWidth={1.8} className="shrink-0 text-muted" />
                <input
                  aria-label="Nom du nouveau sportif"
                  placeholder="Nom du nouveau sportif"
                  value={newAthleteName}
                  maxLength={161}
                  autoComplete="off"
                  onChange={(event) => setNewAthleteName(event.target.value)}
                  className="h-11 min-w-0 flex-1 bg-transparent text-[16px] text-text outline-none placeholder:text-faint"
                />
              </div>
            ) : (
              <MenuRow
                label="Sportif"
                value={athleteName ?? "Choisir un sportif"}
                muted={!athleteName}
                valueOnly
                icon={<User aria-hidden size={18} strokeWidth={1.8} className="text-muted" />}
                onOpen={() => setScreen("athletes")}
              />
            )}
          </div>
          {kind === "individual" && newClient ? (
            <p className="px-4 pt-1.5 text-[12.5px] leading-[1.45] text-muted">
              Sa fiche est créée avec son nom, à compléter ensuite.{" "}
              <button
                type="button"
                onClick={() => setScreen("athletes")}
                className="font-semibold text-violet-text"
              >
                Choisir dans la liste
              </button>
            </p>
          ) : null}
        </div>
        <div>
          <p className={sectionTitleClass}>Options</p>
          <div className={cardClass}>
            <MenuRow
              label="Discipline"
              value={disciplineLabel}
              muted={!discipline}
              icon={<Dumbbell aria-hidden size={18} strokeWidth={1.8} className="text-muted" />}
              onOpen={() => setScreen("discipline")}
            />
          </div>
        </div>
        <div>
          <p className={sectionTitleClass}>Paiement</p>
          <div className={cardClass}>
            <div className={rowClass}>
              <span className="text-[16px] text-text">{priceLabel}</span>
              <span className="flex items-center gap-1.5">
                {priceInput}
                <span className="text-[15px] text-muted">{currencySymbol(currency)}</span>
              </span>
            </div>
            <div className={rowClass}>
              <span className="text-[16px] text-text">Paiement</span>
              {paymentSwitch}
            </div>
            <div className={rowClass}>
              <span className="text-[16px] text-text">Appliquer la TVA</span>
              <Switch checked={vat.apply} onChange={vat.setApply} label="Appliquer la TVA" />
            </div>
            {vat.apply ? (
              <>
                <div className={rowClass}>
                  <label htmlFor={`${formId}-vat`} className="text-[16px] text-text">
                    Taux de TVA
                  </label>
                  {vatRateInput}
                </div>
                <div className={rowClass}>
                  <span className="text-[16px] text-text">TVA comprise dans le prix</span>
                  <Switch
                    checked={vat.included}
                    onChange={vat.setIncluded}
                    label="TVA comprise dans le prix"
                  />
                </div>
              </>
            ) : null}
          </div>
          <p aria-live="polite" className="px-4 pt-1.5 text-[12.5px] leading-[1.45] text-muted">
            {priceHint}
          </p>
        </div>
        <div className={cardClass}>
          <textarea
            aria-label="Note du coach"
            placeholder="Note du coach (facultatif)"
            rows={2}
            maxLength={500}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="block w-full resize-none bg-transparent px-4 py-3 text-[16px] leading-[1.45] text-text outline-none placeholder:text-faint"
          />
        </div>
      </div>
    </div>
  );

  // --- Ordinateur : la bulle du Mac --------------------------------------------------------------
  const label = (text: string) => (
    <span className="text-right text-[13.5px] text-muted">{text}</span>
  );
  const separator = <span aria-hidden className="col-span-2 my-1.5 h-px bg-line" />;
  const athleteItems: PopupItem[] = [
    ...athletes.map((athlete): PopupItem => ({
      kind: "option",
      value: athlete.id,
      label: athlete.name,
    })),
    { kind: "separator" },
    {
      kind: "option",
      value: NEW_ATHLETE,
      label: "Nouveau sportif",
      trailing: <Plus aria-hidden size={14} className="text-violet" />,
    },
  ];
  const disciplineItems: PopupItem[] = [
    { kind: "option", value: "", label: "Non précisée" },
    { kind: "separator" },
    ...SESSION_DISCIPLINES.map((option): PopupItem => ({
      kind: "option",
      value: option,
      label: disciplineLabels[option],
    })),
  ];
  const bubbleMain = (
    <>
      {errorBanner}
      <input
        ref={titleRef}
        aria-label="Titre"
        placeholder={fallbackTitle || "Nouvelle séance"}
        maxLength={120}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className="w-full rounded-[6px] bg-transparent text-[22px] leading-tight font-semibold text-text outline-none placeholder:text-faint selection:bg-violet/40"
      />
      <label className="-mt-1 flex items-center gap-2 text-muted">
        <MapPin aria-hidden size={15} strokeWidth={1.8} className="shrink-0" />
        <input
          aria-label="Lieu"
          placeholder="Ajouter un lieu"
          maxLength={120}
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          className="h-7 min-w-0 flex-1 bg-transparent text-[14px] text-text outline-none placeholder:text-muted"
        />
      </label>
      <div className="grid grid-cols-[112px_minmax(0,1fr)] items-center gap-x-3 gap-y-2">
        {separator}
        {label("Type")}
        {kindSwitch}
        {label("Début")}
        <span className="flex flex-wrap items-center gap-1.5">
          <DateChip label="Date de début" value={startsOn} long onChange={changeStartsOn} />
          {allDay ? null : startTimeInput}
        </span>
        {label("Fin")}
        <span className="flex flex-wrap items-center gap-1.5">
          <span className={`${chipClass} text-text-2`}>{formatDay(startsOn, true)}</span>
          {allDay ? null : endTimeInput}
          {timeProblem || allDay ? null : (
            <span className="text-[13px] text-muted">{formatDuration(duration)}</span>
          )}
        </span>
        <span />
        <span className="flex">
          <MacCheck checked={allDay} onChange={setAllDay} label="Jour entier" />
        </span>
        {timeNote ? (
          <>
            <span />
            {timeNote}
          </>
        ) : null}
        {label("Récurrence")}
        <span className="flex">
          <PopupSelect
            label="Récurrence"
            valueLabel={presetLabels[preset]}
            items={recurrenceItems}
            selected={preset}
            onSelect={chooseRecurrence}
          />
        </span>
        {rule ? (
          <>
            {label("Fin de la répétition")}
            <span className="flex flex-wrap items-center gap-1.5">
              <PopupSelect
                label="Fin de la répétition"
                valueLabel={endsOn ? "À une date" : "Jamais"}
                items={[
                  { kind: "option", value: "never", label: "Jamais" },
                  { kind: "option", value: "date", label: "À une date" },
                ]}
                selected={endsOn ? "date" : "never"}
                onSelect={(value) => setEndsOn(value === "never" ? "" : endsOn || startsOn)}
              />
              {endsOn ? (
                <DateChip
                  label="Date de fin de la répétition"
                  value={endsOn}
                  min={startsOn}
                  long
                  onChange={setEndsOn}
                />
              ) : null}
            </span>
            <span />
            <p className="text-[12.5px] leading-[1.45] text-muted">{sentence}</p>
          </>
        ) : null}
        {separator}
        {kind === "individual" ? (
          <>
            {label("Sportif")}
            {newClient ? (
              <input
                aria-label="Nom du nouveau sportif"
                placeholder="Nom du nouveau sportif"
                value={newAthleteName}
                maxLength={161}
                autoComplete="off"
                autoFocus
                onChange={(event) => setNewAthleteName(event.target.value)}
                className={`${chipClass} w-full font-normal placeholder:text-faint`}
              />
            ) : (
              <span className="flex min-w-0">
                <PopupSelect
                  label="Sportif"
                  valueLabel={athleteName ?? "Choisir un sportif"}
                  muted={!athleteName}
                  items={athleteItems}
                  selected={athleteId || null}
                  onSelect={chooseAthlete}
                  search={athletes.length > 8}
                />
              </span>
            )}
            {newClient ? (
              <>
                <span />
                <p className="text-[12.5px] leading-[1.45] text-muted">
                  Sa fiche est créée avec son nom, à compléter.{" "}
                  <button
                    type="button"
                    onClick={() => setNewClient(false)}
                    className="font-semibold text-violet-text"
                  >
                    Choisir dans la liste
                  </button>
                </p>
              </>
            ) : null}
          </>
        ) : (
          <>
            <span className="self-start pt-1.5 text-right text-[13.5px] text-muted">
              Sportifs inscrits
            </span>
            <span
              role="group"
              aria-label={`Sportifs inscrits : ${enrolledLabel}`}
              className="flex max-h-[148px] flex-wrap gap-1.5 overflow-y-auto"
            >
              {athletes.map((athlete) => {
                const on = athleteIds.includes(athlete.id);
                return (
                  <button
                    key={athlete.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleEnrolled(athlete.id)}
                    className={`inline-flex h-7 items-center gap-1 rounded-[7px] px-2 text-[12.5px] transition-colors duration-150 ${
                      on ? "bg-violet text-white" : "bg-dlg-tile text-text hover:bg-dlg-tile-hover"
                    }`}
                  >
                    {on ? <Check aria-hidden size={12} strokeWidth={2.6} /> : null}
                    {athlete.name}
                  </button>
                );
              })}
              {athletes.length === 0 ? (
                <span className="text-[13px] text-muted">Aucun sportif actif.</span>
              ) : null}
            </span>
          </>
        )}
        {label("Discipline")}
        <span className="flex">
          <PopupSelect
            label="Discipline"
            valueLabel={disciplineLabel}
            muted={!discipline}
            items={disciplineItems}
            selected={discipline}
            onSelect={setDiscipline}
          />
        </span>
        {separator}
        {label("Prix")}
        <span className="flex flex-wrap items-center gap-1.5">
          {priceInput}
          <span className="text-[13.5px] text-muted">{currencySymbol(currency)}</span>
          {paymentSwitch}
        </span>
        {label("TVA")}
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <MacCheck checked={vat.apply} onChange={vat.setApply} label="Appliquer la TVA" />
          {vat.apply ? (
            <>
              {vatRateInput}
              <MacCheck
                checked={vat.included}
                onChange={vat.setIncluded}
                label="TVA comprise dans le prix"
              />
            </>
          ) : null}
        </span>
        <span />
        <p aria-live="polite" className="text-[12.5px] leading-[1.45] text-muted">
          {priceHint}
        </p>
        {separator}
      </div>
      <textarea
        aria-label="Note du coach"
        placeholder="Note du coach (facultatif)"
        rows={2}
        maxLength={500}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        className="block w-full resize-none bg-transparent text-[14px] leading-[1.45] text-text outline-none placeholder:text-muted"
      />
    </>
  );
  const bubble = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-5 pt-5 pb-4 [&>*]:shrink-0">
        {screen === "custom" && rule ? (
          <CustomRule
            rule={rule}
            startsOn={startsOn}
            onChange={setRule}
            onBack={back}
            layout="popover"
          />
        ) : (
          bubbleMain
        )}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
        <span className="text-[12.5px] text-muted">Échap pour annuler</span>
        <button
          type="submit"
          form={formId}
          disabled={submitDisabled}
          className="inline-flex h-9 items-center rounded-[10px] bg-cta px-4 text-[14px] font-semibold text-on-cta transition-[scale,opacity] duration-150 active:scale-[0.97] disabled:opacity-50"
        >
          {pending ? "Enregistrement…" : "Ajouter"}
        </button>
      </div>
    </div>
  );

  return (
    <form
      id={formId}
      action={formAction}
      noValidate
      className={`flex min-h-0 flex-1 flex-col ${popover ? "bg-dlg" : "bg-bg"}`}
    >
      {popover ? (
        bubble
      ) : screen === "main" ? (
        sheet
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pb-6 [&>*]:shrink-0">
          {subScreens[screen]}
        </div>
      )}
      {hidden}
    </form>
  );
}

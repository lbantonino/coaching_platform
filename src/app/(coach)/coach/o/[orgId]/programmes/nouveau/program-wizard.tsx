"use client";

import { ArrowRight, Check, ChevronDown, Minus, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState, useTransition, type ReactNode } from "react";

import { Avatar } from "@/components/ui/avatar";
import { ChipGroup } from "@/components/ui/chip-group";
import {
  MobileActionBar,
  mobileActionPrimaryClass,
  mobileActionSecondaryClass,
} from "@/components/ui/mobile-action-bar";
import { OptionCard, RadioMark } from "@/components/ui/radio-choice";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SelectField } from "@/components/ui/select-field";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { disciplineLabels, disciplineStyles, type Discipline } from "@/domain/training/discipline";
import { hyroxDivisionLabels } from "@/domain/training/hyrox-official";
import { HYROX_DIVISIONS, type HyroxDivision } from "@/domain/training/program-plan";
import { firstFreeMonday, periodsOverlap } from "@/domain/training/program-status";
import {
  createProgram,
  createProgramTemplate,
  previewStart,
  type StartPreview,
} from "@/features/programs/actions";
import type { WizardAthlete, WizardData } from "@/features/programs/wizard";

// Assistant « Créer un programme » (maquette 02, WIZ-01 à 05, D-157), 4 étapes navigables : une étape
// déjà vue se rouvre d'un clic (ordinateur) ; « Continuer » reste grisé tant qu'un champ requis manque
// ([P] accepté). Ordinateur : la liste des étapes à gauche (250 px), le contenu (620 px au plus), le
// pied « Retour / Continuer ». Téléphone : 4 barres de progression, le titre de l'étape, le contenu dans
// une carte, la barre d'actions fixe en bas. Mode « modèle » (?modele=nouveau) : sans sportif ni dates.

type StepIndex = 1 | 2 | 3 | 4;
type MainDiscipline = "running" | "strength" | "hyrox" | "hybrid";
type StartKind = "blank" | "copy" | "template";
type PhaseDraft = { name: string; length: number };

const PHASE_NAMES = ["Base", "Spécifique", "Affûtage"];
// Séances par semaine (D-164) : 1 à 7 en puces ; « 8+ » ouvre un compteur jusqu'à 14 (certains jours
// ont alors plusieurs séances : matin, midi, après-midi, soir).
const MAX_PER_WEEK = 14;
// D-177 : « Hybride » (prévu « plus tard » par le brief) pour les modèles Coory hybrides.
const DISCIPLINE_CHOICES: MainDiscipline[] = ["running", "strength", "hyrox", "hybrid"];

const kicker = "text-[12px] leading-[normal] font-semibold tracking-[0.05em] text-faint uppercase";
const fieldLabel = "text-[13.5px] leading-[normal] font-semibold text-text";
const inputClass =
  "h-[46px] w-full min-w-0 rounded-[12px] bg-surface px-3.5 text-[16px] font-medium text-text inset-ring inset-ring-field-ring outline-none placeholder:font-normal placeholder:text-faint focus:inset-ring-[1.5px] focus:inset-ring-violet lg:text-[15px]";

const dateFormat = new Intl.DateTimeFormat("fr-BE", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const formatLongDay = (iso: string) => dateFormat.format(new Date(`${iso}T00:00:00Z`));

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// Les semaines se lisent du lundi au dimanche (C-9) : une date choisie revient au lundi de sa semaine.
function mondayOf(iso: string): string {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return addDays(iso, -((day + 6) % 7));
}

// Façon de viser pré-choisie (WIZ-F06) : allure si la VMA est connue, sinon zones de FC ; % du max si
// des maxima sont reliés à un exercice, sinon kg.
function aimFor(athlete: WizardAthlete | undefined) {
  return {
    running: athlete?.hasVma ? ("pace" as const) : ("hr" as const),
    strength: athlete?.hasLinkedMaxes ? ("pct" as const) : ("kg" as const),
  };
}

function mainDiscipline(value: Discipline | null | undefined): MainDiscipline | null {
  return value === "running" || value === "strength" || value === "hyrox" || value === "hybrid"
    ? value
    : null;
}

// Début proposé pour ce sportif (revue MVP du 13/11, B8) : le prochain lundi, ou le lundi qui suit son
// dernier programme publié, pour ne pas le chevaucher.
function freeStart(athlete: WizardAthlete | undefined, fallback: string): string {
  return firstFreeMonday(
    (athlete?.programs ?? []).filter((program) => program.status === "published"),
    fallback,
  );
}

export function ProgramWizard({
  organizationId,
  base,
  data,
  templateMode,
  initialAthleteId,
  lockedAthlete = false,
  initialTemplateId,
  initialCopy = false,
  defaultStartDate,
}: {
  organizationId: string;
  base: string;
  data: WizardData;
  templateMode: boolean;
  initialAthleteId: string | null;
  // Ouvert depuis la fiche du sportif (D-163) : le sportif est fixé, l'étape 1 ne demande que le titre.
  lockedAthlete?: boolean;
  initialTemplateId: string | null;
  // « Copier un programme précédent » (onglet Programme du sportif) : étape 4 sur « Copier ».
  initialCopy?: boolean;
  defaultStartDate: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const initialAthlete = data.athletes.find((a) => a.id === initialAthleteId);
  // « Utiliser » un modèle : sa discipline et sa durée sont proposées (le sportif passe avant).
  const initialTemplate = data.templates.find((t) => t.id === initialTemplateId);

  // Depuis la fiche d'un sportif, l'étape 1 est déjà remplie : on commence à l'étape 1 quand même
  // (le titre reste à écrire), le sportif choisi en tête de liste.
  const [step, setStep] = useState<StepIndex>(1);
  const [seen, setSeen] = useState<StepIndex>(1);
  const [athleteId, setAthleteId] = useState<string | null>(initialAthleteId);
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [discipline, setDiscipline] = useState<MainDiscipline | null>(
    mainDiscipline(initialAthlete?.programType) ?? mainDiscipline(initialTemplate?.discipline),
  );
  const [raceOn, setRaceOn] = useState(false);
  const [raceName, setRaceName] = useState("");
  const [raceDate, setRaceDate] = useState("");
  const [division, setDivision] = useState<HyroxDivision | "">(
    initialAthlete?.defaultDivision ?? "",
  );
  const [aim, setAim] = useState(aimFor(initialAthlete));
  const [note, setNote] = useState("");
  const [startDate, setStartDate] = useState(() => freeStart(initialAthlete, defaultStartDate));
  // La date a été choisie à la main : changer de sportif ne la remplace plus.
  const [dateTouched, setDateTouched] = useState(false);
  const [snapped, setSnapped] = useState(false);
  const [weeksCount, setWeeksCount] = useState(initialTemplate?.weeksCount ?? 12);
  // Parti d'un modèle (« Utiliser »), son rythme (C15) ; sinon celui du sportif.
  const [perWeek, setPerWeek] = useState(
    String(
      Math.min(
        Math.max(initialTemplate?.sessionsPerWeek ?? initialAthlete?.sessionsPerWeek ?? 4, 1),
        MAX_PER_WEEK,
      ),
    ),
  );
  const [phases, setPhases] = useState<PhaseDraft[]>([]);
  const [editedPhase, setEditedPhase] = useState<number | null>(null);
  const [scheduling, setScheduling] = useState<"ordered" | "fixed">("ordered");
  const [start, setStart] = useState<StartKind>(
    initialTemplateId
      ? "template"
      : initialCopy && (initialAthlete?.programs.length ?? 0) > 0
        ? "copy"
        : "blank",
  );
  const [sourceProgramId, setSourceProgramId] = useState(initialAthlete?.programs[0]?.id ?? "");
  const [templateId, setTemplateId] = useState(initialTemplateId ?? data.templates[0]?.id ?? "");
  const [preview, setPreview] = useState<StartPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const athlete = data.athletes.find((a) => a.id === athleteId);
  const firstName = athlete?.firstName ?? "ton sportif";
  const fixed = lockedAthlete && !templateMode && athlete ? athlete : null;

  // Changer de sportif : la façon de viser, la division et les séances par semaine suivent ses repères.
  const chooseAthlete = (next: WizardAthlete) => {
    setAthleteId(next.id);
    setAim(aimFor(next));
    setDivision(next.defaultDivision ?? "");
    if (next.sessionsPerWeek) {
      setPerWeek(String(Math.min(Math.max(next.sessionsPerWeek, 1), MAX_PER_WEEK)));
    }
    if (!discipline) setDiscipline(mainDiscipline(next.programType));
    setSourceProgramId(next.programs[0]?.id ?? "");
    if (!dateTouched) setStartDate(freeStart(next, defaultStartDate));
  };

  // Les phases ne dépassent jamais le programme.
  const changeWeeks = (value: number) => {
    const next = Math.min(Math.max(value, 1), 52);
    setWeeksCount(next);
    setPhases((current) => {
      let left = next;
      return current
        .map((phase) => {
          const length = Math.min(phase.length, left);
          left -= length;
          return { ...phase, length };
        })
        .filter((phase) => phase.length > 0);
    });
  };
  const phaseWeeks = phases.reduce((total, phase) => total + phase.length, 0);
  const addPhase = () => {
    const free = weeksCount - phaseWeeks;
    if (free <= 0) return;
    // Proposition (modifiable) : un tiers pour la première phase ; la deuxième laisse un quart du
    // programme pour une troisième (12 semaines : Base 4, Spécifique 5, Affûtage 3) ; ensuite, le reste.
    const length =
      phases.length === 0
        ? Math.max(1, Math.round(weeksCount / 3))
        : phases.length === 1
          ? Math.max(1, free - Math.round(weeksCount / 4))
          : free;
    setPhases((current) => [
      ...current,
      {
        name: PHASE_NAMES[current.length] ?? `Phase ${current.length + 1}`,
        length: Math.min(length, free),
      },
    ]);
    setEditedPhase(phases.length);
  };

  const endDate = addDays(startDate, weeksCount * 7 - 1);
  // C3 : des dates qui chevauchent un programme publié du sportif ne pourront pas être publiées.
  const overlapping = (athlete?.programs ?? []).filter(
    (program) =>
      program.status === "published" && periodsOverlap({ startDate, weeksCount }, program),
  );
  const raceRelation = useMemo(() => {
    if (!raceOn || !raceDate) return null;
    const weeks = Math.round((Date.parse(endDate) - Date.parse(raceDate)) / (7 * 86_400_000));
    if (weeks === 0) return "la semaine de la course";
    return weeks > 0
      ? `${weeks} semaine${weeks > 1 ? "s" : ""} après la course`
      : `${-weeks} semaine${weeks < -1 ? "s" : ""} avant la course`;
  }, [raceOn, raceDate, endDate]);

  const startInput = useMemo(
    () =>
      start === "copy" && sourceProgramId
        ? ({ kind: "copy", programId: sourceProgramId } as const)
        : start === "template" && templateId
          ? ({ kind: "template", templateId } as const)
          : ({ kind: "blank" } as const),
    [start, sourceProgramId, templateId],
  );

  // Aperçu de l'étape 4 : redemandé quand le point de départ ou la taille change.
  useEffect(() => {
    if (step !== 4) return;
    let cancelled = false;
    previewStart(organizationId, {
      start: startInput,
      weeksCount,
      sessionsPerWeek: Number(perWeek),
    }).then((result) => {
      if (!cancelled) setPreview(result.ok ? { weeks: result.weeks, filled: result.filled } : null);
    });
    return () => {
      cancelled = true;
    };
  }, [step, organizationId, startInput, weeksCount, perWeek]);

  const ready: Record<StepIndex, boolean> = {
    1: templateMode ? title.trim().length > 0 : Boolean(athleteId) && title.trim().length > 0,
    2: discipline !== null && (!raceOn || raceName.trim().length > 0),
    3: templateMode || /^\d{4}-\d{2}-\d{2}$/.test(startDate),
    4:
      start === "blank" ||
      (start === "copy" && Boolean(sourceProgramId)) ||
      (start === "template" && Boolean(templateId)),
  };

  const go = (next: StepIndex) => {
    setError(null);
    setStep(next);
    setSeen((current) => (next > current ? next : current));
    window.scrollTo({ top: 0 });
  };

  const phaseInput = () => {
    let from = 1;
    return phases.map((phase) => {
      const item = {
        name: phase.name.trim() || "Phase",
        weekFrom: from,
        weekTo: from + phase.length - 1,
      };
      from += phase.length;
      return item;
    });
  };

  const submit = () => {
    if (!discipline) return;
    setError(null);
    startTransition(async () => {
      if (templateMode) {
        const result = await createProgramTemplate(organizationId, {
          title: title.trim(),
          discipline,
          aimDefaults: aim,
          weeksCount,
          sessionsPerWeek: Number(perWeek),
          phases: phaseInput(),
          scheduling,
          start:
            start === "template" && templateId
              ? { kind: "template", templateId }
              : { kind: "blank" },
        });
        if (!result.ok) return setError(result.issues?.[0] ?? result.message);
        toast("Modèle créé.");
        router.push(`${base}/modeles/${result.templateId}`);
        return;
      }
      if (!athleteId) return;
      const result = await createProgram(organizationId, {
        athleteId,
        title: title.trim(),
        discipline,
        ...(raceOn || note.trim() || (discipline === "hyrox" && division)
          ? {
              goal: {
                ...(raceOn && raceName.trim() ? { raceName: raceName.trim() } : {}),
                ...(raceOn && raceDate ? { raceDate } : {}),
                // C4 : la catégorie compte dès que le programme est Hyrox (charges officielles),
                // course visée ou non.
                ...(discipline === "hyrox" && division ? { hyroxDivision: division } : {}),
                ...(note.trim() ? { note: note.trim() } : {}),
              },
            }
          : {}),
        aimDefaults: aim,
        startDate,
        weeksCount,
        sessionsPerWeek: Number(perWeek),
        phases: phaseInput(),
        scheduling,
        start: startInput,
      });
      if (!result.ok) return setError(result.issues?.[0] ?? result.message);
      toast("Brouillon créé.");
      router.push(`${base}/${result.programId}`);
    });
  };

  const steps = [
    fixed
      ? {
          title: "Titre",
          sub: `Pour ${fixed.firstName}`,
          question: `Comment s'appelle le programme de ${fixed.firstName} ?`,
        }
      : {
          title: templateMode ? "Nom" : "Pour qui",
          sub: templateMode ? "Titre du modèle" : "Sportif et titre",
          question: templateMode ? "Comment s'appelle ce modèle ?" : "Pour qui est ce programme ?",
        },
    { title: "Objectif", sub: "Discipline et course", question: "Quel est l'objectif ?" },
    {
      title: "Calendrier",
      sub: templateMode ? "Durée, séances" : "Début, durée, séances",
      question: "Comment s'organise-t-il ?",
    },
    { title: "Point de départ", sub: "Zéro ou copie + aperçu", question: "D'où pars-tu ?" },
  ] as const;
  const current = steps[step - 1];
  const last = step === 4;
  const primaryLabel = last
    ? templateMode
      ? "Créer le modèle"
      : "Créer le brouillon"
    : "Continuer";
  // Dernière étape : si une étape d'avant n'est plus complète (titre effacé en revenant en arrière),
  // on y retourne au lieu d'envoyer une demande que le serveur refuserait.
  const missing = last ? ([1, 2, 3] as StepIndex[]).find((index) => !ready[index]) : undefined;
  const onPrimary = () => {
    if (!last) return go((step + 1) as StepIndex);
    if (missing) {
      go(missing);
      return setError("Complète cette étape pour créer le programme.");
    }
    submit();
  };
  const primaryDisabled = !ready[step] || pending;

  return (
    <div className="flex flex-1 flex-col lg:min-h-0 lg:flex-row lg:overflow-hidden lg:rounded-[20px] lg:bg-surface">
      {/* Ordinateur : la liste des étapes. */}
      <nav
        aria-label="Étapes"
        className="hidden w-[250px] shrink-0 flex-col gap-1 border-r border-dlg-divider px-[18px] py-6 lg:flex"
      >
        <p className="mb-3.5 px-2 text-[17px] leading-[normal] font-semibold tracking-[-0.01em] text-text">
          {templateMode ? "Nouveau modèle" : "Nouveau programme"}
        </p>
        {steps.map((item, i) => {
          const index = (i + 1) as StepIndex;
          const done = index < step || (index <= seen && index !== step && ready[index]);
          const active = index === step;
          const reachable = index <= seen;
          return (
            <button
              key={item.title}
              type="button"
              disabled={!reachable}
              aria-current={active ? "step" : undefined}
              onClick={() => go(index)}
              className={`flex h-14 w-full items-center gap-3 rounded-[12px] px-2.5 text-left transition-colors duration-150 disabled:cursor-default ${
                active ? "bg-lib-lavender" : reachable ? "hover:bg-surface-2" : ""
              }`}
            >
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full text-[12.5px] font-semibold ${
                  active
                    ? "bg-violet text-white"
                    : done
                      ? "bg-cta text-on-cta"
                      : "text-muted inset-ring-[1.5px] inset-ring-line-2"
                }`}
              >
                {done && !active ? <Check aria-hidden size={14} strokeWidth={2.6} /> : index}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-[14px] leading-[normal] font-semibold text-text">
                  {item.title}
                </span>
                <span
                  className={`truncate text-[12px] leading-[normal] ${active ? "text-muted" : "text-faint"}`}
                >
                  {item.sub}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col lg:min-h-0">
        <div className="flex-1 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:px-9 lg:py-7">
          {/* Téléphone : 4 barres de progression. */}
          <div aria-hidden className="mb-3 flex gap-1.5 lg:hidden">
            {steps.map((item, i) => (
              <span
                key={item.title}
                className={`h-[5px] flex-1 rounded-full ${i < step ? "bg-violet" : "bg-dlg-handle"}`}
              />
            ))}
          </div>
          <div className="lg:max-w-[620px]">
            <p className={kicker}>
              Étape {step} sur 4<span className="lg:hidden"> · {current.title}</span>
            </p>
            <h2 className="mt-1.5 text-[24px] leading-[1.15] font-bold tracking-[-0.02em] text-text lg:text-[26px] lg:tracking-[-0.025em]">
              {current.question}
            </h2>
            <div className="mt-4 flex flex-col gap-5 rounded-[22px] bg-surface p-[18px] lg:mt-6 lg:rounded-none lg:bg-transparent lg:p-0">
              {step === 1 ? (
                templateMode ? (
                  <Field label="Nom du modèle" htmlFor="wizard-title">
                    <input
                      id="wizard-title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      maxLength={120}
                      placeholder="Prépa semi · 12 semaines"
                      className={inputClass}
                    />
                  </Field>
                ) : (
                  <>
                    {fixed ? (
                      <FixedAthlete athlete={fixed} />
                    ) : (
                      <AthletePicker
                        athletes={data.athletes}
                        selected={athleteId}
                        query={query}
                        onQuery={setQuery}
                        onChoose={chooseAthlete}
                      />
                    )}
                    <Field label="Titre du programme" htmlFor="wizard-title">
                      <input
                        id="wizard-title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        maxLength={120}
                        placeholder="Prépa HYROX Gand"
                        className={inputClass}
                      />
                    </Field>
                  </>
                )
              ) : null}

              {step === 2 ? (
                <>
                  <fieldset className="m-0 flex min-w-0 flex-col gap-2.5 border-0 p-0">
                    <legend className={`${fieldLabel} mb-2.5`}>Discipline principale</legend>
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                      {DISCIPLINE_CHOICES.map((choice) => (
                        <label
                          key={choice}
                          className={`flex min-h-[84px] cursor-pointer flex-col justify-between rounded-[14px] bg-surface p-3.5 max-lg:pr-1.5 max-lg:pl-3 transition-[box-shadow,scale] duration-150 active:scale-[0.98] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-violet ${
                            discipline === choice
                              ? "inset-ring-[1.5px] inset-ring-text"
                              : "inset-ring inset-ring-field-ring"
                          }`}
                        >
                          <input
                            type="radio"
                            name="wizard-discipline"
                            value={choice}
                            checked={discipline === choice}
                            onChange={() => setDiscipline(choice)}
                            className="sr-only"
                          />
                          <span
                            aria-hidden
                            className={`size-2.5 rounded-full ${disciplineStyles[choice].dot}`}
                          />
                          <span className="truncate text-[15px] leading-[normal] font-semibold text-text">
                            {disciplineLabels[choice]}
                          </span>
                        </label>
                      ))}
                    </div>
                    {/* Demande d'Antonino du 11/11 : la discipline principale n'enferme pas le programme. */}
                    <p className="text-[12.5px] leading-[1.4] text-muted">
                      Tu pourras aussi y ajouter des séances des autres disciplines, comme un renfo
                      jambes dans un programme running.
                    </p>
                  </fieldset>

                  {templateMode ? null : (
                    <div className="flex flex-col gap-3 rounded-[14px] bg-surface-2 p-4">
                      <Switch checked={raceOn} onChange={setRaceOn} label="Objectif de course" />
                      {raceOn ? (
                        <>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <input
                              aria-label="Nom de la course"
                              value={raceName}
                              onChange={(event) => setRaceName(event.target.value)}
                              maxLength={120}
                              placeholder="HYROX Gand"
                              className={`${inputClass} h-11`}
                            />
                            <input
                              aria-label="Date de la course"
                              type="date"
                              value={raceDate}
                              onChange={(event) => setRaceDate(event.target.value)}
                              className={`${inputClass} h-11`}
                            />
                          </div>
                        </>
                      ) : null}
                      {/* C4 : la catégorie Hyrox, même sans course visée (charges officielles). */}
                      {discipline === "hyrox" ? (
                        <Field label="Catégorie Hyrox" htmlFor="wizard-division">
                          <SelectField
                            id="wizard-division"
                            value={division}
                            onChange={(event) =>
                              setDivision(event.target.value as HyroxDivision | "")
                            }
                          >
                            <option value="">Choisir la catégorie</option>
                            {HYROX_DIVISIONS.map((value) => (
                              <option key={value} value={value}>
                                {hyroxDivisionLabels[value]}
                              </option>
                            ))}
                          </SelectField>
                        </Field>
                      ) : null}
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <p className={fieldLabel}>Façon de viser par défaut</p>
                      <p className="text-[12.5px] leading-[1.45] text-muted">
                        {athlete
                          ? `Pré-choisie d'après les repères de ${firstName}. Modifiable séance par séance.`
                          : "Modifiable séance par séance."}
                      </p>
                    </div>
                    <AimRow discipline="running">
                      <SegmentedControl
                        label="Running"
                        value={aim.running}
                        onChange={(running) => setAim((current) => ({ ...current, running }))}
                        options={[
                          { value: "pace", label: "Allure" },
                          { value: "hr", label: "Zones de FC" },
                        ]}
                      />
                    </AimRow>
                    <AimRow discipline="strength">
                      <SegmentedControl
                        label="Musculation"
                        value={aim.strength}
                        onChange={(strength) => setAim((current) => ({ ...current, strength }))}
                        options={[
                          { value: "kg", label: "kg" },
                          { value: "pct", label: "% du max" },
                        ]}
                      />
                    </AimRow>
                  </div>

                  {templateMode ? null : (
                    <Field label="Note" optional htmlFor="wizard-note">
                      <textarea
                        id="wizard-note"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        maxLength={300}
                        rows={3}
                        placeholder="Ce que tu veux garder en tête pour ce programme"
                        className={`${inputClass} h-auto min-h-[84px] resize-y py-3 leading-[1.5] font-normal`}
                      />
                    </Field>
                  )}
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <div className={`grid gap-3 ${templateMode ? "" : "sm:grid-cols-2"}`}>
                    {templateMode ? null : (
                      <Field label="Date de début" htmlFor="wizard-start">
                        <input
                          id="wizard-start"
                          type="date"
                          value={startDate}
                          onChange={(event) => {
                            if (!event.target.value) return;
                            const monday = mondayOf(event.target.value);
                            setSnapped(monday !== event.target.value);
                            setStartDate(monday);
                            setDateTouched(true);
                          }}
                          className={inputClass}
                        />
                      </Field>
                    )}
                    <Field label="Nombre de semaines" htmlFor="wizard-weeks">
                      <div className="flex h-[46px] items-center rounded-[12px] bg-surface inset-ring inset-ring-field-ring">
                        <button
                          type="button"
                          aria-label="Une semaine de moins"
                          disabled={weeksCount <= 1}
                          onClick={() => changeWeeks(weeksCount - 1)}
                          className="grid h-full w-11 shrink-0 place-items-center text-text transition-[scale] duration-150 enabled:active:scale-90 disabled:text-dlg-disabled"
                        >
                          <Minus aria-hidden size={16} strokeWidth={2} />
                        </button>
                        <input
                          id="wizard-weeks"
                          inputMode="numeric"
                          value={weeksCount}
                          onChange={(event) => {
                            const value = Number(event.target.value.replace(/\D/g, ""));
                            if (value) changeWeeks(value);
                          }}
                          className="h-full min-w-0 flex-1 bg-transparent text-center text-[16px] font-semibold text-text outline-none lg:text-[15px]"
                        />
                        <button
                          type="button"
                          aria-label="Une semaine de plus"
                          disabled={weeksCount >= 52}
                          onClick={() => changeWeeks(weeksCount + 1)}
                          className="grid h-full w-11 shrink-0 place-items-center text-text transition-[scale] duration-150 enabled:active:scale-90 disabled:text-dlg-disabled"
                        >
                          <Plus aria-hidden size={16} strokeWidth={2} />
                        </button>
                      </div>
                    </Field>
                  </div>
                  {templateMode ? null : (
                    <p className="-mt-2 text-[12.5px] leading-[1.45] text-muted">
                      Se termine le {formatLongDay(endDate)}
                      {raceRelation ? ` · ${raceRelation}` : ""}
                      {snapped ? " · les semaines commencent le lundi" : ""}
                    </p>
                  )}
                  {!templateMode && overlapping.length > 0 ? (
                    <p
                      role="status"
                      className="-mt-1 rounded-[12px] bg-warn-soft px-3 py-2.5 text-[12.5px] leading-[1.45] text-text-2"
                    >
                      Ces dates chevauchent{" "}
                      {overlapping.map((program) => `« ${program.title} »`).join(", ")}, déjà
                      publié. Le brouillon se crée, mais il ne pourra être publié qu&apos;après un
                      changement de dates (menu « ··· » de l&apos;éditeur, « Modifier les dates »).
                    </p>
                  ) : null}

                  <Field label="Séances par semaine">
                    <ChipGroup
                      label="Séances par semaine"
                      size="count"
                      value={Number(perWeek) > 7 ? "8+" : perWeek}
                      onChange={(value) =>
                        setPerWeek(value === "8+" ? (Number(perWeek) > 7 ? perWeek : "8") : value)
                      }
                      options={["1", "2", "3", "4", "5", "6", "7", "8+"].map((value) => ({
                        value,
                        label: value,
                      }))}
                    />
                  </Field>
                  {Number(perWeek) > 7 ? (
                    <div className="-mt-1 flex flex-col gap-3 rounded-[14px] bg-surface-2 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <p className={fieldLabel}>Nombre de séances</p>
                          <p className="text-[12.5px] leading-[normal] text-muted">De 8 à 14</p>
                        </div>
                        <div className="flex h-11 w-[132px] shrink-0 items-center rounded-[12px] bg-surface inset-ring inset-ring-field-ring">
                          <button
                            type="button"
                            aria-label="Une séance de moins"
                            disabled={Number(perWeek) <= 8}
                            onClick={() => setPerWeek(String(Number(perWeek) - 1))}
                            className="grid h-full w-11 shrink-0 place-items-center text-text transition-[scale] duration-150 enabled:active:scale-90 disabled:text-dlg-disabled"
                          >
                            <Minus aria-hidden size={16} strokeWidth={2} />
                          </button>
                          <span
                            aria-live="polite"
                            className="flex-1 text-center text-[16px] font-semibold text-text tabular-nums lg:text-[15px]"
                          >
                            {perWeek}
                          </span>
                          <button
                            type="button"
                            aria-label="Une séance de plus"
                            disabled={Number(perWeek) >= MAX_PER_WEEK}
                            onClick={() => setPerWeek(String(Number(perWeek) + 1))}
                            className="grid h-full w-11 shrink-0 place-items-center text-text transition-[scale] duration-150 enabled:active:scale-90 disabled:text-dlg-disabled"
                          >
                            <Plus aria-hidden size={16} strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                      <p className="text-[12.5px] leading-[1.45] text-muted">
                        Au-delà de 7, certains jours auront plusieurs séances : jusqu&apos;à 4,
                        chacune avec son moment (matin, midi, après-midi ou soir).
                      </p>
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className={fieldLabel}>
                        Phases <span className="font-normal text-faint">(facultatif)</span>
                      </p>
                      {phases.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPhases([]);
                            setEditedPhase(null);
                          }}
                          className="text-[13px] font-semibold text-violet-text"
                        >
                          Le faire plus tard
                        </button>
                      ) : null}
                    </div>
                    <div className="flex gap-1.5">
                      {(() => {
                        let from = 1;
                        return phases.map((phase, i) => {
                          const range = `S${from}${phase.length > 1 ? ` – ${from + phase.length - 1}` : ""}`;
                          from += phase.length;
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setEditedPhase(editedPhase === i ? null : i)}
                              style={{ flexGrow: phase.length, flexBasis: 0 }}
                              className={`flex h-[50px] min-w-0 flex-col justify-center rounded-[11px] px-2 text-left transition-[box-shadow] duration-150 ${
                                editedPhase === i
                                  ? "bg-surface inset-ring-[1.5px] inset-ring-violet"
                                  : "bg-bg"
                              }`}
                            >
                              <span className="truncate text-[13px] leading-[normal] font-semibold text-text">
                                {phase.name || "Phase"}
                              </span>
                              <span className="truncate text-[11.5px] leading-[normal] text-muted">
                                {range}
                              </span>
                            </button>
                          );
                        });
                      })()}
                      {weeksCount - phaseWeeks > 0 && phases.length > 0 ? (
                        <span
                          aria-hidden
                          style={{ flexGrow: weeksCount - phaseWeeks, flexBasis: 0 }}
                          className="h-[50px] min-w-0 rounded-[11px] border border-dashed border-line-2"
                        />
                      ) : null}
                      <button
                        type="button"
                        aria-label="Ajouter une phase"
                        disabled={phaseWeeks >= weeksCount}
                        onClick={addPhase}
                        className={`grid h-[50px] shrink-0 place-items-center rounded-[11px] bg-surface text-text inset-ring inset-ring-field-ring transition-[scale] duration-150 enabled:active:scale-95 disabled:text-dlg-disabled ${
                          phases.length === 0 ? "flex-1 gap-1.5 text-[13.5px] font-medium" : "w-12"
                        }`}
                      >
                        {phases.length === 0 ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Plus aria-hidden size={15} strokeWidth={2} />
                            Ajouter une phase
                          </span>
                        ) : (
                          <Plus aria-hidden size={16} strokeWidth={2} />
                        )}
                      </button>
                    </div>
                    {editedPhase !== null && phases[editedPhase] ? (
                      <PhaseEditor
                        phase={phases[editedPhase]}
                        max={phases[editedPhase].length + (weeksCount - phaseWeeks)}
                        onChange={(next) =>
                          setPhases((current) =>
                            current.map((phase, i) => (i === editedPhase ? next : phase)),
                          )
                        }
                        onRemove={() => {
                          setPhases((current) => current.filter((_, i) => i !== editedPhase));
                          setEditedPhase(null);
                        }}
                      />
                    ) : null}
                  </div>

                  <fieldset className="m-0 flex min-w-0 flex-col gap-2.5 border-0 p-0">
                    <legend className={`${fieldLabel} mb-2.5`}>Organisation de la semaine</legend>
                    <OptionCard
                      name="wizard-scheduling"
                      value="ordered"
                      checked={scheduling === "ordered"}
                      onChange={() => setScheduling("ordered")}
                      title="Dans l'ordre, sans jour"
                      description={
                        templateMode
                          ? "Par défaut. Les séances se font dans l'ordre, au jour choisi par le sportif."
                          : `Par défaut. ${firstName} fait les séances 1 → ${perWeek} dans l'ordre, au jour de son choix.`
                      }
                    />
                    <OptionCard
                      name="wizard-scheduling"
                      value="fixed"
                      checked={scheduling === "fixed"}
                      onChange={() => setScheduling("fixed")}
                      title="Un jour fixe par séance"
                      description="Tu choisis un jour pour chaque séance (lundi, mercredi…)."
                    />
                  </fieldset>
                </>
              ) : null}

              {step === 4 ? (
                <>
                  <div className="grid gap-2.5 lg:grid-cols-3">
                    <OptionCard
                      name="wizard-start"
                      value="blank"
                      radio={false}
                      checked={start === "blank"}
                      onChange={() => setStart("blank")}
                      title="Partir de zéro"
                      description="Les semaines sont créées vides : tu ajoutes les séances une à une."
                    />
                    {templateMode ? null : (
                      <OptionCard
                        name="wizard-start"
                        value="copy"
                        radio={false}
                        checked={start === "copy"}
                        onChange={() => {
                          setStart("copy");
                          if (!sourceProgramId) setSourceProgramId(athlete?.programs[0]?.id ?? "");
                        }}
                        title="Copier un programme précédent"
                        description={
                          athlete && athlete.programs.length > 0
                            ? `Reprend les séances d'un ancien programme de ${firstName}.`
                            : `${firstName} n'a pas encore de programme à copier.`
                        }
                        className={
                          athlete && athlete.programs.length > 0
                            ? ""
                            : "pointer-events-none opacity-50"
                        }
                      />
                    )}
                    <OptionCard
                      name="wizard-start"
                      value="template"
                      radio={false}
                      checked={start === "template"}
                      onChange={() => setStart("template")}
                      title="Partir d'un modèle"
                      description="Un modèle Coory ou un des tiens. Coory en fait une copie."
                    />
                  </div>

                  {start === "copy" && athlete ? (
                    <SourceSelect
                      label="Programme à copier"
                      value={sourceProgramId}
                      onChange={setSourceProgramId}
                      options={athlete.programs.map((program) => ({
                        value: program.id,
                        title: program.title,
                        meta: `${firstName} · ${program.weeksCount} semaines · ${
                          program.status === "draft"
                            ? "brouillon"
                            : program.status === "archived"
                              ? "archivé"
                              : `publié v${program.publicationNumber ?? 1}`
                        }`,
                        discipline: athlete.programType,
                      }))}
                    />
                  ) : null}
                  {start === "template" ? (
                    <SourceSelect
                      label="Modèle"
                      value={templateId}
                      onChange={(id) => {
                        setTemplateId(id);
                        // C15 : le programme reprend le rythme du modèle.
                        const chosen = data.templates.find((template) => template.id === id);
                        if (chosen?.sessionsPerWeek) {
                          setPerWeek(String(Math.min(chosen.sessionsPerWeek, MAX_PER_WEEK)));
                        }
                      }}
                      options={[...data.templates]
                        .sort(
                          (a, b) =>
                            Number(b.discipline === discipline) -
                            Number(a.discipline === discipline),
                        )
                        .map((template) => ({
                          value: template.id,
                          title: template.title,
                          meta: `${template.source === "coory" ? "Coory" : "Mes modèles"} · ${template.detail}`,
                          discipline: template.discipline,
                        }))}
                    />
                  ) : null}

                  {start === "copy" ? (
                    <p className="text-[12.5px] leading-[1.45] text-muted">
                      La copie garde le rythme du programme copié (séances par semaine), sans ses
                      rendez-vous avec le coach.
                    </p>
                  ) : null}
                  <StartPreviewGrid
                    preview={preview}
                    weeksCount={weeksCount}
                    perWeek={Number(perWeek)}
                  />
                </>
              ) : null}

              {error ? (
                <p role="alert" className="text-[13.5px] leading-[1.45] font-medium text-alert">
                  {error}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Ordinateur : le pied de l'assistant. */}
        <div className="hidden items-center justify-between border-t border-dlg-divider px-9 py-4 lg:flex">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => go((step - 1) as StepIndex)}
            className="inline-flex h-11 items-center rounded-[12px] bg-surface px-[18px] text-[14.5px] font-semibold text-text inset-ring inset-ring-line-2 transition-[scale,background-color] duration-150 enabled:hover:bg-surface-2 enabled:active:scale-[0.98] disabled:text-dlg-disabled"
          >
            Retour
          </button>
          <button
            type="button"
            disabled={primaryDisabled}
            onClick={onPrimary}
            className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-cta px-5 text-[14.5px] font-semibold whitespace-nowrap text-on-cta transition-[scale,background-color,opacity] duration-150 enabled:hover:bg-cta-hover enabled:active:scale-[0.98] disabled:opacity-45"
          >
            {pending ? "Création…" : primaryLabel}
            {last ? null : <ArrowRight aria-hidden size={15} strokeWidth={2} />}
          </button>
        </div>
      </div>

      {/* Téléphone : la barre d'actions fixe. */}
      <MobileActionBar>
        <button
          type="button"
          disabled={step === 1}
          onClick={() => go((step - 1) as StepIndex)}
          className={`${mobileActionSecondaryClass} w-[110px] disabled:text-dlg-disabled`}
        >
          Retour
        </button>
        <button
          type="button"
          disabled={primaryDisabled}
          onClick={onPrimary}
          className={mobileActionPrimaryClass}
        >
          {pending ? "Création…" : primaryLabel}
        </button>
      </MobileActionBar>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  optional = false,
  children,
}: {
  label: string;
  htmlFor?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      {htmlFor ? (
        <label htmlFor={htmlFor} className={fieldLabel}>
          {label}
          {optional ? <span className="font-normal text-faint"> (facultatif)</span> : null}
        </label>
      ) : (
        <p className={fieldLabel}>{label}</p>
      )}
      {children}
    </div>
  );
}

function AimRow({ discipline, children }: { discipline: Discipline; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex w-[118px] shrink-0 items-center gap-2 text-[14px] font-semibold text-text lg:w-[130px]">
        <span aria-hidden className={`size-2 rounded-full ${disciplineStyles[discipline].dot}`} />
        {disciplineLabels[discipline]}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

// Étape 1 depuis la fiche d'un sportif (D-163) : le sportif est déjà choisi, rien à chercher.
function FixedAthlete({ athlete }: { athlete: WizardAthlete }) {
  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      <p className={fieldLabel}>Sportif</p>
      <div className="flex min-h-[60px] items-center gap-3 rounded-[13px] bg-surface-2 px-3.5 py-2.5">
        <Avatar name={athlete.name} photoPath={athlete.photoPath} size="stack" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[14.5px] leading-[normal] font-semibold text-text">
            {athlete.name}
          </span>
          {athlete.programType ? (
            <span className="flex items-center gap-1.5 text-[12.5px] leading-[normal] text-muted">
              <span
                aria-hidden
                className={`size-1.5 rounded-full ${disciplineStyles[athlete.programType].dot}`}
              />
              {disciplineLabels[athlete.programType]}
            </span>
          ) : null}
        </span>
      </div>
    </div>
  );
}

// Étape 1 : recherche et liste des sportifs (un seul choisi).
function AthletePicker({
  athletes,
  selected,
  query,
  onQuery,
  onChoose,
}: {
  athletes: WizardAthlete[];
  selected: string | null;
  query: string;
  onQuery: (value: string) => void;
  onChoose: (athlete: WizardAthlete) => void;
}) {
  const name = useId();
  const text = query
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
  const shown = athletes
    .filter(
      (athlete) =>
        !text ||
        athlete.name
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .toLowerCase()
          .includes(text),
    )
    // Le sportif choisi reste en tête.
    .sort((a, b) => Number(b.id === selected) - Number(a.id === selected));
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-2.5 border-0 p-0">
      <legend className={`${fieldLabel} mb-2.5`}>Sportif</legend>
      <label className="flex h-[46px] items-center gap-2.5 rounded-[12px] bg-surface px-3.5 text-muted inset-ring inset-ring-field-ring focus-within:inset-ring-[1.5px] focus-within:inset-ring-violet">
        <Search aria-hidden size={17} strokeWidth={2} className="shrink-0" />
        <span className="sr-only">Rechercher un sportif</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Rechercher un sportif"
          className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-text outline-none placeholder:text-faint lg:text-[15px]"
        />
      </label>
      <div className="flex max-h-[264px] flex-col overflow-y-auto rounded-[13px] inset-ring inset-ring-field-ring">
        {shown.length === 0 ? (
          <p className="px-3.5 py-4 text-[13.5px] text-muted">Aucun sportif à ce nom.</p>
        ) : (
          shown.map((athlete) => {
            const checked = athlete.id === selected;
            return (
              <label
                key={athlete.id}
                className={`flex min-h-[56px] cursor-pointer items-center gap-3 border-b border-dlg-divider px-3.5 py-2 last:border-b-0 has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-violet ${
                  checked ? "bg-lib-lavender" : ""
                }`}
              >
                <input
                  type="radio"
                  name={name}
                  value={athlete.id}
                  checked={checked}
                  onChange={() => onChoose(athlete)}
                  className="sr-only"
                />
                <Avatar name={athlete.name} photoPath={athlete.photoPath} size="stack" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-[14.5px] leading-[normal] font-semibold text-text">
                    {athlete.name}
                  </span>
                  {athlete.programType ? (
                    <span className="flex items-center gap-1.5 text-[12.5px] leading-[normal] text-muted">
                      <span
                        aria-hidden
                        className={`size-1.5 rounded-full ${disciplineStyles[athlete.programType].dot}`}
                      />
                      {disciplineLabels[athlete.programType]}
                    </span>
                  ) : null}
                </span>
                <RadioMark checked={checked} large />
              </label>
            );
          })
        )}
      </div>
    </fieldset>
  );
}

// Une phase choisie : son nom et sa durée en semaines.
function PhaseEditor({
  phase,
  max,
  onChange,
  onRemove,
}: {
  phase: PhaseDraft;
  max: number;
  onChange: (phase: PhaseDraft) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2.5 rounded-[14px] bg-surface-2 p-3">
      <label className="flex min-w-[140px] flex-1 flex-col gap-1.5 text-[12.5px] font-semibold text-text-2">
        Nom de la phase
        <input
          value={phase.name}
          maxLength={40}
          onChange={(event) => onChange({ ...phase, name: event.target.value })}
          className={`${inputClass} h-11`}
        />
      </label>
      <div className="flex flex-col gap-1.5 text-[12.5px] font-semibold text-text-2">
        Semaines
        <div className="flex h-11 items-center rounded-[12px] bg-surface inset-ring inset-ring-field-ring">
          <button
            type="button"
            aria-label="Une semaine de moins"
            disabled={phase.length <= 1}
            onClick={() => onChange({ ...phase, length: phase.length - 1 })}
            className="grid h-full w-10 place-items-center text-text disabled:text-dlg-disabled"
          >
            <Minus aria-hidden size={15} strokeWidth={2} />
          </button>
          <span className="w-8 text-center text-[15px] font-semibold text-text tabular">
            {phase.length}
          </span>
          <button
            type="button"
            aria-label="Une semaine de plus"
            disabled={phase.length >= max}
            onClick={() => onChange({ ...phase, length: phase.length + 1 })}
            className="grid h-full w-10 place-items-center text-text disabled:text-dlg-disabled"
          >
            <Plus aria-hidden size={15} strokeWidth={2} />
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="h-11 px-2 text-[13.5px] font-semibold text-alert"
      >
        Retirer
      </button>
    </div>
  );
}

// Étape 4 : le programme ou le modèle à reprendre, en menu natif habillé (titre et précision).
function SourceSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; title: string; meta: string; discipline: Discipline | null }[];
}) {
  const current = options.find((option) => option.value === value) ?? options[0];
  if (!current) return null;
  return (
    <label className="relative flex min-h-[52px] items-center gap-3 rounded-[14px] bg-surface-2 px-4 py-2.5 focus-within:inset-ring-[1.5px] focus-within:inset-ring-violet">
      {current.discipline ? (
        <span
          aria-hidden
          className={`size-2 shrink-0 rounded-full ${disciplineStyles[current.discipline].dot}`}
        />
      ) : null}
      <span className="pointer-events-none flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[14.5px] leading-[normal] font-semibold text-text">
          {current.title}
        </span>
        <span className="truncate text-[12px] leading-[normal] text-muted">{current.meta}</span>
      </span>
      <ChevronDown aria-hidden size={16} strokeWidth={2} className="shrink-0 text-muted" />
      <select
        aria-label={label}
        value={current.value}
        onChange={(event) => onChange(event.target.value)}
        className="absolute inset-0 cursor-pointer appearance-none rounded-[14px] text-[16px] opacity-0"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.title}
          </option>
        ))}
      </select>
    </label>
  );
}

// Étape 4 : l'aperçu, une case par séance prévue (couleur de la discipline reprise, ou « à remplir »).
function StartPreviewGrid({
  preview,
  weeksCount,
  perWeek,
}: {
  preview: StartPreview | null;
  weeksCount: number;
  perWeek: number;
}) {
  const weeks =
    preview?.weeks ??
    Array.from({ length: weeksCount }, () => Array.from({ length: perWeek }, () => null));
  const present = [...new Set(weeks.flat().filter((cell): cell is Discipline => cell !== null))];
  const total = weeks.reduce((sum, week) => sum + week.length, 0);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[14px] leading-[normal] font-semibold text-text">Aperçu</p>
        <p className="truncate text-[12.5px] leading-[normal] text-muted">
          {weeksCount} semaine{weeksCount > 1 ? "s" : ""} × {perWeek} séance{perWeek > 1 ? "s" : ""}{" "}
          · {total} séances
        </p>
      </div>
      <div className="flex max-h-[280px] flex-col gap-1.5 overflow-y-auto">
        {weeks.map((cells, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-6 shrink-0 text-[11.5px] leading-[normal] font-semibold text-faint">
              S{i + 1}
            </span>
            <div className="flex min-w-0 flex-1 gap-1.5">
              {cells.map((cell, j) => (
                <span
                  key={j}
                  className={`h-3 min-w-0 flex-1 rounded-[4px] lg:h-3.5 ${
                    cell ? disciplineStyles[cell].dot : "bg-track"
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] leading-[normal] text-muted">
        {present.map((discipline) => (
          <span key={discipline} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className={`size-2 rounded-[3px] ${disciplineStyles[discipline].dot}`}
            />
            {disciplineLabels[discipline]}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-2 rounded-[3px] bg-track" />À remplir
        </span>
      </div>
    </div>
  );
}

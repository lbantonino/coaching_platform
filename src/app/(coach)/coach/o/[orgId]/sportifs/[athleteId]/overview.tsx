import {
  ChevronRight,
  Dumbbell,
  FileText,
  Gauge,
  HeartPulse,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Timer,
  User,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { disciplineLabels, disciplineStyles } from "@/domain/training/discipline";
import type { ActivityEvent } from "@/features/activity/build";
import type { AgendaItem } from "@/features/agenda/items";
import type { AthleteDetail } from "@/features/athletes/queries";
import {
  athleteLevelLabels,
  contactChannelLabels,
  sexLabels,
  trainingPlaceLabels,
  WEEK_DAYS,
  weekDayLabels,
} from "@/features/athletes/schemas";
import { goalCountdown } from "@/features/goals/format";
import type { GoalEntry } from "@/features/goals/queries";
import {
  goalDiscipline,
  goalPriorityLabels,
  goalTypeLabels,
  hyroxCategoryLabels,
} from "@/features/goals/schemas";
import type { AthleteNotes } from "@/features/notes/queries";
import { formatRaceTime } from "@/features/records/schemas";
import { formatReferenceDetail, splitReferenceValue } from "@/features/references/format";
import type { ReferenceEntry } from "@/features/references/queries";
import { referenceKindLabels, referenceSourceLabels } from "@/features/references/schemas";
import { referenceTone, type ReferenceTone } from "@/features/references/series";
import { formatDate, formatDateTime } from "@/lib/format";

import { ActivityTimeline } from "./activity-timeline";

// Vue d'ensemble de la fiche, d'après la maquette « Sportifs » du 03/11/2026 (page 2a) : tout en
// LECTURE, chaque « Modifier » ouvre l'onglet qui contient le formulaire. Ordinateur : sept cartes en
// grille de deux colonnes (Profil · Prochaines séances, Repères · Objectif, Disponibilités · Notes,
// puis l'Historique en entier), les deux cartes d'une rangée à la même hauteur. Téléphone : une
// colonne, le titre de chaque carte AU-DESSUS d'elle, en petites capitales, avec « Modifier » en violet.
// Chaque section est écrite une seule fois ; des classes différentes la dessinent selon l'écran.

// Libellé différent selon l'écran (la maquette abrège sur ordinateur) : « E-mail » / « Adresse e-mail ».
function Label({ desktop, phone }: { desktop: string; phone: string }) {
  return (
    <>
      <span className="max-lg:hidden">{desktop}</span>
      <span className="lg:hidden">{phone}</span>
    </>
  );
}

function Section({
  id,
  title,
  action,
  wide = false,
  body,
  children,
}: {
  id: string;
  title: string;
  // « Modifier » (bouton à contour sur ordinateur) ou lien violet (« Agenda », « Voir tout »).
  action: { href: string; label: string; edit?: boolean };
  // Historique : toute la largeur de la grille.
  wide?: boolean;
  // Classes du corps sur téléphone, où il devient la carte (padding propre à chaque carte).
  body: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className={`flex min-w-0 flex-col gap-1.5 lg:gap-4 lg:rounded-[20px] lg:bg-surface lg:p-[22px] lg:inset-ring lg:inset-ring-line-soft ${
        wide ? "lg:col-span-2" : ""
      }`}
    >
      <div className="flex min-h-10 items-center justify-between gap-3 px-2.5 lg:min-h-0 lg:items-start lg:px-0">
        <h2
          id={id}
          className="text-[12px] font-semibold tracking-[0.09em] whitespace-nowrap text-faint uppercase lg:text-[17px] lg:tracking-[-0.01em] lg:text-text lg:normal-case"
        >
          {title}
        </h2>
        <Link
          href={action.href}
          scroll={false}
          aria-label={`${action.label} : ${title}`}
          className={`flex min-h-10 shrink-0 items-center gap-1.5 text-[13.5px] font-medium whitespace-nowrap text-violet-text lg:h-[34px] lg:min-h-0 lg:text-[13px] ${
            action.edit
              ? "lg:rounded-[10px] lg:px-3 lg:text-text lg:inset-ring lg:inset-ring-line-2 lg:transition-colors lg:duration-150 lg:hover:bg-surface-2"
              : "hover:underline"
          }`}
        >
          {action.edit ? (
            <Pencil aria-hidden size={13} strokeWidth={1.8} className="max-lg:hidden" />
          ) : null}
          {action.label}
        </Link>
      </div>
      <div
        className={`min-w-0 rounded-[22px] bg-surface inset-ring inset-ring-line-soft lg:rounded-none lg:bg-transparent lg:p-0 lg:inset-ring-0 ${body}`}
      >
        {children}
      </div>
    </section>
  );
}

const missing = <span className="text-faint">Non renseigné</span>;

// Une information : ordinateur, libellé à gauche et valeur à droite (filet dessous) ; téléphone,
// pastille d'icône, libellé au-dessus de la valeur (filet dessous, 16 px avant la suivante).
function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[34px_minmax(0,1fr)] items-center gap-x-3.5 gap-y-0.5 border-b border-line px-6 py-3.5 last:border-b-0 lg:grid-cols-[minmax(110px,160px)_minmax(0,1fr)] lg:items-start lg:gap-x-3 lg:gap-y-0 lg:px-0 lg:py-[11px]">
      <dt className="contents">
        <span className="row-span-2 grid size-[34px] place-items-center rounded-[10px] bg-bg text-text-2 lg:hidden">
          <Icon aria-hidden size={16} strokeWidth={1.8} />
        </span>
        <span className="col-start-2 text-[12.5px] leading-[normal] font-medium text-muted lg:col-start-1 lg:text-[13.5px] lg:font-normal">
          {label}
        </span>
      </dt>
      <dd className="col-start-2 text-[15px] leading-[1.45] font-semibold [overflow-wrap:anywhere] lg:text-[14px] lg:font-medium">
        {children}
      </dd>
    </div>
  );
}

function ProfileSection({ athlete, editHref }: { athlete: AthleteDetail; editHref: string }) {
  return (
    <Section
      id="overview-profile"
      title="Profil du sportif"
      action={{ href: editHref, label: "Modifier", edit: true }}
      body="flex flex-col gap-4 py-2 lg:gap-0 lg:py-0"
    >
      <dl className="contents">
        <InfoRow icon={User} label="Nom complet">
          {athlete.displayName}
        </InfoRow>
        <InfoRow icon={User} label="Sexe">
          {athlete.sex ? (
            <span className={athlete.sex === "female" ? "max-lg:text-female" : "max-lg:text-male"}>
              {sexLabels[athlete.sex]}
            </span>
          ) : (
            missing
          )}
        </InfoRow>
        <InfoRow icon={Mail} label={<Label desktop="E-mail" phone="Adresse e-mail" />}>
          {athlete.email ?? missing}
        </InfoRow>
        <InfoRow icon={Phone} label="Téléphone">
          {athlete.phone ?? missing}
        </InfoRow>
        <InfoRow icon={Gauge} label="Niveau">
          {athlete.level ? (
            <span className="max-lg:mt-0.5 max-lg:inline-flex max-lg:h-[26px] max-lg:items-center max-lg:rounded-[7px] max-lg:bg-ok/10 max-lg:px-[11px] max-lg:text-[13px] max-lg:text-ok">
              {athleteLevelLabels[athlete.level]}
            </span>
          ) : (
            missing
          )}
        </InfoRow>
        <InfoRow icon={FileText} label="Expérience">
          {athlete.experience ?? missing}
        </InfoRow>
        <InfoRow icon={MapPin} label={<Label desktop="Lieux" phone="Lieux d'entraînement" />}>
          {athlete.trainingPlaces.length > 0
            ? athlete.trainingPlaces.map((place) => trainingPlaceLabels[place]).join(", ")
            : missing}
        </InfoRow>
        <InfoRow icon={Dumbbell} label={<Label desktop="Matériel" phone="Matériel disponible" />}>
          {athlete.equipment ?? missing}
        </InfoRow>
        {/* Canal préféré : absent de la maquette, gardé de l'ancien bandeau de chiffres clés. */}
        {athlete.preferredContact ? (
          <InfoRow icon={MessageCircle} label="Canal préféré">
            {contactChannelLabels[athlete.preferredContact]}
          </InfoRow>
        ) : null}
      </dl>
    </Section>
  );
}

const utc = (day: string) => new Date(`${day}T00:00:00Z`);
const weekday = new Intl.DateTimeFormat("fr-BE", { weekday: "short", timeZone: "UTC" });
const dayMonth = new Intl.DateTimeFormat("fr-BE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
// « Aujourd'hui », « Sam 7 » (ce mois-ci), « Sam 12 déc. » (un autre mois).
function upcomingDay(date: string, today: string): string {
  if (date === today) return "Aujourd'hui";
  const day = weekday.format(utc(date)).replace(".", "");
  const label = `${day.charAt(0).toUpperCase()}${day.slice(1)}`;
  return date.slice(0, 7) === today.slice(0, 7)
    ? `${label} ${utc(date).getUTCDate()}`
    : `${label} ${dayMonth.format(utc(date))}`;
}

// Prochaines séances (demande d'Antonino du 26/10) : ce que le sportif a avec le coach dans les
// 30 jours et sa prochaine compétition. « Aujourd'hui » ressort en violet clair.
function UpcomingSection({
  items,
  today,
  agendaPath,
  agendaTabHref,
  goalsHref,
}: {
  items: AgendaItem[];
  today: string;
  agendaPath: string;
  agendaTabHref: string;
  goalsHref: string;
}) {
  return (
    <Section
      id="overview-upcoming"
      title="Prochaines séances"
      action={{ href: agendaTabHref, label: "Agenda" }}
      body="overflow-hidden pb-2 lg:overflow-visible lg:pb-0"
    >
      {items.length === 0 ? (
        <p className="px-6 pt-6 pb-4 text-[13.5px] text-muted lg:p-0">
          Rien de prévu avec ce sportif dans les 30 prochains jours.
        </p>
      ) : (
        <ul
          aria-label="Prochaines séances du sportif"
          className="flex flex-col lg:-mx-3 lg:gap-0.5"
        >
          {items.map((item, index) => {
            const isToday = item.date === today;
            return (
              <li key={item.key} className="border-b border-line last:border-b-0 lg:border-b-0">
                <Link
                  href={
                    item.type === "session"
                      ? `${agendaPath}/seances/${item.sessionId}?date=${item.date}`
                      : goalsHref
                  }
                  scroll={item.type === "session"}
                  className={`grid grid-cols-[66px_minmax(0,1fr)] items-center gap-3.5 px-6 py-4 transition-colors duration-150 lg:grid-cols-[78px_minmax(0,1fr)] lg:gap-3 lg:rounded-xl lg:px-3 lg:py-[11px] ${
                    isToday
                      ? `bg-violet/9 lg:bg-violet/7 ${index === 0 ? "pt-[18px] lg:pt-[11px]" : ""}`
                      : "hover:bg-surface-2"
                  }`}
                >
                  <span className="flex flex-col gap-px leading-[normal]">
                    <span
                      className={`text-[12px] font-medium whitespace-nowrap ${isToday ? "text-violet-text" : "text-muted"}`}
                    >
                      {upcomingDay(item.date, today)}
                    </span>
                    <span className="text-[15px] font-semibold tabular">
                      {item.type === "session" && item.time ? item.time : "Journée"}
                    </span>
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5 leading-[normal]">
                    <span className="flex min-w-0 items-center gap-[7px] text-[14px] font-semibold">
                      {/* La discipline : une barre fine (16/11/2026 : plus de pastilles). */}
                      <span
                        aria-hidden
                        className={`h-4 w-[3px] shrink-0 rounded-[2px] ${item.discipline ? disciplineStyles[item.discipline].dot : "bg-faint"}`}
                      />
                      <span className="truncate">{item.title}</span>
                    </span>
                    <span className="text-[12.5px] leading-[normal] text-muted lg:leading-[1.45]">
                      {item.type === "event"
                        ? `Compétition · ${item.detail}`
                        : item.individual
                          ? // Le détail commence par « Avec {sportif} » : inutile sur sa propre fiche.
                            ["Avec le coach", ...item.detail.split(" · ").slice(1)].join(" · ")
                          : `Collective · ${item.detail}`}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

// Couleurs d'un repère (règle de couleur dans referenceTone, D-25) : pastille teintée, chiffre et
// unité de la couleur de la discipline.
const toneClasses: Record<ReferenceTone, { pill: string; text: string; icon: LucideIcon }> = {
  run: { pill: "bg-run-soft text-run", text: "text-run", icon: Timer },
  hyrox: { pill: "bg-hyrox-soft text-hyrox", text: "text-hyrox", icon: Timer },
  heart: { pill: "bg-accent-soft text-accent-text", text: "text-accent-text", icon: HeartPulse },
  strength: {
    pill: "bg-strength-soft text-strength-fill",
    text: "text-strength-fill",
    icon: Dumbbell,
  },
};

function ReferencesSection({
  references,
  editHref,
}: {
  references: ReferenceEntry[];
  editHref: string;
}) {
  // Deux repères dans la vue d'ensemble (maquette) : la dernière allure mesurée (sinon une FC) et la
  // dernière charge, comme les cartes de l'onglet Repères, où tous les repères se retrouvent.
  const recent = [...references].sort((a, b) => b.measuredOn.localeCompare(a.measuredOn));
  const first =
    recent.find((entry) => entry.kind.startsWith("pace_")) ??
    recent.find((entry) => entry.kind.startsWith("hr_")) ??
    recent[0];
  const second =
    recent.find((entry) => entry !== first && entry.kind === "strength_load") ??
    recent.find((entry) => entry !== first);
  const shown = [first, second].filter((entry): entry is ReferenceEntry => entry !== undefined);
  return (
    <Section
      id="overview-references"
      title="Repères et mesures"
      action={{ href: editHref, label: "Modifier", edit: true }}
      body="p-6 lg:p-0"
    >
      {shown.length === 0 ? (
        <p className="text-[13.5px] text-muted">Aucun repère pour l&apos;instant.</p>
      ) : (
        <ul className="flex flex-col gap-4 lg:gap-2.5">
          {shown.map((entry, index) => {
            const tone = toneClasses[referenceTone(entry.kind)];
            const Icon = tone.icon;
            const { value, unit } = splitReferenceValue(entry);
            const detail = formatReferenceDetail(entry);
            return (
              <li key={entry.id} className="flex flex-col gap-4">
                {index > 0 ? <span aria-hidden className="h-px bg-line lg:hidden" /> : null}
                <div className="flex items-start gap-3.5 lg:rounded-[14px] lg:bg-surface-2 lg:px-[18px] lg:py-4">
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone.pill}`}
                  >
                    <Icon aria-hidden size={18} strokeWidth={1.8} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1 leading-[normal]">
                    <span className="text-[13px] font-medium text-muted">
                      {referenceKindLabels[entry.kind]}
                    </span>
                    <span className={`flex items-baseline gap-1.5 whitespace-nowrap ${tone.text}`}>
                      <span className="text-[25px] leading-[1.1] font-bold tracking-[-0.02em] lg:text-[24px]">
                        {value}
                      </span>
                      {unit ? (
                        <span className="text-[14px] font-semibold lg:text-[13.5px]">{unit}</span>
                      ) : null}
                    </span>
                    <span className="text-[13px] leading-[normal] text-muted lg:text-[12.5px] lg:leading-[1.45]">
                      {detail ? `${detail} · ` : ""}
                      {referenceSourceLabels[entry.source]} · {formatDate(entry.measuredOn)}
                    </span>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

function GoalSection({
  goals,
  today,
  editHref,
}: {
  goals: GoalEntry[];
  today: string;
  editHref: string;
}) {
  // Objectif affiché : le principal, sinon le premier objectif en cours.
  const goal = goals.find((entry) => entry.priority === "main") ?? goals[0];
  const others = goals.length - (goal ? 1 : 0);
  const countdown = goal?.targetDate ? goalCountdown(today, goal.targetDate) : null;
  const discipline = goal ? goalDiscipline(goal.type) : null;
  // Le type n'est écrit que s'il dit autre chose que la pastille de discipline (« Hyrox » deux fois,
  // non ; « Course 10 km » sous « Running », oui). Téléphone : sans le lieu (maquette).
  const category = goal?.hyroxCategory
    ? `Catégorie ${hyroxCategoryLabels[goal.hyroxCategory]}`
    : null;
  const target = goal?.targetTimeSeconds
    ? `Temps visé ${formatRaceTime(goal.targetTimeSeconds)}`
    : null;
  const typeLabel =
    goal?.competitionName &&
    (!discipline || goalTypeLabels[goal.type] !== disciplineLabels[discipline])
      ? goalTypeLabels[goal.type]
      : null;
  const details = [typeLabel, category, goal?.competitionLocation ?? null, target].filter(Boolean);
  const phoneDetails = [typeLabel, category, target].filter(Boolean);
  // Étiquettes : rectangles aux coins arrondis, jamais des capsules (16/11/2026).
  const badge = "flex h-6 items-center gap-1.5 rounded-[6px] px-2 text-[12px] font-medium";

  return (
    <Section
      id="overview-goal"
      title="Objectif actuel"
      action={{ href: editHref, label: "Modifier", edit: true }}
      body="flex flex-col gap-4 p-6 lg:p-0"
    >
      {goal ? (
        // Ordinateur : une sous-carte grise ; téléphone : directement dans la carte.
        <div className="flex flex-col gap-4 lg:gap-2 lg:rounded-2xl lg:bg-surface-2 lg:p-[18px]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {discipline ? (
                <span
                  className={`${badge} font-semibold ${disciplineStyles[discipline].tint} ${disciplineStyles[discipline].text}`}
                >
                  {disciplineLabels[discipline]}
                </span>
              ) : null}
              <span
                className={`${badge} ${goal.priority === "main" ? "bg-violet-soft text-violet-text" : "bg-bg text-text-2"}`}
              >
                {goalPriorityLabels[goal.priority]}
              </span>
            </div>
            {countdown ? (
              <span
                className={`${badge} max-lg:hidden ${countdown.overdue ? "bg-warn-soft text-warn" : "bg-violet-soft text-violet-text"}`}
              >
                {countdown.label}
              </span>
            ) : null}
          </div>
          <div className="flex flex-col gap-1 leading-[normal] lg:contents">
            <h3 className="text-[21px] font-semibold tracking-[-0.02em] break-words lg:text-[22px]">
              {goal.competitionName ?? goalTypeLabels[goal.type]}
            </h3>
            {/* Téléphone : date et détails sur une ligne ; ordinateur : la date, puis les détails. */}
            <p className="text-[13.5px] leading-[1.5] text-text-2 lg:contents">
              <span className="lg:text-[14px] lg:leading-[normal] lg:font-medium lg:text-text">
                {goal.targetDate ? formatDate(goal.targetDate) : "Sans date"}
              </span>
              {phoneDetails.length > 0 ? (
                <span className="lg:hidden"> · {phoneDetails.join(" · ")}</span>
              ) : null}
              {details.length > 0 ? (
                <span className="max-lg:hidden lg:block lg:text-[13px] lg:leading-[1.5] lg:text-muted">
                  {details.join(" · ")}
                </span>
              ) : null}
            </p>
          </div>
          {goal.description ? (
            <p className="text-[14px] leading-[1.5] lg:text-text-2">{goal.description}</p>
          ) : null}
        </div>
      ) : (
        <p className="text-[13.5px] text-muted">
          Aucun objectif en cours.{" "}
          <Link href={editHref} scroll={false} className="text-violet-text hover:underline">
            Ajouter un objectif
          </Link>
        </p>
      )}
      {others > 0 ? (
        <>
          <span aria-hidden className="h-px bg-line lg:hidden" />
          <Link
            href={editHref}
            scroll={false}
            className="flex min-h-7 items-center justify-between text-[13.5px] font-medium whitespace-nowrap lg:mx-auto lg:h-[34px] lg:min-h-0 lg:text-[13px] lg:text-violet-text lg:hover:underline"
          >
            {others === 1 ? "1 autre objectif en cours" : `${others} autres objectifs en cours`}
            <ChevronRight
              aria-hidden
              size={16}
              strokeWidth={1.8}
              className="text-muted lg:hidden"
            />
          </Link>
        </>
      ) : null}
    </Section>
  );
}

function AvailabilitySection({ athlete, editHref }: { athlete: AthleteDetail; editHref: string }) {
  const sessions = athlete.sessionsPerWeek;
  const minutes = athlete.maxSessionMinutes;
  // « 5 séances, 90 min max » (ordinateur) ; « 5 séances par semaine · 90 min max » (téléphone).
  const desktopSummary = [
    sessions ? `${sessions} séance${sessions > 1 ? "s" : ""}` : null,
    minutes ? `${minutes} min max` : null,
  ]
    .filter(Boolean)
    .join(", ");
  const phoneSummary = [
    sessions ? `${sessions} séance${sessions > 1 ? "s" : ""} par semaine` : null,
    minutes ? `${minutes} min max` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const health =
    athlete.healthConsentAt === null ? (
      <span className="font-normal text-muted">
        Pas d&apos;accord du sportif : rien n&apos;est noté.
      </span>
    ) : (
      (athlete.healthConstraints ?? <span className="font-normal text-muted">Rien de noté.</span>)
    );

  return (
    <Section
      id="overview-availability"
      title="Disponibilités et contraintes"
      action={{ href: editHref, label: "Modifier", edit: true }}
      body="flex flex-col gap-4 p-6 lg:p-0"
    >
      <div className="flex flex-col gap-4 lg:gap-2.5">
        <span className="text-[13.5px] leading-[normal] font-medium text-text-2 max-lg:order-2 lg:text-[13px] lg:text-muted">
          <span className="max-lg:hidden">
            Jours disponibles{desktopSummary ? ` · ${desktopSummary}` : ""}
          </span>
          <span className="lg:hidden">{phoneSummary || "Jours disponibles"}</span>
        </span>
        <ul
          aria-label="Jours disponibles"
          className="flex justify-between lg:justify-start lg:gap-1.5"
        >
          {WEEK_DAYS.map((day) => {
            const available = athlete.availableDays.includes(day);
            return (
              <li
                key={day}
                title={weekDayLabels[day]}
                className={`grid size-9 place-items-center rounded-full text-[13px] font-semibold ${
                  available
                    ? "bg-violet-soft-2 text-violet-text"
                    : "text-faint inset-ring inset-ring-line-2"
                }`}
              >
                <span aria-hidden>{weekDayLabels[day].charAt(0)}</span>
                <span className="sr-only">
                  {weekDayLabels[day]} : {available ? "disponible" : "indisponible"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <span aria-hidden className="h-px bg-line lg:hidden" />
      {/* Téléphone : libellé au-dessus de la valeur ; ordinateur : comme le Profil. */}
      <dl className="flex flex-col gap-4 lg:gap-0">
        {(
          [
            {
              desktop: "Organisation",
              phone: "Contraintes d'organisation",
              value: athlete.scheduleConstraints ?? missing,
            },
            {
              desktop: "Points d'attention",
              phone: "Blessures et points d'attention",
              value: health,
            },
          ] as const
        ).map((row) => (
          <div
            key={row.desktop}
            className="flex flex-col gap-1 lg:grid lg:grid-cols-[minmax(110px,160px)_minmax(0,1fr)] lg:gap-3 lg:border-b lg:border-line lg:py-[11px] lg:last:border-b-0"
          >
            <dt className="text-[13.5px] leading-[normal] text-muted">
              <Label desktop={row.desktop} phone={row.phone} />
            </dt>
            <dd className="text-[14px] leading-[1.5] font-medium lg:leading-[1.45]">{row.value}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

function NotesSection({ notes, editHref }: { notes: AthleteNotes; editHref: string }) {
  return (
    <Section
      id="overview-notes"
      title="Notes du coach"
      action={{ href: editHref, label: "Modifier", edit: true }}
      body="flex flex-col gap-4 p-6 lg:p-0"
    >
      {notes.coach ? (
        <div className="flex flex-col gap-4 lg:gap-2 lg:rounded-[14px] lg:bg-surface-2 lg:p-4">
          <p className="text-[14.5px] leading-[1.6] whitespace-pre-line lg:text-[14px] lg:leading-[1.55]">
            {notes.coach.body}
          </p>
          <p className="text-[12.5px] leading-[normal] text-faint">
            <span className="max-lg:hidden">Notes libres · mises à jour le </span>
            <span className="lg:hidden">Mise à jour le </span>
            {formatDateTime(notes.coach.updatedAt)}
          </p>
        </div>
      ) : (
        <p className="text-[13.5px] text-muted">Aucune note libre.</p>
      )}
    </Section>
  );
}

export function AthleteOverview({
  athlete,
  goals,
  references,
  notes,
  activity,
  upcoming,
  agendaPath,
  today,
  basePath,
}: {
  athlete: AthleteDetail;
  goals: GoalEntry[];
  references: ReferenceEntry[];
  notes: AthleteNotes;
  activity: ActivityEvent[];
  upcoming: AgendaItem[];
  agendaPath: string;
  today: string;
  basePath: string;
}) {
  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-4">
      <ProfileSection athlete={athlete} editHref={`${basePath}?onglet=profil`} />
      <UpcomingSection
        items={upcoming}
        today={today}
        agendaPath={agendaPath}
        agendaTabHref={`${basePath}?onglet=agenda`}
        goalsHref={`${basePath}?onglet=objectifs`}
      />
      <ReferencesSection references={references} editHref={`${basePath}?onglet=reperes`} />
      <GoalSection goals={goals} today={today} editHref={`${basePath}?onglet=objectifs`} />
      <AvailabilitySection athlete={athlete} editHref={`${basePath}?onglet=disponibilites`} />
      <NotesSection notes={notes} editHref={`${basePath}?onglet=notes`} />
      <Section
        id="overview-activity"
        title="Historique récent"
        action={{ href: `${basePath}?onglet=historique`, label: "Voir tout" }}
        wide
        body="px-6 pt-6 pb-1.5 lg:p-0"
      >
        <ActivityTimeline events={activity.slice(0, 5)} label="Derniers événements" />
      </Section>
    </div>
  );
}

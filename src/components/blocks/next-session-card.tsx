import { ArrowUpRight, CalendarDays, MessageCircle } from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { disciplineLabels } from "@/domain/training/discipline";
import type { WeekBlock } from "@/features/agenda/week";

// Carte « Prochaine séance » du tableau de bord (maquette v6, D-77) : la séance la plus proche, calculée
// à partir des vraies séances. Même fond que les autres cartes ; elle se distingue par son contour
// violet, l'heure écrite en violet et la photo du sportif cerclée de violet (demandes d'Antonino du
// 01/11 : ni dégradé, ni aplat violet). Toute la carte ouvre la séance ; deux petites icônes « Ouvrir
// la séance » et « Message ». Téléphone (02/11, comme un widget de l'iPhone) : un carré à côté des
// Tâches : « Prochaine séance », l'heure, puis la séance en petit bloc (sans « dans 2 h 28 », 02/11) ; les
// pastilles et les deux icônes sont pour les écrans plus larges (toute la carte ouvre la séance).
const iconLink =
  "inline-flex size-11 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:bg-selected-hover hover:text-text lg:size-7 lg:rounded-md";

// Filet gauche du bloc de la séance, dans le widget carré du téléphone.
const disciplineBars = {
  running: "max-md:border-run-fill",
  strength: "max-md:border-strength-fill",
  hyrox: "max-md:border-hyrox-fill",
  hybrid: "max-md:border-hybrid-fill",
} as const;

const disciplineDots = {
  running: "bg-run-fill",
  strength: "bg-strength-fill",
  hyrox: "bg-hyrox-fill",
  hybrid: "bg-hybrid-fill",
} as const;

function untilLabel(block: WeekBlock, today: string, nowMinutes: number, dayLabel: string) {
  if (block.date !== today) return dayLabel.toLowerCase();
  const minutes = block.start - nowMinutes;
  if (minutes <= 0) return "maintenant";
  if (minutes < 60) return `dans ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `dans ${hours} h${rest > 0 ? ` ${String(rest).padStart(2, "0")}` : ""}`;
}

export function NextSessionCard({
  block,
  rank,
  dayLabel,
  today,
  nowMinutes,
  sessionHref,
  messageHref,
  location,
  person,
  className = "",
}: {
  block: WeekBlock | null;
  // Rang de la séance dans sa journée (« 1 / 6 »).
  rank: { index: number; total: number } | null;
  dayLabel: string;
  today: string;
  nowMinutes: number;
  sessionHref: string | null;
  // Séance individuelle : la conversation avec son sportif.
  messageHref: string | null;
  location: string | null;
  // Séance individuelle : le sportif (sa photo, cerclée de violet).
  person: { name: string; photoPath: string | null } | null;
  // Place dans la page (ex. ordre des cartes sur téléphone).
  className?: string;
}) {
  const when = block ? untilLabel(block, today, nowMinutes, dayLabel) : "";
  return (
    <section
      aria-labelledby="next-session-title"
      // Toute la carte ouvre la séance (29/10/2026) : le lien du titre la couvre entièrement ;
      // les deux petites icônes passent au-dessus et gardent leur propre action.
      className={`relative flex h-full min-w-0 flex-col justify-between gap-5 rounded-[20px] border border-violet-line bg-surface p-5 transition-colors duration-150 hover:border-violet max-md:aspect-square max-md:justify-start max-md:gap-0 max-md:overflow-hidden max-md:p-4 ${className}`}
    >
      <div className="max-md:flex max-md:min-h-0 max-md:flex-1 max-md:flex-col">
        <div className="mb-3 flex items-center justify-between gap-3 max-md:mb-2">
          <h2
            id="next-session-title"
            className="text-[12px] font-medium tracking-[0.08em] whitespace-nowrap text-muted uppercase lg:text-[11px]"
          >
            {block && sessionHref ? (
              <Link
                href={sessionHref}
                className="after:absolute after:inset-0 after:rounded-[20px] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent"
              >
                Prochaine séance<span className="sr-only"> · {when}</span>
              </Link>
            ) : (
              "Prochaine séance"
            )}
          </h2>
          {block ? (
            <span className="flex items-center gap-2 max-md:hidden">
              <span
                aria-hidden
                className="flex h-5 items-center gap-1.5 rounded-full bg-ok-soft px-2 text-[12px] font-medium text-ok lg:text-[11px]"
              >
                <span className="size-1.5 rounded-full bg-ok" />
                {when}
              </span>
              {rank ? (
                <span className="text-[12px] font-medium tracking-[0.08em] whitespace-nowrap text-muted tabular lg:text-[11px]">
                  {rank.index} / {rank.total}
                </span>
              ) : null}
            </span>
          ) : null}
        </div>
        {block ? (
          <>
            <div className="text-[26px] leading-none font-semibold tracking-tight whitespace-nowrap text-violet-text tabular">
              {block.label.slice(0, 5)}
            </div>
            {/* Téléphone : la séance en bloc qui remplit le reste du carré, un filet de la couleur de la
                discipline à gauche (comme un évènement du widget Calendrier de l'iPhone) ; sans photo :
                le sportif, le type de séance, la durée et le lieu, puis la discipline (02/11). */}
            <div
              className={`mt-2.5 flex min-w-0 items-center gap-2.5 max-md:mt-3 max-md:min-h-0 max-md:flex-1 max-md:items-stretch max-md:rounded-lg max-md:border-l-[3px] max-md:bg-surface-2 max-md:py-2 max-md:pr-2 max-md:pl-2.5 ${
                block.discipline ? disciplineBars[block.discipline] : "max-md:border-line-2"
              }`}
            >
              {person ? (
                <span className="inline-flex shrink-0 rounded-full max-md:hidden outline outline-[1.5px] outline-offset-2 outline-violet">
                  <Avatar name={person.name} photoPath={person.photoPath} size="xs" />
                </span>
              ) : null}
              <div className="min-w-0 max-md:flex max-md:flex-1 max-md:flex-col">
                <div className="shrink-0 truncate text-[15px] font-medium text-text md:text-[16px] lg:text-[13px]">
                  {block.title}
                </div>
                <div className="mt-0.5 truncate text-[13px] text-muted max-md:hidden md:text-[14px] lg:text-[12px]">
                  {[
                    block.individual ? block.subtitle : `Collective · ${block.subtitle}`,
                    `${block.end - block.start} min`,
                    location,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
                {/* Téléphone : une information par ligne, la discipline en bas du bloc ; sur un écran de
                    moins de 420 px (iPhone standard), la durée et le lieu cèdent leur place. */}
                <div className="mt-0.5 shrink-0 truncate text-[13px] text-muted md:hidden">
                  {block.individual ? block.subtitle : `Collective · ${block.subtitle}`}
                </div>
                <div className="shrink-0 truncate text-[13px] text-muted tabular max-[419px]:hidden md:hidden">
                  {[`${block.end - block.start} min`, location].filter(Boolean).join(" · ")}
                </div>
                {block.discipline ? (
                  <div className="mt-auto flex shrink-0 items-center gap-1.5 pt-1.5 text-[12px] font-medium text-text-2 md:hidden">
                    <span
                      aria-hidden
                      className={`size-1.5 shrink-0 rounded-full ${disciplineDots[block.discipline]}`}
                    />
                    <span className="truncate">
                      {disciplineLabels[block.discipline]} ·{" "}
                      {block.individual ? "Individuelle" : "Collective"}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        ) : (
          <p className="flex items-center gap-2 text-[13px] text-muted">
            <CalendarDays aria-hidden size={16} strokeWidth={1.8} />
            Rien de prévu pour l&apos;instant.
          </p>
        )}
      </div>
      {block ? (
        <div className="flex items-center justify-between max-md:hidden">
          <div className="flex gap-1.5">
            {block.discipline ? (
              <span className="flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-[13px] text-text-2 lg:h-6 lg:rounded-md lg:px-2 lg:text-[11px]">
                <span
                  aria-hidden
                  className={`size-1.5 rounded-full ${disciplineDots[block.discipline]}`}
                />
                {disciplineLabels[block.discipline]}
              </span>
            ) : null}
            <span className="flex h-8 items-center rounded-lg border border-line px-2.5 text-[13px] text-text-2 lg:h-6 lg:rounded-md lg:px-2 lg:text-[11px]">
              {block.individual ? "Individuelle" : "Collective"}
            </span>
          </div>
          <span className="relative z-10 flex gap-1">
            {sessionHref ? (
              <Link
                href={sessionHref}
                aria-label="Ouvrir la séance"
                title="Ouvrir la séance"
                className={iconLink}
              >
                <ArrowUpRight
                  aria-hidden
                  size={14}
                  strokeWidth={1.9}
                  className="size-[18px] lg:size-3.5"
                />
              </Link>
            ) : null}
            {messageHref ? (
              <Link
                href={messageHref}
                aria-label={`Écrire à ${block.title}`}
                title={`Écrire à ${block.title}`}
                className={iconLink}
              >
                <MessageCircle
                  aria-hidden
                  size={14}
                  strokeWidth={1.8}
                  className="size-[18px] lg:size-3.5"
                />
              </Link>
            ) : null}
          </span>
        </div>
      ) : null}
    </section>
  );
}

import { ArrowUpRight, CalendarDays, MessageCircle } from "lucide-react";
import Link from "next/link";

import { NotAvailableButton } from "@/components/blocks/not-available";
import { Avatar } from "@/components/ui/avatar";
import { FEATURES } from "@/config/features";
import { disciplineLabels, disciplineStyles } from "@/domain/training/discipline";
import type { WeekBlock } from "@/features/agenda/week";

// Carte « Prochaine séance » du tableau de bord (maquette v6, D-77) : la séance la plus proche, calculée
// à partir des vraies séances. Même fond que les autres cartes ; elle se distingue par son contour
// violet, l'heure écrite en violet et la photo du sportif cerclée de violet (demandes d'Antonino du
// 01/11 : ni dégradé, ni aplat violet). Toute la carte ouvre la séance ; deux petites icônes « Ouvrir
// la séance » et « Message ». Téléphone (19/11, demande d'Antonino : « une carte par ligne », et une
// Prochaine séance plus détaillée) : pleine largeur, tout le détail de l'ordinateur (« demain », le
// rang dans la journée, la photo, la séance, durée et lieu, discipline, boutons), plus l'heure de fin.
const iconLink =
  "inline-flex size-11 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:bg-selected-hover hover:text-text lg:size-7 lg:rounded-md";

// « 9:15 » → « 09:15 » (minutes depuis minuit).
function clock(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

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
      className={`relative flex h-full min-w-0 flex-col justify-between gap-5 rounded-[20px] border border-violet-line bg-surface p-5 transition-colors duration-150 hover:border-violet ${className}`}
    >
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
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
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="flex h-5 items-center rounded-[5px] bg-ok-soft px-1.5 text-[12px] font-semibold text-ok lg:text-[11px]"
              >
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
            <div className="flex items-baseline gap-2 whitespace-nowrap">
              <span className="text-[26px] leading-none font-semibold tracking-tight text-violet-text tabular">
                {block.label.slice(0, 5)}
              </span>
              {/* Téléphone : l'heure de fin aussi (19/11). */}
              <span className="text-[14px] text-muted tabular md:hidden">
                jusqu&apos;à {clock(block.end)}
              </span>
            </div>
            <div className="mt-2.5 flex min-w-0 items-center gap-2.5 max-md:mt-3.5 max-md:gap-3">
              {person ? (
                <span className="inline-flex shrink-0 rounded-full outline outline-[1.5px] outline-offset-2 outline-violet">
                  <Avatar name={person.name} photoPath={person.photoPath} size="xs" />
                </span>
              ) : null}
              <div className="min-w-0">
                <div className="truncate text-[16px] font-medium text-text lg:text-[13px]">
                  {block.title}
                </div>
                <div className="mt-0.5 truncate text-[14px] text-muted lg:text-[12px]">
                  {[
                    block.individual ? block.subtitle : `Collective · ${block.subtitle}`,
                    `${block.end - block.start} min`,
                    location,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
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
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {block.discipline ? (
              <span
                className={`flex h-8 items-center rounded-[7px] px-2.5 text-[13px] font-semibold lg:h-6 lg:rounded-[6px] lg:px-2 lg:text-[11px] ${disciplineStyles[block.discipline].tint} ${disciplineStyles[block.discipline].text}`}
              >
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
            {messageHref && !FEATURES.messages ? (
              // MVP espace coach seul (D-167) : « Écrire » ouvre la fenêtre « pas encore disponible ».
              <NotAvailableButton label={`Écrire à ${block.title}`} className={iconLink}>
                <MessageCircle
                  aria-hidden
                  size={14}
                  strokeWidth={1.8}
                  className="size-[18px] lg:size-3.5"
                />
              </NotAvailableButton>
            ) : messageHref ? (
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

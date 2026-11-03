import {
  ChartNoAxesColumn,
  CircleCheck,
  CircleX,
  Link2,
  NotebookPen,
  ShieldCheck,
  Target,
  Trophy,
  UserCheck,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import type { ActivityEvent, ActivityKind } from "@/features/activity/build";
import { formatDay } from "@/lib/format";

const icons: Record<ActivityKind, LucideIcon> = {
  profile: UserPlus,
  goal: Target,
  goal_achieved: CircleCheck,
  goal_dropped: CircleX,
  reference: ChartNoAxesColumn,
  record: Trophy,
  consent: ShieldCheck,
  invite: Link2,
  account: UserCheck,
  note: NotebookPen,
};

// Frise de l'historique (vue d'ensemble : les derniers événements ; onglet Historique : tout), d'après
// la maquette « Sportifs » du 03/11/2026 : pastille ronde de 32 px, trait qui relie les événements,
// titre en gras, date à droite (dessous quand la place manque), détail en gris.
export function ActivityTimeline({ events, label }: { events: ActivityEvent[]; label: string }) {
  return (
    <ol aria-label={label} className="flex flex-col">
      {events.map((event, index) => {
        const Icon = icons[event.kind];
        return (
          <li key={event.id} className="relative grid grid-cols-[32px_minmax(0,1fr)] gap-x-3">
            <span className="relative flex justify-center">
              {/* Trait vertical qui relie les événements (sauf après le dernier). */}
              {index < events.length - 1 ? (
                <span aria-hidden className="absolute top-9 bottom-0 left-[15.5px] w-px bg-line" />
              ) : null}
              <span className="grid size-8 place-items-center rounded-full bg-bg text-text-2">
                <Icon aria-hidden size={15} strokeWidth={1.8} />
              </span>
            </span>
            <div className="flex min-w-0 flex-col gap-0.5 pt-[5px] pb-[18px]">
              <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5">
                <span className="flex-[1_1_220px] text-[14px] leading-[1.4] font-semibold break-words">
                  {event.title}
                </span>
                <time
                  dateTime={event.at}
                  className="text-[12.5px] leading-[normal] whitespace-nowrap text-faint"
                >
                  {formatDay(event.at)}
                </time>
              </div>
              {event.detail ? (
                <span className="text-[13px] leading-[1.45] break-words text-muted">
                  {event.detail}
                </span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

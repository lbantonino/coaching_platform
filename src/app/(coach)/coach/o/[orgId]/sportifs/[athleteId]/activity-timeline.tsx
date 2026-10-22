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

// Frise de l'historique (vue d'ensemble : les derniers événements ; onglet Historique : tout).
export function ActivityTimeline({ events, label }: { events: ActivityEvent[]; label: string }) {
  return (
    <ol aria-label={label} className="flex flex-col">
      {events.map((event, index) => {
        const Icon = icons[event.kind];
        return (
          <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
            {/* Trait vertical qui relie les événements (sauf après le dernier). */}
            {index < events.length - 1 ? (
              <span aria-hidden className="absolute top-9 bottom-0 left-[17px] w-px bg-line" />
            ) : null}
            <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full border border-line bg-bg text-muted">
              <Icon aria-hidden size={15} strokeWidth={1.7} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1.5 sm:flex-row sm:justify-between sm:gap-4">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-small font-medium break-words">{event.title}</span>
                {event.detail ? (
                  <span className="text-caption break-words text-muted">{event.detail}</span>
                ) : null}
              </div>
              <time dateTime={event.at} className="shrink-0 text-caption text-muted">
                {formatDay(event.at)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

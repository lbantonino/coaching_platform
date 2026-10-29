import { Dumbbell, HeartPulse, Timer, type LucideIcon } from "lucide-react";

import { formatReferenceDetail, formatReferenceValue } from "@/features/references/format";
import type { ReferenceEntry } from "@/features/references/queries";
import { referenceKindLabels, referenceSourceLabels } from "@/features/references/schemas";
import { referenceTone, type ReferenceTone } from "@/features/references/series";
import { formatDate } from "@/lib/format";

// Classes de chaque couleur de repère (la règle de couleur est dans referenceTone, D-25).
export const tileTones = {
  run: {
    tile: "border-run/40 bg-surface",
    icon: "border border-run/50 bg-run-soft text-run",
    text: "text-run",
  },
  hyrox: {
    tile: "border-hyrox/40 bg-surface",
    icon: "border border-hyrox/50 bg-hyrox-soft text-hyrox",
    text: "text-hyrox",
  },
  heart: {
    tile: "border-accent/40 bg-surface",
    icon: "border border-accent/50 bg-accent-soft text-accent-text",
    text: "text-accent-text",
  },
  strength: {
    tile: "border-strength/40 bg-surface",
    icon: "border border-strength/50 bg-strength-soft text-strength",
    text: "text-strength",
  },
} as const satisfies Record<ReferenceTone, Record<string, string>>;

const tileIcons: Record<ReferenceTone, LucideIcon> = {
  run: Timer,
  hyrox: Timer,
  heart: HeartPulse,
  strength: Dumbbell,
};

// Tuile d'un repère actuel, partagée par la vue d'ensemble (« compact ») et l'onglet Repères.
export function ReferenceTile({
  entry,
  size = "md",
}: {
  entry: ReferenceEntry;
  size?: "compact" | "md";
}) {
  const tone = referenceTone(entry.kind);
  const Icon = tileIcons[tone];
  const colors = tileTones[tone];
  const detail = formatReferenceDetail(entry);
  return (
    <li className={`flex flex-col gap-1.5 rounded-[14px] border p-4 ${colors.tile}`}>
      <span className="flex items-center gap-2">
        <span
          aria-hidden
          className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full ${colors.icon}`}
        >
          <Icon size={14} strokeWidth={1.75} />
        </span>
        <span className={`${size === "compact" ? "text-caption" : "text-small"} text-muted`}>
          {referenceKindLabels[entry.kind]}
        </span>
      </span>
      <span
        className={`font-mono ${size === "compact" ? "text-title" : "text-h3"} font-medium tabular ${colors.text}`}
      >
        {formatReferenceValue(entry)}
      </span>
      <span className="text-caption text-muted">
        {detail ? `${detail} · ` : ""}
        {referenceSourceLabels[entry.source]} · {formatDate(entry.measuredOn)}
      </span>
    </li>
  );
}

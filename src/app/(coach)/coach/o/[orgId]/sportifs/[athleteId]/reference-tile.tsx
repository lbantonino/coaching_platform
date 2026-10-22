import { Dumbbell, HeartPulse, Timer, type LucideIcon } from "lucide-react";

import { formatReferenceDetail, formatReferenceValue } from "@/features/references/format";
import type { ReferenceEntry } from "@/features/references/queries";
import {
  referenceKindLabels,
  referenceSourceLabels,
  type ReferenceKind,
} from "@/features/references/schemas";
import { formatDate } from "@/lib/format";

// Couleur d'un repère (D-25) : allures en bleu Running, race pace en orange Hyrox,
// fréquences cardiaques en rouge, charges en violet Musculation.
const tileTones = {
  run: {
    tile: "border-run/40 bg-[color-mix(in_srgb,var(--run)_7%,var(--bg))]",
    icon: "border border-run/50 bg-run-soft text-run",
    text: "text-run",
  },
  hyrox: {
    tile: "border-hyrox/40 bg-[color-mix(in_srgb,var(--hyrox)_7%,var(--bg))]",
    icon: "border border-hyrox/50 bg-hyrox-soft text-hyrox",
    text: "text-hyrox",
  },
  heart: {
    tile: "border-accent/40 bg-[color-mix(in_srgb,var(--accent)_6%,var(--bg))]",
    icon: "border border-accent/50 bg-accent-soft text-accent-text",
    text: "text-accent-text",
  },
  strength: {
    tile: "border-strength/40 bg-[color-mix(in_srgb,var(--strength)_7%,var(--bg))]",
    icon: "border border-strength/50 bg-strength-soft text-strength",
    text: "text-strength",
  },
} as const;

function tileStyle(kind: ReferenceKind): { tone: keyof typeof tileTones; icon: LucideIcon } {
  if (kind === "pace_race") return { tone: "hyrox", icon: Timer };
  if (kind.startsWith("pace_")) return { tone: "run", icon: Timer };
  if (kind.startsWith("hr_")) return { tone: "heart", icon: HeartPulse };
  return { tone: "strength", icon: Dumbbell };
}

// Tuile d'un repère actuel, partagée par la vue d'ensemble (« compact ») et l'onglet Repères.
export function ReferenceTile({
  entry,
  size = "md",
}: {
  entry: ReferenceEntry;
  size?: "compact" | "md";
}) {
  const { tone, icon: Icon } = tileStyle(entry.kind);
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

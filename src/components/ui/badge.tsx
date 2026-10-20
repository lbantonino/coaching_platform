import type { ReactNode } from "react";

// Badges de statut : texte coloré sur fond teinté (design system, section Statuts).
const tones = {
  ok: "bg-ok-tint text-ok",
  accent: "bg-accent-tint text-accent",
  warn: "bg-warn-tint text-warn",
  danger: "bg-danger-tint text-danger",
  neutral: "bg-chip text-muted",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex h-6 items-center rounded-full px-2.5 text-caption font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

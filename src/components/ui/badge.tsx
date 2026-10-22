import type { ReactNode } from "react";

// Pastilles de statut (design system §3 et §6). Sens des couleurs :
// ok = fait / sportif actif · live = en cours, record · warn = manqué, en retard
// danger = douleur, alerte : rouge PLEIN et texte blanc, pour ne jamais ressembler à « en cours »
// neutral = à venir, sans statut.
const tones = {
  ok: "bg-ok-soft text-ok",
  live: "bg-accent-soft text-accent-text",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft font-semibold text-danger",
  neutral: "bg-chip text-muted",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-[9px] py-1 text-micro font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

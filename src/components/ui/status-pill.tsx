import type { ReactNode } from "react";

// Étiquette d'état (kit « Coory Pages », STATUS-PILL, D-119) : le libellé sur un fond teinté, en
// rectangle aux coins arrondis (plus de point ni de capsule depuis le 16/11/2026). Ordinateur : 26 px de haut, 12 px ; téléphone : 28 px, 12,5 px.
// Tons : neutre (« Pas encore invitée »), violet (« Lien prêt »), ambre (« En attente »), vert
// (« Compte activé »). Pur balisage : utilisable dans un composant serveur comme client.
export type StatusTone = "neutral" | "accent" | "warn" | "ok";

const tones: Record<StatusTone, string> = {
  neutral: "bg-status-neutral-soft text-status-neutral",
  accent: "bg-status-accent-soft text-status-accent",
  warn: "bg-status-warn-soft text-status-warn",
  ok: "bg-status-ok-soft text-status-ok",
};

export function StatusPill({
  tone,
  className = "",
  children,
}: {
  tone: StatusTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex h-7 shrink-0 items-center rounded-[7px] px-[11px] text-[12.5px] leading-[normal] font-medium whitespace-nowrap lg:h-[26px] lg:rounded-[6px] lg:px-2.5 lg:text-[12px] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

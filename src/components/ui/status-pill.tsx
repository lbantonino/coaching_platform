import type { ReactNode } from "react";

// Pastille d'état (kit « Coory Pages », STATUS-PILL, D-119) : un point de 6 px de la couleur du texte
// puis le libellé, sur un fond teinté. Ordinateur : 26 px de haut, 12 px ; téléphone : 28 px, 12,5 px.
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
      className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-[14px] px-[11px] text-[12.5px] leading-[normal] font-medium whitespace-nowrap lg:h-[26px] lg:rounded-[13px] lg:px-2.5 lg:text-[12px] ${tones[tone]} ${className}`}
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
      {children}
    </span>
  );
}

import type { ReactNode } from "react";

// Pastilles (prompt Claude Design §4 « Badge ») : 12/500, 4 × 10 px, fond teinté + texte de la couleur.
// Sens des couleurs :
// ok = fait, actif, publié, payé · warn = en pause, en attente, à livrer, partiel
// live = en retard, manqué, sauté, priorité haute (rouge en TEXTE) · neutral = brouillon, archivé
// planned = en cours, prévu, à venir (bleu) · moved = reporté, à envoyer (violet)
// danger = douleur, alerte : rouge PLEIN et texte blanc, pour ne jamais ressembler à « en retard ».
const tones = {
  ok: "bg-ok-soft text-ok",
  live: "bg-accent-soft text-accent-text",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft font-semibold text-danger",
  neutral: "bg-chip text-muted",
  planned: "bg-run-soft text-run",
  moved: "bg-strength-soft text-strength",
  // Disciplines (D-23) : course, musculation, Hyrox, hybride. Un point de 7 px devant le libellé.
  run: "bg-run-soft text-run",
  strength: "bg-strength-soft text-strength",
  hyrox: "bg-hyrox-soft text-hyrox",
  hybrid: "bg-hybrid-soft text-hybrid",
} as const;

export type BadgeTone = keyof typeof tones;

const dotColors: Partial<Record<BadgeTone, string>> = {
  run: "bg-run",
  strength: "bg-strength",
  hyrox: "bg-hyrox",
  hybrid: "bg-hybrid",
};

export function Badge({
  tone = "neutral",
  dot,
  children,
}: {
  tone?: BadgeTone;
  // Point de couleur devant le libellé ; par défaut, seulement pour les disciplines.
  dot?: boolean;
  children: ReactNode;
}) {
  const dotColor = dotColors[tone];
  const showDot = dot ?? Boolean(dotColor);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[12px] leading-[1.3] font-medium whitespace-nowrap ${tones[tone]}`}
    >
      {showDot ? (
        <span
          aria-hidden
          className={`size-[7px] shrink-0 rounded-full ${dotColor ?? "bg-current"}`}
        />
      ) : null}
      {children}
    </span>
  );
}

// Couleur d'un statut d'après son libellé (prompt §4), pour que le même mot ait la même couleur
// dans toute l'app.
const statusTones: Record<string, BadgeTone> = {
  Actif: "ok",
  Active: "ok",
  Publié: "ok",
  Payée: "ok",
  Terminée: "ok",
  Faite: "ok",
  Atteint: "ok",
  Acceptée: "ok",
  "En pause": "warn",
  "En attente": "warn",
  "À livrer": "warn",
  Partielle: "warn",
  "En retard": "live",
  Manquée: "live",
  Sautée: "live",
  Haute: "live",
  Expirée: "live",
  Suspendue: "live",
  Brouillon: "neutral",
  Archivé: "neutral",
  Normale: "neutral",
  Abandonné: "neutral",
  "En cours": "planned",
  Prévue: "planned",
  "À venir": "planned",
  Reportée: "moved",
  "À envoyer": "moved",
};

export function statusTone(label: string): BadgeTone {
  return statusTones[label] ?? "neutral";
}

export function StatusBadge({ label }: { label: string }) {
  return <Badge tone={statusTone(label)}>{label}</Badge>;
}

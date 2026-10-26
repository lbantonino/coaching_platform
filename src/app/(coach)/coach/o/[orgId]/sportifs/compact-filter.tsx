"use client";

import {
  Archive,
  ChevronDown,
  CirclePause,
  CirclePlay,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { disciplineIcons } from "@/components/ui/discipline-icon";
import { ActionMenu } from "@/components/ui/overlay";
import { DISCIPLINES } from "@/domain/training/discipline";

// Filtre compact de la liste des sportifs, sur téléphone (demande d'Antonino du 26/10) : au lieu d'une
// rangée de pastilles qui passe à la ligne, un bouton qui montre le choix en cours (« Tous (8) ») et
// une flèche ; il ouvre la liste des choix. Chaque choix reste un lien d'adresse (?statut=…).
// Les icônes sont désignées par une clé : une fonction ne passe pas du serveur au navigateur.
export type CompactOption = { key: string; label: string; href: string; selected: boolean };

const icons: Record<string, LucideIcon> = {
  all: LayoutGrid,
  active: CirclePlay,
  paused: CirclePause,
  archived: Archive,
  ...Object.fromEntries(DISCIPLINES.map((d) => [d, disciplineIcons[d]])),
};

// `shortTitle` : titre du bouton quand le titre complet passerait à la ligne (« Programme »).
export function CompactFilter({
  title,
  shortTitle = title,
  options,
}: {
  title: string;
  shortTitle?: string;
  options: CompactOption[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const current = options.find((option) => option.selected) ?? options[0];
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${shortTitle} : ${current.label}. Changer`}
        className="flex min-h-[60px] min-w-0 items-center justify-between gap-2 rounded-card border border-line bg-surface px-4 py-2.5 text-left transition-colors duration-150 hover:bg-surface-2"
      >
        <span className="flex min-w-0 flex-col">
          <span className="text-[13px] text-muted">{shortTitle}</span>
          <span className="truncate text-[15px] font-medium">{current.label}</span>
        </span>
        <ChevronDown aria-hidden size={18} strokeWidth={1.8} className="shrink-0 text-muted" />
      </button>
      <ActionMenu
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        items={options.map((option) => ({
          label: option.label,
          icon: icons[option.key] ?? LayoutGrid,
          selected: option.selected,
          onSelect: () => router.push(option.href, { scroll: false }),
        }))}
      />
    </>
  );
}

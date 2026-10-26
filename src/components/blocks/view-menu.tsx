"use client";

import {
  CalendarDays,
  CalendarRange,
  ChevronDown,
  Columns3,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ActionMenu } from "@/components/ui/overlay";

// Bouton « Vue » de l'agenda sur téléphone (demande d'Antonino du 26/10, comme Google Agenda) : il
// montre la vue en cours et ouvre le choix Aujourd'hui, 3 jours, Semaine (les 7 jours dans l'écran)
// ou Mois. Chaque choix est une adresse (?vue=…&jours=7) : le bouton retour et le partage marchent.
// Les icônes sont désignées par une clé : une fonction ne passe pas du serveur au navigateur.
export type ViewOption = {
  key: "jour" | "3jours" | "semaine" | "mois";
  label: string;
  href: string;
  selected: boolean;
};

const icons: Record<ViewOption["key"], LucideIcon> = {
  jour: CalendarDays,
  "3jours": Columns3,
  semaine: CalendarRange,
  mois: LayoutGrid,
};

export function ViewMenu({ options }: { options: ViewOption[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const current = options.find((option) => option.selected) ?? options[0];
  const Icon = icons[current.key];
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Vue : ${current.label}. Changer de vue`}
        className="inline-flex h-11 items-center gap-2 rounded-control border border-line-2 bg-surface px-3.5 text-[14px] font-medium transition-colors duration-150 hover:bg-surface-2"
      >
        <Icon aria-hidden size={16} strokeWidth={1.8} className="text-accent-text" />
        <span className="text-muted">Vue</span>
        {current.label}
        <ChevronDown aria-hidden size={16} strokeWidth={1.8} className="text-muted" />
      </button>
      <ActionMenu
        open={open}
        onClose={() => setOpen(false)}
        title="Vue de l'agenda"
        items={options.map((option) => ({
          label: option.label,
          icon: icons[option.key],
          selected: option.selected,
          onSelect: () => router.push(option.href, { scroll: false }),
        }))}
      />
    </>
  );
}

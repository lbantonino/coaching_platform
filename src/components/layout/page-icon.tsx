"use client";

import type { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import { navFor } from "./navigation";
import { useShell } from "./shell-context";

// Icône de la page dans son en-tête (demande d'Antonino du 29/10/2026 : chaque page comme le tableau
// de bord) : la même que dans le menu, trouvée d'après l'adresse (une sous-page prend celle de sa
// rubrique). Rien si la page n'est pas dans le menu. En violet comme la page active du menu (02/11 :
// repérer la page même menu replié) : devant le titre sur ordinateur, à côté du nom de la page dans la
// barre du téléphone.
export function PageIcon({
  size = 18,
  className = "hidden shrink-0 text-violet-text lg:block",
}: {
  size?: number;
  className?: string;
} = {}) {
  const { space, orgBase } = useShell();
  const pathname = usePathname();
  const { main, secondary } = navFor(space, orgBase);
  const entries = [...main, ...(secondary ?? [])];
  const found =
    entries.find((entry) => entry.match(pathname)) ??
    entries
      .filter((entry) => entry.href !== "/coach" && pathname.startsWith(`${entry.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0];
  const Icon: LucideIcon | undefined = found?.icon;
  return Icon ? <Icon aria-hidden size={size} strokeWidth={1.8} className={className} /> : null;
}

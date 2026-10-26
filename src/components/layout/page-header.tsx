import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { SkeletonLines } from "@/components/ui/skeleton";

import { HeaderTools } from "./header-tools";

// En-tête de page (prompt Claude Design §5.2). À gauche : lien retour (sous-page), H1 en Space
// Grotesk (28 px téléphone, 34 px ordinateur), phrase en gris. À droite sur ordinateur : recherche,
// assistant, cloche, puis les actions de la page (contour, bouton rouge, menu « ••• »).
// Sur téléphone : les actions passent sous le titre, en pleine largeur.
export function PageHeader({
  title,
  titleAside,
  subtitle,
  back,
  actions,
  tools = true,
}: {
  title: ReactNode;
  // À côté du titre (ex. repère ♀ / ♂ d'un sportif)
  titleAside?: ReactNode;
  subtitle?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
  // false : la page affiche elle-même la recherche, l'assistant et la cloche (page centrée).
  tools?: boolean;
}) {
  return (
    <header className="flex flex-wrap items-end gap-x-4 gap-y-3.5 px-4 pt-4 pb-1 lg:px-8 lg:pt-7">
      <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-1.5">
        {back ? (
          <Link
            href={back.href}
            className="inline-flex min-h-9 items-center gap-1.5 self-start text-[14px] text-muted transition-colors duration-150 hover:text-text"
          >
            <ArrowLeft aria-hidden size={16} strokeWidth={1.8} />
            {back.label}
          </Link>
        ) : null}
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="font-display text-heading leading-[1.05] font-semibold break-words lg:text-heading-lg">
            {title}
          </h1>
          {titleAside}
        </div>
        {subtitle ? <p className="text-[15px] leading-[1.45] text-muted">{subtitle}</p> : null}
      </div>
      <div className="flex flex-[1_1_100%] flex-wrap items-center gap-2 lg:flex-none [&>*]:flex-[1_1_auto] lg:[&>*]:flex-none">
        {tools ? <HeaderTools /> : null}
        {actions}
      </div>
    </header>
  );
}

// Corps de page : une colonne sur téléphone (marges 16, de la place en bas pour la barre du sportif
// et les messages), marges 32 sur ordinateur. `grid` : grille de 12 colonnes (prompt §5.2).
export function PageBody({ grid = false, children }: { grid?: boolean; children: ReactNode }) {
  return (
    <div
      className={`px-4 pt-3 pb-[120px] lg:px-8 lg:pt-4 lg:pb-14 ${
        // Téléphone (26/10) : plus d'air entre les sections d'une page en grille (tableau de bord…).
        grid ? "grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-4" : "flex flex-col gap-4"
      }`}
    >
      {children}
    </div>
  );
}

// Conteneur d'une page des espaces : l'en-tête et le corps s'y suivent.
export const pageMainClass = "flex w-full min-w-0 flex-1 flex-col";

// Chargement d'une page entière (repli de <Suspense>), aux marges de l'en-tête.
export function PageLoading({ label }: { label?: string }) {
  return (
    <div className="px-4 pt-4 lg:px-8 lg:pt-7">
      <SkeletonLines label={label} />
    </div>
  );
}

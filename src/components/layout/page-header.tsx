import { type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { SkeletonLines } from "@/components/ui/skeleton";

import { BackLink } from "./back-link";
import { HeaderTools } from "./header-tools";
import { PageIcon } from "./page-icon";

// En-tête de page (prompt Claude Design §5.2), le même pour toutes les pages depuis le 29/10/2026
// (demande d'Antonino : « comme le tableau de bord, tout aligné »). Ordinateur : UNE ligne alignée sur
// le logo du menu : retour éventuel, icône de la page (celle du menu), titre de 26 px, puis à droite la
// recherche, l'assistant, la cloche et les actions. Pas de phrase sous le titre, ni sur ordinateur ni
// sur téléphone (demandes d'Antonino du 29/10/2026) : elle reste pour les lecteurs d'écran. Seule
// exception : une page de détail (pastilles d'une fiche sportif).
// Téléphone : la barre du haut écrit déjà le nom de la page, le titre reste pour les lecteurs
// d'écran ; une page de détail (avec retour) garde le sien (nom du sportif, de la facture…). Les
// actions passent dessous, en pleine largeur.
export function PageHeader({
  title,
  titleAside,
  subtitle,
  back,
  actions,
  tools = true,
  icon,
}: {
  title: ReactNode;
  // À côté du titre (ex. repère ♀ / ♂ d'un sportif)
  titleAside?: ReactNode;
  subtitle?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
  // false : la page affiche elle-même la recherche, l'assistant et la cloche (page centrée).
  tools?: boolean;
  // Ancien en-tête « en ligne » du tableau de bord : c'est maintenant celui de toutes les pages.
  inline?: boolean;
  // Icône imposée ; sinon celle de la page dans le menu.
  icon?: LucideIcon;
}) {
  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 pt-4 pb-1 lg:flex-nowrap lg:px-8 lg:pt-[17px]">
      {/* Page de détail (avec retour) : le lien de retour au-dessus, puis la ligne du titre, dont la
          phrase (pastilles d'une fiche sportif…) peut passer à la ligne. */}
      <div
        className={`flex min-w-0 flex-[1_1_auto] flex-col gap-1.5 ${back ? "lg:gap-0.5" : "lg:flex-row lg:items-center lg:gap-3"}`}
      >
        {/* Retour « là où j'étais » (29/10/2026), voir back-link.tsx. */}
        {back ? <BackLink href={back.href} label={back.label} /> : null}
        <div
          className={`flex min-w-0 flex-col gap-1.5 lg:flex-row lg:items-center lg:gap-3 ${back ? "lg:flex-wrap" : "lg:contents"}`}
        >
          <div
            className={`flex min-w-0 items-center gap-3 lg:shrink-0 ${back ? "" : "max-lg:sr-only"}`}
          >
            {/* Icône imposée par la page : dessinée ici (une fonction ne passe pas au navigateur). */}
            {icon ? (
              (() => {
                const Icon = icon;
                return (
                  <Icon
                    aria-hidden
                    size={22}
                    strokeWidth={1.8}
                    className="shrink-0 text-muted max-lg:hidden"
                  />
                );
              })()
            ) : (
              <PageIcon />
            )}
            <h1 className="min-w-0 font-display text-[24px] leading-tight font-semibold tracking-[-0.03em] break-words lg:text-[26px] lg:whitespace-nowrap">
              {title}
            </h1>
            {titleAside}
          </div>
          {subtitle ? (
            <div
              className={`min-w-0 text-[14px] leading-[1.45] text-muted ${back ? "" : "sr-only"}`}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
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

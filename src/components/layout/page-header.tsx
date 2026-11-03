import { type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { SkeletonLines } from "@/components/ui/skeleton";

import { BackLink } from "./back-link";
import { MobileBarTitle } from "./mobile-bar";
import { HeaderTools } from "./header-tools";
import { PageIcon } from "./page-icon";

// En-tête de page (prompt Claude Design §5.2), le même pour toutes les pages depuis le 29/10/2026
// (demande d'Antonino : « comme le tableau de bord, tout aligné »). Ordinateur : UNE ligne alignée sur
// le logo du menu : retour éventuel, icône de la page (celle du menu), titre de 26 px, puis à droite la
// recherche, l'assistant, la cloche et les actions. Pas de phrase sous le titre, ni sur ordinateur ni
// sur téléphone (demandes d'Antonino du 29/10/2026) : elle reste pour les lecteurs d'écran. Seule
// exception : une page de détail (pastilles d'une fiche sportif).
// Téléphone : la barre du haut écrit déjà le nom de la page, le titre reste pour les lecteurs
// d'écran ; une page de détail (avec retour) garde le sien (nom du sportif, de l'exercice…). Les
// actions passent dessous, en pleine largeur. Sans retour ni action visible, l'en-tête ne prend aucune
// place : le contenu commence juste sous les cartes ☰ et outils.
export function PageHeader({
  title,
  titleAside,
  subtitle,
  back,
  actions,
  tools = true,
  icon,
  visibleTitle = true,
  backInPhoneBar = false,
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
  // false : seul le lien de retour se voit, la page écrit son titre dans son contenu (page d'une
  // séance, 03/11 : l'en-tête reste celui de base) ; il reste pour les lecteurs d'écran.
  visibleTitle?: boolean;
  // Téléphone : le lien de retour dans la barre du haut, à la place du nom de la page (fiche sportif,
  // demande d'Antonino du 03/11) ; il n'est plus répété sous la barre.
  backInPhoneBar?: boolean;
}) {
  return (
    // Ordinateur (maquette v6, D-77) : l'en-tête est une carte de 64 px (titre 15 px, outils à droite),
    // à 20 px du menu et 14 px du bord droit (maquette « Sportifs », 03/11/2026).
    <header
      className={`flex flex-wrap items-center gap-x-4 ${back ? (visibleTitle ? "gap-y-3" : "gap-y-0") : ""} px-3.5 pt-0 pb-1 lg:mt-3.5 lg:mr-3.5 lg:ml-5 lg:min-h-16 lg:flex-nowrap lg:rounded-[20px] lg:bg-surface lg:py-3 lg:pr-[18px] lg:pl-[22px] lg:inset-ring lg:inset-ring-line`}
    >
      {/* Page de détail (avec retour) : le lien de retour au-dessus, puis la ligne du titre, dont la
          phrase (pastilles d'une fiche sportif…) peut passer à la ligne. */}
      <div
        className={`flex min-w-0 flex-[1_1_auto] flex-col gap-1.5 ${back ? "lg:gap-0.5" : "lg:flex-row lg:items-center lg:gap-2.5"}`}
      >
        {/* Retour « là où j'étais » (29/10/2026), voir back-link.tsx. */}
        {back ? (
          backInPhoneBar ? (
            <>
              <span className="max-lg:hidden">
                <BackLink href={back.href} label={back.label} />
              </span>
              <MobileBarTitle>
                <BackLink href={back.href} label={back.label} variant="bar" />
              </MobileBarTitle>
            </>
          ) : (
            <BackLink href={back.href} label={back.label} />
          )
        ) : null}
        <div
          className={`flex min-w-0 flex-col gap-1.5 lg:flex-row lg:items-center lg:gap-2.5 ${back ? "lg:flex-wrap" : "lg:contents"} ${visibleTitle ? "" : "sr-only"}`}
        >
          <div
            className={`flex min-w-0 items-center gap-3 lg:shrink-0 lg:gap-2.5 ${back ? "" : "max-lg:sr-only"}`}
          >
            {/* Icône imposée par la page : dessinée ici (une fonction ne passe pas au navigateur). */}
            {icon ? (
              (() => {
                const Icon = icon;
                return (
                  <Icon
                    aria-hidden
                    size={17}
                    strokeWidth={1.8}
                    className="hidden shrink-0 text-violet-text lg:block"
                  />
                );
              })()
            ) : (
              <PageIcon size={17} />
            )}
            <h1 className="min-w-0 font-display text-[24px] leading-tight font-semibold tracking-[-0.03em] break-words lg:text-[15px] lg:tracking-tight lg:whitespace-nowrap">
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
      <div className="flex flex-[1_1_100%] flex-wrap items-center gap-2 lg:flex-none lg:gap-2.5 [&>*]:flex-[1_1_auto] lg:[&>*]:flex-none">
        {tools ? <HeaderTools /> : null}
        {actions}
      </div>
    </header>
  );
}

// Corps de page : une colonne sur téléphone (marges 14, de la place en bas pour la barre du sportif
// et les messages), sur ordinateur 20 px à gauche (après le menu) et 14 px à droite (03/11/2026). `grid` : grille de 12 colonnes (prompt §5.2).
// `fill` (tableau de bord, D-78) : sur ordinateur, le corps prend toute la hauteur restante de l'écran
// (la page ne défile pas) ; son bas s'aligne sur celui du menu (12 px du bord).
export function PageBody({
  grid = false,
  fill = false,
  children,
}: {
  grid?: boolean;
  fill?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`px-3.5 pt-3.5 pb-[120px] lg:pt-4 lg:pr-3.5 lg:pl-5 ${fill ? "lg:min-h-0 lg:flex-1 lg:pb-3.5" : "lg:pb-14"} ${
        // Téléphone (26/10) : plus d'air entre les sections d'une page en grille (tableau de bord…).
        grid
          ? "grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-4"
          : `flex flex-col ${fill ? "gap-4 md:gap-6 lg:gap-4" : "gap-4"}`
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
    <div className="px-3.5 pt-4 lg:pt-7 lg:pr-3.5 lg:pl-5">
      <SkeletonLines label={label} />
    </div>
  );
}

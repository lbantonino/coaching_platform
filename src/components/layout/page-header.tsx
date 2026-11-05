import { type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { SkeletonLines } from "@/components/ui/skeleton";

import { BackLink } from "./back-link";
import { MobileBarTitle } from "./mobile-bar";
import { HeaderTools } from "./header-tools";
import { PageIcon } from "./page-icon";

// En-tête de page (prompt Claude Design §5.2), le même pour toutes les pages depuis le 29/10/2026
// (demande d'Antonino : « comme le tableau de bord, tout aligné »). Ordinateur : UNE carte de 64 px,
// UNE ligne : icône de la page (celle du menu), titre de 15 px, puis à droite la recherche,
// l'assistant, la cloche et les actions. Pas de phrase sous le titre (demandes d'Antonino du
// 29/10/2026) : elle reste pour les lecteurs d'écran.
//
// Page « à l'intérieur » d'une autre (avec retour), RÈGLE d'Antonino du 05/11/2026 (D-124), valable
// pour toutes les pages, même si une maquette dessine autre chose :
// - ordinateur : le chemin sur la même ligne, la carte garde sa hauteur de base :
//   « [icône] ← Bibliothèque · Créer un exercice ». « ← Bibliothèque » ramène là où j'étais
//   (back-link.tsx) ; le point dit qu'on est descendu d'un niveau ; le titre est celui de la page en
//   cours. Rien en dessous (la phrase éventuelle reste pour les lecteurs d'écran) ;
// - téléphone : le retour est dans la barre du haut (« ☰  ← Bibliothèque  IA cloche », D-117) ; le
//   titre de la page (et son bouton à droite, ex. la corbeille) en tête du contenu, à 20 px sous la
//   barre pour respirer. `visibleTitle={false}` (fiche sportif, page d'une séance) : la page écrit son
//   grand titre dans son contenu ; sur téléphone l'en-tête ne garde que le retour de la barre.
// Les actions passent dessous sur téléphone, en pleine largeur. Sans retour ni action visible,
// l'en-tête ne prend aucune place sur téléphone : le contenu commence juste sous les cartes ☰ et
// outils.
export function PageHeader({
  title,
  titleAside,
  subtitle,
  back,
  actions,
  tools = true,
  icon,
  visibleTitle = true,
}: {
  title: ReactNode;
  // À côté du titre, sur la même ligne (ex. corbeille d'une page Modifier sur téléphone, pastilles
  // d'une fiche exercice sur ordinateur).
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
  // false : sur téléphone, seul le retour de la barre se voit et la page écrit son grand titre dans
  // son contenu ; sur ordinateur, le chemin reste complet (« ← Sportifs · Chloé Martin »).
  visibleTitle?: boolean;
}) {
  const Icon = icon;
  return (
    // Ordinateur (maquette v6, D-77) : l'en-tête est une carte de 64 px (titre 15 px, outils à droite),
    // à 20 px du menu et 14 px du bord droit (maquette « Sportifs », 03/11/2026).
    <header
      className={`flex flex-wrap items-center gap-x-4 ${back ? (visibleTitle ? "gap-y-3 max-lg:pt-5" : "gap-y-0") : ""} px-3.5 pt-0 pb-1 lg:mt-3.5 lg:mr-3.5 lg:ml-5 lg:min-h-16 lg:flex-nowrap lg:rounded-[20px] lg:bg-surface lg:py-3 lg:pr-[18px] lg:pl-[22px] lg:inset-ring lg:inset-ring-line`}
    >
      {/* Retour « là où j'étais » (29/10/2026), voir back-link.tsx : dans la barre du haut sur
          téléphone (D-117). */}
      {back ? (
        <MobileBarTitle>
          <BackLink href={back.href} label={back.label} variant="bar" />
        </MobileBarTitle>
      ) : null}
      <div
        className={`@container flex min-w-0 flex-[1_1_auto] flex-col gap-1.5 lg:flex-row lg:items-center lg:gap-2.5 ${
          back ? (visibleTitle ? "" : "max-lg:sr-only") : "max-lg:sr-only"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3 lg:flex-1 lg:gap-2.5">
          {/* Icône imposée par la page : dessinée ici (une fonction ne passe pas au navigateur). */}
          {Icon ? (
            <Icon
              aria-hidden
              size={17}
              strokeWidth={1.8}
              className="hidden shrink-0 text-violet-text lg:block"
            />
          ) : (
            <PageIcon size={17} />
          )}
          {/* Ordinateur : « ← page précédente · », sur la ligne du titre (D-124). */}
          {back ? (
            <>
              <span className="flex max-w-[40cqi] min-w-0 shrink max-lg:hidden">
                <BackLink href={back.href} label={back.label} variant="path" />
              </span>
              <span aria-hidden className="shrink-0 text-[15px] text-faint max-lg:hidden">
                ·
              </span>
            </>
          ) : null}
          <h1 className="min-w-0 font-display text-[24px] leading-tight font-semibold tracking-[-0.03em] break-words lg:truncate lg:text-[15px] lg:tracking-tight">
            {title}
          </h1>
          {/* La place de la ligne se mesure (requête de conteneur, « @container ») : un complément
              (pastilles d'une fiche exercice) ne s'affiche que s'il reste assez de place pour le chemin. */}
          {titleAside}
        </div>
        {/* Phrase sous le titre : sur téléphone pour une page avec retour (pastilles d'une fiche
            exercice, rappel de Nouveau sportif) ; jamais sur ordinateur (une seule ligne). */}
        {subtitle ? (
          <div
            className={`min-w-0 text-[14px] leading-[1.45] text-muted ${
              back && visibleTitle ? "lg:sr-only" : "sr-only"
            }`}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
      <div className="flex flex-[1_1_100%] flex-wrap items-center gap-2 lg:flex-none lg:gap-2.5 [&>*]:flex-[1_1_auto] lg:[&>*]:flex-none">
        {/* Page avec retour ET boutons : sous 1 280 px, la recherche devient une loupe (D-124). */}
        {tools ? <HeaderTools compact={back && actions ? "xl" : false} /> : null}
        {actions}
      </div>
    </header>
  );
}

// Corps de page : une colonne sur téléphone (marges 14), sur ordinateur 20 px à gauche (après le menu)
// et 14 px à droite (03/11/2026). `grid` : grille de 12 colonnes (prompt §5.2).
// Bas de page (demandes d'Antonino du 04/11) : en fin de défilement, la dernière carte s'arrête
// - sur téléphone, à 28 px du bas (la marge basse de la maquette « Sportifs », 16 / 14 / 28) : la
//   carte respire, même dans un cadre d'iPhone aux coins arrondis (à 16 px, l'arrondi de l'écran
//   mordait sur ses angles) ; la barre du sportif est dans le flux (sticky), elle ne recouvre rien ;
// - sur ordinateur, au niveau du bas du menu de gauche (14 px, la marge du menu).
// Page avec un bouton flottant « + » (téléphone, D-117) : plus de place en bas (globals.css).
// `fill` (tableau de bord, D-78) : sur ordinateur, le corps prend toute la hauteur restante de l'écran
// (la page ne défile pas) ; son bas s'aligne sur celui du menu (14 px du bord).
// `grow` (Documents, kit « Coory Pages » 05, D-120) : sur téléphone comme sur ordinateur, le corps prend
// AU MOINS la hauteur restante (sa carte descend jusqu'en bas, comme la maquette) et grandit avec son
// contenu (la page défile).
// `screen` (fil de Messages, D-138) : sur téléphone, le corps fait EXACTEMENT la hauteur restante de
// l'écran (la page ne défile pas, c'est la carte qui défile à l'intérieur) ; le <main> de la page doit
// alors porter `phoneScreenMainClass`.
export function PageBody({
  grid = false,
  fill = false,
  grow = false,
  screen = false,
  children,
}: {
  grid?: boolean;
  fill?: boolean;
  grow?: boolean;
  screen?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      data-page-body=""
      data-phone-screen={screen ? "" : undefined}
      className={`px-3.5 pt-3.5 pb-7 lg:pt-4 lg:pr-3.5 lg:pl-5 lg:pb-3.5 ${fill ? "lg:min-h-0 lg:flex-1" : ""} ${grow ? "flex-1" : ""} ${screen ? "max-lg:min-h-0 max-lg:flex-1" : ""} ${
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
// Téléphone : le <main> prend exactement la hauteur de l'écran sous la barre du haut quand son corps
// est en mode `screen` (comme l'Agenda) ; sinon rien ne change.
export const phoneScreenMainClass =
  "max-lg:has-[[data-phone-screen]]:h-[calc(100dvh-var(--top-bar)-env(safe-area-inset-top))] max-lg:has-[[data-phone-screen]]:flex-none";

// Chargement d'une page entière (repli de <Suspense>), aux marges de l'en-tête.
export function PageLoading({ label }: { label?: string }) {
  return (
    <div className="px-3.5 pt-4 lg:pt-7 lg:pr-3.5 lg:pl-5">
      <SkeletonLines label={label} />
    </div>
  );
}

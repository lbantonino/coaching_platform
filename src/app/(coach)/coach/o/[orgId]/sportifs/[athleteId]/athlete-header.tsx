import { MessageCircle, Send } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { SexMark } from "@/components/ui/sex-mark";
import { disciplineLabels, disciplineStyles } from "@/domain/training/discipline";
import { completionLabel, missingProfileInfo } from "@/features/athletes/completeness";
import type { AthleteDetail } from "@/features/athletes/queries";
import {
  athleteLevelLabels,
  athleteStatusDots,
  athleteStatusLabels,
} from "@/features/athletes/schemas";

import { AthleteFicheMenu } from "./athlete-fiche-menu";
import { FicheCreateMenu } from "./fiche-create-menu";
import { FicheTabSelect, type FicheTab } from "./fiche-tab-select";

// En-tête de la fiche, d'après la maquette « Sportifs » du 03/11/2026 (pages 2a à 2k), commun à tous
// les onglets. L'en-tête de page reste celui de base (D-88) : retour « Sportifs », recherche,
// assistant, cloche, « + Créer » et « ··· » (mêmes actions que la liste). Dessous, la carte
// d'identité : photo, nom, ♀ / ♂, « Actif · Confirmé · Hyrox », et « Écrire » (ou « Inviter » sans
// compte). Puis les onglets : une barre sur ordinateur, un sélecteur dans la carte sur téléphone.
// Les anciens chiffres clés (D-24) sont dans la vue d'ensemble : objectif, séances et durée
// (Disponibilités), prochaine compétition (Prochaines séances), canal préféré (Profil).
export function AthleteHeader({
  athlete,
  organizationId,
  listPath,
}: {
  athlete: AthleteDetail;
  organizationId: string;
  listPath: string;
}) {
  const basePath = `${listPath}/${athlete.id}`;
  const menuAthlete = {
    id: athlete.id,
    name: athlete.displayName,
    status: athlete.status,
    programType: athlete.programType,
    hasAccount: athlete.hasAccount,
  };

  return (
    <>
      <PageHeader
        back={{ href: listPath, label: "Sportifs" }}
        // Téléphone (demande d'Antonino du 03/11, comme la maquette) : « ← Sportifs » dans la barre
        // du haut, entre ☰ et les outils, sur tous les onglets de la fiche.
        backInPhoneBar
        title={athlete.displayName}
        visibleTitle={false}
        actions={
          <div className="flex items-center gap-2.5 max-lg:hidden">
            <FicheCreateMenu
              athlete={{
                id: athlete.id,
                name: athlete.displayName,
                programType: athlete.programType,
              }}
            />
            <AthleteFicheMenu
              organizationId={organizationId}
              athlete={menuAthlete}
              basePath={basePath}
            />
          </div>
        }
      />

      {/* Téléphone : « + Créer » dans la barre du haut. */}
      <FicheCreateMenu
        athlete={{ id: athlete.id, name: athlete.displayName, programType: athlete.programType }}
        phone
      />
    </>
  );
}

// Carte d'identité et onglets : dans le corps de la page, au-dessus du contenu de l'onglet.
export function AthleteIdentity({
  athlete,
  organizationId,
  listPath,
  invitePath,
  tabs,
}: {
  athlete: AthleteDetail;
  organizationId: string;
  listPath: string;
  invitePath: string;
  tabs: FicheTab[];
}) {
  const basePath = `${listPath}/${athlete.id}`;
  const missing = missingProfileInfo(athlete);
  const menuAthlete = {
    id: athlete.id,
    name: athlete.displayName,
    status: athlete.status,
    programType: athlete.programType,
    hasAccount: athlete.hasAccount,
  };
  const canInvite = !athlete.hasAccount && athlete.status !== "archived";
  // Le point de séparation des informations (« · »), en gris clair.
  const dot = (
    <span aria-hidden className="text-checkbox">
      ·
    </span>
  );
  return (
    <>
      {/* La carte d'identité (le sélecteur d'onglets du téléphone en bas de la carte). */}
      <section
        aria-label="Identité du sportif"
        className="relative rounded-[20px] bg-surface inset-ring inset-ring-line-soft"
      >
        <div className="flex items-center gap-3 pt-4 pr-4 pb-3.5 pl-5 lg:flex-wrap lg:gap-4 lg:px-[22px] lg:py-5">
          <span className="relative flex shrink-0 [&>span>*]:size-[46px]! [&>span>*]:text-[15px]! lg:[&>span>*]:size-[60px]! lg:[&>span>*]:text-[19px]!">
            <Avatar
              name={athlete.displayName}
              colorClass={
                athlete.programType ? disciplineStyles[athlete.programType].avatar : undefined
              }
              photoPath={athlete.photoPath}
            />
            {/* Téléphone : le statut est le point sur la photo. */}
            <span
              aria-hidden
              className={`absolute right-0 bottom-0 size-3 rounded-full ring-[2.5px] ring-surface lg:hidden ${athleteStatusDots[athlete.status]}`}
            />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-[3px] lg:basis-[200px] lg:gap-1.5">
            <div className="flex min-w-0 items-center gap-1.5 lg:gap-2">
              {/* Le titre de la page (h1) est dans l'en-tête, lu par les lecteurs d'écran. */}
              <p
                aria-hidden
                className="truncate text-[16.5px] leading-[normal] font-semibold tracking-[-0.01em] lg:text-[26px] lg:leading-[1.15] lg:tracking-[-0.025em]"
              >
                {athlete.displayName}
              </p>
              <span className="lg:hidden">
                <SexMark sex={athlete.sex} plain />
              </span>
              <span className="max-lg:hidden [&>span]:size-[22px]! [&>span]:text-[13px]! [&>span]:font-medium!">
                <SexMark sex={athlete.sex} size="sm" />
              </span>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[13px] leading-[normal] text-muted lg:gap-x-3 lg:gap-y-2 lg:text-[13.5px] lg:text-text-2">
              <span className="flex items-center gap-1.5 max-lg:hidden">
                <span
                  aria-hidden
                  className={`size-[7px] rounded-full ${athleteStatusDots[athlete.status]}`}
                />
                {athleteStatusLabels[athlete.status]}
              </span>
              {athlete.level ? (
                <>
                  <span className="max-lg:hidden">{dot}</span>
                  <span>{athleteLevelLabels[athlete.level]}</span>
                </>
              ) : null}
              {athlete.programType ? (
                <>
                  {athlete.level ? dot : <span className="max-lg:hidden">{dot}</span>}
                  <span className="flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className={`size-1.5 rounded-full lg:size-[7px] ${disciplineStyles[athlete.programType].dot}`}
                    />
                    {disciplineLabels[athlete.programType]}
                  </span>
                </>
              ) : null}
              {/* Fiche créée d'un simple nom (D-35) : le lien mène à l'onglet Profil. */}
              {missing.length > 0 ? (
                <>
                  {dot}
                  <Link
                    href={`${basePath}?onglet=profil`}
                    scroll={false}
                    title={completionLabel(missing)}
                    className="whitespace-nowrap text-warn hover:underline"
                  >
                    Fiche à compléter
                  </Link>
                </>
              ) : null}
            </div>
          </div>
          {athlete.hasAccount ? (
            <Link
              href={`/coach/messages?sportif=${athlete.id}`}
              aria-label={`Écrire à ${athlete.displayName}`}
              className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-bg text-text transition-colors duration-150 lg:flex lg:h-10 lg:w-auto lg:gap-2 lg:rounded-[11px] lg:bg-transparent lg:px-3.5 lg:text-[14px] lg:font-medium lg:inset-ring lg:inset-ring-line-2 lg:hover:bg-surface-2"
            >
              <MessageCircle aria-hidden strokeWidth={1.8} className="size-[17px] lg:size-[15px]" />
              <span className="max-lg:sr-only">Écrire</span>
            </Link>
          ) : canInvite ? (
            <Link
              href={invitePath}
              aria-label={`Inviter ${athlete.displayName} dans son espace`}
              className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-bg text-text transition-colors duration-150 lg:flex lg:h-10 lg:w-auto lg:gap-2 lg:rounded-[11px] lg:bg-transparent lg:px-3.5 lg:text-[14px] lg:font-medium lg:inset-ring lg:inset-ring-line-2 lg:hover:bg-surface-2"
            >
              <Send aria-hidden strokeWidth={1.8} className="size-[17px] lg:size-[15px]" />
              <span className="max-lg:sr-only">Inviter</span>
            </Link>
          ) : null}
          {/* Téléphone : « ··· » (absent de la maquette) garde les actions de l'en-tête de l'ordinateur. */}
          <span className="lg:hidden">
            <AthleteFicheMenu
              organizationId={organizationId}
              athlete={menuAthlete}
              basePath={basePath}
              phone
            />
          </span>
        </div>
        <FicheTabSelect tabs={tabs} />
      </section>

      {/* Ordinateur : les dix onglets posés sur le fond de la page, sans cadre autour (demande
          d'Antonino du 03/11) ; ils défilent s'ils ne tiennent pas. Onglets aux mêmes places qu'avec
          le cadre de la maquette (4 px du bord) ; marges intérieures plus larges que ces 4 px : la
          place de l'ombre de l'onglet ouvert, que le défilement couperait sinon. */}
      <nav
        aria-label="Sections de la fiche"
        className="-mx-1 -my-1.5 flex gap-0.5 overflow-x-auto px-2 py-2.5 [scrollbar-width:none] max-lg:hidden"
      >
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            scroll={false}
            aria-current={tab.active ? "page" : undefined}
            className={`flex h-[38px] flex-[1_0_auto] items-center justify-center rounded-[10px] px-3.5 text-[13.5px] font-medium whitespace-nowrap transition-colors duration-150 ${
              tab.active
                ? // Seul l'onglet ouvert se détache (décision d'Antonino du 03/11) : fond blanc (gris
                  // surélevé en sombre), ombre douce, sans contour.
                  "bg-glass text-text shadow-[0_1px_2px_rgba(22,18,40,0.08),0_4px_12px_rgba(22,18,40,0.08)]"
                : "text-muted hover:text-text"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </>
  );
}

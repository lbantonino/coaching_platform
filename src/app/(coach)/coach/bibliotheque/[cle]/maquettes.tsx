import type { ReactNode } from "react";

import { ExerciseImage } from "@/components/blocks/exercise-image";
import { KeyValueList } from "@/components/blocks/key-value";
import { BackLink } from "@/components/layout/back-link";
import { HeaderTools } from "@/components/layout/header-tools";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { Card, MicroLabel } from "@/components/ui/card";
import type { ExerciseSheet } from "@/features/exercises/queries";

import { MovementStage } from "./movement-stage";
import { SheetTabs } from "./sheet-tabs";

// MAQUETTES TEMPORAIRES (31/10/2026) : trois mises en page de la fiche d'un exercice, ouvertes par
// ?maquette=1, 2 ou 3, pour qu'Antonino choisisse. Après son choix, la retenue remplace la fiche
// actuelle et ce fichier disparaît.
export type SheetParts = {
  sheet: ExerciseSheet;
  badges: ReactNode;
  actions: ReactNode;
  // Maquette 5 : le favori en rond sur la scène, les autres boutons sous le titre.
  favoriteIcon: ReactNode;
  moreActions: ReactNode;
  video: ReactNode;
  instructions: ReactNode;
  facts: { label: string; items: ReactNode[] }[];
  credits: ReactNode;
};

const back = { href: "/coach/bibliotheque", label: "Bibliothèque" };

function shotsOf(sheet: ExerciseSheet) {
  const { main, start, end } = sheet.images;
  return [
    main ? { src: main, alt: `Illustration : ${sheet.nameFr}`, caption: null } : null,
    start ? { src: start, alt: `${sheet.nameFr}, début du mouvement`, caption: "Début" } : null,
    end ? { src: end, alt: `${sheet.nameFr}, fin du mouvement`, caption: "Fin" } : null,
  ].filter((shot) => shot !== null);
}

// Bandeau bleu clair sur toute la largeur : les images y gardent la même taille (une demie, ou un
// tiers s'il y en a trois) et une image seule est centrée, sans vide sombre à côté.
function Band({ sheet }: { sheet: ExerciseSheet }) {
  const shots = shotsOf(sheet);
  if (!shots.length) {
    return (
      <ExerciseImage
        src={null}
        alt={`Illustration : ${sheet.nameFr}`}
        category={sheet.category}
        missingLabel
      />
    );
  }
  return (
    <div className="flex justify-center gap-1 rounded-card bg-illustration p-2">
      {shots.map((shot) => (
        <figure
          key={shot.src}
          className={`flex min-w-0 flex-col items-center ${shots.length === 3 ? "w-1/3" : "w-1/2"}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shot.src} alt={shot.alt} className="aspect-square w-full object-contain" />
          {shot.caption ? (
            <figcaption className="pb-1 text-[12px] font-medium text-on-illustration">
              {shot.caption}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );
}

function FactChips({ facts }: { facts: SheetParts["facts"] }) {
  return (
    <div className="flex flex-col gap-3.5">
      {facts.map((fact) => (
        <div key={fact.label} className="flex flex-col gap-2">
          <MicroLabel>{fact.label}</MicroLabel>
          <ul className="flex flex-wrap gap-1.5">
            {fact.items.map((item, index) => (
              <li
                key={index}
                className="rounded-pill bg-chip px-3 py-1.5 text-[14px] leading-[1.3]"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function FactList({ facts }: { facts: SheetParts["facts"] }) {
  return (
    <dl className="flex flex-col gap-3">
      {facts.map((fact) => (
        <div key={fact.label} className="flex flex-col gap-1">
          <dt>
            <MicroLabel>{fact.label}</MicroLabel>
          </dt>
          <dd className="text-[15px] leading-[1.45]">
            {fact.items.map((item, index) => (
              <span key={index}>
                {index > 0 ? ", " : null}
                {item}
              </span>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function asKeyValues(facts: SheetParts["facts"]) {
  return facts.map((fact) => ({
    label: fact.label,
    value: fact.items.map((item, index) => (
      <span key={index}>
        {index > 0 ? ", " : null}
        {item}
      </span>
    )),
  }));
}

// 1. « Bandeau illustré » : les images en tête sur toute la largeur, les boutons juste dessous, les
// muscles et le matériel en pastilles, puis les consignes. Ordinateur : la colonne de gauche reste en
// place pendant qu'on lit les consignes.
export function Maquette1({
  sheet,
  badges,
  actions,
  video,
  instructions,
  facts,
  credits,
}: SheetParts) {
  return (
    <>
      <PageHeader back={back} title={sheet.nameFr} subtitle={badges} />
      <PageBody grid>
        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-4 lg:col-span-5 lg:self-start">
          <Band sheet={sheet} />
          <div className="flex flex-wrap gap-2 [&>*]:flex-[1_1_auto]">{actions}</div>
          {video}
          <section aria-label="Muscles et matériel">
            <FactChips facts={facts} />
          </section>
        </div>
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-7">
          <Card id="exercise-instructions" title="Consignes">
            {instructions}
          </Card>
          {credits}
        </div>
      </PageBody>
    </>
  );
}

// 2. « Une seule carte » : tout dans une carte, comme une fiche papier. Une image seule partage sa
// ligne avec les muscles et le matériel ; deux ou trois images forment une rangée, les infos dessous.
// Ordinateur : une colonne de lecture (760 px), pas deux.
export function Maquette2({
  sheet,
  badges,
  actions,
  video,
  instructions,
  facts,
  credits,
}: SheetParts) {
  const shots = shotsOf(sheet);
  const image = (shot: (typeof shots)[number]) => (
    <ExerciseImage
      key={shot.src}
      src={shot.src}
      alt={shot.alt}
      category={sheet.category}
      caption={shot.caption ? `${shot.caption} du mouvement` : undefined}
    />
  );
  return (
    <>
      <PageHeader back={back} title={sheet.nameFr} subtitle={badges} actions={actions} />
      <PageBody>
        <div className="flex w-full max-w-[760px] flex-col gap-4">
          <Card>
            {shots.length <= 1 ? (
              <div className="grid grid-cols-2 items-center gap-4">
                {shots.length ? (
                  image(shots[0])
                ) : (
                  <ExerciseImage
                    src={null}
                    alt={`Illustration : ${sheet.nameFr}`}
                    category={sheet.category}
                  />
                )}
                <FactList facts={facts} />
              </div>
            ) : (
              <>
                <div className={`grid gap-3 ${shots.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
                  {shots.map(image)}
                </div>
                <div className="border-t border-line pt-3.5">
                  <FactList facts={facts} />
                </div>
              </>
            )}
            <div className="flex flex-col gap-3 border-t border-line pt-3.5">
              <h2 className="font-display text-block font-semibold">Consignes</h2>
              {instructions}
            </div>
          </Card>
          {video}
          {credits}
        </div>
      </PageBody>
    </>
  );
}

// 3. « Onglets » : les images en tête, puis deux onglets, Consignes (ouvert) et Muscles et matériel.
// Moins long à faire défiler, et de la place pour d'autres onglets plus tard (vidéo, programmes où
// l'exercice est utilisé…).
export function Maquette3({
  sheet,
  badges,
  actions,
  video,
  instructions,
  facts,
  credits,
}: SheetParts) {
  return (
    <>
      <PageHeader back={back} title={sheet.nameFr} subtitle={badges} actions={actions} />
      <PageBody grid>
        <div className="flex min-w-0 flex-col gap-3 lg:col-span-5">
          <Band sheet={sheet} />
          {video}
        </div>
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-7">
          <Card>
            <SheetTabs
              tabs={[
                { label: "Consignes", content: instructions },
                {
                  label: "Muscles et matériel",
                  content: <KeyValueList items={asKeyValues(facts)} />,
                },
              ]}
            />
          </Card>
          {credits}
        </div>
      </PageBody>
    </>
  );
}

// 4. La 3 sans onglets (demande d'Antonino du 31/10 : voir les deux sections à la fois) : le bandeau,
// puis les muscles et le matériel, puis les consignes. Ordinateur : images et muscles à gauche,
// consignes à droite.
export function Maquette4({
  sheet,
  badges,
  actions,
  video,
  instructions,
  facts,
  credits,
}: SheetParts) {
  return (
    <>
      <PageHeader back={back} title={sheet.nameFr} subtitle={badges} actions={actions} />
      <PageBody grid>
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-5">
          <Band sheet={sheet} />
          {video}
          <Card id="exercise-details" title="Muscles et matériel">
            <KeyValueList items={asKeyValues(facts)} />
          </Card>
        </div>
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-7">
          <Card id="exercise-instructions" title="Consignes">
            {instructions}
          </Card>
          {credits}
        </div>
      </PageBody>
    </>
  );
}

// 5. « La scène du mouvement » (demande d'Antonino du 31/10 : un design totalement différent, sans
// cartes). Une seule chose forte : la scène, bord à bord sur téléphone, où le début et la fin du
// mouvement alternent comme une image animée. Tout le reste est calme, posé sur le fond : grand titre,
// muscles et matériel en deux lignes, consignes en frise numérotée (c'est une vraie suite d'étapes).
// Ordinateur : la ligne du haut de toutes les pages (retour, outils), la scène fixe à droite du titre.
// L'image garde sa taille d'origine (demande d'Antonino du 31/10 : la grande scène était trop grande).
export function Maquette5({
  sheet,
  badges,
  favoriteIcon,
  moreActions,
  video,
  facts,
  credits,
}: SheetParts) {
  const shots = shotsOf(sheet);
  const muscles = facts.find((fact) => fact.label === "Muscles principaux")?.items ?? [];
  const secondary = facts.find((fact) => fact.label === "Muscles secondaires")?.items ?? [];
  const equipment = facts.find((fact) => fact.label === "Matériel")?.items ?? [];
  const variantOf = facts.find((fact) => fact.label === "Variante de")?.items ?? [];
  const list = (items: ReactNode[]) =>
    items.map((item, index) => (
      <span key={index}>
        {index > 0 ? ", " : null}
        {item}
      </span>
    ));
  return (
    <>
      <header className="hidden items-center justify-between gap-4 px-8 pt-[17px] lg:flex">
        <BackLink href={back.href} label={back.label} />
        <HeaderTools />
      </header>
      <div className="grid grid-cols-1 pb-[120px] lg:grid-cols-12 lg:gap-12 lg:px-8 lg:pt-5 lg:pb-14">
        <div className="lg:sticky lg:top-5 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:self-start">
          <MovementStage
            shots={shots}
            category={sheet.category}
            name={sheet.nameFr}
            corner={
              <>
                <span className="lg:invisible">
                  <BackLink href={back.href} label={back.label} variant="icon" />
                </span>
                {favoriteIcon}
              </>
            }
          />
        </div>

        <div className="flex min-w-0 flex-col gap-7 px-4 pt-5 lg:col-span-7 lg:col-start-1 lg:row-start-1 lg:px-0 lg:pt-1">
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-[30px] leading-[1.05] font-semibold tracking-[-0.035em] text-balance lg:text-[40px]">
              {sheet.nameFr}
            </h1>
            {badges}
          </div>

          <dl className="grid grid-cols-[84px_minmax(0,1fr)] gap-x-4 gap-y-3 text-[15px] leading-[1.45]">
            <dt className="text-muted">Muscles</dt>
            <dd className="min-w-0">
              <span className="font-medium">{list(muscles)}</span>
              {secondary.length ? (
                <span className="mt-0.5 block text-[14px] text-muted">
                  Secondaires : {list(secondary)}
                </span>
              ) : null}
            </dd>
            <dt className="text-muted">Matériel</dt>
            <dd className="min-w-0">{list(equipment)}</dd>
            {variantOf.length ? (
              <>
                <dt className="text-muted">Variante de</dt>
                <dd className="min-w-0">{list(variantOf)}</dd>
              </>
            ) : null}
          </dl>

          <div className="flex flex-wrap gap-2 [&>*]:flex-[1_1_auto] lg:[&>*]:flex-none">
            {moreActions}
            {video}
          </div>

          <section aria-labelledby="exercise-instructions" className="flex flex-col gap-4">
            <h2
              id="exercise-instructions"
              className="font-display text-[20px] font-semibold tracking-[-0.02em]"
            >
              Consignes
            </h2>
            {sheet.instructions.length ? (
              <ol className="flex flex-col">
                {sheet.instructions.map((step, index) => (
                  <li key={index} className="relative flex gap-4 pb-5 last:pb-0">
                    {index < sheet.instructions.length - 1 ? (
                      <span
                        aria-hidden
                        className="absolute top-9 bottom-1 left-[15.5px] w-px bg-line-2"
                      />
                    ) : null}
                    <span
                      aria-hidden
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-line-2 font-display text-[14px] font-semibold tabular"
                    >
                      {index + 1}
                    </span>
                    <p className="min-w-0 max-w-[62ch] pt-[5px] text-[16px] leading-[1.55]">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-[15px] text-muted">
                Consignes à venir : elles seront écrites puis validées par un coach.
              </p>
            )}
          </section>

          {credits}
        </div>
      </div>
    </>
  );
}

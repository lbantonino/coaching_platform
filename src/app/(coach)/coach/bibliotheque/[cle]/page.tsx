import { Play } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { ExerciseTag, MissingIllustration, SheetFigure } from "@/components/blocks/exercise-image";
import { InstructionTimeline } from "@/components/blocks/instruction-timeline";
import { BarbellIcon } from "@/components/blocks/library-icons";
import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { videoPlatform } from "@/domain/exercises/coach-exercise";
import { muscleGroupsOf } from "@/domain/exercises/library";
import {
  equipmentInfo,
  exerciseCategoryLabels,
  muscleGroupLabels,
  muscleInfo,
} from "@/domain/exercises/vocabulary";
import { requireCoach } from "@/features/auth/guards";
import { setExerciseFavorite } from "@/features/exercises/actions";
import { deleteCoachExercise } from "@/features/exercises/coach-actions";
import { getExerciseSheet, type ExerciseSheet } from "@/features/exercises/queries";

import { ExerciseActions } from "./exercise-actions";

export const metadata: Metadata = {
  title: "Exercice",
};

// Fiche d'un exercice de la bibliothèque (P3-01, D-75 ; maquette « Bibliothèque » du 06/11/2026,
// D-142) : illustrations, muscles, matériel et consignes, rien d'autre (une bibliothèque, pas un
// éditeur). UN seul composant, qui choisit sa mise en page selon le nombre d'illustrations :
// 2 (début et fin) → maquette 3a / 3b ; 1 → 2a / 2b ; 0 → 4a / 4b (cadre « Aucune illustration »).
// Ordinateur : carte du haut (illustration(s) à gauche, identité, muscles et matériel à droite), puis
// les consignes en frise. Téléphone : illustration(s) et identité, puis une carte muscles et matériel,
// puis les consignes. Le catalogue commun ne se modifie pas (« Créer ma variante » en fait une copie) ;
// un exercice de l'organisation (D-76) se modifie, se supprime et peut avoir un lien vidéo.
const KEY = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Ouverte depuis une séance (« ⋯ » → « Voir dans la Bibliothèque », D-187) : le retour ramène au
// programme ou au modèle, comme le geste de retour (règle D-124). Seulement une adresse de l'app.
function backFrom(retour: string | string[] | undefined): { href: string; label: string } {
  if (
    typeof retour === "string" &&
    /^\/coach\/o\/[0-9a-f-]{36}\/(programmes|sportifs)\//.test(retour) &&
    !retour.includes("//")
  ) {
    const label = /\/programmes\/modeles\//.test(retour)
      ? "Modèle"
      : /\/sportifs\//.test(retour)
        ? "Sportif"
        : "Programme";
    return { href: retour, label };
  }
  return { href: "/coach/bibliotheque", label: "Bibliothèque" };
}

export default function ExercisePage({
  params,
  searchParams,
}: PageProps<"/coach/bibliotheque/[cle]">) {
  return (
    // Très grand écran : la fiche s'arrête à 1 180 px de large, centrée (lignes de consignes lisibles,
    // PROPOSED validé le 06/11).
    <main className={`${pageMainClass} min-[1440px]:mx-auto min-[1440px]:max-w-[1214px]`}>
      <Suspense fallback={<PageLoading />}>
        {Promise.all([params, searchParams]).then(([{ cle }, query]) => (
          <Exercise exerciseKey={cle} back={backFrom(query.retour)} />
        ))}
      </Suspense>
    </main>
  );
}

async function Exercise({
  exerciseKey,
  back,
}: {
  exerciseKey: string;
  back: { href: string; label: string };
}) {
  const { user, memberships } = await requireCoach();
  if (!KEY.test(exerciseKey)) notFound();
  const sheet = await getExerciseSheet(exerciseKey, user.id);
  if (!sheet) notFound();

  const { main, start, end } = sheet.images;
  // Début et fin : deux images ; sinon l'image qui existe ; sinon aucune.
  const pair = start && end ? { start, end } : null;
  const single = pair ? null : (main ?? start ?? end);
  const layout = pair ? 2 : single ? 1 : 0;

  const steps = sheet.instructions.length;
  const muscleGroup = muscleGroupsOf(sheet.primaryMuscles)[0];
  const meta = [
    sheet.mine ? "Mon exercice" : null,
    exerciseCategoryLabels[sheet.category],
    sheet.hyroxStation
      ? `Station ${sheet.hyroxStation}`
      : muscleGroup
        ? muscleGroupLabels[muscleGroup]
        : null,
    sheet.unilateral ? "Un côté à la fois" : null,
    steps ? `${steps} étape${steps > 1 ? "s" : ""}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const platform = sheet.videoUrl ? videoPlatform(sheet.videoUrl) : null;

  const media =
    layout === 2 && pair ? (
      <div className="grid grid-cols-2 gap-2 lg:flex lg:shrink-0 lg:items-start lg:self-start lg:gap-2.5">
        <SheetFigure
          src={pair.start}
          alt={`${sheet.nameFr}, début du mouvement`}
          step={{ number: 1, label: "Début" }}
          className="w-full lg:w-44 xl:w-[268px]"
        />
        <SheetFigure
          src={pair.end}
          alt={`${sheet.nameFr}, fin du mouvement`}
          step={{ number: 2, label: "Fin" }}
          className="w-full lg:w-44 xl:w-[268px]"
        />
      </div>
    ) : layout === 1 && single ? (
      <SheetFigure
        src={single}
        alt={`Illustration : ${sheet.nameFr}`}
        className="w-full lg:w-[280px] lg:self-start xl:w-80"
      />
    ) : (
      <MissingIllustration
        addHref={sheet.mine ? `/coach/bibliotheque/${sheet.id}/modifier` : undefined}
        className="lg:w-[280px] lg:shrink-0 lg:self-start xl:w-80"
      />
    );

  return (
    <>
      <PageHeader
        back={back}
        title={sheet.nameFr}
        // Téléphone : le nom est écrit dans la carte du haut ; la barre garde le retour.
        visibleTitle={false}
        actions={
          <ExerciseActions
            name={sheet.nameFr}
            favorite={sheet.favorite}
            setFavorite={setExerciseFavorite.bind(null, sheet.id)}
            variantHref={
              sheet.mine ? undefined : `/coach/bibliotheque/nouveau?variante=${sheet.key}`
            }
            editHref={sheet.mine ? `/coach/bibliotheque/${sheet.id}/modifier` : undefined}
            remove={
              sheet.mine
                ? deleteCoachExercise.bind(null, memberships[0].organizationId, sheet.id)
                : undefined
            }
          />
        }
      />
      <PageBody>
        <div className="flex flex-col gap-3 lg:gap-4">
          <section
            aria-label="Exercice"
            className={`rounded-[20px] bg-surface p-4 inset-ring inset-ring-line-soft ${
              layout === 2 ? "" : "lg:p-[18px]"
            }`}
          >
            <div
              className={`flex flex-col gap-4 lg:flex-row lg:items-stretch ${
                layout === 2 ? "lg:gap-6" : "lg:gap-7"
              }`}
            >
              {media}
              <div
                className={`flex min-w-0 flex-col lg:flex-1 ${
                  layout === 2
                    ? "lg:gap-[18px] lg:px-0.5 lg:pt-1"
                    : "lg:gap-[22px] lg:px-1 lg:pt-1.5"
                }`}
              >
                <div className="flex flex-col gap-2.5">
                  <ExerciseTag category={sheet.category} size="sheet" />
                  <h2
                    className={`text-[22px] leading-[1.15] font-bold tracking-[-0.025em] text-pretty text-text ${
                      layout === 2 ? "max-lg:text-[21px] lg:text-[22px]" : "lg:text-[26px]"
                    }`}
                  >
                    {sheet.nameFr}
                  </h2>
                  <p className="text-[13.5px] leading-[normal] text-muted">{meta}</p>
                  {sheet.videoUrl ? (
                    <a
                      href={sheet.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex h-[34px] items-center gap-[7px] self-start rounded-[10px] bg-surface px-3.5 text-[12.5px] leading-none font-semibold whitespace-nowrap text-text shadow-[0_1px_2px_rgba(22,18,40,0.08)] inset-ring inset-ring-popover-line transition-[background-color,scale] duration-150 ease-out hover:bg-surface-2 active:scale-[0.97]"
                    >
                      <Play aria-hidden size={13} strokeWidth={2} />
                      {platform ? `Voir la vidéo sur ${platform}` : "Voir la vidéo"}
                    </a>
                  ) : null}
                </div>
                <span aria-hidden className="h-px bg-line-soft max-lg:hidden" />
                <Details sheet={sheet} className="max-lg:hidden" />
              </div>
            </div>
          </section>

          {/* Téléphone : muscles et matériel dans leur propre carte (maquette 2b / 3b / 4b). */}
          <section
            aria-label="Muscles et matériel"
            className="rounded-[20px] bg-surface p-[18px] inset-ring inset-ring-line-soft lg:hidden"
          >
            <Details sheet={sheet} />
          </section>

          <section
            aria-labelledby="exercise-instructions"
            className="flex flex-col gap-[18px] rounded-[20px] bg-surface px-[18px] py-5 inset-ring inset-ring-line-soft lg:px-7 lg:py-[26px]"
          >
            <div className="flex items-center justify-between gap-3">
              <h2
                id="exercise-instructions"
                className="text-[16px] leading-[normal] font-semibold text-text"
              >
                Consignes
              </h2>
              {steps ? (
                <span className="text-[12.5px] leading-[normal] font-medium text-dlg-faint">
                  {steps} étape{steps > 1 ? "s" : ""}
                </span>
              ) : null}
            </div>
            {steps ? (
              <InstructionTimeline steps={sheet.instructions} />
            ) : (
              <p className="text-[14px] leading-[1.55] text-muted">
                Consignes à venir : elles seront écrites puis validées par un coach.
              </p>
            )}
          </section>

          {/* Licence RepDB (terme 2) : mention visible ; terme 7 : pas un avis médical. */}
          <p className="text-[12px] leading-[1.5] text-dlg-faint">
            {sheet.attributionRequired ? (
              <>
                Données de l&apos;exercice :{" "}
                <a
                  href="https://repdb.co"
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="text-muted underline underline-offset-2 hover:text-text"
                >
                  Exercise data by RepDB (repdb.co)
                </a>
                .{" "}
              </>
            ) : null}
            {sheet.mine
              ? "Exercice créé par ton organisation. "
              : sheet.category === "hyrox"
                ? "Illustration : Coory. "
                : null}
            Contenu informatif, pas un avis médical.
          </p>
        </div>
      </PageBody>
    </>
  );
}

// Muscles principaux (lavande), secondaires (gris), matériel (icône + nom) et, pour une variante,
// l'exercice d'origine. Libellés en petites capitales espacées (maquette).
function Details({ sheet, className = "" }: { sheet: ExerciseSheet; className?: string }) {
  const label = (code: string, dict: Record<string, { label: string }>) =>
    dict[code]?.label ?? code;
  return (
    <div className={`flex flex-col gap-3.5 ${className}`}>
      <Group title="Muscles principaux">
        {sheet.primaryMuscles.length ? (
          <Chips items={sheet.primaryMuscles.map((code) => label(code, muscleInfo))} primary />
        ) : (
          <p className="text-[13.5px] leading-[normal] text-muted">À venir</p>
        )}
      </Group>
      {sheet.secondaryMuscles.length ? (
        <Group title="Muscles secondaires">
          <Chips items={sheet.secondaryMuscles.map((code) => label(code, muscleInfo))} />
        </Group>
      ) : null}
      <Group title="Matériel">
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {(sheet.equipment.length
            ? sheet.equipment.map((code) => label(code, equipmentInfo))
            : ["Poids du corps"]
          ).map((name) => (
            <li
              key={name}
              className="flex items-center gap-2 text-[14px] leading-[normal] font-semibold text-text"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-[8px] bg-lib-chip">
                <BarbellIcon aria-hidden size={15} strokeWidth={1.8} className="text-dlg-ink-2" />
              </span>
              {name}
            </li>
          ))}
        </ul>
      </Group>
      {sheet.variantOf ? (
        <Group title="Variante de">
          <Link
            href={`/coach/bibliotheque/${sheet.variantOf.key}`}
            className="self-start text-[14px] leading-[normal] font-semibold text-violet-text underline-offset-2 hover:underline"
          >
            {sheet.variantOf.nameFr}
          </Link>
        </Group>
      ) : null}
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-[11px] leading-[normal] font-semibold tracking-[0.08em] text-dlg-faint uppercase">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Chips({ items, primary = false }: { items: string[]; primary?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={item}
          className={`h-7 rounded-full px-[11px] text-[12.5px] leading-7 whitespace-nowrap ${
            primary
              ? "bg-lib-lavender font-semibold text-lib-lavender-ink"
              : "bg-lib-chip font-medium text-dlg-ink-2"
          }`}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

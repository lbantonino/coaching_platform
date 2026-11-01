import { Copy, Pencil, Play } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ExerciseImage } from "@/components/blocks/exercise-image";
import { FavoriteButton } from "@/components/blocks/favorite-button";
import { KeyValueList } from "@/components/blocks/key-value";
import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { videoPlatform } from "@/domain/exercises/coach-exercise";
import {
  difficultyLabels,
  equipmentInfo,
  exerciseCategoryLabels,
  muscleInfo,
  type ExerciseCategory,
} from "@/domain/exercises/vocabulary";
import { requireCoach } from "@/features/auth/guards";
import { setExerciseFavorite } from "@/features/exercises/actions";
import { deleteCoachExercise } from "@/features/exercises/coach-actions";
import { getExerciseSheet, type ExerciseSheet } from "@/features/exercises/queries";

import { DeleteExerciseButton } from "./delete-exercise-button";
import {
  Maquette1,
  Maquette2,
  Maquette3,
  Maquette4,
  Maquette5,
  type SheetParts,
} from "./maquettes";

export const metadata: Metadata = {
  title: "Exercice",
};

// Fiche d'un exercice de la bibliothèque (P3-01, D-75) : illustrations, muscles, matériel et consignes,
// rien d'autre (demande d'Antonino du 30/10 : une bibliothèque, pas un éditeur). Ce qui se règle dans
// une séance (répétitions, charge, distance…) est gardé en base et s'affichera dans la création de
// programme. Le catalogue commun ne se modifie pas (« Créer ma variante » en fait une copie) ; un
// exercice de l'organisation (D-76) se modifie et se supprime, et peut avoir un lien vidéo.
const categoryTones: Record<ExerciseCategory, BadgeTone> = {
  strength: "strength",
  hyrox: "hyrox",
  cardio: "neutral",
  mobility: "neutral",
};

const KEY = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// MAQUETTES TEMPORAIRES (31/10/2026) : ?maquette=1 à 5 ouvre une des mises en page
// proposées à Antonino (maquettes.tsx).
const MAQUETTES = {
  "1": Maquette1,
  "2": Maquette2,
  "3": Maquette3,
  "4": Maquette4,
  "5": Maquette5,
} as const;

export default function ExercisePage({
  params,
  searchParams,
}: PageProps<"/coach/bibliotheque/[cle]">) {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
        {Promise.all([params, searchParams]).then(([{ cle }, query]) => (
          <Exercise
            exerciseKey={cle}
            maquette={typeof query.maquette === "string" ? query.maquette : null}
          />
        ))}
      </Suspense>
    </main>
  );
}

async function Exercise({
  exerciseKey,
  maquette,
}: {
  exerciseKey: string;
  maquette: string | null;
}) {
  const { user, memberships } = await requireCoach();
  if (!KEY.test(exerciseKey)) notFound();
  const sheet = await getExerciseSheet(exerciseKey, user.id);
  if (!sheet) notFound();
  const labels = (codes: string[], dict: Record<string, { label: string }>) =>
    codes.map((code) => dict[code]?.label ?? code).join(", ");
  const platform = sheet.videoUrl ? videoPlatform(sheet.videoUrl) : null;

  const Maquette = maquette && maquette in MAQUETTES ? MAQUETTES[maquette as "1"] : null;
  if (Maquette) return <Maquette {...sheetParts(sheet, memberships[0].organizationId)} />;

  return (
    <>
      <PageHeader
        back={{ href: "/coach/bibliotheque", label: "Bibliothèque" }}
        title={sheet.nameFr}
        subtitle={
          <span className="flex flex-wrap gap-1.5">
            {sheet.mine ? <Badge tone="moved">Mon exercice</Badge> : null}
            <Badge tone={categoryTones[sheet.category]}>
              {exerciseCategoryLabels[sheet.category]}
            </Badge>
            {sheet.hyroxStation ? <Badge tone="hyrox">Station {sheet.hyroxStation}</Badge> : null}
            {sheet.difficulty ? <Badge>{difficultyLabels[sheet.difficulty]}</Badge> : null}
            {sheet.unilateral ? <Badge>Un côté à la fois</Badge> : null}
          </span>
        }
        actions={
          <>
            <FavoriteButton
              variant="button"
              name={sheet.nameFr}
              favorite={sheet.favorite}
              setFavorite={setExerciseFavorite.bind(null, sheet.id)}
            />
            {sheet.mine ? (
              <>
                <Link
                  href={`/coach/bibliotheque/${sheet.id}/modifier`}
                  className={buttonClass({ variant: "outline" })}
                >
                  <Pencil aria-hidden size={16} strokeWidth={1.8} />
                  Modifier
                </Link>
                <DeleteExerciseButton
                  name={sheet.nameFr}
                  remove={deleteCoachExercise.bind(null, memberships[0].organizationId, sheet.id)}
                />
              </>
            ) : (
              <Link
                href={`/coach/bibliotheque/nouveau?variante=${sheet.key}`}
                className={buttonClass({ variant: "outline" })}
              >
                <Copy aria-hidden size={16} strokeWidth={1.8} />
                Créer ma variante
              </Link>
            )}
          </>
        }
      />
      <PageBody grid>
        <section aria-label="Illustrations" className="flex flex-col gap-3 lg:col-span-5">
          <Illustrations sheet={sheet} />
          {sheet.videoUrl ? (
            <a
              href={sheet.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass({ variant: "inverse", className: "self-start" })}
            >
              <Play aria-hidden size={16} strokeWidth={1.8} />
              {platform ? `Voir la vidéo sur ${platform}` : "Voir la vidéo"}
            </a>
          ) : null}
        </section>

        <div className="flex min-w-0 flex-col gap-4 lg:col-span-7">
          <Card id="exercise-details" title="Muscles et matériel">
            <KeyValueList
              items={[
                {
                  label: "Muscles principaux",
                  value: sheet.primaryMuscles.length
                    ? labels(sheet.primaryMuscles, muscleInfo)
                    : "À venir",
                },
                ...(sheet.secondaryMuscles.length
                  ? [
                      {
                        label: "Muscles secondaires",
                        value: labels(sheet.secondaryMuscles, muscleInfo),
                      },
                    ]
                  : []),
                {
                  label: "Matériel",
                  value: sheet.equipment.length
                    ? labels(sheet.equipment, equipmentInfo)
                    : "Poids du corps",
                },
                ...(sheet.variantOf
                  ? [
                      {
                        label: "Variante de",
                        value: (
                          <Link
                            href={`/coach/bibliotheque/${sheet.variantOf.key}`}
                            className="underline underline-offset-2 hover:text-accent-text"
                          >
                            {sheet.variantOf.nameFr}
                          </Link>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </Card>

          <Card id="exercise-instructions" title="Consignes">
            {sheet.instructions.length > 0 ? (
              <ol className="flex flex-col gap-2.5">
                {sheet.instructions.map((step, index) => (
                  <li key={index} className="flex gap-3 text-[15px] leading-[1.5]">
                    <span
                      aria-hidden
                      className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-chip text-[12px] font-semibold tabular"
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0">{step}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-[14px] text-muted">
                Consignes à venir : elles seront écrites puis validées par un coach.
              </p>
            )}
          </Card>

          {/* Licence RepDB (terme 2) : mention visible ; terme 7 : pas un avis médical. */}
          <p className="text-[13px] leading-[1.5] text-muted">
            {sheet.attributionRequired ? (
              <>
                Données de l&apos;exercice :{" "}
                <a
                  href="https://repdb.co"
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="underline underline-offset-2 hover:text-text"
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

// Toutes les images sur la même grille de deux colonnes (demande d'Antonino du 30/10) : une image
// Hyrox seule a la même taille qu'une image RepDB de début ou de fin, au lieu de toute la largeur.
// Sans aucune image : le bandeau « Illustration à venir ».
function Illustrations({ sheet }: { sheet: ExerciseSheet }) {
  const { main, start, end } = sheet.images;
  if (!main && !start && !end) {
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
    <div className="grid grid-cols-2 gap-3">
      {main ? (
        <ExerciseImage
          src={main}
          alt={`Illustration : ${sheet.nameFr}`}
          category={sheet.category}
        />
      ) : null}
      {start ? (
        <ExerciseImage
          src={start}
          alt={`${sheet.nameFr}, début du mouvement`}
          category={sheet.category}
          caption="Début du mouvement"
        />
      ) : null}
      {end ? (
        <ExerciseImage
          src={end}
          alt={`${sheet.nameFr}, fin du mouvement`}
          category={sheet.category}
          caption="Fin du mouvement"
        />
      ) : null}
    </div>
  );
}

// Les morceaux de la fiche, pour les maquettes : les mêmes contenus, rangés autrement.
function sheetParts(sheet: ExerciseSheet, organizationId: string): SheetParts {
  const names = (codes: string[], dict: Record<string, { label: string }>) =>
    codes.map((code) => dict[code]?.label ?? code);
  const platform = sheet.videoUrl ? videoPlatform(sheet.videoUrl) : null;
  const favorite = (variant: "icon" | "button") => (
    <FavoriteButton
      variant={variant}
      name={sheet.nameFr}
      favorite={sheet.favorite}
      setFavorite={setExerciseFavorite.bind(null, sheet.id)}
    />
  );
  const more = sheet.mine ? (
    <>
      <Link
        href={`/coach/bibliotheque/${sheet.id}/modifier`}
        className={buttonClass({ variant: "outline" })}
      >
        <Pencil aria-hidden size={16} strokeWidth={1.8} />
        Modifier
      </Link>
      <DeleteExerciseButton
        name={sheet.nameFr}
        remove={deleteCoachExercise.bind(null, organizationId, sheet.id)}
      />
    </>
  ) : (
    <Link
      href={`/coach/bibliotheque/nouveau?variante=${sheet.key}`}
      className={buttonClass({ variant: "outline" })}
    >
      <Copy aria-hidden size={16} strokeWidth={1.8} />
      Créer ma variante
    </Link>
  );
  return {
    sheet,
    badges: (
      <span className="flex flex-wrap gap-1.5">
        {sheet.mine ? <Badge tone="moved">Mon exercice</Badge> : null}
        <Badge tone={categoryTones[sheet.category]}>{exerciseCategoryLabels[sheet.category]}</Badge>
        {sheet.hyroxStation ? <Badge tone="hyrox">Station {sheet.hyroxStation}</Badge> : null}
        {sheet.difficulty ? <Badge>{difficultyLabels[sheet.difficulty]}</Badge> : null}
        {sheet.unilateral ? <Badge>Un côté à la fois</Badge> : null}
      </span>
    ),
    actions: (
      <>
        {favorite("button")}
        {more}
      </>
    ),
    favoriteIcon: favorite("icon"),
    moreActions: more,
    video: sheet.videoUrl ? (
      <a
        href={sheet.videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass({ variant: "inverse", className: "self-start" })}
      >
        <Play aria-hidden size={16} strokeWidth={1.8} />
        {platform ? `Voir la vidéo sur ${platform}` : "Voir la vidéo"}
      </a>
    ) : null,
    instructions:
      sheet.instructions.length > 0 ? (
        <ol className="flex flex-col gap-2.5">
          {sheet.instructions.map((step, index) => (
            <li key={index} className="flex gap-3 text-[15px] leading-[1.5]">
              <span
                aria-hidden
                className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-chip text-[12px] font-semibold tabular"
              >
                {index + 1}
              </span>
              <span className="min-w-0">{step}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-[14px] text-muted">
          Consignes à venir : elles seront écrites puis validées par un coach.
        </p>
      ),
    facts: [
      {
        label: "Muscles principaux",
        items: sheet.primaryMuscles.length ? names(sheet.primaryMuscles, muscleInfo) : ["À venir"],
      },
      ...(sheet.secondaryMuscles.length
        ? [{ label: "Muscles secondaires", items: names(sheet.secondaryMuscles, muscleInfo) }]
        : []),
      {
        label: "Matériel",
        items: sheet.equipment.length ? names(sheet.equipment, equipmentInfo) : ["Poids du corps"],
      },
      ...(sheet.variantOf
        ? [
            {
              label: "Variante de",
              items: [
                <Link
                  key="variant"
                  href={`/coach/bibliotheque/${sheet.variantOf.key}`}
                  className="underline underline-offset-2 hover:text-accent-text"
                >
                  {sheet.variantOf.nameFr}
                </Link>,
              ],
            },
          ]
        : []),
    ],
    credits: (
      <p className="text-[13px] leading-[1.5] text-muted">
        {sheet.attributionRequired ? (
          <>
            Données de l&apos;exercice :{" "}
            <a
              href="https://repdb.co"
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="underline underline-offset-2 hover:text-text"
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
    ),
  };
}

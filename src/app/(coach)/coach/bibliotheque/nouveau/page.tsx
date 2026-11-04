import type { Metadata } from "next";
import { Suspense } from "react";

import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { muscleGroupsOf } from "@/domain/exercises/library";
import { equipmentInfo } from "@/domain/exercises/vocabulary";
import { requireCoach } from "@/features/auth/guards";
import { createCoachExercise } from "@/features/exercises/coach-actions";
import { getExerciseSheet } from "@/features/exercises/queries";

import { ExerciseForm } from "../exercise-form";

export const metadata: Metadata = {
  title: "Créer un exercice",
};

// « Créer un exercice » (D-76). ?variante=<clé ou identifiant> : « Créer ma variante » depuis une
// fiche ; le formulaire reprend sa rubrique, ses groupes musculaires et son matériel, pas ses
// consignes ni son image (le coach écrit les siennes).
export default function NewExercisePage({
  searchParams,
}: PageProps<"/coach/bibliotheque/nouveau">) {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
        {searchParams.then((query) => (
          <NewExercise variant={typeof query.variante === "string" ? query.variante : ""} />
        ))}
      </Suspense>
    </main>
  );
}

async function NewExercise({ variant }: { variant: string }) {
  const { user, memberships } = await requireCoach();
  const organizationId = memberships[0].organizationId;
  const origin =
    variant && /^[0-9a-z-]{1,80}$/.test(variant) ? await getExerciseSheet(variant, user.id) : null;
  const equipment = origin?.equipment.find((code) => Object.hasOwn(equipmentInfo, code)) ?? "";

  return (
    <>
      <PageHeader
        back={
          origin
            ? { href: `/coach/bibliotheque/${origin.key}`, label: origin.nameFr }
            : { href: "/coach/bibliotheque", label: "Bibliothèque" }
        }
        title={origin ? "Créer ma variante" : "Créer un exercice"}
      />
      {/* Le formulaire porte ses cartes (aperçu et champs, kit « Coory Pages » 08 / 11, D-121). */}
      <PageBody>
        <ExerciseForm
          mode="create"
          action={createCoachExercise.bind(null, organizationId)}
          cancelHref={origin ? `/coach/bibliotheque/${origin.key}` : "/coach/bibliotheque"}
          variantOf={
            origin
              ? { id: origin.id, nameFr: origin.nameFr, href: `/coach/bibliotheque/${origin.key}` }
              : null
          }
          initial={{
            name: origin ? `${origin.nameFr} (ma variante)`.slice(0, 80) : "",
            category: origin?.category ?? "strength",
            muscleGroups: origin ? muscleGroupsOf(origin.primaryMuscles) : [],
            equipment,
            instructions: "",
            videoUrl: "",
          }}
        />
      </PageBody>
    </>
  );
}

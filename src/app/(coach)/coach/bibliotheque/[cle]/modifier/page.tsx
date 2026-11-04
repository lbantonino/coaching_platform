import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { requireCoach } from "@/features/auth/guards";
import { deleteCoachExercise, updateCoachExercise } from "@/features/exercises/coach-actions";
import { getCoachExercise } from "@/features/exercises/queries";

import { ExerciseForm } from "../../exercise-form";
import { DeleteExerciseButton } from "../delete-exercise-button";

export const metadata: Metadata = {
  title: "Modifier l'exercice",
};

// Modifier un exercice de l'organisation (D-76), redessiné d'après le kit « Coory Pages », page 11
// (D-121). Un exercice du catalogue commun n'a pas cette page : le coach en fait une variante.
// En-tête : « ← nom de l'exercice » (sa fiche, l'écran précédent) puis « Modifier l'exercice ».
// Supprimer, toujours après confirmation : lien rouge dans l'aperçu (ordinateur), corbeille à droite
// du titre (téléphone) ; il reste aussi sur la fiche.
export default function EditExercisePage({
  params,
}: PageProps<"/coach/bibliotheque/[cle]/modifier">) {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
        {params.then(({ cle }) => (
          <EditExercise exerciseId={cle} />
        ))}
      </Suspense>
    </main>
  );
}

async function EditExercise({ exerciseId }: { exerciseId: string }) {
  const { memberships } = await requireCoach();
  const organizationId = memberships[0].organizationId;
  const exercise = await getCoachExercise(exerciseId);
  if (!exercise) notFound();
  const href = `/coach/bibliotheque/${exercise.id}`;
  const remove = deleteCoachExercise.bind(null, organizationId, exercise.id);
  return (
    <>
      <PageHeader
        back={{ href, label: exercise.nameFr }}
        title="Modifier l'exercice"
        titleAside={
          <span className="ml-auto flex lg:hidden">
            <DeleteExerciseButton name={exercise.nameFr} remove={remove} variant="icon" />
          </span>
        }
      />
      <PageBody>
        <ExerciseForm
          mode="edit"
          action={updateCoachExercise.bind(null, organizationId, exercise.id)}
          cancelHref={href}
          currentPhoto={exercise.photo}
          deletion={{ name: exercise.nameFr, remove }}
          initial={{
            name: exercise.nameFr,
            category: exercise.category,
            muscleGroups: exercise.muscleGroups,
            equipment: exercise.equipment,
            instructions: exercise.instructions,
            videoUrl: exercise.videoUrl,
          }}
        />
      </PageBody>
    </>
  );
}

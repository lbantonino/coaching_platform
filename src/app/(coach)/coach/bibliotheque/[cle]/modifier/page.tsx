import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { requireCoach } from "@/features/auth/guards";
import { updateCoachExercise } from "@/features/exercises/coach-actions";
import { getCoachExercise } from "@/features/exercises/queries";

import { ExerciseForm } from "../../exercise-form";

export const metadata: Metadata = {
  title: "Modifier l'exercice",
};

// Modifier un exercice de l'organisation (D-76). Un exercice du catalogue commun n'a pas cette page :
// le coach en fait une variante.
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
  const exercise = await getCoachExercise(exerciseId);
  if (!exercise) notFound();
  const href = `/coach/bibliotheque/${exercise.id}`;
  return (
    <>
      <PageHeader back={{ href, label: exercise.nameFr }} title="Modifier l'exercice" />
      <PageBody>
        <Card className="lg:max-w-[760px]">
          <ExerciseForm
            mode="edit"
            action={updateCoachExercise.bind(null, memberships[0].organizationId, exercise.id)}
            cancelHref={href}
            currentPhoto={exercise.photo}
            initial={{
              name: exercise.nameFr,
              category: exercise.category,
              muscleGroups: exercise.muscleGroups,
              equipment: exercise.equipment,
              instructions: exercise.instructions,
              videoUrl: exercise.videoUrl,
            }}
          />
        </Card>
      </PageBody>
    </>
  );
}

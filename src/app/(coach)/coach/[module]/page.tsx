import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ModulePage } from "@/components/layout/module-page";
import { COACH_MODULES, type CoachModule } from "@/components/layout/modules";
import { PageLoading, pageMainClass } from "@/components/layout/page-header";
import { requireCoach } from "@/features/auth/guards";

// Modules de l'espace coach pas encore construits (D-32) : /coach/programmes…
// Les pages construites (profil, sportifs, agenda) ont leur propre dossier et passent avant.
// Modules qui ont maintenant leur propre page (D-35) : leur dossier passe avant celui-ci.
const BUILT = new Set([
  "assistant",
  "taches",
  "messages",
  "comptabilite",
  "notifications",
  "documents",
  "bibliotheque",
  // Programmes (C-19) : /coach/programmes renvoie vers la page de l'organisation.
  "programmes",
]);

// Depuis Programmes (D-157), tous les modules ont leur page : plus rien à générer à la construction
// (Next refuse une liste vide avec Cache Components). La route reste dynamique : un module encore à
// construire s'afficherait ici, une adresse inconnue répond « Page introuvable ».
function find(slug: string) {
  if (BUILT.has(slug)) return null;
  return Object.hasOwn(COACH_MODULES, slug) ? COACH_MODULES[slug as CoachModule] : null;
}

export async function generateMetadata({
  params,
}: PageProps<"/coach/[module]">): Promise<Metadata> {
  const { module: slug } = await params;
  return { title: find(slug)?.label ?? "Page introuvable" };
}

export default function CoachModulePage({ params }: PageProps<"/coach/[module]">) {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
        {params.then(({ module: slug }) => (
          <Module slug={slug} />
        ))}
      </Suspense>
    </main>
  );
}

async function Module({ slug }: { slug: string }) {
  await requireCoach();
  const info = find(slug);
  if (!info) notFound();
  return <ModulePage info={info} />;
}

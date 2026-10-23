import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ModulePage } from "@/components/layout/module-page";
import { COACH_MODULES, type CoachModule } from "@/components/layout/modules";
import { PageLoading, pageMainClass } from "@/components/layout/page-header";
import { requireCoach } from "@/features/auth/guards";

// Modules de l'espace coach pas encore construits (D-32) : /coach/programmes, /coach/facturation…
// Les pages construites (profil, sportifs, agenda) ont leur propre dossier et passent avant.
export function generateStaticParams() {
  return Object.keys(COACH_MODULES).map((module) => ({ module }));
}

function find(slug: string) {
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

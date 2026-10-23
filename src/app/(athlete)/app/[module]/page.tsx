import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ModulePage } from "@/components/layout/module-page";
import { ATHLETE_MODULES, type AthleteModule } from "@/components/layout/modules";
import { PageLoading, pageMainClass } from "@/components/layout/page-header";
import { LogoutButton } from "@/components/ui/logout-button";
import { requireAthleteAccount } from "@/features/auth/guards";

// Modules de l'espace sportif pas encore construits (D-32) : /app/programme, /app/progression…
export function generateStaticParams() {
  return Object.keys(ATHLETE_MODULES).map((module) => ({ module }));
}

function find(slug: string) {
  return Object.hasOwn(ATHLETE_MODULES, slug) ? ATHLETE_MODULES[slug as AthleteModule] : null;
}

export async function generateMetadata({ params }: PageProps<"/app/[module]">): Promise<Metadata> {
  const { module: slug } = await params;
  return { title: find(slug)?.label ?? "Page introuvable" };
}

export default function AthleteModulePage({ params }: PageProps<"/app/[module]">) {
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
  await requireAthleteAccount();
  const info = find(slug);
  if (!info) notFound();
  // Le profil porte la déconnexion : sur téléphone, c'est là qu'elle se trouve (prototype).
  return (
    <ModulePage
      info={info}
      extra={
        slug === "profil" ? (
          <LogoutButton className="lg:hidden [&>button]:h-[54px] [&>button]:w-full" />
        ) : null
      }
    />
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ModulePage } from "@/components/layout/module-page";
import { ADMIN_MODULES, type AdminModule } from "@/components/layout/modules";
import { PageLoading, pageMainClass } from "@/components/layout/page-header";
import { requirePlatformAdmin } from "@/features/auth/guards";

// Outils d'administration pas encore construits (D-32) : /admin/organisations, /admin/audit…
export function generateStaticParams() {
  return Object.keys(ADMIN_MODULES).map((module) => ({ module }));
}

function find(slug: string) {
  return Object.hasOwn(ADMIN_MODULES, slug) ? ADMIN_MODULES[slug as AdminModule] : null;
}

export async function generateMetadata({
  params,
}: PageProps<"/admin/[module]">): Promise<Metadata> {
  const { module: slug } = await params;
  return { title: find(slug)?.label ?? "Page introuvable" };
}

export default function AdminModulePage({ params }: PageProps<"/admin/[module]">) {
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
  await requirePlatformAdmin();
  const info = find(slug);
  if (!info) notFound();
  return <ModulePage info={info} />;
}

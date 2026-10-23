import type { Metadata } from "next";
import { Suspense } from "react";

import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { requirePlatformAdmin } from "@/features/auth/guards";

export const metadata: Metadata = {
  title: "Administration",
};

export default function AdminHomePage() {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading label="Vérification de tes droits…" />}>
        <AdminSession />
      </Suspense>
    </main>
  );
}

async function AdminSession() {
  const user = await requirePlatformAdmin();

  return (
    <>
      <PageHeader
        title="Administration"
        subtitle={`Connecté en tant que ${user.email ?? "admin"}`}
      />
      <PageBody>
        <p role="status" className="max-w-2xl rounded-card border border-line bg-surface p-4">
          Aucun outil d&apos;administration n&apos;est encore disponible. La gestion des
          organisations arrivera dans une phase ultérieure. Ce rôle ne donne aucun accès aux données
          des coachs et de leurs sportifs.
        </p>
      </PageBody>
    </>
  );
}

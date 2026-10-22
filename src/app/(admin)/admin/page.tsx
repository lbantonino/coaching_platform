import type { Metadata } from "next";
import { Suspense } from "react";

import { LogoutButton } from "@/components/ui/logout-button";
import { requirePlatformAdmin } from "@/features/auth/guards";

export const metadata: Metadata = {
  title: "Administration",
};

export default function AdminHomePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-10">
      <h1 className="font-display text-h2 font-medium">Administration de la plateforme</h1>
      <Suspense fallback={<p className="text-muted">Vérification de tes droits…</p>}>
        <AdminSession />
      </Suspense>
    </main>
  );
}

async function AdminSession() {
  const user = await requirePlatformAdmin();

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted">
        Connecté en tant que <span className="font-medium text-current">{user.email}</span>
      </p>
      <p role="status" className="rounded-card border border-line bg-surface p-4">
        Aucun outil d&apos;administration n&apos;est encore disponible. La gestion des organisations
        arrivera dans une phase ultérieure. Ce rôle ne donne aucun accès aux données des coachs et
        de leurs sportifs.
      </p>
      <LogoutButton />
    </div>
  );
}

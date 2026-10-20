import type { Metadata } from "next";
import { Suspense } from "react";

import { LogoutButton } from "@/components/ui/logout-button";
import { requireAthlete } from "@/features/auth/guards";

export const metadata: Metadata = {
  title: "Mon espace sportif | Coaching Platform",
};

export default function AthleteHomePage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Mon espace sportif</h1>
      <Suspense fallback={<p className="text-zinc-500">Chargement de ton espace…</p>}>
        <AthleteSession />
      </Suspense>
    </main>
  );
}

// Espace sportif volontairement minimal et honnête : les programmes arrivent en P5/P6.
async function AthleteSession() {
  const { user, links } = await requireAthlete();
  const coaches = links.map((link) => link.organizationName).join(", ");

  return (
    <div className="flex flex-col gap-6">
      <p className="text-zinc-600 dark:text-zinc-400">
        Connecté en tant que <span className="font-medium text-current">{user.email}</span>
      </p>
      <p role="status" className="rounded-lg border border-zinc-300 p-4 dark:border-zinc-700">
        Ton coach ({coaches}) t&apos;a ajouté. Ton programme apparaîtra ici dès qu&apos;il sera
        publié.
      </p>
      <LogoutButton />
    </div>
  );
}

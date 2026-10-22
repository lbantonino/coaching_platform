import type { Metadata } from "next";
import { Suspense } from "react";

import { LogoutButton } from "@/components/ui/logout-button";
import { requireAthlete } from "@/features/auth/guards";

export const metadata: Metadata = {
  title: "Mon espace sportif",
};

export default function AthleteHomePage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-5 py-10">
      <h1 className="text-h2 font-medium">Mon espace sportif</h1>
      <Suspense fallback={<p className="text-muted">Chargement de ton espace…</p>}>
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
      <p className="text-muted">
        Connecté en tant que <span className="font-medium text-current">{user.email}</span>
      </p>
      <p role="status" className="rounded-card border border-line bg-surface p-4">
        Ton coach ({coaches}) t&apos;a ajouté. Ton programme apparaîtra ici dès qu&apos;il sera
        publié.
      </p>
      <LogoutButton />
    </div>
  );
}

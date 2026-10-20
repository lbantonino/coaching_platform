import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { LogoutButton } from "@/components/ui/logout-button";
import { requireCoach } from "@/features/auth/guards";

export const metadata: Metadata = {
  title: "Espace coach | Coaching Platform",
};

const roleLabels = { owner: "Propriétaire", coach: "Coach" } as const;

export default function CoachHomePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Espace coach</h1>
      {/* La session se lit à la requête : avec Cache Components, elle doit être derrière Suspense. */}
      <Suspense fallback={<p className="text-zinc-500">Chargement de ton espace…</p>}>
        <CoachSession />
      </Suspense>
    </main>
  );
}

async function CoachSession() {
  // Garde-fou serveur : connecté ET membre actif d'une organisation, sinon redirection.
  const { user, memberships } = await requireCoach();

  return (
    <div className="flex flex-col gap-6">
      <p className="text-zinc-600 dark:text-zinc-400">
        Connecté en tant que <span className="font-medium text-current">{user.email}</span>
      </p>

      <section aria-labelledby="orgs-title" className="flex flex-col gap-3">
        <h2 id="orgs-title" className="text-lg font-medium">
          {memberships.length > 1 ? "Tes organisations" : "Ton organisation"}
        </h2>
        <ul className="flex flex-col gap-2">
          {memberships.map((membership) => (
            <li key={membership.organizationId}>
              <Link
                href={`/coach/o/${membership.organizationId}/sportifs`}
                className="flex items-center justify-between gap-4 rounded-lg border border-zinc-300 p-4 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                <span className="flex flex-col">
                  <span className="font-medium">{membership.organizationName}</span>
                  <span className="text-sm text-zinc-500">Voir les sportifs →</span>
                </span>
                <span className="text-sm text-zinc-500">{roleLabels[membership.role]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <LogoutButton />
    </div>
  );
}

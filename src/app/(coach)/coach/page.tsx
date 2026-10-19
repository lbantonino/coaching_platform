import type { Metadata } from "next";
import { Suspense } from "react";

import { logout } from "@/features/auth/actions";
import { getCoachMemberships, requireUser } from "@/features/auth/session";

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
  // Vérification serveur, indépendante du proxy (qui n'est qu'une redirection optimiste).
  const user = await requireUser();
  const memberships = await getCoachMemberships(user.id);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-zinc-600 dark:text-zinc-400">
        Connecté en tant que <span className="font-medium text-current">{user.email}</span>
      </p>

      {memberships.length === 0 ? (
        <p role="status" className="rounded-lg border border-zinc-300 p-4 dark:border-zinc-700">
          Ce compte n&apos;est rattaché à aucune organisation coach.
        </p>
      ) : (
        <section aria-labelledby="orgs-title" className="flex flex-col gap-3">
          <h2 id="orgs-title" className="text-lg font-medium">
            {memberships.length > 1 ? "Tes organisations" : "Ton organisation"}
          </h2>
          <ul className="flex flex-col gap-2">
            {memberships.map((membership) => (
              <li
                key={membership.organizationId}
                className="flex items-center justify-between gap-4 rounded-lg border border-zinc-300 p-4 dark:border-zinc-700"
              >
                <span className="font-medium">{membership.organizationName}</span>
                <span className="text-sm text-zinc-500">{roleLabels[membership.role]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form action={logout}>
        <button
          type="submit"
          className="h-11 rounded-lg border border-zinc-300 px-4 font-medium dark:border-zinc-700"
        >
          Se déconnecter
        </button>
      </form>
    </div>
  );
}

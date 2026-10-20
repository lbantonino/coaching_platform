import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { primaryButtonClass } from "@/components/ui/form-styles";
import { listAthletes } from "@/features/athletes/queries";
import { athleteStatusLabels } from "@/features/athletes/schemas";
import { requireOrgAccess } from "@/features/auth/guards";

export const metadata: Metadata = {
  title: "Sportifs | Coaching Platform",
};

export default function AthletesPage({ params }: PageProps<"/coach/o/[orgId]/sportifs">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <Link href="/coach" className="text-sm underline">
        ← Espace coach
      </Link>
      {/* L'identifiant d'organisation vient de l'URL : donnée de requête, donc derrière Suspense. */}
      <Suspense fallback={<p className="text-zinc-500">Chargement des sportifs…</p>}>
        {params.then(({ orgId }) => (
          <AthleteList orgId={orgId} />
        ))}
      </Suspense>
    </main>
  );
}

async function AthleteList({ orgId }: { orgId: string }) {
  // L'ID de l'URL est vérifié : un ID d'une autre organisation mène à « Accès refusé ».
  const { membership } = await requireOrgAccess(orgId);
  const athletes = await listAthletes(membership.organizationId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">{membership.organizationName}</p>
          <h1 className="text-2xl font-semibold tracking-tight">Sportifs</h1>
        </div>
        <Link
          href={`/coach/o/${membership.organizationId}/sportifs/nouveau`}
          className={`${primaryButtonClass} inline-flex items-center px-5`}
        >
          Ajouter un sportif
        </Link>
      </div>

      {athletes.length === 0 ? (
        <p role="status" className="rounded-lg border border-zinc-300 p-4 dark:border-zinc-700">
          Aucun sportif pour l&apos;instant. Ajoute ton premier sportif pour pouvoir lui créer un
          programme.
        </p>
      ) : (
        <ul className="flex flex-col gap-2" aria-label="Liste des sportifs">
          {athletes.map((athlete) => (
            <li
              key={athlete.id}
              className="flex flex-col gap-1 rounded-lg border border-zinc-300 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-700"
            >
              <div className="flex flex-col">
                <span className="font-medium">{athlete.displayName}</span>
                {athlete.email ? (
                  <span className="text-sm text-zinc-500">{athlete.email}</span>
                ) : null}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-zinc-500">
                  {athleteStatusLabels[athlete.status]}
                  {athlete.hasAccount
                    ? " · compte activé"
                    : athlete.hasPendingInvite
                      ? " · invitation en attente"
                      : " · sans compte"}
                </span>
                {athlete.hasAccount ? null : (
                  <Link
                    href={`/coach/o/${membership.organizationId}/sportifs/${athlete.id}/inviter`}
                    className="font-medium underline"
                    aria-label={`Inviter ${athlete.displayName}`}
                  >
                    Inviter
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

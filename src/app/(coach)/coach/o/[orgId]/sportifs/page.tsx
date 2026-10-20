import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { listAthletes, type AthleteListItem } from "@/features/athletes/queries";
import { athleteStatusLabels } from "@/features/athletes/schemas";
import { requireOrgAccess } from "@/features/auth/guards";

export const metadata: Metadata = {
  title: "Sportifs",
};

export default function AthletesPage({ params }: PageProps<"/coach/o/[orgId]/sportifs">) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
      {/* L'identifiant d'organisation vient de l'URL : donnée de requête, donc derrière Suspense. */}
      <Suspense fallback={<p className="text-muted">Chargement des sportifs…</p>}>
        {params.then(({ orgId }) => (
          <AthleteList orgId={orgId} />
        ))}
      </Suspense>
    </main>
  );
}

function accessBadge(athlete: AthleteListItem): { tone: BadgeTone; label: string } {
  if (athlete.hasAccount) return { tone: "ok", label: "Compte activé" };
  if (athlete.hasPendingInvite) return { tone: "warn", label: "Invitation en attente" };
  return { tone: "neutral", label: "Sans compte" };
}

async function AthleteList({ orgId }: { orgId: string }) {
  // L'ID de l'URL est vérifié : un ID d'une autre organisation mène à « Accès refusé ».
  const { membership } = await requireOrgAccess(orgId);
  const athletes = await listAthletes(membership.organizationId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-small text-muted">{membership.organizationName}</p>
          <h1 className="text-h2 font-medium md:text-h1">Sportifs</h1>
        </div>
        <Link
          href={`/coach/o/${membership.organizationId}/sportifs/nouveau`}
          className={buttonClass({ variant: "primary", size: "md" })}
        >
          <Plus aria-hidden size={16} strokeWidth={2} />
          Ajouter un sportif
        </Link>
      </div>

      {athletes.length === 0 ? (
        <p
          role="status"
          className="rounded-[14px] border border-dashed border-line-2 p-6 text-muted"
        >
          Aucun sportif pour l&apos;instant. Ajoute ton premier sportif pour pouvoir lui créer un
          programme.
        </p>
      ) : (
        <ul
          className="flex flex-col overflow-hidden rounded-[14px] border border-line bg-surface"
          aria-label="Liste des sportifs"
        >
          {athletes.map((athlete) => {
            const badge = accessBadge(athlete);
            return (
              <li
                key={athlete.id}
                className="flex flex-col gap-3 border-b border-line p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{athlete.displayName}</span>
                  <span className="truncate text-small text-muted">
                    {athleteStatusLabels[athlete.status]}
                    {athlete.email ? ` · ${athlete.email}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                  {athlete.hasAccount ? null : (
                    <Link
                      href={`/coach/o/${membership.organizationId}/sportifs/${athlete.id}/inviter`}
                      className={buttonClass({ variant: "outline", size: "sm" })}
                      aria-label={`Inviter ${athlete.displayName}`}
                    >
                      Inviter
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

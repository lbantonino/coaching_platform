import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { getAthlete } from "@/features/athletes/queries";
import { athleteStatusLabels } from "@/features/athletes/schemas";
import { requireOrgAccess } from "@/features/auth/guards";
import { formatDateTime, todayIsoInBrussels } from "@/lib/format";

import { AthleteEditForm } from "./athlete-edit-form";
import { ReferencesSection } from "./references-section";

export const metadata: Metadata = {
  title: "Fiche sportif",
};

export default function AthletePage({
  params,
}: PageProps<"/coach/o/[orgId]/sportifs/[athleteId]">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 py-6 md:px-8 md:py-[22px]">
      <Suspense fallback={<p className="text-muted">Chargement de la fiche…</p>}>
        {params.then(({ orgId, athleteId }) => (
          <AthleteSection orgId={orgId} athleteId={athleteId} />
        ))}
      </Suspense>
    </main>
  );
}

const statusTone = { active: "ok", paused: "warn", archived: "neutral" } as const;

async function AthleteSection({ orgId, athleteId }: { orgId: string; athleteId: string }) {
  const { membership } = await requireOrgAccess(orgId);
  const athlete = await getAthlete(membership.organizationId, athleteId);
  // ID inconnu ou d'une autre organisation : même réponse (404), sans révéler son existence.
  if (!athlete) notFound();

  const listPath = `/coach/o/${membership.organizationId}/sportifs`;

  return (
    <div className="flex flex-col gap-8">
      <Link
        href={listPath}
        className="w-fit text-small text-muted underline underline-offset-4 hover:text-text"
      >
        ← Sportifs
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={athlete.displayName} size="lg" />
          <div className="flex min-w-0 flex-col gap-1.5">
            <h1 className="text-h2 font-medium break-words md:text-h1">{athlete.displayName}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={statusTone[athlete.status]}>{athleteStatusLabels[athlete.status]}</Badge>
              <Badge tone={athlete.hasAccount ? "ok" : "neutral"}>
                {athlete.hasAccount ? "Compte activé" : "Sans compte"}
              </Badge>
              <span className="text-caption text-muted">
                Ajouté le {formatDateTime(athlete.createdAt)}
              </span>
            </div>
          </div>
        </div>
        {athlete.hasAccount || athlete.status === "archived" ? null : (
          <Link
            href={`${listPath}/${athlete.id}/inviter`}
            className={buttonClass({ variant: "inverse", size: "md" })}
          >
            Inviter dans son espace
          </Link>
        )}
      </header>

      <section
        aria-labelledby="infos-title"
        className="flex flex-col gap-5 rounded-card border border-line bg-surface p-5 md:p-[22px]"
      >
        <h2 id="infos-title" className="text-title font-medium">
          Informations
        </h2>
        <AthleteEditForm
          organizationId={membership.organizationId}
          athlete={{
            id: athlete.id,
            displayName: athlete.displayName,
            email: athlete.email ?? "",
            phone: athlete.phone ?? "",
            status: athlete.status,
            hasAccount: athlete.hasAccount,
          }}
        />
      </section>

      <ReferencesSection
        organizationId={membership.organizationId}
        athleteId={athlete.id}
        today={todayIsoInBrussels()}
      />
    </div>
  );
}

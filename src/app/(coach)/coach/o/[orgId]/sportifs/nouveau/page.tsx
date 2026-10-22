import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { requireOrgAccess } from "@/features/auth/guards";

import { NewAthleteForm } from "./new-athlete-form";

export const metadata: Metadata = {
  title: "Nouveau sportif",
};

export default function NewAthletePage({ params }: PageProps<"/coach/o/[orgId]/sportifs/nouveau">) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-5 py-10">
      <Suspense fallback={<p className="text-muted">Chargement…</p>}>
        {params.then(({ orgId }) => (
          <NewAthleteSection orgId={orgId} />
        ))}
      </Suspense>
    </main>
  );
}

async function NewAthleteSection({ orgId }: { orgId: string }) {
  const { membership } = await requireOrgAccess(orgId);
  const listPath = `/coach/o/${membership.organizationId}/sportifs`;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={listPath}
        className="text-small text-muted underline underline-offset-4 hover:text-text"
      >
        ← Retour aux sportifs
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-small text-muted">{membership.organizationName}</p>
        <h1 className="font-display text-h2 font-medium">Nouveau sportif</h1>
        <p className="text-small text-muted">
          Seul le nom est obligatoire. L&apos;e-mail servira plus tard à l&apos;inviter dans son
          espace sportif.
        </p>
      </div>
      <NewAthleteForm organizationId={membership.organizationId} />
    </div>
  );
}

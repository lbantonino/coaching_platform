import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { requireOrgAccess } from "@/features/auth/guards";

import { NewAthleteForm } from "./new-athlete-form";

export const metadata: Metadata = {
  title: "Nouveau sportif | Coaching Platform",
};

export default function NewAthletePage({ params }: PageProps<"/coach/o/[orgId]/sportifs/nouveau">) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-10">
      <Suspense fallback={<p className="text-zinc-500">Chargement…</p>}>
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
      <Link href={listPath} className="text-sm underline">
        ← Retour aux sportifs
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-sm text-zinc-500">{membership.organizationName}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Nouveau sportif</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Seul le nom est obligatoire. L&apos;e-mail servira plus tard à l&apos;inviter dans son
          espace sportif.
        </p>
      </div>
      <NewAthleteForm organizationId={membership.organizationId} />
    </div>
  );
}

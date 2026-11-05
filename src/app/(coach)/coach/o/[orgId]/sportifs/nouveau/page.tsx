import type { Metadata } from "next";
import { Suspense } from "react";

import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { requireOrgAccess } from "@/features/auth/guards";

import { NewAthleteForm } from "./new-athlete-form";

export const metadata: Metadata = {
  title: "Nouveau sportif",
};

export default function NewAthletePage({ params }: PageProps<"/coach/o/[orgId]/sportifs/nouveau">) {
  return (
    <main className={pageMainClass}>
      <Suspense fallback={<PageLoading />}>
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
    <>
      <PageHeader
        title="Nouveau sportif"
        back={{ href: listPath, label: "Sportifs" }}
        subtitle="Seul le prénom est obligatoire. Tout se modifie ensuite depuis sa fiche."
      />
      <PageBody>
        <NewAthleteForm organizationId={membership.organizationId} cancelHref={listPath} />
      </PageBody>
    </>
  );
}

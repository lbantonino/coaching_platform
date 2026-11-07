"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";

import { ErrorState } from "@/components/blocks/error-state";
import { PageBody, PageHeader, pageMainClass } from "@/components/layout/page-header";

// 500 dans l'espace coach (maquette « Coory Erreurs », D-147) : une page qui plante s'affiche DANS la
// coquille. On ne montre JAMAIS le détail technique (il peut contenir des informations sensibles),
// seulement la référence de l'erreur. « Réessayer » relit la page sur le serveur puis la réaffiche.
export default function CoachError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  return (
    <main className={pageMainClass}>
      <PageHeader title="Erreur" quiet />
      <PageBody grow>
        <ErrorState
          variant="server-error"
          digest={error.digest}
          onRetry={() =>
            startTransition(() => {
              router.refresh();
              reset();
            })
          }
        />
      </PageBody>
    </main>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";

import { StandaloneError } from "@/components/blocks/error-state";

// Erreur hors de la coquille (maquette « Coory Erreurs », D-147) : page publique, ou coquille de
// l'espace qui a elle-même planté. On n'affiche JAMAIS le détail technique (il peut contenir des
// informations sensibles) : seulement la référence de l'erreur et une sortie claire.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  return (
    <StandaloneError
      variant="server-error"
      digest={error.digest}
      onRetry={() =>
        startTransition(() => {
          router.refresh();
          reset();
        })
      }
    />
  );
}

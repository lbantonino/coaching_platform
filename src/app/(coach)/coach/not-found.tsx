import type { Metadata } from "next";

import { ErrorState } from "@/components/blocks/error-state";
import { PageBody, PageHeader, pageMainClass } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Page introuvable",
};

// 404 dans l'espace coach (maquette « Coory Erreurs », D-147) : un lien mort vers un exercice, un
// sportif, une séance ou une page inconnue s'affiche DANS la coquille (menu sans page active, en-tête
// « Erreur »). La carte remplit la place jusqu'au bas du menu.
export default function CoachNotFound() {
  return (
    <main className={pageMainClass}>
      <PageHeader title="Erreur" quiet />
      <PageBody grow>
        <ErrorState variant="not-found" />
      </PageBody>
    </main>
  );
}

import { Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import {
  PageBody,
  PageHeader,
  PageLoading,
  pageMainClass,
  phoneScreenMainClass,
} from "@/components/layout/page-header";
import { requireCoach } from "@/features/auth/guards";

import { AssistantView } from "./assistant-view";

export const metadata: Metadata = {
  title: "Assistant IA",
};

// Page complète de l'Assistant IA, kit « Coory Pages », page 02 (D-132 ; décision 15) : l'historique
// à gauche, la conversation à droite (la même que celle de la boîte, « Plein écran »). Sans
// fournisseur d'IA branché, l'assistant le dit (components/blocks/assistant.tsx).
// La page a la hauteur de l'écran (comme l'Agenda, 27/11, demande d'Antonino) : la barre latérale, la
// barre du haut et la colonne « Nouvelle conversation » restent en place, SEULE la conversation défile
// (sinon le fil s'allongeait et c'était toute la page qui défilait).
export default function AssistantPage() {
  return (
    <main className={`${pageMainClass} ${phoneScreenMainClass} lg:h-dvh lg:flex-none`}>
      <Suspense fallback={<PageLoading />}>
        <Assistant />
      </Suspense>
    </main>
  );
}

async function Assistant() {
  await requireCoach();
  return (
    <>
      <PageHeader title="Assistant IA" icon={Sparkles} />
      {/* Téléphone : la page occupe l'écran sous la barre, la saisie reste en bas (comme Messages). */}
      <PageBody fill screen>
        <AssistantView />
      </PageBody>
    </>
  );
}

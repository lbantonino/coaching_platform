import { Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { requireCoach } from "@/features/auth/guards";

import { AssistantView } from "./assistant-view";

export const metadata: Metadata = {
  title: "Assistant IA",
};

// Page complète de l'Assistant IA, kit « Coory Pages », page 02 (D-132 ; décision 15) : l'historique
// à gauche, la conversation à droite (la même que celle de la boîte, « Plein écran »). Sans
// fournisseur d'IA branché, l'assistant le dit (components/blocks/assistant.tsx).
export default function AssistantPage() {
  return (
    <main className={pageMainClass}>
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

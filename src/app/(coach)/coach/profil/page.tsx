import type { Metadata } from "next";
import { Suspense } from "react";

import type { SettingsSection } from "@/components/blocks/settings-context";
import { PageBody, PageHeader, PageLoading, pageMainClass } from "@/components/layout/page-header";
import { requireCoach } from "@/features/auth/guards";
import { getSettingsData } from "@/features/coach/settings-data";

import { SECTIONS } from "./sections";
import { SettingsPanel } from "./settings-panel";

export const metadata: Metadata = {
  title: "Paramètres",
};

// Page complète des Paramètres : par un lien partagé ou au rechargement (?onglet=). Depuis le menu
// du compte, la même chose s'ouvre en grande fenêtre par-dessus la page en cours (D-58).
export default function CoachSettingsPage({ searchParams }: PageProps<"/coach/profil">) {
  return (
    <main className={pageMainClass}>
      <PageHeader title="Paramètres" subtitle="Ton compte, tes préférences et tes structures." />
      <PageBody>
        <Suspense fallback={<PageLoading />}>
          {searchParams.then((query) => (
            <Settings section={SECTIONS.find((item) => item.key === query.onglet)?.key ?? null} />
          ))}
        </Suspense>
      </PageBody>
    </main>
  );
}

async function Settings({ section }: { section: SettingsSection | null }) {
  const { user, memberships } = await requireCoach();
  const data = await getSettingsData(user, memberships[0]);
  return <SettingsPanel data={data} section={section} />;
}

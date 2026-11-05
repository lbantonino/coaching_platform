import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { PageLoading } from "@/components/layout/page-header";

import { SECTIONS } from "./sections";

export const metadata: Metadata = {
  title: "Paramètres",
};

// Plus de page Paramètres (décision 5 d'Antonino, kit « Coory Pages », page 13, D-127) : un lien
// /coach/profil?onglet=… (partagé, ancien favori) ouvre la FENÊTRE des Paramètres par-dessus le
// tableau de bord, à la bonne rubrique (?parametres=…, lu par SettingsDialogProvider). L'export
// /coach/profil/export reste une adresse à part.
export default function CoachSettingsPage({ searchParams }: PageProps<"/coach/profil">) {
  return (
    <Suspense fallback={<PageLoading />}>
      {searchParams.then(({ onglet }) => {
        const section = SECTIONS.find((item) => item.key === onglet)?.key ?? "profil";
        redirect(`/coach?parametres=${section}`);
      })}
    </Suspense>
  );
}

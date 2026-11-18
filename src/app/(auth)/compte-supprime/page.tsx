import { CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EntryIcon, entryPrimaryClass, EntryTitle } from "@/components/layout/entry-ui";

export const metadata: Metadata = {
  title: "Compte supprimé",
  robots: { index: false },
};

// Après « Supprimer mon compte » (décisions d'Antonino du 18/11/2026) : le coach est déconnecté et
// atterrit ici ; page publique (aucune donnée, aucune session), sans e-mail envoyé.
export default function AccountDeletedPage() {
  return (
    <div className="flex flex-col gap-[22px]">
      <EntryIcon icon={CircleCheck} tone="ok" />
      <EntryTitle sub="Ton organisation, tes sportifs et tous tes fichiers ont été effacés. Cet appareil n'est plus connecté. Merci d'avoir utilisé Coory.">
        Ton compte a été supprimé
      </EntryTitle>
      <Link href="/" className={entryPrimaryClass}>
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}

import { ShieldX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import {
  EntryIcon,
  entryPrimaryClass,
  entrySecondaryClass,
  EntryTitle,
  InfoCard,
} from "@/components/layout/entry-ui";
import { initials } from "@/components/ui/avatar";
import { logout } from "@/features/auth/actions";
import { getHomePath } from "@/features/auth/guards";
import { getCurrentUser } from "@/features/auth/session";

export const metadata: Metadata = {
  title: "Accès refusé",
  robots: { index: false },
};

const spaceLabels: Record<string, string> = {
  "/coach": "Espace coach",
  "/app": "Espace sportif",
  "/admin": "Administration",
  "/bienvenue": "Inscription à terminer",
};

// Même page pour « espace interdit » et « ressource inexistante ou d'une autre organisation » :
// ne jamais révéler l'existence d'une donnée à laquelle on n'a pas droit (prompt §7.1).
export default function AccessDeniedPage() {
  return (
    <div className="flex flex-col gap-[22px]">
      <EntryIcon icon={ShieldX} />
      <p className="font-mono text-[12px] font-medium tracking-[0.06em] text-muted">ERREUR 403</p>
      <EntryTitle sub="Cette page appartient à un autre espace ou ton compte n'a pas les droits nécessaires.">
        Accès refusé
      </EntryTitle>
      <Suspense fallback={null}>
        <AccountActions />
      </Suspense>
    </div>
  );
}

async function AccountActions() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Link href="/login" className={entryPrimaryClass}>
        Se connecter
      </Link>
    );
  }
  const home = await getHomePath(user.id);
  const space = spaceLabels[home];
  return (
    <>
      <InfoCard>
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-chip text-[13px] font-semibold"
          >
            {initials(user.email ?? "?")}
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-[15px] font-semibold">Ton compte : {user.email}</span>
            {space ? <span className="text-[13px] text-muted">{space}</span> : null}
          </span>
        </div>
      </InfoCard>
      {/* Un compte sans espace (coach sans organisation) n'a pas d'espace où retourner. */}
      {space ? (
        <Link href={home} className={entryPrimaryClass}>
          Retour à mon espace
        </Link>
      ) : null}
      <form action={logout}>
        <button type="submit" className={entrySecondaryClass}>
          Changer de compte
        </button>
      </form>
    </>
  );
}

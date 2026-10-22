import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { StatCard } from "@/components/ui/card";
import { listAthletes } from "@/features/athletes/queries";
import { requireCoach } from "@/features/auth/guards";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

const roleLabels = { owner: "Propriétaire", coach: "Coach" } as const;

export default function CoachHomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-5 py-6 md:px-8 md:py-[22px]">
      <h1 className="text-h2 font-medium md:text-h1">Tableau de bord</h1>
      {/* La session se lit à la requête : avec Cache Components, elle doit être derrière Suspense. */}
      <Suspense fallback={<p className="text-muted">Chargement de ton espace…</p>}>
        <Dashboard />
      </Suspense>
    </main>
  );
}

async function Dashboard() {
  // Garde-fou serveur : connecté ET membre actif d'une organisation, sinon redirection.
  const { user, memberships } = await requireCoach();
  const current = memberships[0];
  const athletes = await listAthletes(current.organizationId);

  // Chiffres RÉELS, calculés depuis la base (aucune statistique inventée).
  const active = athletes.filter((a) => a.status === "active").length;
  const withAccount = athletes.filter((a) => a.hasAccount).length;
  const pending = athletes.filter((a) => a.hasPendingInvite).length;

  return (
    <div className="flex flex-col gap-8">
      <p className="-mt-6 text-muted">Connecté en tant que {user.email}</p>

      <section aria-label="Chiffres clés" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          hero
          className="col-span-2 sm:col-span-1"
          label="Sportifs actifs"
          value={active}
          hint={current.organizationName}
        />
        <StatCard
          label="Comptes activés"
          value={withAccount}
          hint="Sportifs ayant rejoint leur espace"
        />
        <StatCard
          label="Invitations en attente"
          value={pending}
          hint="Liens valides non utilisés"
        />
      </section>

      <section aria-labelledby="orgs-title" className="flex flex-col gap-3">
        <h2 id="orgs-title" className="text-title font-medium">
          {memberships.length > 1 ? "Tes organisations" : "Ton organisation"}
        </h2>
        <ul className="flex flex-col gap-2">
          {memberships.map((membership) => (
            <li key={membership.organizationId}>
              <Link
                href={`/coach/o/${membership.organizationId}/sportifs`}
                className="flex items-center justify-between gap-4 rounded-card border border-line bg-surface p-4 transition-colors hover:bg-surface-2"
              >
                <span className="flex flex-col">
                  <span className="font-medium">{membership.organizationName}</span>
                  <span className="text-small text-muted">
                    {roleLabels[membership.role]} · Voir les sportifs
                  </span>
                </span>
                <ChevronRight aria-hidden size={17} strokeWidth={1.7} className="text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

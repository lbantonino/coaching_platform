import { MailOpen, UserCheck, Users } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { StatCard } from "@/components/ui/card";
import { listAthletes } from "@/features/athletes/queries";
import { requireCoach } from "@/features/auth/guards";
import { listSessions } from "@/features/sessions/queries";
import { todayIsoInBrussels } from "@/lib/format";

import { CoachingWeek } from "./coaching-week";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

export default function CoachHomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-5 py-6 md:px-8 md:py-[22px]">
      <h1 className="font-display text-h2 font-medium md:text-h1">Tableau de bord</h1>
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
  const [athletes, sessions] = await Promise.all([
    listAthletes(current.organizationId),
    listSessions(current.organizationId),
  ]);

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
          icon={Users}
          value={active}
          hint={current.organizationName}
        />
        <StatCard
          label="Comptes activés"
          icon={UserCheck}
          tone="green"
          value={withAccount}
          hint="Sportifs ayant rejoint leur espace"
        />
        <StatCard
          label="Invitations en attente"
          icon={MailOpen}
          tone="amber"
          value={pending}
          hint="Liens valides non utilisés"
        />
      </section>

      <CoachingWeek
        sessions={sessions}
        today={todayIsoInBrussels()}
        agendaHref={`/coach/o/${current.organizationId}/agenda`}
      />
    </div>
  );
}

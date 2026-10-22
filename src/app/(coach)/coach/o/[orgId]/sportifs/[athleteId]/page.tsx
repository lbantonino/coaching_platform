import { ArrowLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { PageTabs } from "@/components/ui/page-tabs";
import { getAthlete } from "@/features/athletes/queries";
import { requireOrgAccess } from "@/features/auth/guards";
import { listGoals } from "@/features/goals/queries";
import { listReferences } from "@/features/references/queries";
import { todayIsoInBrussels } from "@/lib/format";

import { AthleteEditForm } from "./athlete-edit-form";
import { AthleteHeader, KeyFigures } from "./athlete-header";
import { AvailabilitySection } from "./availability-section";
import { GoalsSection } from "./goals-section";
import { AthleteOverview } from "./overview";
import { ReferencesSection } from "./references-section";

export const metadata: Metadata = {
  title: "Fiche sportif",
};

// Onglets de la fiche (P2-04). L'onglet est dans l'adresse (?onglet=…) ; une valeur inconnue
// retombe sur la vue d'ensemble. L'historique arrive avec l'étape suivante (notes et historique).
const TABS = [
  { key: "vue", label: "Vue d'ensemble" },
  { key: "profil", label: "Profil" },
  { key: "objectifs", label: "Objectifs" },
  { key: "disponibilites", label: "Disponibilités" },
  { key: "reperes", label: "Repères" },
] as const;
type TabKey = (typeof TABS)[number]["key"];
const tabSchema = z.enum(TABS.map((tab) => tab.key) as [TabKey, ...TabKey[]]).catch("vue");

export default function AthletePage({
  params,
  searchParams,
}: PageProps<"/coach/o/[orgId]/sportifs/[athleteId]">) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-6 md:px-8 md:py-[22px]">
      <Suspense fallback={<p className="text-muted">Chargement de la fiche…</p>}>
        {Promise.all([params, searchParams]).then(([{ orgId, athleteId }, query]) => (
          <AthleteSection orgId={orgId} athleteId={athleteId} tab={tabSchema.parse(query.onglet)} />
        ))}
      </Suspense>
    </main>
  );
}

async function AthleteSection({
  orgId,
  athleteId,
  tab,
}: {
  orgId: string;
  athleteId: string;
  tab: TabKey;
}) {
  const { membership } = await requireOrgAccess(orgId);
  const athlete = await getAthlete(membership.organizationId, athleteId);
  // ID inconnu ou d'une autre organisation : même réponse (404), sans révéler son existence.
  if (!athlete) notFound();

  const organizationId = membership.organizationId;
  const listPath = `/coach/o/${organizationId}/sportifs`;
  const basePath = `${listPath}/${athlete.id}`;
  const today = todayIsoInBrussels();
  const { current: goals } = await listGoals(organizationId, athlete.id);

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-small text-muted">
        <Link href={listPath} className="inline-flex items-center gap-2 rounded-sm hover:text-text">
          <ArrowLeft aria-hidden size={15} strokeWidth={1.7} />
          Sportifs
        </Link>
        <ChevronRight aria-hidden size={14} strokeWidth={1.7} />
        <span aria-current="page" className="truncate text-text">
          {athlete.displayName}
        </span>
      </nav>

      <AthleteHeader athlete={athlete} invitePath={`${basePath}/inviter`} />
      <KeyFigures athlete={athlete} goals={goals} today={today} basePath={basePath} />

      <PageTabs
        label="Sections de la fiche"
        items={TABS.map((item) => ({
          href: item.key === "vue" ? basePath : `${basePath}?onglet=${item.key}`,
          label: item.label,
          active: item.key === tab,
        }))}
      />

      {tab === "vue" ? (
        <AthleteOverview
          athlete={athlete}
          goals={goals}
          references={(await listReferences(organizationId, athlete.id)).current}
          today={today}
          basePath={basePath}
        />
      ) : (
        // Les onglets de saisie gardent une largeur de lecture confortable.
        <div className="flex w-full max-w-3xl flex-col gap-6">
          {tab === "profil" ? (
            <section
              aria-labelledby="infos-title"
              className="flex flex-col gap-5 rounded-card border border-line bg-surface p-5 md:p-[22px]"
            >
              <h2 id="infos-title" className="text-title font-medium">
                Informations
              </h2>
              <AthleteEditForm
                organizationId={organizationId}
                athleteId={athlete.id}
                hasAccount={athlete.hasAccount}
                values={{
                  firstName: athlete.firstName,
                  lastName: athlete.lastName ?? "",
                  email: athlete.email ?? "",
                  phone: athlete.phone ?? "",
                  status: athlete.status,
                  preferredContact: athlete.preferredContact ?? "",
                  level: athlete.level ?? "",
                  experience: athlete.experience ?? "",
                  trainingPlaces: athlete.trainingPlaces,
                  equipment: athlete.equipment ?? "",
                }}
              />
            </section>
          ) : null}
          {tab === "objectifs" ? (
            <GoalsSection organizationId={organizationId} athleteId={athlete.id} today={today} />
          ) : null}
          {tab === "disponibilites" ? (
            <AvailabilitySection organizationId={organizationId} athlete={athlete} />
          ) : null}
          {tab === "reperes" ? (
            <ReferencesSection
              organizationId={organizationId}
              athleteId={athlete.id}
              today={today}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PageBody, PageHeader, pageMainClass } from "@/components/layout/page-header";
import { buttonClass } from "@/components/ui/button";
import { LogoutButton } from "@/components/ui/logout-button";
import { SkeletonLines } from "@/components/ui/skeleton";
import { ThemeChoice } from "@/components/ui/theme-choice";
import { requireCoach } from "@/features/auth/guards";
import { getCoachProfile } from "@/features/coach/profile";
import { removeCoachPhoto, uploadCoachPhoto } from "@/features/photos/actions";

import { PhotoForm } from "../photo-form";
import { CoachNameForm } from "./coach-name-form";

export const metadata: Metadata = {
  title: "Paramètres",
};

export default function CoachProfilePage() {
  return (
    <main className={pageMainClass}>
      <PageHeader
        title="Paramètres"
        subtitle="Ton profil de coach, le thème de l'app et ton compte."
      />
      <PageBody>
        <div className="flex w-full max-w-2xl flex-col gap-6">
          <Suspense fallback={<SkeletonLines />}>
            <Profile />
          </Suspense>
        </div>
      </PageBody>
    </main>
  );
}

async function Profile() {
  const { user, memberships } = await requireCoach();
  const profile = await getCoachProfile(user);
  return (
    <>
      <section
        aria-labelledby="coach-photo-title"
        className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 md:p-[22px]"
      >
        <h2 id="coach-photo-title" className="text-title font-medium">
          Photo
        </h2>
        <PhotoForm
          name={profile.displayName}
          photoPath={profile.photoPath}
          upload={uploadCoachPhoto}
          remove={removeCoachPhoto}
        />
      </section>
      <section
        aria-labelledby="coach-name-title"
        className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 md:p-[22px]"
      >
        <h2 id="coach-name-title" className="text-title font-medium">
          Identité
        </h2>
        <CoachNameForm
          firstName={profile.firstName ?? ""}
          lastName={profile.lastName ?? ""}
          companyName={profile.companyName ?? ""}
        />
      </section>
      {/* D-38 : le thème quitte la barre du menu pour les Paramètres (Clair, Sombre, Système). */}
      <section
        id="theme"
        aria-labelledby="coach-theme-title"
        className="flex scroll-mt-6 flex-col gap-4 rounded-card border border-line bg-surface p-5 md:p-[22px]"
      >
        <div className="flex flex-col gap-1">
          <h2 id="coach-theme-title" className="text-title font-medium">
            Thème
          </h2>
          <p className="text-caption text-muted">
            « Système » suit le réglage de ton téléphone ou de ton ordinateur. Retenu sur cet
            appareil.
          </p>
        </div>
        <div className="max-w-md">
          <ThemeChoice />
        </div>
      </section>
      <section
        id="compte"
        aria-labelledby="coach-account-title"
        className="flex scroll-mt-6 flex-col gap-4 rounded-card border border-line bg-surface p-5 md:p-[22px]"
      >
        <h2 id="coach-account-title" className="text-title font-medium">
          Compte
        </h2>
        <dl className="flex flex-col gap-2 text-[15px]">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <dt className="text-muted sm:w-40">Adresse e-mail</dt>
            <dd className="break-all">{user.email}</dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <dt className="text-muted sm:w-40">Organisation</dt>
            <dd>{memberships[0]?.organizationName}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/mot-de-passe-oublie" className={buttonClass({ variant: "outline" })}>
            Changer mon mot de passe
          </Link>
          <LogoutButton />
        </div>
      </section>
    </>
  );
}

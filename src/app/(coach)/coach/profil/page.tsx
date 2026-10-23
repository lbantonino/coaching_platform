import type { Metadata } from "next";
import { Suspense } from "react";

import { PageBody, PageHeader, pageMainClass } from "@/components/layout/page-header";
import { SkeletonLines } from "@/components/ui/skeleton";
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
        subtitle="Ton profil de coach : photo, identité et entreprise."
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
        <p className="text-caption text-muted">
          Connecté avec {user.email} · {memberships[0]?.organizationName}
        </p>
      </section>
    </>
  );
}

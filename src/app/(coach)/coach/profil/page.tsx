import type { Metadata } from "next";
import { Suspense } from "react";

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
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-6 md:px-8 md:py-[22px]">
      <h1 className="font-display text-h2 font-medium md:text-h1">Paramètres</h1>
      <p className="-mt-3 text-muted">Ton profil de coach : photo, identité et entreprise.</p>
      <Suspense fallback={<p className="text-muted">Chargement…</p>}>
        <Profile />
      </Suspense>
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

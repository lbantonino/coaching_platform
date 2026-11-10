import { redirect } from "next/navigation";

import { requireCoach } from "@/features/auth/guards";

// « Créer → Programme » (menu Créer, fiche d'un sportif) : l'assistant de l'organisation du coach,
// avec le sportif déjà choisi s'il est dans l'adresse (?sportif=<id>).
export default async function NewProgramRedirect({
  searchParams,
}: PageProps<"/coach/programmes/nouveau">) {
  const { memberships } = await requireCoach();
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") query.set(key, value);
  }
  const suffix = query.toString();
  redirect(
    `/coach/o/${memberships[0]?.organizationId}/programmes/nouveau${suffix ? `?${suffix}` : ""}`,
  );
}

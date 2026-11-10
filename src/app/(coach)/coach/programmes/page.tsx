import { redirect } from "next/navigation";

import { requireCoach } from "@/features/auth/guards";

// Ancienne adresse du module (D-32) : la page Programmes vit maintenant dans l'organisation du coach,
// comme les Sportifs et l'Agenda (C-19, 09/11/2026). On y renvoie, filtres compris.
export default async function ProgrammesRedirect({ searchParams }: PageProps<"/coach/programmes">) {
  const { memberships } = await requireCoach();
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") query.set(key, value);
  }
  const suffix = query.toString();
  redirect(`/coach/o/${memberships[0]?.organizationId}/programmes${suffix ? `?${suffix}` : ""}`);
}

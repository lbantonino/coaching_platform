import { Suspense } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getAthleteLinks, getCurrentUser } from "@/features/auth/session";
import { createClient } from "@/lib/supabase/server";

// Coquille de l'espace sportif (prompt Claude Design §5.3) : barre latérale sur ordinateur, barre du
// bas à 5 onglets sur téléphone. Ce n'est PAS une protection : chaque page appelle requireAthlete…
export default function AthleteLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <AthleteShell>{children}</AthleteShell>
    </Suspense>
  );
}

async function AthleteShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const link = user ? (await getAthleteLinks(user.id))[0] : undefined;
  let name = link?.displayName ?? null;
  if (user && !name) {
    // Sportif inscrit seul (D-30), pas encore rattaché : le nom saisi à l'inscription.
    const supabase = await createClient();
    const { data } = await supabase
      .from("account_signups")
      .select("first_name, last_name")
      .eq("user_id", user.id)
      .maybeSingle();
    name = data ? `${data.first_name} ${data.last_name}` : (user.email?.split("@")[0] ?? null);
  }
  const sex = link?.sex === "female" || link?.sex === "male" ? link.sex : null;
  const title = sex === "female" ? "Sportive" : "Sportif";
  return (
    <AppShell
      value={{
        space: "athlete",
        orgBase: null,
        user: name
          ? {
              name,
              role: link ? `${title} · ${link.organizationName}` : title,
              photoPath: link?.photoPath ?? null,
              sex,
              settingsHref: "/app/profil",
            }
          : null,
      }}
    >
      {children}
    </AppShell>
  );
}

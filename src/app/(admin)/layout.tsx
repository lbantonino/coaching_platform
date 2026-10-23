import { Suspense } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/features/auth/session";

// Coquille de l'administration (prompt Claude Design §5.2, menu admin). Ce n'est PAS une protection :
// chaque page appelle requirePlatformAdmin.
export default function AdminLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <AppShell
      value={{
        space: "admin",
        orgBase: null,
        user: user
          ? {
              name: user.email?.split("@")[0] ?? "Administration",
              role: "Admin plateforme",
              photoPath: null,
              sex: null,
              settingsHref: null,
            }
          : null,
      }}
    >
      {children}
    </AppShell>
  );
}

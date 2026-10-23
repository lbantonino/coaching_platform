"use client";

import { usePathname } from "next/navigation";

// Sur-titre du panneau de marque (prompt Claude Design §5.1) : INVITATION sur l'invitation ;
// ESPACE COACH / ESPACE SPORTIF à l'inscription et sur « Bienvenue », selon le type de compte coché
// dans le formulaire (sans JavaScript : sélecteur :has()) ; PLATEFORME DE COACHING ailleurs.
const eyebrowClass =
  "font-mono text-[12px] font-medium tracking-[0.08em] text-accent-text uppercase";

// Repli pendant que l'adresse se lit (Cache Components : usePathname derrière Suspense).
export function DefaultEyebrow() {
  return <p className={eyebrowClass}>Plateforme de coaching</p>;
}

export function EntryEyebrow() {
  const pathname = usePathname();
  if (pathname.startsWith("/invitation")) return <p className={eyebrowClass}>Invitation</p>;
  if (pathname === "/inscription" || pathname === "/bienvenue") {
    return (
      <p className={eyebrowClass}>
        <span className="group-has-[[value=athlete]:checked]/auth:hidden">Espace coach</span>
        <span className="hidden group-has-[[value=athlete]:checked]/auth:inline">
          Espace sportif
        </span>
      </p>
    );
  }
  return <DefaultEyebrow />;
}

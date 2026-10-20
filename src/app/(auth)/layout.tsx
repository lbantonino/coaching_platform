import Link from "next/link";

import { Logo } from "@/components/ui/logo";

// Pages d'accès (connexion, mot de passe, invitation, refus) : colonne centrée, logo en tête.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="px-4 py-5 sm:px-8">
        <Link href="/" aria-label="Accueil" className="inline-flex rounded-[9px]">
          <Logo />
        </Link>
      </header>
      {children}
    </div>
  );
}

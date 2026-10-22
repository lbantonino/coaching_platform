import Link from "next/link";

import { CooryLogo } from "@/components/ui/coory-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// Pages d'accès (connexion, mot de passe, invitation, refus) : colonne centrée, logo en tête.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" aria-label="Accueil" className="inline-flex rounded-sm">
          <CooryLogo size={24} />
        </Link>
        <ThemeToggle />
      </header>
      {children}
    </div>
  );
}

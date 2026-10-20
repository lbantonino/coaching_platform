import Link from "next/link";

import { buttonClass } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { BRAND } from "@/config/brand";

// Accueil public minimal. Pas d'inscription libre avant P8 : seul l'accès « Se connecter » est proposé.
export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="px-4 py-5 sm:px-8">
        <Logo />
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-4 pb-24">
        <h1 className="text-h1 font-medium sm:text-display">
          Programmer, publier et suivre tes sportifs.
        </h1>
        <p className="max-w-lg text-title text-muted">{BRAND.tagline}</p>
        <Link
          href="/login"
          className={buttonClass({ variant: "primary", size: "lg", className: "w-fit" })}
        >
          Se connecter
        </Link>
      </main>
    </div>
  );
}

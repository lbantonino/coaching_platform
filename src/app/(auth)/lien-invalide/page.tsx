import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Lien invalide",
  robots: { index: false },
};

export default function InvalidLinkPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-start gap-6 px-4 pt-6 pb-16 sm:justify-center sm:py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-h2 font-medium">Lien invalide ou expiré</h1>
        <p className="text-muted">
          Ce lien a déjà été utilisé, a expiré, ou a été ouvert dans un autre navigateur que celui
          de la demande. Demande un nouveau lien.
        </p>
      </div>
      <Link
        href="/mot-de-passe-oublie"
        className="font-medium text-text underline underline-offset-4"
      >
        Demander un nouveau lien
      </Link>
    </main>
  );
}

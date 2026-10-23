import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Lien invalide",
  robots: { index: false },
};

export default function InvalidLinkPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-h2 font-medium">Lien invalide ou expiré</h1>
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
    </div>
  );
}

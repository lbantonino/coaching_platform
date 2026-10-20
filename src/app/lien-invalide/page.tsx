import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Lien invalide | Coaching Platform",
  robots: { index: false },
};

export default function InvalidLinkPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Lien invalide ou expiré</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Ce lien a déjà été utilisé, a expiré, ou a été ouvert dans un autre navigateur que celui
          de la demande. Demande un nouveau lien.
        </p>
      </div>
      <Link href="/mot-de-passe-oublie" className="font-medium underline">
        Demander un nouveau lien
      </Link>
    </main>
  );
}

import { Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { requireCoach } from "@/features/auth/guards";

import { COMING_SOON, type ComingSoonSlug } from "../../../coming-soon";

export const metadata: Metadata = {
  title: "Bientôt",
};

export function generateStaticParams() {
  return Object.keys(COMING_SOON).map((module) => ({ module }));
}

// Page d'un module prévu (D-28) : dit honnêtement ce qui arrive et quand, sans écran factice.
export default function ComingSoonPage({ params }: PageProps<"/coach/bientot/[module]">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-10 md:px-8">
      <Suspense fallback={<p className="text-muted">Chargement…</p>}>
        {params.then(({ module }) => (
          <ComingSoon slug={module} />
        ))}
      </Suspense>
    </main>
  );
}

async function ComingSoon({ slug }: { slug: string }) {
  await requireCoach();
  if (!(slug in COMING_SOON)) notFound();
  const planned = COMING_SOON[slug as ComingSoonSlug];
  return (
    <section className="flex flex-col gap-5 rounded-card border border-line bg-surface p-6 md:p-8">
      <span
        aria-hidden
        className="inline-flex size-12 items-center justify-center rounded-full border border-accent/50 bg-accent-soft text-accent-text"
      >
        <Clock size={22} strokeWidth={1.7} />
      </span>
      <div className="flex flex-col gap-2">
        <Badge tone="neutral">Bientôt · {planned.phase}</Badge>
        <h1 className="font-display text-h2 font-medium">{planned.label}</h1>
        <p className="text-muted">{planned.summary}</p>
      </div>
      <p className="text-small text-muted">
        Ce module n&apos;est pas encore construit : il arrive dans l&apos;ordre de la roadmap. Rien
        n&apos;est simulé en attendant.
      </p>
      <Link
        href="/coach"
        className={buttonClass({ variant: "outline", size: "md", className: "w-fit" })}
      >
        Retour au tableau de bord
      </Link>
    </section>
  );
}

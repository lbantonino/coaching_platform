import { ThemedCooryLogo } from "@/components/brand/themed-logo";

// Repli de chargement de la coquille (recette du 19/11/2026) : juste après la connexion, l'espace coach
// restait un fond uni le temps que la coquille lise la session. Il en dessine maintenant la silhouette,
// aux mêmes places que la vraie (menu de 236 px sur ordinateur, barre du haut sur téléphone, en-tête,
// cartes) : rien ne saute quand la page arrive. Composant serveur, sans données ; la pulsation suit le
// squelette de l'app (skeleton.tsx) et s'arrête avec « réduire les animations » (globals.css).
const NAV_WIDTHS = ["62%", "48%", "54%", "66%", "70%", "58%"];

function Bone({ className }: { className: string }) {
  return <span className={`block animate-pulse-soft rounded-[6px] bg-surface-2 ${className}`} />;
}

export function ShellSkeleton() {
  return (
    <div data-shell-skeleton="" role="status" className="flex min-h-dvh flex-1">
      <span className="sr-only">Chargement de ton espace…</span>
      {/* Ordinateur : le cadre du menu, avec le logo. */}
      <div
        aria-hidden
        className="sticky top-3.5 my-3.5 ml-3.5 hidden h-[calc(100dvh-28px)] w-[236px] shrink-0 flex-col rounded-[20px] bg-panel px-3.5 pt-6 pb-4 inset-ring inset-ring-line lg:flex"
      >
        <div className="flex h-[55px] items-center px-2.5 pt-1 pb-6">
          <ThemedCooryLogo height={18.5} />
        </div>
        <div className="flex flex-col gap-1">
          {NAV_WIDTHS.map((width, index) => (
            <div key={index} className="flex h-9 items-center gap-2.5 px-2.5">
              <Bone className="size-4 shrink-0" />
              <span style={{ width }} className="block">
                <Bone className="h-3" />
              </span>
            </div>
          ))}
        </div>
        <div className="mt-auto flex items-center gap-2.5 px-1.5">
          <span className="size-8 shrink-0 animate-pulse-soft rounded-full bg-surface-2" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Bone className="h-3 w-3/4" />
            <Bone className="h-2.5 w-1/3" />
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className="flex min-w-0 flex-1 flex-col max-lg:pt-[env(safe-area-inset-top)]"
      >
        {/* Téléphone : la barre du haut (☰, nom de la page, assistant et cloche). */}
        <div className="flex h-[var(--top-bar)] items-center justify-between px-3 pt-2.5 lg:hidden">
          <span className="size-11 shrink-0 rounded-[14px] bg-panel inset-ring inset-ring-line" />
          <div className="flex min-w-0 flex-1 items-center pr-2.5 pl-3.5">
            <Bone className="h-3.5 w-28" />
          </div>
          <span className="h-12 w-[92px] shrink-0 rounded-2xl bg-panel inset-ring inset-ring-line" />
        </div>
        {/* Ordinateur : la carte d'en-tête de la page (64 px). */}
        <div className="mt-3.5 mr-3.5 ml-5 hidden h-16 items-center gap-2.5 rounded-[20px] bg-surface pr-[18px] pl-[22px] inset-ring inset-ring-line lg:flex">
          <Bone className="size-4 shrink-0" />
          <Bone className="h-3.5 w-40" />
        </div>
        {/* Le corps : les marges de PageBody, et quelques cartes. */}
        <div className="flex flex-col gap-3 px-3.5 pt-5 pb-7 lg:grid lg:grid-cols-3 lg:pt-4 lg:pr-3.5 lg:pl-5">
          <Bone className="mb-2 h-6 w-48 lg:hidden" />
          {[0, 1, 2].map((card) => (
            <div
              key={card}
              className="flex h-36 flex-col gap-3 rounded-card border border-line bg-surface p-4"
            >
              <Bone className="h-3 w-2/5" />
              <Bone className="h-5 w-3/5" />
              <Bone className="mt-auto h-3 w-4/5" />
            </div>
          ))}
          <div className="h-48 rounded-card border border-line bg-surface lg:col-span-3" />
        </div>
      </div>
    </div>
  );
}

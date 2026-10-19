// Page provisoire du socle P0 : aucune fonctionnalité métier n'est encore branchée.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-1 flex-col justify-center gap-4 px-4 py-16">
      <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase">
        Socle technique, phase P0
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">Coaching Platform</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Nom de travail provisoire. Les espaces coach, sportif et administration seront ajoutés phase
        par phase, selon la feuille de route.
      </p>
    </main>
  );
}

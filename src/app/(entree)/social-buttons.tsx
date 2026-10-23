import { signInWithProvider } from "@/features/auth/signup-actions";
import { enabledProviders, providerLabels, type OAuthProvider } from "@/features/auth/providers";

// Logos des fournisseurs (formes simplifiées, une couleur), décoratifs : le nom est écrit à côté.
const logos: Record<OAuthProvider, React.ReactNode> = {
  google: (
    <svg aria-hidden viewBox="0 0 24 24" className="size-[18px]">
      <path
        fill="currentColor"
        d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3zM12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22zm-5.6-8a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9zM12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.7 9.4 5.9 12 5.9z"
      />
    </svg>
  ),
  facebook: (
    <svg aria-hidden viewBox="0 0 24 24" className="size-[18px]">
      <path
        fill="currentColor"
        d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"
      />
    </svg>
  ),
  apple: (
    <svg aria-hidden viewBox="0 0 24 24" className="size-[18px]">
      <path
        fill="currentColor"
        d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8s2.3-1.3 3.1-2.5c1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1zM13.9 5c.7-.8 1.2-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z"
      />
    </svg>
  ),
};

// Boutons « Continuer avec … » (prompt Claude Design §7.1) : seulement les fournisseurs réellement
// configurés (AUTH_PROVIDERS). Téléphone : pleine largeur « Continuer avec Google » ; ordinateur :
// trois colonnes, le nom seul. Aucun configuré : rien n'est affiché, pas même le séparateur.
export function SocialButtons() {
  const providers = enabledProviders();
  if (providers.length === 0) return null;
  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex items-center gap-3 text-[13px] text-muted">
        <span className="h-px flex-1 bg-line" />
        ou
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="grid gap-2.5 lg:grid-cols-3">
        {providers.map((provider) => (
          <form key={provider} action={signInWithProvider.bind(null, provider)}>
            <button
              type="submit"
              aria-label={`Continuer avec ${providerLabels[provider]}`}
              className="flex h-[50px] w-full items-center justify-center gap-2.5 rounded-[13px] border border-line-2 bg-surface text-[15px] font-medium text-text transition-colors duration-150 hover:bg-surface-2"
            >
              {logos[provider]}
              <span>
                <span className="lg:hidden">Continuer avec </span>
                {providerLabels[provider]}
              </span>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}

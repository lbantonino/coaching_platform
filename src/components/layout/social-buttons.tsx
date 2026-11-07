import { signInWithProvider } from "@/features/auth/signup-actions";
import { entrySecondaryClass } from "./entry-ui";
import { enabledProviders, providerLabels, type OAuthProvider } from "@/features/auth/providers";

// Logos des fournisseurs (formes simplifiées, une couleur), décoratifs : le nom est écrit à côté.
const logos: Record<OAuthProvider, React.ReactNode> = {
  // Logo officiel multicolore (maquette du 06/11/2026) : couleurs de la marque Google, pas des jetons.
  google: (
    <svg aria-hidden viewBox="0 0 48 48" className="size-[19px] lg:size-[18px]">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
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

// Boutons « Continuer avec … » (maquette du 06/11/2026, D-139) : seulement les fournisseurs
// réellement configurés (AUTH_PROVIDERS), « Continuer avec Google » en pleine largeur. Aucun
// configuré : rien n'est affiché, pas même le séparateur « ou ».
// Espacement : 14 px autour du « ou » sur téléphone ; 18 px entre chaque élément sur ordinateur.
export function SocialButtons() {
  const providers = enabledProviders();
  if (providers.length === 0) return null;
  return (
    <div className="flex flex-col lg:gap-[18px] lg:pt-[18px]">
      <div className="flex items-center gap-3 py-3.5 text-[12.5px] font-medium text-faint lg:py-0">
        <span className="h-px flex-1 bg-line" />
        ou
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="flex flex-col gap-2.5">
        {providers.map((provider) => (
          <form key={provider} action={signInWithProvider.bind(null, provider)}>
            <button type="submit" className={entrySecondaryClass}>
              {logos[provider]}
              Continuer avec {providerLabels[provider]}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}

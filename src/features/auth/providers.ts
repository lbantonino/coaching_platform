import "server-only";

// Connexions sociales (D-30). Un fournisseur n'est proposé que s'il est déclaré dans AUTH_PROVIDERS,
// c'est-à-dire réellement configuré dans Supabase avec ses clés : jamais de bouton qui ne marche pas.
export const OAUTH_PROVIDERS = ["google", "facebook", "apple"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export const providerLabels: Record<OAuthProvider, string> = {
  google: "Google",
  facebook: "Facebook",
  apple: "Apple",
};

export function enabledProviders(): OAuthProvider[] {
  const declared = (process.env.AUTH_PROVIDERS ?? "").split(",").map((item) => item.trim());
  return OAUTH_PROVIDERS.filter((provider) => declared.includes(provider));
}

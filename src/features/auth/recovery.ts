// Lien « Mot de passe oublié » (incident du 20/11/2026) : l'e-mail porte un jeton (token_hash) qui mène
// à l'app. /auth/confirm le range dans ce cookie SANS le vérifier, et l'action « Enregistrer le mot de
// passe » le vérifie (une seule fois) au moment d'enregistrer. Ainsi le lien marche depuis n'importe quel
// appareil (pas de cookie de la demande à retrouver), et le robot d'une messagerie qui l'ouvre avant la
// personne ne le consomme pas.
export const RECOVERY_COOKIE = "coory_recovery";
// Le cookie ne part que vers la page du nouveau mot de passe (et son action).
export const RECOVERY_COOKIE_PATH = "/nouveau-mot-de-passe";
// Même durée que le lien (otp_expiry de Supabase : 1 h).
export const RECOVERY_COOKIE_MAX_AGE = 60 * 60;

// Forme d'un jeton de Supabase (empreinte hexadécimale, préfixe « pkce_ » possible) : on refuse le
// reste avant même d'appeler Supabase.
export function isTokenHash(value: string | null | undefined): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{20,128}$/.test(value);
}

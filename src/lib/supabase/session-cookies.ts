// « Se souvenir de moi » (connexion, maquette du 06/11/2026, D-139). Case cochée : les cookies de
// session Supabase gardent leur durée (400 jours, rafraîchis à chaque visite). Case décochée : ils
// deviennent des cookies de navigateur, effacés à sa fermeture. Le choix est mémorisé dans un petit
// cookie, lui-même de navigateur, lu partout où la session est écrite (actions serveur et proxy).
// Module partagé : ni « server-only » (le proxy l'importe) ni client.

export const REMEMBER_COOKIE = "coory-remember";

type CookieOptions = { maxAge?: number; expires?: Date | number | string };

// Valeur du cookie -> faut-il garder la session ? Absent (comptes déjà connectés, Google, lien
// d'e-mail) = oui, comme avant.
export function remembers(value: string | undefined): boolean {
  return value !== "0";
}

// Options d'un cookie de session : sans « Se souvenir de moi », on retire sa durée. Jamais pour un
// effacement (durée 0 ou date passée) : sans durée, il deviendrait un cookie vide au lieu de partir.
export function sessionCookieOptions<T extends CookieOptions>(options: T, remember: boolean): T {
  if (remember) return options;
  if (options.maxAge !== undefined && options.maxAge <= 0) return options;
  if (options.expires !== undefined && new Date(options.expires).getTime() <= Date.now()) {
    return options;
  }
  const rest = { ...options };
  delete rest.maxAge;
  delete rest.expires;
  return rest;
}

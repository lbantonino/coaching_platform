// Référence d'une erreur montrée au coach (D-147) : les 8 premiers caractères de l'identifiant que
// Next.js donne à une erreur du serveur (`digest`), en majuscules, par paquets de 4 (« 7F3A-21C9 »).
// Il permet de retrouver l'erreur dans les journaux sans rien montrer de technique. Sans identifiant
// (erreur dans le navigateur), pas de référence : la page la masque.
export function formatErrorRef(digest: string | undefined | null): string | null {
  const clean = (digest ?? "").replace(/[^a-z0-9]/gi, "").toUpperCase();
  if (clean.length < 8) return null;
  return `${clean.slice(0, 4)}-${clean.slice(4, 8)}`;
}

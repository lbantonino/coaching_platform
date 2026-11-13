// MVP « espace coach seul » (D-167, décision d'Antonino du 13/11/2026) : tout ce qui suppose un
// sportif connecté est masqué, mais le code reste en place pour la suite. Passer un drapeau à `true`
// rouvre la fonctionnalité (routes, menus, boutons) d'un coup.
export const FEATURES = {
  // Messagerie coach <-> sportif : page /coach/messages, boutons « Écrire », notifications.
  messages: false,
  // Invitations des sportifs : page Inviter, liens d'invitation, acceptation (/invitation/…).
  invitations: false,
  // Espace sportif (/app) et inscription « Je suis sportif ».
  athleteSpace: false,
} as const;

// Le texte de la fenêtre affichée par un bouton dont la fonctionnalité est masquée.
export const NOT_AVAILABLE_TEXT =
  "Cette fonctionnalité n'est pas encore disponible sur cette version.";

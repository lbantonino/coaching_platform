// Robustesse d'un mot de passe (prompt Claude Design §4 « Jauge de robustesse »), de 0 à 4 :
// +1 dès 10 caractères, +1 majuscules ET minuscules, +1 chiffre, +1 symbole ; plafonnée à 1 sous
// 6 caractères. Indication pour la personne qui tape : la vraie règle (10 caractères minimum) est
// vérifiée par le serveur.
export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

export const PASSWORD_MIN_LENGTH = 10;

export const STRENGTH_LABELS = ["Trop faible", "Faible", "Moyenne", "Bonne", "Excellente"] as const;

export function passwordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= PASSWORD_MIN_LENGTH) score += 1;
  if (/[a-zà-ÿ]/.test(password) && /[A-ZÀ-Ý]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^\p{L}\d]/u.test(password)) score += 1;
  if (password.length < 6) score = Math.min(score, 1);
  return score as PasswordStrength;
}

// Structures légales d'un coach (D-57) : règles PURES de saisie, testées par Vitest. Les mêmes
// formats sont vérifiés en base (supabase/migrations/*_parametres.sql).

export const LEGAL_FORMS = ["independent", "asbl", "srl", "sa", "other"] as const;
export type LegalForm = (typeof LEGAL_FORMS)[number];
export const legalFormLabels: Record<LegalForm, string> = {
  independent: "Indépendant (personne physique)",
  asbl: "ASBL",
  srl: "SRL",
  sa: "SA",
  other: "Autre",
};

export const VAT_STATUSES = ["subject", "franchise", "not_subject"] as const;
export type VatStatus = (typeof VAT_STATUSES)[number];
export const vatStatusLabels: Record<VatStatus, string> = {
  subject: "Assujetti à la TVA",
  franchise: "Franchise de TVA (petite entreprise)",
  not_subject: "Non assujetti",
};

// Numéro d'entreprise belge (BCE) : 10 chiffres, les 2 derniers = 97 − (8 premiers modulo 97).
// Saisie libre (« 0123.456.749 », « BE 0123 456 749 ») -> « 0123456749 », ou null si invalide.
export function normalizeEnterpriseNumber(raw: string): string | null {
  let digits = raw.replace(/[\s.\-]/g, "").toUpperCase();
  if (digits.startsWith("BE")) digits = digits.slice(2);
  // Ancien format à 9 chiffres : on ajoute le 0 de tête.
  if (/^[0-9]{9}$/.test(digits)) digits = `0${digits}`;
  if (!/^[01][0-9]{9}$/.test(digits)) return null;
  const base = Number(digits.slice(0, 8));
  const check = Number(digits.slice(8));
  return 97 - (base % 97) === check ? digits : null;
}

// « 0123456749 » -> « 0123.456.749 » (affichage).
export function formatEnterpriseNumber(digits: string): string {
  return `${digits.slice(0, 4)}.${digits.slice(4, 7)}.${digits.slice(7)}`;
}

// En Belgique, le numéro de TVA est le numéro d'entreprise précédé de « BE ».
export function vatNumberFor(enterpriseNumber: string): string {
  return `BE${enterpriseNumber}`;
}

// IBAN : lettres et chiffres sans espaces, clé de contrôle ISO 13616 (modulo 97 = 1). Belge : 16
// caractères. -> « BE68539007547034 », ou null si invalide.
export function normalizeIban(raw: string): string | null {
  const iban = raw.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$/.test(iban)) return null;
  if (iban.startsWith("BE") && iban.length !== 16) return null;
  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`;
  let remainder = 0;
  for (const char of rearranged) {
    const value = /[A-Z]/.test(char) ? String(char.charCodeAt(0) - 55) : char;
    for (const digit of value) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1 ? iban : null;
}

// « BE68539007547034 » -> « BE68 5390 0754 7034 » (affichage).
export function formatIban(iban: string): string {
  return iban.replace(/(.{4})/g, "$1 ").trim();
}

// BIC : 8 ou 11 caractères (« GEBABEBB », « GKCCBEBB »).
export function normalizeBic(raw: string): string | null {
  const bic = raw.replace(/\s/g, "").toUpperCase();
  return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic) ? bic : null;
}

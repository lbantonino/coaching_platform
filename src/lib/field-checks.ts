import { z } from "zod";

import { parseEuros } from "@/domain/billing/payments";

// Contrôles d'un champ au moment où on le quitte (audit apple-design du 28/10 : valider au fil de la
// saisie, pas seulement à l'envoi). Règles PURES, mêmes messages que le serveur, qui revérifie tout.
// Un champ vide n'est jamais en erreur ici : « obligatoire » reste vérifié à l'envoi.
export type FieldRule = "email" | "phone" | "future-date" | "euros";

const PHONE = /^\+?[0-9 ().-]{6,24}$/;

export function checkField(rule: FieldRule, raw: string, today: string): string | null {
  const value = raw.trim();
  if (value === "") return null;
  switch (rule) {
    case "email":
      return z.email().safeParse(value).success ? null : "Adresse e-mail invalide.";
    case "phone":
      return PHONE.test(value)
        ? null
        : "Numéro de téléphone invalide (format international conseillé : +32 …).";
    case "future-date":
      return value < today ? "Cette date est déjà passée." : null;
    case "euros":
      return parseEuros(value) === null
        ? "Montant invalide : écris par exemple 65 ou 65,50."
        : null;
  }
}

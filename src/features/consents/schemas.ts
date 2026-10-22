import { z } from "zod";

// Consentement aux données de santé (P2-02 partie 3, D-20). Aligné sur supabase/migrations/*_disponibilites_consentement.sql.

// Comment le coach a obtenu l'accord explicite du sportif, quand c'est lui qui le note.
export const COACH_PROOFS = ["oral", "written", "signed_form"] as const;
export type CoachProof = (typeof COACH_PROOFS)[number];
export const coachProofLabels: Record<CoachProof, string> = {
  oral: "Oral (en séance, au téléphone)",
  written: "Par écrit (message, e-mail)",
  signed_form: "Formulaire signé",
};
export const coachProofSchema = z.enum(COACH_PROOFS, {
  error: "Indique comment le sportif a donné son accord.",
});

export type ConsentAction = "granted" | "withdrawn";
export type ConsentSource = "athlete" | "coach";

// Phrase du journal : « Accord donné par le sportif depuis son espace », « Accord retiré, noté par le coach »…
export function consentEventLabel(
  action: ConsentAction,
  source: ConsentSource,
  proof: CoachProof | null,
): string {
  const what = action === "granted" ? "Accord donné" : "Accord retiré";
  if (source === "athlete") return `${what} par le sportif depuis son espace`;
  return proof
    ? `${what}, noté par le coach (${coachProofLabels[proof].toLowerCase()})`
    : `${what}, noté par le coach`;
}

// Codes d'erreur renvoyés par les fonctions SQL grant_health_consent / withdraw_health_consent.
export function consentErrorMessage(code: string | undefined): string {
  if (code === "preuve_invalide") return "Indique comment le sportif a donné son accord.";
  if (code === "acces_refuse") return "Action non autorisée.";
  return "L'accord n'a pas pu être enregistré. Réessaie.";
}

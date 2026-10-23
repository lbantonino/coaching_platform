import type { z } from "zod";

// Premier message d'erreur de chaque champ (le formulaire l'affiche sous le champ concerné).
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "");
    if (field && !(field in errors)) errors[field] = issue.message;
  }
  return errors;
}

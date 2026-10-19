import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "Adresse e-mail invalide." }).max(254),
  password: z.string().min(1, { error: "Mot de passe requis." }).max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;

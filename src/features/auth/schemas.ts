import { z } from "zod";

// Aligné sur minimum_password_length (supabase/config.toml) : 10 caractères.
export const PASSWORD_MIN_LENGTH = 10;

const emailField = z.email({ error: "Adresse e-mail invalide." }).max(254);

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, { error: "Mot de passe requis." }).max(128),
});

export const passwordResetRequestSchema = z.object({
  email: emailField,
});

export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, {
        error: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`,
      })
      .max(128, { error: "Le mot de passe est trop long (128 caractères maximum)." }),
    confirmation: z.string(),
  })
  .refine((values) => values.password === values.confirmation, {
    error: "Les deux mots de passe ne correspondent pas.",
    path: ["confirmation"],
  });

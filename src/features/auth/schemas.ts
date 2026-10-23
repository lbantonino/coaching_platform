import { z } from "zod";

// Aligné sur minimum_password_length (supabase/config.toml) : 10 caractères.
export const PASSWORD_MIN_LENGTH = 10;

// Messages du prototype Claude Design (§7.1) : vide → « Indique… », mal formé → « ne semble pas valide ».
export const emailField = z
  .email({
    error: (issue) =>
      issue.input ? "Cette adresse e-mail ne semble pas valide." : "Indique ton adresse e-mail.",
  })
  .max(254);

// Nouveau mot de passe (inscription, invitation, réinitialisation). Vide ou trop court : un seul
// message à la fois (le premier problème trouvé).
export const newPasswordField = z
  .string()
  .min(1, { error: "Choisis un mot de passe." })
  .min(PASSWORD_MIN_LENGTH, { error: `Au moins ${PASSWORD_MIN_LENGTH} caractères, s'il te plaît.` })
  .max(128, { error: "Le mot de passe est trop long (128 caractères maximum)." });

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, { error: "Indique ton mot de passe." }).max(128),
});

export const passwordResetRequestSchema = z.object({
  email: emailField,
});

export const newPasswordSchema = z
  .object({
    password: newPasswordField,
    confirmation: z.string(),
  })
  .refine((values) => values.password === values.confirmation, {
    error: "Les deux mots de passe ne correspondent pas.",
    path: ["confirmation"],
  });

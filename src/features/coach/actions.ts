"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireCoach } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";

export type CoachNameState = { error: string | null; saved: boolean; attempt: number };

const nameSchema = z.object({
  firstName: z.string().trim().min(1, "Indique ton prénom.").max(80, "Prénom trop long."),
  lastName: z
    .string()
    .trim()
    .max(80, "Nom trop long.")
    .transform((value) => (value === "" ? null : value)),
  companyName: z
    .string()
    .trim()
    .max(120, "Nom d'entreprise trop long.")
    .transform((value) => (value === "" ? null : value)),
});

// Prénom, nom et entreprise du coach connecté (affichés dans le menu et, plus tard, sur les documents).
export async function updateCoachName(
  previous: CoachNameState,
  formData: FormData,
): Promise<CoachNameState> {
  const { user } = await requireCoach();
  const parsed = nameSchema.safeParse({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    companyName: String(formData.get("companyName") ?? ""),
  });
  const next = previous.attempt + 1;
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Nom invalide.",
      saved: false,
      attempt: next,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("coach_profiles").upsert(
    {
      user_id: user.id,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      company_name: parsed.data.companyName,
    },
    { onConflict: "user_id" },
  );
  if (error)
    return {
      error: "Le profil n'a pas pu être enregistré. Réessaie.",
      saved: false,
      attempt: next,
    };

  revalidatePath("/coach", "layout");
  return { error: null, saved: true, attempt: next };
}

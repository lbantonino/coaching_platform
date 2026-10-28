import "server-only";

import { createClient } from "@/lib/supabase/server";

export type CoachPreferences = {
  // Nouvelle séance (D-57) : valeurs proposées d'office dans la fenêtre « Nouvelle séance ».
  defaultSessionMinutes: number;
  defaultLocation: string | null;
  defaultPriceCents: number | null;
  defaultPaymentMethod: "cash" | "transfer";
  // Agenda : heures affichées au minimum (une séance plus tôt ou plus tard les élargit).
  agendaFirstHour: number;
  agendaLastHour: number;
  // Ce qui compte dans la cloche et s'affiche dans Notifications.
  notify: {
    competitions: boolean;
    messages: boolean;
    tasks: boolean;
    invoices: boolean;
    profiles: boolean;
  };
};

export type CoachProfile = {
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  phone: string | null;
  // Nom affiché : prénom et nom s'ils sont renseignés, sinon le début de l'adresse e-mail.
  displayName: string;
  photoPath: string | null;
  preferences: CoachPreferences;
};

export const DEFAULT_PREFERENCES: CoachPreferences = {
  defaultSessionMinutes: 60,
  defaultLocation: null,
  defaultPriceCents: null,
  defaultPaymentMethod: "transfer",
  agendaFirstHour: 6,
  agendaLastHour: 22,
  notify: { competitions: true, messages: true, tasks: true, invoices: true, profiles: true },
};

// Profil du coach connecté (la RLS ne laisse lire que le sien et ceux de ses collègues).
export async function getCoachProfile(user: {
  id: string;
  email: string | null;
}): Promise<CoachProfile> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("coach_profiles")
    .select(
      `first_name, last_name, company_name, phone, photo_path, default_session_minutes,
       default_location, default_price_cents, default_payment_method, agenda_first_hour,
       agenda_last_hour, notify_competitions, notify_messages, notify_tasks, notify_invoices,
       notify_profiles`,
    )
    .eq("user_id", user.id)
    .maybeSingle();
  const name = [data?.first_name, data?.last_name].filter(Boolean).join(" ");
  return {
    firstName: data?.first_name ?? null,
    lastName: data?.last_name ?? null,
    companyName: data?.company_name ?? null,
    phone: data?.phone ?? null,
    displayName: name || (user.email?.split("@")[0] ?? "Coach"),
    photoPath: data?.photo_path ?? null,
    preferences: data
      ? {
          defaultSessionMinutes: data.default_session_minutes,
          defaultLocation: data.default_location,
          defaultPriceCents: data.default_price_cents,
          // La contrainte CHECK en base garantit cette liste fermée.
          defaultPaymentMethod: data.default_payment_method as "cash" | "transfer",
          agendaFirstHour: data.agenda_first_hour,
          agendaLastHour: data.agenda_last_hour,
          notify: {
            competitions: data.notify_competitions,
            messages: data.notify_messages,
            tasks: data.notify_tasks,
            invoices: data.notify_invoices,
            profiles: data.notify_profiles,
          },
        }
      : DEFAULT_PREFERENCES,
  };
}

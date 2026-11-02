"use server";

import { revalidatePath } from "next/cache";

import { isNotificationKey } from "@/domain/notifications/keys";
import { requireOrgAccess } from "@/features/auth/guards";
import { getCoachProfile } from "@/features/coach/profile";
import { todayIsoInBrussels } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

import { buildPreview, type NotificationPreview } from "./preview";
import { getNotifications } from "./queries";

// État des notifications du coach connecté (4e, D-61) : lue, non lue, masquée, rétablie. Les clés
// viennent du navigateur : elles sont revérifiées (forme connue, nombre borné) ; la RLS limite aux
// lignes de la personne, dans son organisation.
const MAX_KEYS = 500;

function cleanKeys(keys: unknown): string[] | null {
  if (!Array.isArray(keys) || keys.length === 0 || keys.length > MAX_KEYS) return null;
  if (!keys.every(isNotificationKey)) return null;
  return [...new Set(keys)];
}

function revalidateNotifications() {
  // La cloche et le menu sont dans la coquille : toute la zone coach se recalcule.
  revalidatePath("/coach", "layout");
}

export async function setNotificationsRead(
  organizationId: string,
  keys: string[],
  read: boolean,
): Promise<{ ok: boolean }> {
  const { membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const clean = cleanKeys(keys);
  if (!clean || typeof read !== "boolean") return { ok: false };
  const supabase = await createClient();

  if (read) {
    const now = new Date().toISOString();
    const { error } = await supabase.from("coach_notification_states").upsert(
      clean.map((key) => ({ organization_id: orgId, key, read_at: now })),
      // Seules ces colonnes changent : une notification masquée le reste.
      { onConflict: "user_id,organization_id,key" },
    );
    if (error) return { ok: false };
  } else {
    // Non lue : la ligne disparaît, sauf si la notification est aussi masquée.
    const [removed, kept] = await Promise.all([
      supabase
        .from("coach_notification_states")
        .delete()
        .eq("organization_id", orgId)
        .in("key", clean)
        .is("dismissed_at", null),
      supabase
        .from("coach_notification_states")
        .update({ read_at: null })
        .eq("organization_id", orgId)
        .in("key", clean)
        .not("dismissed_at", "is", null),
    ]);
    if (removed.error || kept.error) return { ok: false };
  }
  revalidateNotifications();
  return { ok: true };
}

export async function dismissNotification(
  organizationId: string,
  key: string,
): Promise<{ ok: boolean }> {
  const { membership } = await requireOrgAccess(organizationId);
  if (!isNotificationKey(key)) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase
    .from("coach_notification_states")
    .upsert(
      { organization_id: membership.organizationId, key, dismissed_at: new Date().toISOString() },
      { onConflict: "user_id,organization_id,key" },
    );
  if (error) return { ok: false };
  revalidateNotifications();
  return { ok: true };
}

// « Annuler » après avoir masqué : la notification revient, avec son état de lecture d'avant.
export async function restoreNotification(
  organizationId: string,
  key: string,
): Promise<{ ok: boolean }> {
  const { membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  if (!isNotificationKey(key)) return { ok: false };
  const supabase = await createClient();
  const [removed, kept] = await Promise.all([
    supabase
      .from("coach_notification_states")
      .delete()
      .eq("organization_id", orgId)
      .eq("key", key)
      .is("read_at", null),
    supabase
      .from("coach_notification_states")
      .update({ dismissed_at: null })
      .eq("organization_id", orgId)
      .eq("key", key)
      .not("read_at", "is", null),
  ]);
  if (removed.error || kept.error) return { ok: false };
  revalidateNotifications();
  return { ok: true };
}

// Aperçu sous la cloche (ordinateur, 02/11) : lu à l'ouverture du popover. Lire n'est pas marquer comme
// lu : seule l'ouverture d'un élément le marque (même règle que la page Notifications).
export async function loadNotificationPreview(
  organizationId: string,
): Promise<NotificationPreview> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const today = todayIsoInBrussels();
  const [all, profile] = await Promise.all([getNotifications(orgId, today), getCoachProfile(user)]);
  return buildPreview(all, profile.preferences.notify, orgId, today);
}

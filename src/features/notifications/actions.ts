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

type StateColumn = "read_at" | "dismissed_at" | "deleted_at";

// Pose une date (lue, masquée, supprimée) sur des notifications : seule cette colonne change, les
// autres états restent (une notification masquée reste lue, etc.).
async function setState(orgId: string, keys: string[], column: StateColumn) {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const date =
    column === "read_at"
      ? { read_at: now }
      : column === "dismissed_at"
        ? { dismissed_at: now }
        : { deleted_at: now };
  const { error } = await supabase.from("coach_notification_states").upsert(
    keys.map((key) => ({ organization_id: orgId, key, ...date })),
    { onConflict: "user_id,organization_id,key" },
  );
  return !error;
}

// Retire une date. Une ligne qui n'a plus aucun état disparaît (la base n'en garde pas de vide).
async function clearState(orgId: string, keys: string[], column: StateColumn) {
  const [a, b] = (["read_at", "dismissed_at", "deleted_at"] as const).filter((c) => c !== column);
  const supabase = await createClient();
  const table = () => supabase.from("coach_notification_states");
  const cleared =
    column === "read_at"
      ? { read_at: null }
      : column === "dismissed_at"
        ? { dismissed_at: null }
        : { deleted_at: null };
  const [removed, kept] = await Promise.all([
    table().delete().eq("organization_id", orgId).in("key", keys).is(a, null).is(b, null),
    table()
      .update(cleared)
      .eq("organization_id", orgId)
      .in("key", keys)
      .or(`${a}.not.is.null,${b}.not.is.null`),
  ]);
  return !removed.error && !kept.error;
}

// Vérifie l'accès et les clés, puis applique `change` ; la coquille (cloche, menu) se recalcule.
async function changeStates(
  organizationId: string,
  keys: unknown,
  change: (orgId: string, clean: string[]) => Promise<boolean>,
): Promise<{ ok: boolean }> {
  const { membership } = await requireOrgAccess(organizationId);
  const clean = cleanKeys(keys);
  if (!clean) return { ok: false };
  if (!(await change(membership.organizationId, clean))) return { ok: false };
  revalidateNotifications();
  return { ok: true };
}

export async function setNotificationsRead(
  organizationId: string,
  keys: string[],
  read: boolean,
): Promise<{ ok: boolean }> {
  if (typeof read !== "boolean") return { ok: false };
  return changeStates(organizationId, keys, (orgId, clean) =>
    read ? setState(orgId, clean, "read_at") : clearState(orgId, clean, "read_at"),
  );
}

// Masquer : la notification passe dans l'onglet « Masquées » (réversible).
export async function dismissNotifications(
  organizationId: string,
  keys: string[],
): Promise<{ ok: boolean }> {
  return changeStates(organizationId, keys, (orgId, clean) =>
    setState(orgId, clean, "dismissed_at"),
  );
}

// « Afficher à nouveau », ou « Annuler » après avoir masqué : retour avec l'état de lecture d'avant.
export async function restoreNotifications(
  organizationId: string,
  keys: string[],
): Promise<{ ok: boolean }> {
  return changeStates(organizationId, keys, (orgId, clean) =>
    clearState(orgId, clean, "dismissed_at"),
  );
}

// Supprimer (décision 11, D-128) : plus visible nulle part, même dans « Masquées ».
export async function deleteNotifications(
  organizationId: string,
  keys: string[],
): Promise<{ ok: boolean }> {
  return changeStates(organizationId, keys, (orgId, clean) => setState(orgId, clean, "deleted_at"));
}

// « Annuler » dans les 5 secondes après une suppression.
export async function undeleteNotifications(
  organizationId: string,
  keys: string[],
): Promise<{ ok: boolean }> {
  return changeStates(organizationId, keys, (orgId, clean) =>
    clearState(orgId, clean, "deleted_at"),
  );
}

// Aperçu sous la cloche (ordinateur, 02/11) : lu à l'ouverture du popover. Lire n'est pas marquer comme
// lu : seule l'ouverture d'un élément le marque (même règle que la page Notifications).
export async function loadNotificationPreview(
  organizationId: string,
): Promise<NotificationPreview> {
  const { user, membership } = await requireOrgAccess(organizationId);
  const orgId = membership.organizationId;
  const today = todayIsoInBrussels();
  const [all, profile] = await Promise.all([
    getNotifications(orgId, today, membership.vatRate),
    getCoachProfile(user),
  ]);
  return buildPreview(all, profile.preferences.notify, orgId, today);
}

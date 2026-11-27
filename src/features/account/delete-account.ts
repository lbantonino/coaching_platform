"use server";

import { redirect } from "next/navigation";

import { getCoachMemberships, requireUser } from "@/features/auth/session";
import { isDemoAccount } from "@/features/demo/queries";
import { DEMO_DISABLED } from "@/features/demo/rules";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { CONFIRMATION_WORD } from "./rules";

// « Supprimer mon compte » (décisions d'Antonino du 18/11/2026 ; droit à l'effacement du RGPD, exigé
// aussi par Apple et Google) : tout est effacé TOUT DE SUITE, dans cet ordre :
//   1. les fichiers de l'organisation (documents, photos, images d'exercices) et les photos du coach,
//      avec SA session (la RLS du stockage le permet) : après l'étape 2, on ne saurait plus où ils sont ;
//   2. les données (fonction SQL delete_account_data, appelable par le serveur seulement) ;
//   3. le compte lui-même (voie officielle de Supabase), retenté une fois ;
//   4. la session.
// La clé du serveur (étapes 2 et 3) est vérifiée AVANT de toucher au moindre fichier. Une étape qui
// échoue s'arrête avec un message ; relancer reprend là où ça s'était arrêté : sans organisation
// (données déjà effacées), on passe directement au compte (relecture du 18/11 : le coach restait
// bloqué sur « accès refusé »). Le compte de démo partagé ne se supprime jamais, ni une organisation
// partagée avec un autre coach (ses données seraient touchées).

export type DeleteAccountState = { error: string | null; attempt: number };

const BUCKETS = ["coach-documents", "profile-photos", "exercise-images"] as const;
const SHARED_ORG =
  "Ton organisation est partagée avec un autre coach : écris-nous pour la supprimer, ses données seraient touchées.";
const FAILED = "La suppression n'a pas abouti. Réessaie ; si ça recommence, écris-nous.";

type Storage = Awaited<ReturnType<typeof createClient>>["storage"];

// Tous les fichiers sous un dossier, sous-dossiers compris (la liste de Supabase ne descend pas
// d'elle-même : un dossier y apparaît sans identifiant).
async function listFiles(storage: Storage, bucket: string, folder: string): Promise<string[]> {
  const files: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await storage.from(bucket).list(folder, { limit: 1000, offset });
    if (error) throw error;
    for (const item of data) {
      const path = `${folder}/${item.name}`;
      if (item.id) files.push(path);
      else files.push(...(await listFiles(storage, bucket, path)));
    }
    if (data.length < 1000) return files;
  }
}

async function removeFolder(storage: Storage, bucket: string, folder: string): Promise<void> {
  const files = await listFiles(storage, bucket, folder);
  for (let start = 0; start < files.length; start += 1000) {
    const { error } = await storage.from(bucket).remove(files.slice(start, start + 1000));
    if (error) throw error;
  }
}

export async function deleteMyAccount(
  previous: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const attempt = previous.attempt + 1;
  // Le mot exact, sans tolérance (casse, espaces) : même règle que le bouton de la fenêtre.
  if (formData.get("confirmation") !== CONFIRMATION_WORD) {
    return { error: `Tape ${CONFIRMATION_WORD} pour confirmer.`, attempt };
  }
  const user = await requireUser();
  if (await isDemoAccount()) return { error: DEMO_DISABLED, attempt };

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    // Clé du serveur absente (configuration) : on s'arrête avant d'effacer quoi que ce soit.
    return { error: FAILED, attempt };
  }

  const supabase = await createClient();
  try {
    const orgIds = (await getCoachMemberships(user.id, supabase)).map((m) => m.organizationId);
    if (orgIds.length > 0) {
      // Organisation partagée : refus AVANT d'effacer le moindre fichier.
      const { count, error } = await supabase
        .from("organization_members")
        .select("user_id", { count: "exact", head: true })
        .in("organization_id", orgIds)
        .neq("user_id", user.id);
      if (error) throw error;
      if ((count ?? 0) > 0) return { error: SHARED_ORG, attempt };
    }
    for (const bucket of BUCKETS) {
      for (const orgId of orgIds) await removeFolder(supabase.storage, bucket, `org/${orgId}`);
    }
    // Fichiers joints à l'Assistant IA (D-213) : <organisation>/<coach>/… (24 h au plus).
    for (const orgId of orgIds) await removeFolder(supabase.storage, "assistant-files", orgId);
    await removeFolder(supabase.storage, "profile-photos", `user/${user.id}`);
  } catch {
    return { error: FAILED, attempt };
  }

  const { error: dataError } = await admin.rpc("delete_account_data", { p_user_id: user.id });
  if (dataError) {
    if (dataError.code === "CY412") return { error: SHARED_ORG, attempt };
    if (dataError.code === "42501") return { error: DEMO_DISABLED, attempt };
    return { error: FAILED, attempt };
  }

  // Un service d'authentification qui hoquette : un second essai avant d'abandonner.
  let { error: userError } = await admin.auth.admin.deleteUser(user.id);
  if (userError) ({ error: userError } = await admin.auth.admin.deleteUser(user.id));
  if (userError) return { error: FAILED, attempt };

  // Le compte n'existe plus : la déconnexion efface surtout les cookies de ce navigateur.
  await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
  redirect("/compte-supprime");
}

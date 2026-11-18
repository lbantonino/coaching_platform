import { beforeEach, describe, expect, it, vi } from "vitest";

// « Supprimer mon compte » (relecture du 18/11/2026) : l'ordre des étapes protège le coach. Les
// services (session, stockage, base, comptes) sont simulés : on vérifie ce que l'action fait, et
// surtout ce qu'elle ne fait PAS, quand une étape manque ou a déjà eu lieu.

const calls = {
  storageList: vi.fn(),
  storageRemove: vi.fn(),
  rpc: vi.fn(),
  deleteUser: vi.fn(),
  signOut: vi.fn(),
};
let memberships: { organizationId: string }[] = [];
let adminAvailable = true;

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));
vi.mock("@/features/auth/session", () => ({
  requireUser: async () => ({ id: "user-1", email: "coach@example.test" }),
  getCoachMemberships: async () => memberships,
}));
vi.mock("@/features/demo/queries", () => ({ isDemoAccount: async () => false }));

function storage() {
  return {
    from: () => ({
      list: async (folder: string) => {
        calls.storageList(folder);
        return { data: [], error: null };
      },
      remove: async (paths: string[]) => {
        calls.storageRemove(paths);
        return { data: [], error: null };
      },
    }),
  };
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    storage: storage(),
    from: () => ({
      select: () => ({
        in: () => ({ neq: async () => ({ count: 0, error: null }) }),
      }),
    }),
    auth: { signOut: async () => calls.signOut() },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    if (!adminAvailable) throw new Error("SUPABASE_SECRET_KEY manquante");
    return {
      rpc: async (name: string, args: unknown) => {
        calls.rpc(name, args);
        return { error: null };
      },
      auth: { admin: { deleteUser: async (id: string) => calls.deleteUser(id) } },
    };
  },
}));

const { deleteMyAccount } = await import("@/features/account/delete-account");

function confirmed() {
  const form = new FormData();
  form.set("confirmation", "SUPPRIMER");
  return form;
}

beforeEach(() => {
  Object.values(calls).forEach((call) => call.mockReset());
  calls.deleteUser.mockResolvedValue({ error: null });
  memberships = [{ organizationId: "org-1" }];
  adminAvailable = true;
});

describe("deleteMyAccount", () => {
  it("sans la clé du serveur : un message, et RIEN n'est effacé (ni fichier, ni donnée)", async () => {
    adminAvailable = false;
    const result = await deleteMyAccount({ error: null, attempt: 0 }, confirmed());
    expect(result.error).toMatch(/n'a pas abouti/);
    expect(calls.storageRemove).not.toHaveBeenCalled();
    expect(calls.storageList).not.toHaveBeenCalled();
    expect(calls.rpc).not.toHaveBeenCalled();
  });

  it("nouvel essai après un échec à l'étape « compte » (plus d'organisation) : le compte part", async () => {
    memberships = [];
    await expect(deleteMyAccount({ error: null, attempt: 1 }, confirmed())).rejects.toThrow(
      "REDIRECT:/compte-supprime",
    );
    expect(calls.storageList).not.toHaveBeenCalledWith("org/org-1");
    expect(calls.storageList).toHaveBeenCalledWith("user/user-1");
    expect(calls.rpc).toHaveBeenCalledWith("delete_account_data", { p_user_id: "user-1" });
    expect(calls.deleteUser).toHaveBeenCalledWith("user-1");
  });

  it("la suppression du compte échoue une fois : l'action réessaie d'elle-même", async () => {
    calls.deleteUser
      .mockResolvedValueOnce({ error: new Error("réseau") })
      .mockResolvedValueOnce({ error: null });
    await expect(deleteMyAccount({ error: null, attempt: 0 }, confirmed())).rejects.toThrow(
      "REDIRECT:/compte-supprime",
    );
    expect(calls.deleteUser).toHaveBeenCalledTimes(2);
  });
});

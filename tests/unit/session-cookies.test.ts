import { describe, expect, it } from "vitest";

import { remembers, sessionCookieOptions } from "@/lib/supabase/session-cookies";

// « Se souvenir de moi » (D-139) : sans la case, les cookies de session perdent leur durée
// (effacés à la fermeture du navigateur), sauf quand il s'agit de les effacer.
describe("sessionCookieOptions", () => {
  const persistent = { path: "/", maxAge: 34_560_000, sameSite: "lax" as const };

  it("garde la durée quand on se souvient de la personne", () => {
    expect(sessionCookieOptions(persistent, true)).toEqual(persistent);
  });

  it("retire la durée (cookie de navigateur) sinon", () => {
    expect(sessionCookieOptions(persistent, false)).toEqual({ path: "/", sameSite: "lax" });
    const dated = { path: "/", expires: new Date(Date.now() + 86_400_000) };
    expect(sessionCookieOptions(dated, false)).toEqual({ path: "/" });
  });

  it("n'empêche jamais un effacement (durée 0 ou date passée)", () => {
    const removal = { path: "/", maxAge: 0 };
    expect(sessionCookieOptions(removal, false)).toEqual(removal);
    const past = { path: "/", expires: new Date(0) };
    expect(sessionCookieOptions(past, false)).toEqual(past);
  });

  it("se souvient par défaut (cookie absent), oublie seulement sur « 0 »", () => {
    expect(remembers(undefined)).toBe(true);
    expect(remembers("1")).toBe(true);
    expect(remembers("0")).toBe(false);
  });
});

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { FEATURES } from "@/config/features";
import { publicEnv } from "@/lib/env";
import { REMEMBER_COOKIE, remembers, sessionCookieOptions } from "@/lib/supabase/session-cookies";

// Proxy (ex-middleware, Next 16) : rafraîchit la session Supabase à chaque requête et fait une
// redirection « optimiste ». Ce n'est PAS la protection des données : chaque page et chaque action
// revérifie l'utilisateur côté serveur, et la RLS PostgreSQL filtre en dernier ressort.
const PROTECTED_PREFIXES = ["/coach", "/admin", "/app", "/bienvenue"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  // « Se souvenir de moi » décoché : la session rafraîchie reste un cookie de navigateur.
  const remember = remembers(request.cookies.get(REMEMBER_COOKIE)?.value);

  const supabase = createServerClient(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, sessionCookieOptions(options, remember)),
        );
        // En-têtes anti-cache : une réponse qui pose un cookie de session ne doit jamais être mise en cache.
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // getClaims() vérifie le jeton (contrairement à getSession()) et le rafraîchit si besoin.
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  if (!isSignedIn && PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return redirectWithCookies(request, response, "/login");
  }
  if (isSignedIn && (pathname === "/login" || pathname === "/inscription")) {
    return redirectWithCookies(request, response, "/espace");
  }
  // Plus de page Paramètres (D-127) : /coach/profil?onglet=… ouvre la fenêtre par-dessus le tableau
  // de bord. Redirection HTTP, AVANT la page : faite par la page elle-même (dans un bloc Suspense),
  // elle partait au milieu du rendu et pouvait rester bloquée sur une page vide (tâche 3, 05/11).
  // La rubrique est revérifiée par la fenêtre (rubrique inconnue -> Profil).
  // MVP espace coach seul (D-167) : les pages qui supposent un sportif connecté sont coupées ici, avant
  // la page (même raison que ci-dessous). Chaque page refuse aussi d'elle-même (notFound).
  const cut = mvpRedirect(pathname);
  if (cut) return redirectWithCookies(request, response, cut);
  if (isSignedIn && pathname === "/coach/profil") {
    const wanted = request.nextUrl.searchParams.get("onglet") ?? "";
    const section = /^[a-z]{1,20}$/.test(wanted) ? wanted : "profil";
    return redirectWithCookies(request, response, `/coach?parametres=${section}`);
  }

  return response;
}

// Où renvoyer une adresse masquée par le MVP coach seul (null si l'adresse reste ouverte).
function mvpRedirect(pathname: string): string | null {
  if (
    !FEATURES.messages &&
    (pathname === "/coach/messages" || pathname.startsWith("/coach/messages/"))
  )
    return "/coach";
  if (!FEATURES.invitations) {
    const invite = /^(\/coach\/o\/[^/]+\/sportifs\/[^/]+)\/inviter\/?$/.exec(pathname);
    if (invite) return invite[1] ?? "/coach";
    if (pathname.startsWith("/invitation/")) return "/login";
  }
  if (!FEATURES.athleteSpace && (pathname === "/app" || pathname.startsWith("/app/")))
    return "/acces-refuse";
  return null;
}

// Une redirection doit conserver les cookies éventuellement rafraîchis par getClaims().
function redirectWithCookies(request: NextRequest, from: NextResponse, path: string) {
  const redirect = NextResponse.redirect(new URL(path, request.url));
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  from.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "set-cookie") redirect.headers.set(key, value);
  });
  return redirect;
}

export const config = {
  // Toutes les routes sauf les fichiers statiques et les images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

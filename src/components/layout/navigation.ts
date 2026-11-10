import {
  Bell,
  BookOpen,
  Bug,
  Building2,
  Calculator,
  Calendar,
  CreditCard,
  FileText,
  Folder,
  History,
  House,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

import { ADMIN_MODULES, ATHLETE_MODULES, COACH_MODULES, type ModuleInfo } from "./modules";

// Menus des trois espaces (prompt Claude Design §5.2 et §5.3), dans l'ordre des prototypes.
// `match` dit si une adresse appartient à l'entrée : les sous-pages allument leur parent
// (fiche sportif → Sportifs, détail de séance → Agenda…).
export type Space = "coach" | "athlete" | "admin";

export type NavEntry = {
  label: string;
  href: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
};

const exact = (href: string) => (pathname: string) => pathname === href;
const under = (href: string) => (pathname: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

// `orgBase` : « /coach/o/<organisation> », absent tant que le coach n'a pas d'organisation.
export function coachNav(orgBase: string | null): { main: NavEntry[]; secondary: NavEntry[] } {
  const moduleEntry = (slug: keyof typeof COACH_MODULES, icon: LucideIcon): NavEntry => ({
    label: COACH_MODULES[slug].label,
    href: `/coach/${slug}`,
    icon,
    match: exact(`/coach/${slug}`),
  });
  const main: NavEntry[] = [
    { label: "Tableau de bord", href: "/coach", icon: House, match: exact("/coach") },
  ];
  // Agenda en 2e position, sous le Tableau de bord (demande d'Antonino du 01/11, D-78).
  if (orgBase) {
    main.push({
      label: "Agenda",
      href: `${orgBase}/agenda`,
      icon: Calendar,
      match: under(`${orgBase}/agenda`),
    });
  }
  if (orgBase) {
    main.push({
      label: "Sportifs",
      href: `${orgBase}/sportifs`,
      icon: Users,
      match: under(`${orgBase}/sportifs`),
    });
  }
  // Programmes (C-19, 09/11/2026) : dans l'organisation, comme les Sportifs ; l'éditeur, l'assistant et
  // les modèles (sous-pages) allument l'entrée.
  main.push(
    orgBase
      ? {
          label: COACH_MODULES.programmes.label,
          href: `${orgBase}/programmes`,
          icon: FileText,
          match: under(`${orgBase}/programmes`),
        }
      : moduleEntry("programmes", FileText),
  );
  // Plus de Facturation (D-90) : Coory ne fait pas de factures, la Comptabilité suit l'argent.
  main.push(
    moduleEntry("comptabilite", Calculator),
    // La fiche d'un exercice (/coach/bibliotheque/<clé>) allume la Bibliothèque.
    { ...moduleEntry("bibliotheque", BookOpen), match: under("/coach/bibliotheque") },
  );
  // D-38 : Assistant IA, puis Messages juste en dessous (demande d'Antonino du 24/10), Tâches,
  // Documents, Notifications ; Paramètres passe dans la roue dentée en bas du menu (avec Thème,
  // Compte, Se déconnecter).
  const secondary: NavEntry[] = [
    moduleEntry("assistant", Sparkles),
    moduleEntry("messages", MessageSquare),
    moduleEntry("taches", ListChecks),
    moduleEntry("documents", Folder),
    moduleEntry("notifications", Bell),
  ];
  return { main, secondary };
}

export function athleteNav(): { main: NavEntry[]; secondary: NavEntry[] } {
  const moduleEntry = (slug: keyof typeof ATHLETE_MODULES, icon: LucideIcon, label?: string) => ({
    label: label ?? ATHLETE_MODULES[slug].label,
    href: `/app/${slug}`,
    icon,
    match: exact(`/app/${slug}`),
  });
  return {
    main: [
      { label: "Aujourd'hui", href: "/app", icon: House, match: exact("/app") },
      moduleEntry("programme", FileText, "Mon programme"),
      moduleEntry("calendrier", Calendar),
      moduleEntry("historique", History),
      moduleEntry("progression", TrendingUp),
      moduleEntry("objectifs", Target),
      moduleEntry("documents", Folder),
      moduleEntry("messages", MessageSquare),
    ],
    secondary: [moduleEntry("notifications", Bell), moduleEntry("profil", Settings, "Paramètres")],
  };
}

// Barre du bas du sportif sur téléphone : 5 onglets, la séance du jour à 2 actions maximum.
export function athleteTabs(): NavEntry[] {
  return [
    { label: "Aujourd'hui", href: "/app", icon: House, match: exact("/app") },
    { label: "Programme", href: "/app/programme", icon: FileText, match: exact("/app/programme") },
    {
      label: "Progression",
      href: "/app/progression",
      icon: TrendingUp,
      match: exact("/app/progression"),
    },
    {
      label: "Messages",
      href: "/app/messages",
      icon: MessageSquare,
      match: exact("/app/messages"),
    },
    { label: "Profil", href: "/app/profil", icon: User, match: exact("/app/profil") },
  ];
}

export function adminNav(): { main: NavEntry[]; secondary: null } {
  const moduleEntry = (slug: keyof typeof ADMIN_MODULES, icon: LucideIcon, label?: string) => ({
    label: label ?? ADMIN_MODULES[slug].label,
    href: `/admin/${slug}`,
    icon,
    match: exact(`/admin/${slug}`),
  });
  return {
    main: [
      { label: "Vue d'ensemble", href: "/admin", icon: LayoutDashboard, match: exact("/admin") },
      moduleEntry("organisations", Building2),
      moduleEntry("utilisateurs", Users, "Utilisateurs et rôles"),
      moduleEntry("abonnements", CreditCard),
      moduleEntry("audit", ScrollText),
      moduleEntry("erreurs", Bug),
      moduleEntry("conformite", ShieldCheck),
    ],
    secondary: null,
  };
}

export function navFor(space: Space, orgBase: string | null) {
  if (space === "coach") return coachNav(orgBase);
  if (space === "athlete") return athleteNav();
  return adminNav();
}

// Adresses de la cloche et de la recherche dans chaque espace.
export const notificationsHref: Record<Space, string> = {
  coach: "/coach/notifications",
  athlete: "/app/notifications",
  admin: "/admin/notifications",
};

export const homeHref: Record<Space, string> = {
  coach: "/coach",
  athlete: "/app",
  admin: "/admin",
};

// Titre court de la page, centré dans la barre du haut sur téléphone (prompt §5.2).
const coachTitles: [RegExp, string][] = [
  [/^\/coach$/, "Tableau de bord"],
  [/^\/coach\/profil$/, "Paramètres"],
  [/^\/coach\/o\/[^/]+\/sportifs$/, "Sportifs"],
  [/^\/coach\/o\/[^/]+\/sportifs\/nouveau$/, "Nouveau sportif"],
  [/^\/coach\/o\/[^/]+\/sportifs\/[^/]+\/inviter$/, "Invitation"],
  [/^\/coach\/o\/[^/]+\/sportifs\/[^/]+$/, "Fiche sportif"],
  [/^\/coach\/o\/[^/]+\/agenda$/, "Agenda"],
  [/^\/coach\/o\/[^/]+\/agenda\/seances\/nouvelle$/, "Nouvelle séance"],
  [/^\/coach\/o\/[^/]+\/agenda\/seances\/[^/]+\/modifier$/, "Modifier la séance"],
  [/^\/coach\/o\/[^/]+\/agenda\/seances\/[^/]+$/, "Séance"],
  [/^\/coach\/o\/[^/]+\/programmes$/, "Programmes"],
  [/^\/coach\/o\/[^/]+\/programmes\/nouveau$/, "Nouveau programme"],
  [/^\/coach\/o\/[^/]+\/programmes\/modeles\/[^/]+$/, "Modèle"],
  [/^\/coach\/o\/[^/]+\/programmes\/[^/]+\/seances\/[^/]+$/, "Séance"],
  [/^\/coach\/o\/[^/]+\/programmes\/[^/]+$/, "Programme"],
  [/^\/coach\/bibliotheque\/[^/]+$/, "Exercice"],
];

function moduleTitle(modules: Record<string, ModuleInfo>, prefix: string, pathname: string) {
  const slug = pathname.slice(prefix.length);
  return Object.hasOwn(modules, slug) ? modules[slug].label : null;
}

export function pageTitle(space: Space, pathname: string): string {
  if (space === "coach") {
    const known = coachTitles.find(([pattern]) => pattern.test(pathname));
    return known?.[1] ?? moduleTitle(COACH_MODULES, "/coach/", pathname) ?? "Coory";
  }
  if (space === "athlete") {
    if (pathname === "/app") return "Aujourd'hui";
    return moduleTitle(ATHLETE_MODULES, "/app/", pathname) ?? "Coory";
  }
  if (pathname === "/admin") return "Vue d'ensemble";
  return moduleTitle(ADMIN_MODULES, "/admin/", pathname) ?? "Coory";
}

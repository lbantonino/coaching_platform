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
  ListChecks,
  MessageSquare,
  ScrollText,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

// Modules pas encore construits (D-32) : visibles dans le menu SANS badge « Bientôt ». Chacun ouvre la
// page du module, vide et honnête : titre et phrase du prototype, état vide qui dit ce que le module
// contiendra. Jamais de faux chiffres. Quand un module est construit, il quitte cette liste et
// le menu pointe vers sa vraie page.
export type ModuleInfo = {
  // Titre court (barre du haut sur téléphone, onglet du navigateur)
  label: string;
  // Titre de la page (H1) et phrase sous le titre, repris des prototypes Claude Design
  h1: string;
  sub: string;
  icon: LucideIcon;
  emptyTitle: string;
  emptyText: string;
};

export const COACH_MODULES = {
  programmes: {
    label: "Programmes",
    h1: "Programmes",
    sub: "Crée, personnalise et publie les programmes.",
    icon: FileText,
    emptyTitle: "Aucun programme pour l'instant",
    emptyText:
      "Tu créeras ici les programmes de tes sportifs sur plusieurs semaines, à partir de tes modèles, puis tu les publieras dans leur espace.",
  },
  comptabilite: {
    label: "Comptabilité",
    h1: "Comptabilité",
    sub: "Vue de gestion, pas une comptabilité légale certifiée.",
    icon: Calculator,
    emptyTitle: "Aucun mouvement pour l'instant",
    emptyText:
      "Ce que tu gagnes, ce que tu dépenses et ton résultat apparaîtront ici à partir de tes paiements reçus et de tes dépenses.",
  },
  bibliotheque: {
    label: "Bibliothèque",
    h1: "Bibliothèque",
    sub: "Tes exercices, blocs et modèles de séances.",
    icon: BookOpen,
    emptyTitle: "Ta bibliothèque est vide",
    emptyText:
      "Tu y rangeras tes exercices, tes blocs et tes modèles de séances et de semaines, pour les réutiliser d'un sportif à l'autre.",
  },
  taches: {
    label: "Tâches",
    h1: "Tâches",
    sub: "Toutes les actions liées à ton activité.",
    icon: ListChecks,
    emptyTitle: "Aucune tâche",
    emptyText:
      "Tes tâches (programme à livrer, facture à envoyer, suivi à faire) apparaîtront ici avec leur échéance et leur priorité.",
  },
  documents: {
    label: "Documents",
    h1: "Documents",
    sub: "Fichiers et exports PDF centralisés.",
    icon: Folder,
    emptyTitle: "Aucun document",
    emptyText:
      "Les PDF de tes programmes publiés, tes factures et les fichiers que tu importes seront rangés ici.",
  },
  messages: {
    label: "Messages",
    h1: "Messages",
    sub: "Conversations 1:1 avec tes sportifs.",
    icon: MessageSquare,
    emptyTitle: "Aucune conversation",
    emptyText:
      "Tu échangeras ici avec chacun de tes sportifs, dans le respect de son canal préféré. En attendant, le message visible par le sportif se trouve dans sa fiche (onglet Notes).",
  },
  notifications: {
    label: "Notifications",
    h1: "Notifications",
    sub: "Retours, messages, invitations, séances à encaisser et tâches.",
    icon: Bell,
    emptyTitle: "Aucune notification",
    emptyText:
      "Tu seras prévenu ici d'un nouveau retour de séance, d'un message, d'une invitation acceptée ou d'une séance à encaisser.",
  },
  recherche: {
    label: "Recherche",
    h1: "Rechercher dans Coory",
    sub: "Sportifs, programmes, séances, documents.",
    icon: Search,
    emptyTitle: "La recherche globale arrive",
    emptyText:
      "Pour l'instant, la recherche du haut de page trouve tes sportifs. Elle cherchera aussi dans les programmes, les séances et les documents.",
  },
  assistant: {
    label: "Assistant IA",
    h1: "Assistant IA",
    sub: "Il propose des actions, tu les valides avant exécution.",
    icon: Sparkles,
    emptyTitle: "L'assistant n'est pas encore actif",
    emptyText:
      "Tu lui écriras par exemple « Ajoute Valentin Dupont, musculation, disponible mardi et jeudi à 19 h ». Il proposera les actions ; rien ne sera fait sans ta validation.",
  },
} satisfies Record<string, ModuleInfo>;

export const ATHLETE_MODULES = {
  programme: {
    label: "Programme",
    h1: "Mon programme",
    sub: "Les semaines et les séances préparées par ton coach.",
    icon: FileText,
    emptyTitle: "Aucun programme publié",
    emptyText:
      "Dès que ton coach publiera ton programme, tu verras ici chaque semaine et chaque séance.",
  },
  calendrier: {
    label: "Calendrier",
    h1: "Calendrier",
    sub: "Tes séances, semaine par semaine.",
    icon: Calendar,
    emptyTitle: "Rien au calendrier",
    emptyText: "Tes séances apparaîtront ici dès que ton coach aura publié ton programme.",
  },
  historique: {
    label: "Historique",
    h1: "Historique",
    sub: "Tes séances passées.",
    icon: History,
    emptyTitle: "Aucune séance passée",
    emptyText: "Chaque séance terminée, partielle ou sautée sera gardée ici avec ton ressenti.",
  },
  progression: {
    label: "Progression",
    h1: "Ma progression",
    sub: "Tes séances réalisées, ton ressenti et tes records.",
    icon: TrendingUp,
    emptyTitle: "Aucune donnée pour l'instant",
    emptyText:
      "Ta régularité, ton ressenti moyen et tes records apparaîtront ici quand tu auras réalisé des séances.",
  },
  objectifs: {
    label: "Objectifs",
    h1: "Objectifs et épreuves",
    sub: "Ton prochain grand rendez-vous.",
    icon: Target,
    emptyTitle: "Aucun objectif affiché",
    emptyText:
      "Les objectifs et les épreuves notés par ton coach apparaîtront ici avec le compte à rebours.",
  },
  documents: {
    label: "Documents",
    h1: "Mes documents",
    sub: "PDF des programmes publiés.",
    icon: Folder,
    emptyTitle: "Aucun document",
    emptyText: "Les PDF de tes programmes publiés seront téléchargeables ici.",
  },
  messages: {
    label: "Messages",
    h1: "Messages",
    sub: "Ta conversation avec ton coach.",
    icon: MessageSquare,
    emptyTitle: "Aucun message",
    emptyText:
      "Tu pourras écrire à ton coach ici. Le dernier message de ton coach est sur la page Aujourd'hui.",
  },
  notifications: {
    label: "Notifications",
    h1: "Notifications",
    sub: "Nouveau programme, nouvelle version, message, rappel.",
    icon: Bell,
    emptyTitle: "Aucune notification",
    emptyText:
      "Tu seras prévenu ici d'un nouveau programme, d'une nouvelle version ou d'un message de ton coach.",
  },
  profil: {
    label: "Profil",
    h1: "Mon profil",
    sub: "Ton identité et tes préférences.",
    icon: User,
    emptyTitle: "Ton profil arrive",
    emptyText:
      "Tu modifieras ici ton identité et tes préférences. Ton accord pour tes contraintes physiques se gère pour l'instant sur la page Aujourd'hui.",
  },
  recherche: {
    label: "Recherche",
    h1: "Rechercher",
    sub: "Séances, documents, messages.",
    icon: Search,
    emptyTitle: "Rien à chercher pour l'instant",
    emptyText: "La recherche portera sur tes séances, tes documents et tes messages.",
  },
} satisfies Record<string, ModuleInfo>;

export const ADMIN_MODULES = {
  organisations: {
    label: "Organisations",
    h1: "Organisations",
    sub: "Les espaces des coachs et leur état.",
    icon: Building2,
    emptyTitle: "Outil pas encore disponible",
    emptyText:
      "Tu verras ici chaque organisation, son propriétaire, son nombre de sportifs et sa formule.",
  },
  utilisateurs: {
    label: "Utilisateurs",
    h1: "Utilisateurs et rôles",
    sub: "Comptes coachs, sportifs et administrateurs.",
    icon: Users,
    emptyTitle: "Outil pas encore disponible",
    emptyText: "Tu verras ici chaque compte, son rôle et sa dernière connexion.",
  },
  abonnements: {
    label: "Abonnements",
    h1: "Abonnements et quotas",
    sub: "Formules, revenus et quotas.",
    icon: CreditCard,
    emptyTitle: "Outil pas encore disponible",
    emptyText: "Les formules, le revenu mensuel et les quotas des organisations apparaîtront ici.",
  },
  audit: {
    label: "Journal d'audit",
    h1: "Journal d'audit",
    sub: "Qui, quoi, quand.",
    icon: ScrollText,
    emptyTitle: "Outil pas encore disponible",
    emptyText: "Chaque action sensible de l'administration sera journalisée ici.",
  },
  erreurs: {
    label: "Erreurs",
    h1: "Erreurs et intégrations",
    sub: "Incidents et état des services.",
    icon: Bug,
    emptyTitle: "Outil pas encore disponible",
    emptyText: "Les incidents et l'état des intégrations (e-mails, stockage) apparaîtront ici.",
  },
  conformite: {
    label: "Conformité",
    h1: "Conformité",
    sub: "Exports et suppressions de comptes.",
    icon: ShieldCheck,
    emptyTitle: "Outil pas encore disponible",
    emptyText:
      "Les demandes d'export et de suppression de données seront traitées et journalisées ici.",
  },
  notifications: {
    label: "Notifications",
    h1: "Notifications",
    sub: "Alertes de la plateforme.",
    icon: Bell,
    emptyTitle: "Aucune notification",
    emptyText: "Les alertes de la plateforme apparaîtront ici.",
  },
  recherche: {
    label: "Recherche",
    h1: "Rechercher",
    sub: "Organisations et comptes.",
    icon: Search,
    emptyTitle: "Outil pas encore disponible",
    emptyText: "La recherche portera sur les organisations et les comptes.",
  },
} satisfies Record<string, ModuleInfo>;

export type CoachModule = keyof typeof COACH_MODULES;
export type AthleteModule = keyof typeof ATHLETE_MODULES;
export type AdminModule = keyof typeof ADMIN_MODULES;

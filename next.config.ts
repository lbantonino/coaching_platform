import type { NextConfig } from "next";

// En-têtes de sécurité (revue du 13/11/2026), sur toutes les pages : pas d'affichage dans un cadre
// d'un autre site (clickjacking ; Coory lui-même affiche l'aperçu PDF des Documents dans un cadre), pas de devinette du type des fichiers, adresse d'origine réduite
// pour les autres sites, ni caméra, ni micro, ni position. HTTPS imposé en production (HSTS). Pas de
// politique stricte des scripts : Next.js en écrit dans la page, elle demanderait des nonces.
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Micro : Coory seulement, pour la dictée de l'Assistant IA (D-173).
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  /* config options here */
  cacheComponents: true,
  // Pas de logo « N » des outils de développement de Next.js sur les écrans (demande d'Antonino).
  devIndicators: false,
  // Développement sur un vrai téléphone (même Wi-Fi, http://<IP du Mac>:3000) : Next 16 bloque le
  // JavaScript des pages ouvertes depuis une autre adresse que localhost, et les boutons (œil du mot
  // de passe, menu ☰…) ne répondent plus. Les jokers couvrent le réseau de la maison (192.168…) et
  // le partage de connexion de l'iPhone (172.20.10…, Mac en 172.20.10.9 le 04/11), même si l'IP change.
  allowedDevOrigins: ["192.168.*.*", "172.20.10.*"],
  partialPrefetching: true,
  // PDF des programmes (phase 5) : les polices Plus Jakarta Sans sont lues sur le disque par les deux
  // routes de téléchargement ; on les embarque avec ces routes au déploiement.
  outputFileTracingIncludes: {
    // Le PDF du programme (un seul fichier depuis D-211, adresse …/pdf) et celui d'une conversation
    // de l'Assistant IA (D-212) : la police Plus Jakarta Sans est lue sur le disque au rendu.
    "/coach/o/[orgId]/programmes/[programId]/pdf": ["./src/features/programs/pdf/fonts/*"],
    "/coach/o/[orgId]/assistant/conversations/[conversationId]/pdf": [
      "./src/features/programs/pdf/fonts/*",
    ],
  },
  experimental: {
    // Les agents de code ne sont prévenus que des mises à jour de sécurité de Next.js.
    agentUpgrade: "security",
    // Photos de profil jusqu'à 2 Mo (D-28), documents jusqu'à 4 Mo (D-60, revue du 13/11/2026 : la
    // limite d'envoi de Vercel est 4,5 Mo) : 1 Mo par défaut pour une action serveur, plus la marge du
    // formulaire. La taille réelle est revérifiée dans l'action.
    serverActions: { bodySizeLimit: "5mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

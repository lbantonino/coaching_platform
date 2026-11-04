import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  experimental: {
    // Photos de profil jusqu'à 2 Mo (D-28), documents jusqu'à 10 Mo (D-60) : 1 Mo par défaut pour une
    // action serveur, plus la marge du formulaire. La taille réelle est revérifiée dans l'action.
    serverActions: { bodySizeLimit: "11mb" },
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

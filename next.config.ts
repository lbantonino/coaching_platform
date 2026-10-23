import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Pas de logo « N » des outils de développement de Next.js sur les écrans (demande d'Antonino).
  devIndicators: false,
  partialPrefetching: true,
  experimental: {
    // Photos de profil jusqu'à 2 Mo (D-28) : 1 Mo par défaut pour une action serveur, plus la marge
    // du formulaire. La taille réelle est revérifiée dans l'action.
    serverActions: { bodySizeLimit: "3mb" },
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

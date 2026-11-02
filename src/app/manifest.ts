import type { MetadataRoute } from "next";

import { BRAND } from "@/config/brand";

// Manifeste de l'application installable (D-77) : nom, couleurs et icônes du kit de marque
// (public/brand). « Installable si validé plus tard » : rien n'est mis en cache hors ligne.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.name,
    short_name: BRAND.name,
    description: BRAND.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#131316",
    theme_color: "#131316",
    icons: [
      { src: "/brand/app-icon/coory-app-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/app-icon/coory-app-icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/app-icon/coory-app-icon-noir.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}

import type { MetadataRoute } from "next";

import { BRAND } from "@/config/brand";

// Manifeste de l'application installable, d'après le kit du logo définitif (COORY-LOGO-KIT, 04/11/2026) :
// icônes 192, 512 et « maskable » (Android). « Installable si validé plus tard » : rien n'est mis en
// cache hors ligne.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.name,
    short_name: BRAND.name,
    description: "L’app des coachs et de leurs sportifs.",
    start_url: "/",
    display: "standalone",
    background_color: "#17151D",
    theme_color: "#17151D",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

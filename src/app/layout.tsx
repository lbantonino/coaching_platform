import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { PressFeedback } from "@/components/ui/press-feedback";
import { ToastProvider } from "@/components/ui/toast";
import { BRAND } from "@/config/brand";
import { sidebarInitScript } from "@/lib/sidebar";
import { themeInitScript } from "@/lib/theme";

import "./globals.css";

// Police (D-77, 01/11/2026, maquette v6 validée par Antonino) : Plus Jakarta Sans pour TOUT, titres,
// texte, heures et chiffres (chiffres alignés). Plus de police « machine à écrire » (demande d'Antonino).
// Graisse 800 (04/11/2026) : le nom COORY du logo définitif (src/components/brand/CooryLogo.tsx).
// next/font télécharge la police au build et la sert depuis notre domaine : aucun appel à Google
// dans le navigateur des visiteurs (plus rapide, et pas d'adresse IP transmise à un tiers).
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Logo définitif (kit COORY-LOGO-KIT, 04/11/2026, rangé dans docs/design/coory-brand/) : favicon,
// icônes d'écran d'accueil, image de partage. Fichiers servis depuis public/.
export const metadata: Metadata = {
  // Adresse du site en ligne : sert à écrire l'adresse complète de l'image de partage (og-image.png).
  // À remplir quand le nom de domaine sera choisi, par exemple new URL("https://coory.app").
  // metadataBase: new URL("https://…"),
  title: { default: BRAND.name, template: `%s · ${BRAND.name}` },
  description: BRAND.tagline,
  applicationName: BRAND.name,
  icons: {
    // Favicon qui suit le thème du navigateur (demande d'Antonino du 04/11) : icon.svg passe le C en
    // blanc cassé quand le navigateur est en sombre (règle prefers-color-scheme dans le SVG). Seuls le
    // SVG (« any ») et le .ico de secours sont annoncés : avec des PNG de 16 et 32 px dans la liste,
    // Chrome pouvait les préférer, et ils ne changent pas de couleur (les fichiers restent dans public/).
    // Safari ne lit pas les favicons SVG : il prend le .ico.
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    other: [{ rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#8B5CF6" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: BRAND.name,
    description: "L’app des coachs et de leurs sportifs.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: BRAND.name }],
    siteName: BRAND.name,
    type: "website",
  },
  twitter: { card: "summary_large_image", images: ["/og-image.png"] },
};

// Couleur de la barre du navigateur (téléphone) : celle du fond de chaque thème (gardée au passage au
// logo définitif, choix d'Antonino du 04/11 : la barre se fond dans la page).
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#131316" },
    { media: "(prefers-color-scheme: light)", color: "#f3f2f7" },
  ],
  colorScheme: "dark light",
};

// suppressHydrationWarning sur <html> : themeInitScript y pose data-theme ("dark" ou "light") avant React,
// c'est voulu ; sans cette option, React signalerait une différence entre le serveur et le navigateur.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${jakarta.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: sidebarInitScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-bg text-text">
        <PressFeedback />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

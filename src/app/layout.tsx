import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { PressFeedback } from "@/components/ui/press-feedback";
import { ToastProvider } from "@/components/ui/toast";
import { BRAND } from "@/config/brand";
import { sidebarInitScript } from "@/lib/sidebar";
import { themeInitScript } from "@/lib/theme";

import "./globals.css";

// Police (D-77, 01/11/2026, maquette v6 validée par Antonino) : Plus Jakarta Sans pour TOUT, titres,
// texte, heures et chiffres (chiffres alignés). Plus de police « machine à écrire » (demande d'Antonino)
// ni de police à part pour le logo : le logo est désormais un dessin (public/brand).
// next/font télécharge la police au build et la sert depuis notre domaine : aucun appel à Google
// dans le navigateur des visiteurs (plus rapide, et pas d'adresse IP transmise à un tiers).
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: BRAND.name, template: `%s · ${BRAND.name}` },
  description: BRAND.tagline,
};

// Couleur de la barre du navigateur (téléphone) : celle du fond de chaque thème.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#08080a" },
    { media: "(prefers-color-scheme: light)", color: "#f3f2f7" },
  ],
  colorScheme: "dark light",
};

// suppressHydrationWarning sur <html> : themeInitScript y pose data-theme ("dark" ou "light") avant React,
// c'est voulu ; sans cette option, React signalerait une différence entre le serveur et le navigateur.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${jakarta.variable} h-full antialiased`}
    >
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

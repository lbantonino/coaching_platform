import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter_Tight, Space_Grotesk } from "next/font/google";

import { PressFeedback } from "@/components/ui/press-feedback";
import { ToastProvider } from "@/components/ui/toast";
import { BRAND } from "@/config/brand";
import { sidebarInitScript } from "@/lib/sidebar";
import { themeInitScript } from "@/lib/theme";

import "./globals.css";

// Polices (29/10/2026, choix d'Antonino) : Inter Tight pour les titres ET le texte de l'interface, Geist Mono
// pour les heures et les données, Space Grotesk seulement pour le logo « C∞ry » (la marque ne change pas).
// next/font télécharge les polices au build et les sert depuis notre domaine : aucun appel à Google
// dans le navigateur des visiteurs (plus rapide, et pas d'adresse IP transmise à un tiers).
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: BRAND.name, template: `%s · ${BRAND.name}` },
  description: BRAND.tagline,
};

export const viewport: Viewport = {
  themeColor: "#141518", // fond graphite, le défaut depuis le 29/10/2026
  colorScheme: "light",
};

// suppressHydrationWarning sur <html> : themeInitScript y pose data-theme ("dark" ou "light") avant React,
// c'est voulu ; sans cette option, React signalerait une différence entre le serveur et le navigateur.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${interTight.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
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

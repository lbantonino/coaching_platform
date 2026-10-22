import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";

import { BRAND } from "@/config/brand";
import { themeInitScript } from "@/lib/theme";

import "./globals.css";

// Trois polices (COORY_DESIGN_SYSTEM.md §4) : Space Grotesk pour le logo, les titres et les grands chiffres
// (jamais sous 18 px), Geist pour tout le reste de l'interface, Geist Mono pour les données.
// next/font télécharge les polices au build et les sert depuis notre domaine : aucun appel à Google
// dans le navigateur des visiteurs (plus rapide, et pas d'adresse IP transmise à un tiers).
const geistSans = Geist({
  variable: "--font-geist-sans",
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
  themeColor: "#0B0B0C",
  colorScheme: "dark",
};

// suppressHydrationWarning sur <html> : themeInitScript peut y poser data-theme="light" avant React,
// c'est voulu ; sans cette option, React signalerait une différence entre le serveur et le navigateur.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-bg text-text">{children}</body>
    </html>
  );
}

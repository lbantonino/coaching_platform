import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { BRAND } from "@/config/brand";

import "./globals.css";

// « Geist partout » (design system Athlix) : Geist pour l'interface, Geist Mono pour les données.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: BRAND.name, template: `%s · ${BRAND.name}` },
  description: BRAND.tagline,
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-page text-text">{children}</body>
    </html>
  );
}

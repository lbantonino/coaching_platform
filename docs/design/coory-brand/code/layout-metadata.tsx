// app/layout.tsx — extraits à fusionner (ne pas écraser le fichier existant)
import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-jakarta', display: 'swap' });

export const metadata: Metadata = {
  // metadataBase: new URL('https://coory.app'), // ← mettre le vrai domaine
  title: { default: 'Coory', template: '%s · Coory' },
  description: 'L’app des coachs et de leurs sportifs : programmes, agenda, suivi et comptabilité.',
  applicationName: 'Coory',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    other: [{ rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#8B5CF6' }],
  },
  manifest: '/manifest.webmanifest',
  openGraph: { title: 'Coory', description: 'L’app des coachs et de leurs sportifs.', images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Coory' }], siteName: 'Coory', type: 'website' },
  twitter: { card: 'summary_large_image', images: ['/og-image.png'] },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F4F2' },
    { media: '(prefers-color-scheme: dark)', color: '#17151D' },
  ],
};

// Dans <html>, ajouter la classe : <html lang="fr" className={jakarta.variable}>

// app/manifest.ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Coory',
    short_name: 'Coory',
    description: 'L’app des coachs et de leurs sportifs.',
    start_url: '/',
    display: 'standalone',
    background_color: '#17151D',
    theme_color: '#17151D',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'My Mall',
    short_name: 'My Mall',
    description: 'Run your shop from your phone.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f9f6',
    theme_color: '#387a4f',
    icons: [
      { src: '/icon-light-32x32.png', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
} 

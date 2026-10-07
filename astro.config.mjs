// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://felixcorcoran.es',
  fonts: [
    {
      // Self-hosted desde @fontsource/sora. Solo el subset latin (cubre el
      // español) y solo los pesos que usamos: 300, 400, 500 y 600.
      provider: fontProviders.local(),
      name: 'Sora',
      cssVariable: '--font-sora',
      fallbacks: ['sans-serif'],
      options: {
        variants: [300, 400, 500, 600].map((weight) => ({
          weight,
          style: 'normal',
          src: [`@fontsource/sora/files/sora-latin-${weight}-normal.woff2`],
        })),
      },
    },
  ],
  build: {
    // El CSS va dentro del HTML: sin peticiones que bloqueen el primer
    // pintado (la web tiene poco CSS y dos páginas principales)
    inlineStylesheets: 'always',
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Three.js (~540 kB sin comprimir, ~135 kB gzip) va en un chunk propio
      // que se carga de forma diferida; no bloquea el render inicial.
      chunkSizeWarningLimit: 600,
    },
  }
});

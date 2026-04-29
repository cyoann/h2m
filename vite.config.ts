import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

const base = isGitHubActions && repositoryName ? `/${repositoryName}/` : '/';

export default defineConfig({
  base,

  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      includeAssets: ['favicon.svg', 'favicon.png', 'apple-touch-icon.png'],

      manifest: {
        id: base,
        name: 'h2m — HTML to Markdown',
        short_name: 'h2m',
        description: 'A lightweight offline HTML-to-Markdown converter.',
        lang: 'en',
        dir: 'ltr',
        display: 'standalone',
        orientation: 'any',
        start_url: '.',
        scope: '.',
        theme_color: '#f7f4ee',
        background_color: '#f7f4ee',
        categories: ['productivity', 'utilities'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,txt,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },

      devOptions: {
        enabled: true,
      },
    }),
  ],

  server: {
    open: true,
  },

  preview: {
    open: true,
  },
});

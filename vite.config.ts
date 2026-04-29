import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === 'true';

const base = isGitHubPagesBuild && repoName ? `/${repoName}/` : '/';

export default defineConfig({
  base,

  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      manifest: {
        name: 'h2m — HTML to Markdown',
        short_name: 'h2m',
        description: 'A lightweight offline HTML-to-Markdown converter.',
        lang: 'en',
        display: 'standalone',
        orientation: 'any',
        start_url: '.',
        scope: '.',
        theme_color: '#f7f4ee',
        background_color: '#f7f4ee',
        categories: ['productivity', 'utilities'],
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,txt,webmanifest}'],
        navigateFallback: 'index.html',
      },

      devOptions: {
        enabled: true,
      },
    }),
  ],

  server: {
    open: true,
  },
});

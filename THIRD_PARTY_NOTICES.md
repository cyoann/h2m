# Third-party notices

h2m is built with open-source tools and libraries. This file lists the direct dependencies used by the app and its development workflow.

For the complete resolved dependency tree, see `pnpm-lock.yaml`.

## Runtime dependencies

| Package | Role | License |
| --- | --- | --- |
| DOMPurify | Sanitizes user-provided HTML before conversion. | Apache-2.0 OR MPL-2.0 |
| Turndown | Converts sanitized HTML to Markdown. | MIT |

## Development and build tools

| Package | Role | License |
| --- | --- | --- |
| Vite | Development server and production build tooling. | MIT |
| vite-plugin-pwa | PWA manifest and service worker generation. | MIT |
| TypeScript | Static type checking. | Apache-2.0 |
| Sass | SCSS compilation. | MIT |
| Sharp | PWA image asset generation. | Apache-2.0 |
| Vitest | Test runner. | MIT |
| jsdom | DOM environment for tests. | MIT |
| @types/turndown | Type definitions for Turndown. | MIT |

## Notes

- h2m implements its GitHub Flavored Markdown conversion rules internally.
- h2m does not bundle `turndown-plugin-gfm`.
- h2m does not include analytics, telemetry, remote fonts, CDN assets, or backend services.

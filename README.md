# h2m

h2m is a private, offline HTML-to-Markdown converter with a brutalist, terminal-inspired interface.

It runs entirely in the browser. Paste rich web-page HTML, open or drop a local HTML/text file, and export clean Markdown without sending content to a server.

## Features

- Converts pasted rich HTML to Markdown.
- Opens or drag-drops local `.html`, `.htm`, `.xhtml`, `.xml`, and `.txt` files.
- Sanitizes user HTML with DOMPurify before conversion.
- Converts sanitized HTML with Turndown.js.
- Preserves configurable conversion settings:
  - heading style
  - code block style
  - bullet marker
  - link handling
  - image handling
  - strikethrough
  - table preservation
  - comment removal
- Persists user settings locally.
- Persists the current draft locally.
- Copies Markdown to the clipboard.
- Downloads Markdown as a `.md` file.
- Works as an offline-capable PWA.

## Security model

User-provided HTML is treated as unsafe.

The conversion pipeline is:

1. Read HTML or text input.
2. Sanitize input through DOMPurify.
3. Convert sanitized HTML through Turndown.js.
4. Render Markdown output as plain text.

The app does not render user-provided HTML directly into the page.

## Tech stack

- Vite
- Vanilla TypeScript
- SCSS
- DOMPurify
- Turndown.js
- vite-plugin-pwa
- Vitest + jsdom
- GitHub Pages

## Project structure

```text
src/
  app/
    app.ts              App entry wiring
  core/
    converter.ts        HTML sanitization + Markdown conversion orchestration
    sanitizer.ts        DOMPurify configuration
    settings.ts         Settings schema, defaults, persistence, UI preferences
    draft.ts            Local draft persistence
  ui/
    app-shell.ts        Static app shell markup and DOM control lookup
    layout.ts           App state, event wiring, and UI updates
    settings-panel.ts   Settings dialog rendering and form handling
    clipboard.ts        Clipboard read/write capability helpers
    files.ts            File import/download helpers
    shortcuts.ts        Keyboard shortcut routing
  styles/
    _tokens.scss        Design tokens
    _themes.scss        Light/dark theme variables
    main.scss           App layout and component styles
```

## Getting started

Install dependencies:

```sh
pnpm install
```

Start the dev server:

```sh
pnpm dev
```

Run tests:

```sh
pnpm test
```

Run type checks and tests:

```sh
pnpm check
```

Build for production:

```sh
pnpm build
```

Preview the production build:

```sh
pnpm preview
```

## PWA assets

Production builds generate PWA image assets before Vite builds the app:

```sh
pnpm assets
```

Generated files are written to `public/`.

## Deployment

The app is built as static files and deployed to GitHub Pages by `.github/workflows/pages.yml`.

The workflow uses pnpm, runs `pnpm check`, then builds with `pnpm build`. The Vite base path is derived from `GITHUB_REPOSITORY` when running in GitHub Actions, so the same build works for repository Pages deployments.

## Development notes

- Keep the app dependency-light.
- Do not introduce a framework or state manager.
- Keep conversion logic deterministic and testable.
- Keep UI code plain and explicit.
- Preserve the offline-first behavior.

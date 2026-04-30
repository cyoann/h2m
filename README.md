<p align="center">
  <a href="https://cyoann.github.io/h2m/">
    <img src="public/logo.svg" width="96" height="96" alt="h2m logo">
  </a>
</p>

<h1 align="center">h2m</h1>

<p align="center">
  Convert HTML to clean Markdown in your browser.
</p>

<p align="center">
  <a href="https://cyoann.github.io/h2m/">Open the app</a>
  ·
  <a href="#features">Features</a>
  ·
  <a href="#markdown-output">Markdown output</a>
  ·
  <a href="#development">Development</a>
</p>

---

## Overview

h2m is a lightweight, offline-first HTML-to-Markdown converter.

Paste copied web-page HTML, open a local HTML or text file, and export Markdown. The conversion happens locally in the browser: no backend, no account, no analytics, no telemetry.

## Features

- Paste rich HTML from web pages.
- Open or drag-drop `.html`, `.htm`, `.xhtml`, `.xml`, and `.txt` files.
- Sanitize user-provided HTML before conversion.
- Convert sanitized HTML to Markdown.
- Copy Markdown to the clipboard.
- Download Markdown as a `.md` file.
- Restore local draft input.
- Persist conversion preferences locally.
- Work offline as a Progressive Web App.

## Markdown output

h2m defaults to GitHub Flavored Markdown-friendly output:

| Area | Default behavior |
| --- | --- |
| Headings | ATX headings, for example `# Heading` |
| Code blocks | Fenced code blocks |
| Code language | Preserved when detected from common highlight classes |
| Lists | `-` bullet marker |
| Links | Markdown links |
| Images | Markdown images |
| Strikethrough | `~~text~~` |
| Task lists | `- [ ]` and `- [x]` |
| Tables | Markdown tables when the source table can be represented safely |

Table handling is configurable:

- **Markdown table** for simple data tables.
- **Sanitized HTML** for complex tables that would lose structure.
- **Plain text** for readable cell content without table syntax.

Known table limits:

- `rowspan` has no faithful GitHub Flavored Markdown equivalent.
- Layout-heavy or nested tables may be preserved as sanitized HTML.
- Tables containing block content such as lists, headings, blockquotes, horizontal rules, or code blocks may be preserved as sanitized HTML.

## Security and privacy

User HTML is treated as unsafe.

The pipeline is:

1. Read pasted or opened input.
2. Sanitize input with DOMPurify.
3. Convert sanitized HTML with Turndown and h2m's internal GFM rules.
4. Render Markdown as plain text.

h2m does not render user-provided HTML directly into the page.

Local persistence:

- settings are stored in `localStorage`;
- draft input is stored in `localStorage`;
- content is not sent to a server by h2m.

## Built with

h2m stays intentionally small and boring.

| Tool | Use |
| --- | --- |
| [Vite](https://vite.dev/) | development server and static production build |
| [TypeScript](https://www.typescriptlang.org/) | typed application code |
| [SCSS](https://sass-lang.com/) | styling |
| [DOMPurify](https://github.com/cure53/DOMPurify) | HTML sanitization |
| [Turndown](https://github.com/mixmark-io/turndown) | HTML-to-Markdown conversion |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | offline PWA support |
| [Vitest](https://vitest.dev/) | tests |
| [jsdom](https://github.com/jsdom/jsdom) | DOM test environment |
| [Sharp](https://sharp.pixelplumbing.com/) | generated PWA image assets |

Third-party license details are listed in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## Development

Install dependencies:

```sh
pnpm install
```

Start the development server:

```sh
pnpm dev
```

Run checks:

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

Generate PWA assets:

```sh
pnpm assets
```

## Project structure

```text
src/
  app/                 App entry wiring
  core/                Conversion, sanitization, settings, draft persistence
  ui/                  DOM shell, events, clipboard, files, shortcuts
  styles/              Design tokens, themes, app styles
```

## Deployment

The public app is deployed at:

<https://cyoann.github.io/h2m/>

The GitHub Pages workflow:

1. installs dependencies with pnpm;
2. runs `pnpm check`;
3. runs `pnpm build`;
4. uploads `dist/` to GitHub Pages.

## License

h2m is released under the [MIT License](LICENSE).

See [third-party notices](THIRD_PARTY_NOTICES.md) for dependency licenses.

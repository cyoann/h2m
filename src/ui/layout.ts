import { createSettingsPanel } from './settings-panel';

export function createLayout(): HTMLElement {
  const shell = document.createElement('div');
  const settingsPanel = createSettingsPanel();

  shell.className = 'app-shell';

  shell.innerHTML = `
    <header class="topbar">
      <a class="brand" href="/" aria-label="h2m home">
        <span class="brand__mark">h2m</span>
        <span class="brand__name">HTML to Markdown</span>
      </a>

      <nav class="topbar__actions" aria-label="Application actions">
        <button class="quiet-button" type="button" data-action="open-settings">
          Settings
        </button>
      </nav>
    </header>

    <section class="hero" aria-labelledby="app-title">
      <p class="eyebrow">Offline-first converter</p>
      <h1 id="app-title">Clean Markdown from unsafe HTML.</h1>
      <p class="hero__copy">
        Paste HTML. Sanitize it. Convert it. Keep the output plain, portable, and readable.
      </p>
    </section>

    <section class="workspace" aria-label="HTML to Markdown workspace">
      <article class="panel panel--input">
        <header class="panel__header">
          <div>
            <p class="panel__kicker">Input</p>
            <h2>HTML</h2>
          </div>
          <button class="text-button" type="button" disabled>Paste</button>
        </header>

        <textarea
          class="editor"
          id="html-input"
          name="html-input"
          spellcheck="false"
          placeholder="<h1>Hello h2m</h1>"
          aria-label="HTML input"
        ></textarea>
      </article>

      <article class="panel panel--output">
        <header class="panel__header">
          <div>
            <p class="panel__kicker">Output</p>
            <h2>Markdown</h2>
          </div>
          <button class="text-button" type="button" disabled>Copy</button>
        </header>

        <textarea
          class="editor editor--output"
          id="markdown-output"
          name="markdown-output"
          spellcheck="false"
          readonly
          placeholder="# Hello h2m"
          aria-label="Markdown output"
        ></textarea>
      </article>
    </section>

    <footer class="statusbar" aria-live="polite">
      <span>Ready</span>
      <span>Local only</span>
    </footer>
  `;

  shell.append(settingsPanel);

  const openSettingsButton = shell.querySelector<HTMLButtonElement>('[data-action="open-settings"]');

  openSettingsButton?.addEventListener('click', () => {
    settingsPanel.showModal();
  });

  return shell;
}

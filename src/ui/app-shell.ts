export interface AppControls {
  input: HTMLTextAreaElement;
  output: HTMLTextAreaElement;
  fileInput: HTMLInputElement;
  openButton: HTMLButtonElement;
  pasteButton: HTMLButtonElement;
  copyButton: HTMLButtonElement;
  downloadButton: HTMLButtonElement;
  clearButton: HTMLButtonElement;
  settingsButton: HTMLButtonElement;
  statusPrimary: HTMLElement;
  statusSecondary: HTMLElement;
  metricHtmlCharacters: HTMLElement;
  metricMarkdownCharacters: HTMLElement;
  metricMarkdownWords: HTMLElement;
}

export interface AppShell {
  shell: HTMLElement;
  controls: AppControls;
}

export function createAppShell(settingsPanel: HTMLDialogElement): AppShell {
  const shell = document.createElement('div');

  shell.className = 'app-shell';
  shell.innerHTML = appShellMarkup;
  shell.append(settingsPanel);

  return {
    shell,
    controls: getAppControls(shell),
  };
}

const appShellMarkup = `
  <header class="topbar">
    <a class="brand" href="./" aria-label="h2m home">
      <span class="brand__mark">h2m</span>
      <span class="brand__text">
        <span class="brand__name">HTML to Markdown</span>
        <span class="brand__tagline">private · offline · clean</span>
      </span>
    </a>

    <nav class="topbar__actions" aria-label="Application actions">
      <button
        class="quiet-button"
        type="button"
        data-action="open-settings"
        title="Open settings (Ctrl/Cmd+,)"
        aria-keyshortcuts="Control+, Meta+,"
      >
        Settings
      </button>
    </nav>
  </header>

  <section class="command-strip" aria-label="Primary workflow">
    <div class="command-strip__intro">
      <p class="eyebrow">Convert</p>
      <h1>Paste a page. Keep the Markdown.</h1>
    </div>

    <div class="command-strip__actions" aria-label="Input actions">
      <button
        class="primary-action"
        type="button"
        data-action="open-file"
        title="Open an HTML or text file (Ctrl/Cmd+O)"
        aria-keyshortcuts="Control+O Meta+O"
      >
        Open file
      </button>

      <button
        class="secondary-action"
        type="button"
        data-action="paste-html"
        title="Paste HTML from clipboard (Ctrl/Cmd+Shift+V)"
        aria-keyshortcuts="Control+Shift+V Meta+Shift+V"
      >
        Paste HTML
      </button>

      <button
        class="secondary-action"
        type="button"
        data-action="clear-html"
        title="Clear input (Ctrl/Cmd+Shift+X)"
        aria-keyshortcuts="Control+Shift+X Meta+Shift+X"
      >
        Clear
      </button>
    </div>
  </section>

  <section class="workspace" aria-label="HTML to Markdown workspace">
    <article class="panel panel--input">
      <header class="panel__header">
        <div>
          <p class="panel__kicker">Source</p>
          <h2>HTML</h2>
        </div>

        <p class="panel__hint">Paste rich web content or drop a file.</p>
      </header>

      <textarea
        class="editor"
        id="html-input"
        name="html-input"
        spellcheck="false"
        placeholder="<article>
  <h1>Your copied page</h1>
  <p>Paste rich HTML here.</p>
</article>"
        aria-label="HTML input"
      ></textarea>
    </article>

    <article class="panel panel--output">
      <header class="panel__header">
        <div>
          <p class="panel__kicker">Result</p>
          <h2>Markdown</h2>
        </div>

        <div class="panel__actions">
          <button
            class="text-button"
            type="button"
            data-action="copy-markdown"
            disabled
            title="Copy Markdown to clipboard (Ctrl/Cmd+Shift+C)"
            aria-keyshortcuts="Control+Shift+C Meta+Shift+C"
          >
            Copy
          </button>
          <button
            class="text-button"
            type="button"
            data-action="download-markdown"
            disabled
            title="Download Markdown file (Ctrl/Cmd+Shift+S)"
            aria-keyshortcuts="Control+Shift+S Meta+Shift+S"
          >
            Download
          </button>
        </div>
      </header>

      <textarea
        class="editor editor--output"
        id="markdown-output"
        name="markdown-output"
        spellcheck="false"
        readonly
        placeholder="# Your copied page

Paste HTML on the left. Markdown appears here."
        aria-label="Markdown output"
      ></textarea>
    </article>
  </section>

  <input
    class="file-input"
    type="file"
    data-file-input
    accept=".html,.htm,.xhtml,.xml,.txt,text/html,text/plain,application/xhtml+xml,application/xml"
    aria-label="Open HTML file"
  />

  <footer class="statusbar" aria-live="polite">
    <div class="statusbar__messages">
      <span class="statusbar__primary" data-status-primary>Ready</span>
      <span class="statusbar__secondary" data-status-secondary>Local only</span>
    </div>

    <dl class="metrics" aria-label="Conversion metrics">
      <div class="metric">
        <dt>HTML</dt>
        <dd data-metric-html-characters>0 chars</dd>
      </div>

      <div class="metric">
        <dt>Markdown</dt>
        <dd data-metric-markdown-characters>0 chars</dd>
      </div>

      <div class="metric">
        <dt>Words</dt>
        <dd data-metric-markdown-words>0</dd>
      </div>
    </dl>
  </footer>
`;

function getAppControls(root: HTMLElement): AppControls {
  return {
    input: getRequiredElement(root, '#html-input', HTMLTextAreaElement),
    output: getRequiredElement(root, '#markdown-output', HTMLTextAreaElement),
    fileInput: getRequiredElement(root, '[data-file-input]', HTMLInputElement),
    openButton: getRequiredElement(root, '[data-action="open-file"]', HTMLButtonElement),
    pasteButton: getRequiredElement(root, '[data-action="paste-html"]', HTMLButtonElement),
    copyButton: getRequiredElement(root, '[data-action="copy-markdown"]', HTMLButtonElement),
    downloadButton: getRequiredElement(root, '[data-action="download-markdown"]', HTMLButtonElement),
    clearButton: getRequiredElement(root, '[data-action="clear-html"]', HTMLButtonElement),
    settingsButton: getRequiredElement(root, '[data-action="open-settings"]', HTMLButtonElement),
    statusPrimary: getRequiredElement(root, '[data-status-primary]', HTMLElement),
    statusSecondary: getRequiredElement(root, '[data-status-secondary]', HTMLElement),
    metricHtmlCharacters: getRequiredElement(root, '[data-metric-html-characters]', HTMLElement),
    metricMarkdownCharacters: getRequiredElement(root, '[data-metric-markdown-characters]', HTMLElement),
    metricMarkdownWords: getRequiredElement(root, '[data-metric-markdown-words]', HTMLElement),
  };
}

function getRequiredElement<T extends HTMLElement>(root: HTMLElement, selector: string, constructor: new () => T): T {
  const element = root.querySelector(selector);

  if (!(element instanceof constructor)) {
    throw new Error(`h2m layout failed to find required element: ${selector}`);
  }

  return element;
}

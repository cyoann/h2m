import { convertHtmlToMarkdown } from '../core/converter';
import { applyUiPreferences, loadSettings, saveSettings, type AppSettings } from '../core/settings';
import { createSettingsPanel } from './settings-panel';

interface LayoutControls {
  input: HTMLTextAreaElement;
  output: HTMLTextAreaElement;
  pasteButton: HTMLButtonElement;
  copyButton: HTMLButtonElement;
  clearButton: HTMLButtonElement;
  statusPrimary: HTMLElement;
  statusSecondary: HTMLElement;
}

export function createLayout(): HTMLElement {
  const shell = document.createElement('div');

  let settings = loadSettings();

  shell.className = 'app-shell';
  applyUiPreferences(settings);

  const handleSettingsChange = (nextSettings: AppSettings): void => {
    settings = nextSettings;

    saveSettings(settings);
    applyUiPreferences(settings);
    renderConversion('Settings saved');
  };

  const settingsPanel = createSettingsPanel({
    settings,
    onChange: handleSettingsChange,
  });

  shell.innerHTML = `
    <header class="topbar">
      <a class="brand" href="./" aria-label="h2m home">
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

          <div class="panel__actions">
            <button class="text-button" type="button" data-action="paste-html">
              Paste
            </button>
            <button class="text-button" type="button" data-action="clear-html">
              Clear
            </button>
          </div>
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

          <button class="text-button" type="button" data-action="copy-markdown" disabled>
            Copy
          </button>
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
      <span data-status-primary>Ready</span>
      <span data-status-secondary>Local only</span>
    </footer>
  `;

  shell.append(settingsPanel);

  const controls = getLayoutControls(shell);

  controls.pasteButton.disabled = !canReadClipboard();
  controls.clearButton.disabled = true;

  shell.querySelector<HTMLButtonElement>('[data-action="open-settings"]')?.addEventListener('click', () => {
    settingsPanel.showModal();
  });

  controls.input.addEventListener('input', () => {
    renderConversion();
  });

  controls.pasteButton.addEventListener('click', async () => {
    try {
      controls.input.value = await navigator.clipboard.readText();
      renderConversion('Pasted from clipboard');
      controls.input.focus();
    } catch {
      setStatus('Clipboard paste unavailable', 'Use keyboard paste instead');
      controls.input.focus();
    }
  });

  controls.copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(controls.output.value);
      setStatus('Copied Markdown', `${controls.output.value.length} chars`);
    } catch {
      controls.output.select();
      setStatus('Clipboard copy unavailable', 'Markdown selected');
    }
  });

  controls.clearButton.addEventListener('click', () => {
    controls.input.value = '';
    renderConversion('Cleared');
    controls.input.focus();
  });

  renderConversion();

  return shell;

  function renderConversion(statusMessage?: string): void {
    const result = convertHtmlToMarkdown(controls.input.value, settings);

    controls.output.value = result.markdown;
    controls.copyButton.disabled = result.markdown.length === 0;
    controls.clearButton.disabled = controls.input.value.length === 0;

    const primary = statusMessage ?? getPrimaryStatus(result.inputCharacters);
    const secondary =
      result.inputCharacters === 0
        ? 'Local only'
        : `${result.inputCharacters} HTML chars → ${result.outputCharacters} Markdown chars`;

    setStatus(primary, secondary);
  }

  function setStatus(primary: string, secondary: string): void {
    controls.statusPrimary.textContent = primary;
    controls.statusSecondary.textContent = secondary;
  }
}

function getLayoutControls(root: HTMLElement): LayoutControls {
  return {
    input: getRequiredElement(root, '#html-input', HTMLTextAreaElement),
    output: getRequiredElement(root, '#markdown-output', HTMLTextAreaElement),
    pasteButton: getRequiredElement(root, '[data-action="paste-html"]', HTMLButtonElement),
    copyButton: getRequiredElement(root, '[data-action="copy-markdown"]', HTMLButtonElement),
    clearButton: getRequiredElement(root, '[data-action="clear-html"]', HTMLButtonElement),
    statusPrimary: getRequiredElement(root, '[data-status-primary]', HTMLElement),
    statusSecondary: getRequiredElement(root, '[data-status-secondary]', HTMLElement),
  };
}

function getRequiredElement<T extends HTMLElement>(root: HTMLElement, selector: string, constructor: new () => T): T {
  const element = root.querySelector(selector);

  if (!(element instanceof constructor)) {
    throw new Error(`h2m layout failed to find required element: ${selector}`);
  }

  return element;
}

function getPrimaryStatus(inputCharacters: number): string {
  return inputCharacters === 0 ? 'Ready' : 'Converted';
}

function canReadClipboard(): boolean {
  return typeof navigator.clipboard?.readText === 'function';
}

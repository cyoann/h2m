import { convertHtmlToMarkdown } from '../core/converter';
import { applyUiPreferences, loadSettings, saveSettings, type AppSettings } from '../core/settings';
import {
  canReadPlainClipboard,
  canReadRichClipboard,
  canWriteClipboard,
  readClipboardEventPayload,
  readSystemClipboardPayload,
  type ClipboardPayload,
} from './clipboard';
import { deriveMarkdownFileName, downloadTextFile, isLikelyReadableTextFile, readTextFile } from './files';
import { createSettingsPanel } from './settings-panel';

interface LayoutControls {
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

interface OutputMetrics {
  htmlCharacters: number;
  markdownCharacters: number;
  markdownWords: number;
}

export function createLayout(): HTMLElement {
  const shell = document.createElement('div');

  let settings = loadSettings();
  let currentSourceName = 'h2m.html';
  let dragDepth = 0;

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
        <button
          class="quiet-button"
          type="button"
          data-action="open-settings"
          title="Open settings"
        >
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
            <button
              class="text-button"
              type="button"
              data-action="open-file"
              title="Open an HTML or text file"
            >
              Open
            </button>
            <button
              class="text-button"
              type="button"
              data-action="paste-html"
              title="Paste HTML from clipboard"
            >
              Paste
            </button>
            <button
              class="text-button"
              type="button"
              data-action="clear-html"
              title="Clear input"
            >
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

          <div class="panel__actions">
            <button
              class="text-button"
              type="button"
              data-action="copy-markdown"
              disabled
              title="Copy Markdown to clipboard"
            >
              Copy
            </button>
            <button
              class="text-button"
              type="button"
              data-action="download-markdown"
              disabled
              title="Download Markdown file"
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
          placeholder="# Hello h2m"
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
        <span data-status-primary>Ready</span>
        <span data-status-secondary>Local only</span>
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

  shell.append(settingsPanel);

  const controls = getLayoutControls(shell);

  controls.pasteButton.disabled = !canReadPlainClipboard() && !canReadRichClipboard();
  controls.clearButton.disabled = true;

  controls.settingsButton.addEventListener('click', () => {
    settingsPanel.showModal();
  });

  controls.openButton.addEventListener('click', () => {
    controls.fileInput.click();
  });

  controls.fileInput.addEventListener('change', async () => {
    const file = controls.fileInput.files?.item(0);

    if (file) {
      await loadFile(file);
    }

    controls.fileInput.value = '';
  });

  controls.input.addEventListener('input', () => {
    renderConversion();
  });

  controls.input.addEventListener('paste', (event) => {
    const payload = readClipboardEventPayload(event);

    if (!payload) {
      return;
    }

    event.preventDefault();
    insertAtSelection(controls.input, payload.content);
    currentSourceName = 'clipboard.html';
    renderConversion(getPasteStatus(payload));
  });

  controls.pasteButton.addEventListener('click', async () => {
    await pasteFromClipboard();
  });

  controls.copyButton.addEventListener('click', async () => {
    await copyMarkdown();
  });

  controls.downloadButton.addEventListener('click', () => {
    downloadMarkdown();
  });

  controls.clearButton.addEventListener('click', () => {
    clearInput();
  });

  shell.addEventListener('dragenter', (event) => {
    if (!hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    dragDepth += 1;
    shell.classList.add('is-dragging');
  });

  shell.addEventListener('dragover', (event) => {
    if (!hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  });

  shell.addEventListener('dragleave', (event) => {
    if (!hasDraggedFiles(event)) {
      return;
    }

    dragDepth = Math.max(0, dragDepth - 1);

    if (dragDepth === 0) {
      shell.classList.remove('is-dragging');
    }
  });

  shell.addEventListener('drop', async (event) => {
    if (!hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    dragDepth = 0;
    shell.classList.remove('is-dragging');

    const file = event.dataTransfer?.files.item(0);

    if (file) {
      await loadFile(file);
    }
  });

  shell.addEventListener('keydown', async (event) => {
    await handleShortcut(event, {
      onOpen: () => controls.fileInput.click(),
      onPaste: pasteFromClipboard,
      onCopy: copyMarkdown,
      onDownload: downloadMarkdown,
      onClear: clearInput,
      onSettings: () => {
        settingsPanel.showModal();
      },
    });
  });

  renderConversion();

  return shell;

  async function loadFile(file: File): Promise<void> {
    if (!isLikelyReadableTextFile(file)) {
      setStatus('Unsupported file', 'Use .html, .htm, .xhtml, .xml, or .txt');
      return;
    }

    try {
      const importedFile = await readTextFile(file);

      currentSourceName = importedFile.name;
      controls.input.value = importedFile.content;

      renderConversion(`Opened ${importedFile.name}`);
      controls.input.focus();
    } catch {
      setStatus('Could not read file', 'Try copy and paste instead');
    }
  }

  async function pasteFromClipboard(): Promise<void> {
    try {
      const payload = await readSystemClipboardPayload();

      currentSourceName = 'clipboard.html';
      controls.input.value = payload.content;
      renderConversion(getPasteStatus(payload));
      controls.input.focus();
    } catch {
      setStatus('Clipboard paste denied', 'Use Ctrl/Cmd+V inside the HTML panel');
      controls.input.focus();
    }
  }

  async function copyMarkdown(): Promise<void> {
    if (!controls.output.value) {
      setStatus('Nothing to copy', 'Markdown output is empty');
      return;
    }

    if (canWriteClipboard()) {
      try {
        await navigator.clipboard.writeText(controls.output.value);
        setStatus('Copied Markdown', `${controls.output.value.length} chars`);
        return;
      } catch {
        // Fall through to manual selection.
      }
    }

    controls.output.focus();
    controls.output.select();
    setStatus('Markdown selected', 'Press Ctrl/Cmd+C to copy');
  }

  function downloadMarkdown(): void {
    if (!controls.output.value) {
      setStatus('Nothing to download', 'Markdown output is empty');
      return;
    }

    const fileName = deriveMarkdownFileName(currentSourceName);

    downloadTextFile(controls.output.value, fileName);
    setStatus('Downloaded Markdown', fileName);
  }

  function clearInput(): void {
    currentSourceName = 'h2m.html';
    controls.input.value = '';
    renderConversion('Cleared');
    controls.input.focus();
  }

  function renderConversion(statusMessage?: string): void {
    const result = convertHtmlToMarkdown(controls.input.value, settings);
    const metrics = getOutputMetrics(controls.input.value, result.markdown);

    controls.output.value = result.markdown;
    controls.copyButton.disabled = result.markdown.length === 0;
    controls.downloadButton.disabled = result.markdown.length === 0;
    controls.clearButton.disabled = controls.input.value.length === 0;

    renderMetrics(metrics);

    const primary = statusMessage ?? getPrimaryStatus(metrics.htmlCharacters);
    const secondary =
      metrics.htmlCharacters === 0
        ? 'Local only'
        : `${formatNumber(metrics.htmlCharacters)} HTML chars → ${formatNumber(
            metrics.markdownCharacters,
          )} Markdown chars`;

    setStatus(primary, secondary);
  }

  function renderMetrics(metrics: OutputMetrics): void {
    controls.metricHtmlCharacters.textContent = `${formatNumber(metrics.htmlCharacters)} chars`;

    controls.metricMarkdownCharacters.textContent = `${formatNumber(metrics.markdownCharacters)} chars`;

    controls.metricMarkdownWords.textContent = formatNumber(metrics.markdownWords);
  }

  function setStatus(primary: string, secondary: string): void {
    controls.statusPrimary.textContent = primary;
    controls.statusSecondary.textContent = secondary;
  }
}

interface ShortcutHandlers {
  onOpen: () => void;
  onPaste: () => Promise<void>;
  onCopy: () => Promise<void>;
  onDownload: () => void;
  onClear: () => void;
  onSettings: () => void;
}

async function handleShortcut(event: KeyboardEvent, handlers: ShortcutHandlers): Promise<void> {
  const key = event.key.toLowerCase();
  const hasPrimaryModifier = event.metaKey || event.ctrlKey;

  if (!hasPrimaryModifier) {
    return;
  }

  if (!event.shiftKey && key === 'o') {
    event.preventDefault();
    handlers.onOpen();
    return;
  }

  if (event.shiftKey && key === 'v') {
    event.preventDefault();
    await handlers.onPaste();
    return;
  }

  if (event.shiftKey && key === 'c') {
    event.preventDefault();
    await handlers.onCopy();
    return;
  }

  if (event.shiftKey && key === 's') {
    event.preventDefault();
    handlers.onDownload();
    return;
  }

  if (event.shiftKey && key === 'x') {
    event.preventDefault();
    handlers.onClear();
    return;
  }

  if (key === ',') {
    event.preventDefault();
    handlers.onSettings();
  }
}

function getLayoutControls(root: HTMLElement): LayoutControls {
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

function getOutputMetrics(html: string, markdown: string): OutputMetrics {
  return {
    htmlCharacters: html.length,
    markdownCharacters: markdown.length,
    markdownWords: countWords(markdown),
  };
}

function countWords(value: string): number {
  const words = value.trim().match(/\S+/g);

  return words?.length ?? 0;
}

function insertAtSelection(textarea: HTMLTextAreaElement, value: string): void {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  textarea.setRangeText(value, start, end, 'end');
}

function getPasteStatus(payload: ClipboardPayload): string {
  return payload.format === 'html' ? 'Pasted HTML from clipboard' : 'Pasted plain text from clipboard';
}

function getPrimaryStatus(inputCharacters: number): string {
  return inputCharacters === 0 ? 'Ready' : 'Converted';
}

function hasDraggedFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files');
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

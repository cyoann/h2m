import { convertHtmlToMarkdown } from '../core/converter';
import { formatDraftTimestamp, loadDraft, removeDraft, saveDraft, type DraftState } from '../core/draft';
import { applyUiPreferences, loadSettings, saveSettings, type AppSettings } from '../core/settings';
import { createAppShell, type AppControls } from './app-shell';
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
import { handleShortcut } from './shortcuts';

interface AppState {
  settings: AppSettings;
  currentSourceName: string;
  restoredDraft: DraftState | null;
  dragDepth: number;
}

interface OutputMetrics {
  htmlCharacters: number;
  markdownCharacters: number;
  markdownWords: number;
}

export function createLayout(): HTMLElement {
  const state = createInitialState();

  applyUiPreferences(state.settings);

  const settingsPanel = createSettingsPanel({
    settings: state.settings,
    onChange: handleSettingsChange,
  });
  const { shell, controls } = createAppShell(settingsPanel);

  restoreDraftInput();
  initializeControlState();
  bindActionEvents();
  bindDragAndDrop();
  bindShortcuts();
  renderConversion();

  return shell;

  function handleSettingsChange(nextSettings: AppSettings): void {
    state.settings = nextSettings;

    saveSettings(state.settings);
    applyUiPreferences(state.settings);
    renderConversion('Settings saved');
  }

  function restoreDraftInput(): void {
    if (state.restoredDraft) {
      controls.input.value = state.restoredDraft.html;
    }
  }

  function initializeControlState(): void {
    controls.pasteButton.disabled = !canReadPlainClipboard() && !canReadRichClipboard();
    controls.clearButton.disabled = true;
  }

  function bindActionEvents(): void {
    controls.settingsButton.addEventListener('click', openSettings);

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
      persistCurrentDraft();
      renderConversion();
    });

    controls.input.addEventListener('paste', (event) => {
      const payload = readClipboardEventPayload(event);

      if (!payload) {
        return;
      }

      event.preventDefault();
      insertAtSelection(controls.input, payload.content);
      state.currentSourceName = 'clipboard.html';
      persistCurrentDraft();
      renderConversion(getPasteStatus(payload));
    });

    controls.pasteButton.addEventListener('click', async () => {
      await pasteFromClipboard();
    });

    controls.copyButton.addEventListener('click', async () => {
      await copyMarkdown();
    });

    controls.downloadButton.addEventListener('click', downloadMarkdown);
    controls.clearButton.addEventListener('click', clearInput);
  }

  function bindDragAndDrop(): void {
    shell.addEventListener('dragenter', (event) => {
      if (!hasDraggedFiles(event)) {
        return;
      }

      event.preventDefault();
      state.dragDepth += 1;
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

      state.dragDepth = Math.max(0, state.dragDepth - 1);

      if (state.dragDepth === 0) {
        shell.classList.remove('is-dragging');
      }
    });

    shell.addEventListener('drop', async (event) => {
      if (!hasDraggedFiles(event)) {
        return;
      }

      event.preventDefault();
      state.dragDepth = 0;
      shell.classList.remove('is-dragging');

      const file = event.dataTransfer?.files.item(0);

      if (file) {
        await loadFile(file);
      }
    });
  }

  function bindShortcuts(): void {
    shell.addEventListener('keydown', async (event) => {
      await handleShortcut(event, {
        onOpen: () => controls.fileInput.click(),
        onPaste: pasteFromClipboard,
        onCopy: copyMarkdown,
        onDownload: downloadMarkdown,
        onClear: clearInput,
        onSettings: openSettings,
      });
    });
  }

  function openSettings(): void {
    if (!settingsPanel.open) {
      settingsPanel.showModal();
    }
  }

  async function loadFile(file: File): Promise<void> {
    if (!isLikelyReadableTextFile(file)) {
      setStatus('Unsupported file', 'Use .html, .htm, .xhtml, .xml, or .txt');
      return;
    }

    try {
      const importedFile = await readTextFile(file);

      state.currentSourceName = importedFile.name;
      controls.input.value = importedFile.content;

      persistCurrentDraft();
      renderConversion(`Opened ${importedFile.name}`);
      controls.input.focus();
    } catch {
      setStatus('Could not read file', 'Try copy and paste instead');
    }
  }

  async function pasteFromClipboard(): Promise<void> {
    try {
      const payload = await readSystemClipboardPayload();

      state.currentSourceName = 'clipboard.html';
      controls.input.value = payload.content;
      persistCurrentDraft();
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

    const fileName = deriveMarkdownFileName(state.currentSourceName);

    downloadTextFile(controls.output.value, fileName);
    setStatus('Downloaded Markdown', fileName);
  }

  function clearInput(): void {
    state.currentSourceName = 'h2m.html';
    controls.input.value = '';
    removeDraft();
    renderConversion('Cleared');
    controls.input.focus();
  }

  function persistCurrentDraft(): void {
    const saved = saveDraft({
      html: controls.input.value,
      sourceName: state.currentSourceName,
    });

    if (!saved) {
      setStatus('Draft not saved', 'Browser storage unavailable');
    }
  }

  function renderConversion(statusMessage?: string): void {
    const result = convertHtmlToMarkdown(controls.input.value, state.settings);
    const metrics = getOutputMetrics(result.inputCharacters, result.markdown);

    controls.output.value = result.markdown;
    controls.copyButton.disabled = result.markdown.length === 0;
    controls.downloadButton.disabled = result.markdown.length === 0;
    controls.clearButton.disabled = controls.input.value.length === 0;

    renderMetrics(controls, metrics);
    renderStatus(statusMessage, metrics);
  }

  function renderStatus(statusMessage: string | undefined, metrics: OutputMetrics): void {
    const primary =
      statusMessage ??
      (state.restoredDraft ? `Restored ${state.restoredDraft.sourceName}` : getPrimaryStatus(metrics.htmlCharacters));

    const secondary =
      metrics.htmlCharacters === 0
        ? 'Local only'
        : state.restoredDraft
          ? `Saved locally ${formatDraftTimestamp(state.restoredDraft.updatedAt)}`
          : `${formatNumber(metrics.htmlCharacters)} HTML chars → ${formatNumber(
              metrics.markdownCharacters,
            )} Markdown chars`;

    state.restoredDraft = null;

    setStatus(primary, secondary);
  }

  function setStatus(primary: string, secondary: string): void {
    controls.statusPrimary.textContent = primary;
    controls.statusSecondary.textContent = secondary;
  }
}

function createInitialState(): AppState {
  const restoredDraft = loadDraft();

  return {
    settings: loadSettings(),
    currentSourceName: restoredDraft?.sourceName ?? 'h2m.html',
    restoredDraft,
    dragDepth: 0,
  };
}

function renderMetrics(controls: AppControls, metrics: OutputMetrics): void {
  controls.metricHtmlCharacters.textContent = `${formatNumber(metrics.htmlCharacters)} chars`;
  controls.metricMarkdownCharacters.textContent = `${formatNumber(metrics.markdownCharacters)} chars`;
  controls.metricMarkdownWords.textContent = formatNumber(metrics.markdownWords);
}

function getOutputMetrics(inputCharacters: number, markdown: string): OutputMetrics {
  return {
    htmlCharacters: inputCharacters,
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

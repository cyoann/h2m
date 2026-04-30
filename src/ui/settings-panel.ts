import {
  DEFAULT_SETTINGS,
  type AppSettings,
  type BulletListMarker,
  type CodeBlockStyle,
  type DensityPreference,
  type HeadingStyle,
  type ImageMode,
  type LinkMode,
  type TableMode,
  type ThemePreference,
} from '../core/settings';

interface SettingsPanelOptions {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
}

const headingStyles = ['atx', 'setext'] as const satisfies readonly HeadingStyle[];
const codeBlockStyles = ['fenced', 'indented'] as const satisfies readonly CodeBlockStyle[];
const bulletListMarkers = ['-', '*', '+'] as const satisfies readonly BulletListMarker[];
const themePreferences = ['system', 'light', 'dark'] as const satisfies readonly ThemePreference[];
const densityPreferences = ['comfortable', 'compact'] as const satisfies readonly DensityPreference[];
const linkModes = ['preserve', 'text'] as const satisfies readonly LinkMode[];
const imageModes = ['markdown', 'alt', 'remove'] as const satisfies readonly ImageMode[];
const tableModes = ['markdown', 'html', 'text'] as const satisfies readonly TableMode[];

export function createSettingsPanel({ settings, onChange }: SettingsPanelOptions): HTMLDialogElement {
  const dialog = document.createElement('dialog');

  dialog.className = 'settings-dialog';
  dialog.setAttribute('aria-labelledby', 'settings-title');

  dialog.innerHTML = `
    <form class="settings-card" method="dialog">
      <header class="settings-card__header">
        <div>
          <p class="eyebrow">Preferences</p>
          <h2 id="settings-title">Settings</h2>
        </div>

        <button class="icon-button" type="submit" aria-label="Close settings">
          ×
        </button>
      </header>

      <div class="settings-card__body">
        <fieldset class="setting-group">
          <legend>Conversion format</legend>

          <label class="field-row">
            <span>
              <strong>Heading style</strong>
              <small>Controls how HTML headings become Markdown headings.</small>
            </span>
            <select name="headingStyle">
              <option value="atx" ${selected(settings.headingStyle, 'atx')}>ATX — # Heading</option>
              <option value="setext" ${selected(settings.headingStyle, 'setext')}>Setext — underlined</option>
            </select>
          </label>

          <label class="field-row">
            <span>
              <strong>Code blocks</strong>
              <small>Choose fenced blocks for portable Markdown.</small>
            </span>
            <select name="codeBlockStyle">
              <option value="fenced" ${selected(settings.codeBlockStyle, 'fenced')}>Fenced — triple backticks</option>
              <option value="indented" ${selected(settings.codeBlockStyle, 'indented')}>Indented — four spaces</option>
            </select>
          </label>

          <label class="field-row">
            <span>
              <strong>Bullet marker</strong>
              <small>Controls unordered list output.</small>
            </span>
            <select name="bulletListMarker">
              <option value="-" ${selected(settings.bulletListMarker, '-')}>Dash — -</option>
              <option value="*" ${selected(settings.bulletListMarker, '*')}>Asterisk — *</option>
              <option value="+" ${selected(settings.bulletListMarker, '+')}>Plus — +</option>
            </select>
          </label>
        </fieldset>

        <fieldset class="setting-group">
          <legend>Rules</legend>

          <label class="field-row">
            <span>
              <strong>Links</strong>
              <small>Preserve destinations or keep readable text only.</small>
            </span>
            <select name="linkMode">
              <option value="preserve" ${selected(settings.linkMode, 'preserve')}>Preserve Markdown links</option>
              <option value="text" ${selected(settings.linkMode, 'text')}>Text only</option>
            </select>
          </label>

          <label class="field-row">
            <span>
              <strong>Images</strong>
              <small>Choose how copied article images should appear.</small>
            </span>
            <select name="imageMode">
              <option value="markdown" ${selected(settings.imageMode, 'markdown')}>Markdown images</option>
              <option value="alt" ${selected(settings.imageMode, 'alt')}>Alt text only</option>
              <option value="remove" ${selected(settings.imageMode, 'remove')}>Remove images</option>
            </select>
          </label>

          <label class="check-row">
            <input type="checkbox" name="enableStrikethrough" ${checked(settings.enableStrikethrough)} />
            <span>
              <strong>Strikethrough</strong>
              <small>Convert deleted text into ~~Markdown~~ syntax.</small>
            </span>
          </label>

          <label class="check-row">
            <input type="checkbox" name="enableTaskListItems" ${checked(settings.enableTaskListItems)} />
            <span>
              <strong>Task lists</strong>
              <small>Convert checkbox list items into GitHub-style [ ] and [x] tasks.</small>
            </span>
          </label>

          <label class="check-row">
            <input
              type="checkbox"
              name="enableHighlightedCodeBlocks"
              ${checked(settings.enableHighlightedCodeBlocks)}
            />
            <span>
              <strong>Code block languages</strong>
              <small>Preserve detected language names on fenced code blocks.</small>
            </span>
          </label>

          <label class="field-row">
            <span>
              <strong>Tables</strong>
              <small>Convert simple tables to Markdown, preserve complex tables as HTML, or flatten them.</small>
            </span>
            <select name="tableMode">
              <option value="markdown" ${selected(settings.tableMode, 'markdown')}>Markdown table</option>
              <option value="html" ${selected(settings.tableMode, 'html')}>Sanitized HTML</option>
              <option value="text" ${selected(settings.tableMode, 'text')}>Plain text</option>
            </select>
          </label>

          <label class="check-row">
            <input type="checkbox" name="removeComments" ${checked(settings.removeComments)} />
            <span>
              <strong>Remove comments</strong>
              <small>Strip HTML comments before conversion.</small>
            </span>
          </label>
        </fieldset>

        <fieldset class="setting-group">
          <legend>Interface</legend>

          <label class="field-row">
            <span>
              <strong>Theme</strong>
              <small>Follow your system theme, or force light or dark mode.</small>
            </span>
            <select name="theme">
              <option value="system" ${selected(settings.theme, 'system')}>System</option>
              <option value="light" ${selected(settings.theme, 'light')}>Light</option>
              <option value="dark" ${selected(settings.theme, 'dark')}>Dark</option>
            </select>
          </label>

          <label class="field-row">
            <span>
              <strong>Layout density</strong>
              <small>Choose comfortable spacing or a more compact workspace.</small>
            </span>
            <select name="density">
              <option value="comfortable" ${selected(settings.density, 'comfortable')}>Comfortable</option>
              <option value="compact" ${selected(settings.density, 'compact')}>Compact</option>
            </select>
          </label>
        </fieldset>
      </div>

      <footer class="settings-card__footer">
        <button class="text-button" type="button" data-action="reset-settings">
          Reset
        </button>
        <button class="primary-button" type="submit">Done</button>
      </footer>
    </form>
  `;

  const form = dialog.querySelector<HTMLFormElement>('.settings-card');
  const resetButton = dialog.querySelector<HTMLButtonElement>('[data-action="reset-settings"]');

  if (!form || !resetButton) {
    throw new Error('h2m settings panel failed to initialize.');
  }

  form.addEventListener('change', () => {
    onChange(readSettingsFromForm(form));
  });

  resetButton.addEventListener('click', () => {
    writeSettingsToForm(form, DEFAULT_SETTINGS);
    onChange({ ...DEFAULT_SETTINGS });
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  return dialog;
}

function readSettingsFromForm(form: HTMLFormElement): AppSettings {
  const data = new FormData(form);

  return {
    headingStyle: readChoice(data.get('headingStyle'), headingStyles, DEFAULT_SETTINGS.headingStyle),
    codeBlockStyle: readChoice(data.get('codeBlockStyle'), codeBlockStyles, DEFAULT_SETTINGS.codeBlockStyle),
    bulletListMarker: readChoice(data.get('bulletListMarker'), bulletListMarkers, DEFAULT_SETTINGS.bulletListMarker),
    removeComments: data.get('removeComments') === 'on',

    linkMode: readChoice(data.get('linkMode'), linkModes, DEFAULT_SETTINGS.linkMode),
    imageMode: readChoice(data.get('imageMode'), imageModes, DEFAULT_SETTINGS.imageMode),
    tableMode: readChoice(data.get('tableMode'), tableModes, DEFAULT_SETTINGS.tableMode),
    enableStrikethrough: data.get('enableStrikethrough') === 'on',
    enableTaskListItems: data.get('enableTaskListItems') === 'on',
    enableHighlightedCodeBlocks: data.get('enableHighlightedCodeBlocks') === 'on',

    theme: readChoice(data.get('theme'), themePreferences, DEFAULT_SETTINGS.theme),
    density: readChoice(data.get('density'), densityPreferences, DEFAULT_SETTINGS.density),
  };
}

function writeSettingsToForm(form: HTMLFormElement, settings: AppSettings): void {
  getFormSelect(form, 'headingStyle').value = settings.headingStyle;
  getFormSelect(form, 'codeBlockStyle').value = settings.codeBlockStyle;
  getFormSelect(form, 'bulletListMarker').value = settings.bulletListMarker;
  getFormSelect(form, 'linkMode').value = settings.linkMode;
  getFormSelect(form, 'imageMode').value = settings.imageMode;
  getFormSelect(form, 'tableMode').value = settings.tableMode;
  getFormSelect(form, 'theme').value = settings.theme;
  getFormSelect(form, 'density').value = settings.density;

  getFormCheckbox(form, 'removeComments').checked = settings.removeComments;
  getFormCheckbox(form, 'enableStrikethrough').checked = settings.enableStrikethrough;
  getFormCheckbox(form, 'enableTaskListItems').checked = settings.enableTaskListItems;
  getFormCheckbox(form, 'enableHighlightedCodeBlocks').checked = settings.enableHighlightedCodeBlocks;
}

function getFormSelect(form: HTMLFormElement, name: string): HTMLSelectElement {
  const field = form.elements.namedItem(name);

  if (!(field instanceof HTMLSelectElement)) {
    throw new Error(`Missing settings select: ${name}`);
  }

  return field;
}

function getFormCheckbox(form: HTMLFormElement, name: string): HTMLInputElement {
  const field = form.elements.namedItem(name);

  if (!(field instanceof HTMLInputElement) || field.type !== 'checkbox') {
    throw new Error(`Missing settings checkbox: ${name}`);
  }

  return field;
}

function readChoice<T extends string>(value: FormDataEntryValue | null, allowedValues: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowedValues.includes(value as T) ? (value as T) : fallback;
}

function selected(currentValue: string, optionValue: string): string {
  return currentValue === optionValue ? 'selected' : '';
}

function checked(value: boolean): string {
  return value ? 'checked' : '';
}

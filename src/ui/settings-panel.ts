import {
  DEFAULT_SETTINGS,
  type AppSettings,
  type BulletListMarker,
  type CodeBlockStyle,
  type HeadingStyle,
  type ImageMode,
  type LinkMode,
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
const linkModes = ['preserve', 'text'] as const satisfies readonly LinkMode[];
const imageModes = ['markdown', 'alt', 'remove'] as const satisfies readonly ImageMode[];

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
            <input type="checkbox" name="preserveTables" ${checked(settings.preserveTables)} />
            <span>
              <strong>Preserve tables as HTML</strong>
              <small>Keep sanitized tables instead of flattening their text.</small>
            </span>
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
              <small>System mode is the default Zen behavior.</small>
            </span>
            <select name="theme">
              <option value="system" ${selected(settings.theme, 'system')}>System</option>
              <option value="light" ${selected(settings.theme, 'light')}>Light</option>
              <option value="dark" ${selected(settings.theme, 'dark')}>Dark</option>
            </select>
          </label>

          <label class="check-row">
            <input type="checkbox" name="zenDensity" ${checked(settings.zenDensity)} />
            <span>
              <strong>Zen spacing</strong>
              <small>Use generous whitespace and taller writing surfaces.</small>
            </span>
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
    enableStrikethrough: data.get('enableStrikethrough') === 'on',
    preserveTables: data.get('preserveTables') === 'on',

    theme: readChoice(data.get('theme'), themePreferences, DEFAULT_SETTINGS.theme),
    zenDensity: data.get('zenDensity') === 'on',
  };
}

function writeSettingsToForm(form: HTMLFormElement, settings: AppSettings): void {
  getFormSelect(form, 'headingStyle').value = settings.headingStyle;
  getFormSelect(form, 'codeBlockStyle').value = settings.codeBlockStyle;
  getFormSelect(form, 'bulletListMarker').value = settings.bulletListMarker;
  getFormSelect(form, 'linkMode').value = settings.linkMode;
  getFormSelect(form, 'imageMode').value = settings.imageMode;
  getFormSelect(form, 'theme').value = settings.theme;

  getFormCheckbox(form, 'removeComments').checked = settings.removeComments;
  getFormCheckbox(form, 'enableStrikethrough').checked = settings.enableStrikethrough;
  getFormCheckbox(form, 'preserveTables').checked = settings.preserveTables;
  getFormCheckbox(form, 'zenDensity').checked = settings.zenDensity;
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

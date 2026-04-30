export type HeadingStyle = 'setext' | 'atx';
export type CodeBlockStyle = 'indented' | 'fenced';
export type BulletListMarker = '-' | '+' | '*';
export type ThemePreference = 'system' | 'light' | 'dark';
export type DensityPreference = 'comfortable' | 'compact';

export type LinkMode = 'preserve' | 'text';
export type ImageMode = 'markdown' | 'alt' | 'remove';
export type TableMode = 'markdown' | 'html' | 'text';

export interface AppSettings {
  headingStyle: HeadingStyle;
  codeBlockStyle: CodeBlockStyle;
  bulletListMarker: BulletListMarker;
  removeComments: boolean;

  linkMode: LinkMode;
  imageMode: ImageMode;
  tableMode: TableMode;
  enableStrikethrough: boolean;
  enableTaskListItems: boolean;
  enableHighlightedCodeBlocks: boolean;

  theme: ThemePreference;
  density: DensityPreference;
}

const STORAGE_KEY = 'h2m:settings:v1';

const headingStyles = ['setext', 'atx'] as const;
const codeBlockStyles = ['indented', 'fenced'] as const;
const bulletListMarkers = ['-', '+', '*'] as const;
const themePreferences = ['system', 'light', 'dark'] as const;
const densityPreferences = ['comfortable', 'compact'] as const;
const linkModes = ['preserve', 'text'] as const;
const imageModes = ['markdown', 'alt', 'remove'] as const;
const tableModes = ['markdown', 'html', 'text'] as const;

export const DEFAULT_SETTINGS: AppSettings = {
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  removeComments: true,

  linkMode: 'preserve',
  imageMode: 'markdown',
  tableMode: 'markdown',
  enableStrikethrough: true,
  enableTaskListItems: true,
  enableHighlightedCodeBlocks: true,

  theme: 'system',
  density: 'comfortable',
};

export function loadSettings(storage: Storage = globalThis.localStorage): AppSettings {
  try {
    const rawSettings = storage.getItem(STORAGE_KEY);

    if (!rawSettings) {
      return { ...DEFAULT_SETTINGS };
    }

    return parseSettings(JSON.parse(rawSettings));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings, storage: Storage = globalThis.localStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function applyUiPreferences(settings: AppSettings, root: HTMLElement = document.documentElement): void {
  root.dataset.theme = settings.theme;
  root.dataset.density = settings.density;

  root.style.colorScheme = settings.theme === 'system' ? 'light dark' : settings.theme;
}

function parseSettings(value: unknown): AppSettings {
  if (!isRecord(value)) {
    return { ...DEFAULT_SETTINGS };
  }

  return {
    headingStyle: readChoice(value.headingStyle, headingStyles, DEFAULT_SETTINGS.headingStyle),
    codeBlockStyle: readChoice(value.codeBlockStyle, codeBlockStyles, DEFAULT_SETTINGS.codeBlockStyle),
    bulletListMarker: readChoice(value.bulletListMarker, bulletListMarkers, DEFAULT_SETTINGS.bulletListMarker),
    removeComments: readBoolean(value.removeComments, DEFAULT_SETTINGS.removeComments),

    linkMode: readChoice(value.linkMode, linkModes, DEFAULT_SETTINGS.linkMode),
    imageMode: readChoice(value.imageMode, imageModes, DEFAULT_SETTINGS.imageMode),
    tableMode: readChoice(value.tableMode, tableModes, readLegacyTableMode(value.preserveTables)),
    enableStrikethrough: readBoolean(value.enableStrikethrough, DEFAULT_SETTINGS.enableStrikethrough),
    enableTaskListItems: readBoolean(value.enableTaskListItems, DEFAULT_SETTINGS.enableTaskListItems),
    enableHighlightedCodeBlocks: readBoolean(
      value.enableHighlightedCodeBlocks,
      DEFAULT_SETTINGS.enableHighlightedCodeBlocks,
    ),

    theme: readChoice(value.theme, themePreferences, DEFAULT_SETTINGS.theme),
    density: readChoice(value.density, densityPreferences, readLegacyDensity(value.zenDensity)),
  };
}

function readLegacyDensity(value: unknown): DensityPreference {
  if (value === false) {
    return 'compact';
  }

  if (value === true) {
    return 'comfortable';
  }

  return DEFAULT_SETTINGS.density;
}

function readLegacyTableMode(value: unknown): TableMode {
  if (value === true) {
    return 'html';
  }

  if (value === false) {
    return 'markdown';
  }

  return DEFAULT_SETTINGS.tableMode;
}

function readChoice<T extends string>(value: unknown, allowedValues: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowedValues.includes(value as T) ? (value as T) : fallback;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

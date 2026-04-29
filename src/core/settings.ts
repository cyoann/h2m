export type HeadingStyle = 'setext' | 'atx';
export type CodeBlockStyle = 'indented' | 'fenced';
export type BulletListMarker = '-' | '+' | '*';
export type ThemePreference = 'system' | 'light' | 'dark';

export interface AppSettings {
  headingStyle: HeadingStyle;
  codeBlockStyle: CodeBlockStyle;
  bulletListMarker: BulletListMarker;
  removeComments: boolean;
  theme: ThemePreference;
  zenDensity: boolean;
}

const STORAGE_KEY = 'h2m:settings:v1';

const headingStyles = ['setext', 'atx'] as const;
const codeBlockStyles = ['indented', 'fenced'] as const;
const bulletListMarkers = ['-', '+', '*'] as const;
const themePreferences = ['system', 'light', 'dark'] as const;

export const DEFAULT_SETTINGS: AppSettings = {
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  removeComments: true,
  theme: 'system',
  zenDensity: true,
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
  root.dataset.density = settings.zenDensity ? 'zen' : 'compact';

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
    theme: readChoice(value.theme, themePreferences, DEFAULT_SETTINGS.theme),
    zenDensity: readBoolean(value.zenDensity, DEFAULT_SETTINGS.zenDensity),
  };
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

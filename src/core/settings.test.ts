import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, applyUiPreferences, loadSettings, saveSettings, type AppSettings } from './settings';

class MemoryStorage implements Storage {
  private readonly items = new Map<string, string>();

  get length(): number {
    return this.items.size;
  }

  clear(): void {
    this.items.clear();
  }

  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.items.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.items.delete(key);
  }

  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }
}

describe('settings', () => {
  it('loads defaults when storage is empty', () => {
    const storage = new MemoryStorage();

    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
  });

  it('falls back to defaults for invalid stored values', () => {
    const storage = new MemoryStorage();

    storage.setItem(
      'h2m:settings:v1',
      JSON.stringify({
        headingStyle: 'invalid',
        codeBlockStyle: 'wrong',
        bulletListMarker: '~',
        removeComments: 'yes',
        theme: 'solarized',
        zenDensity: 'no',
      }),
    );

    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
  });

  it('saves and reloads valid settings', () => {
    const storage = new MemoryStorage();

    const settings: AppSettings = {
      headingStyle: 'setext',
      codeBlockStyle: 'indented',
      bulletListMarker: '*',
      removeComments: false,
      theme: 'dark',
      zenDensity: false,
    };

    saveSettings(settings, storage);

    expect(loadSettings(storage)).toEqual(settings);
  });

  it('applies UI preferences to the document root', () => {
    const root = document.createElement('html');

    applyUiPreferences(
      {
        ...DEFAULT_SETTINGS,
        theme: 'dark',
        zenDensity: false,
      },
      root,
    );

    expect(root.dataset.theme).toBe('dark');
    expect(root.dataset.density).toBe('compact');
    expect(root.style.colorScheme).toBe('dark');
  });
});

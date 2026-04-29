import { describe, expect, it } from 'vitest';
import { formatDraftTimestamp, loadDraft, removeDraft, saveDraft } from './draft';

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

describe('draft persistence', () => {
  it('returns null when no draft exists', () => {
    const storage = new MemoryStorage();

    expect(loadDraft(storage)).toBeNull();
  });

  it('saves and loads a draft', () => {
    const storage = new MemoryStorage();

    const saved = saveDraft(
      {
        html: '<h1>Hello</h1>',
        sourceName: 'article.html',
      },
      storage,
    );

    const draft = loadDraft(storage);

    expect(saved).toBe(true);
    expect(draft?.html).toBe('<h1>Hello</h1>');
    expect(draft?.sourceName).toBe('article.html');
    expect(typeof draft?.updatedAt).toBe('string');
  });

  it('removes the draft when saving empty input', () => {
    const storage = new MemoryStorage();

    saveDraft(
      {
        html: '<p>Keep me</p>',
        sourceName: 'article.html',
      },
      storage,
    );

    saveDraft(
      {
        html: '   ',
        sourceName: 'article.html',
      },
      storage,
    );

    expect(loadDraft(storage)).toBeNull();
  });

  it('ignores malformed stored data', () => {
    const storage = new MemoryStorage();

    storage.setItem('h2m:draft:v1', JSON.stringify({ html: 42 }));

    expect(loadDraft(storage)).toBeNull();
  });

  it('removes a saved draft', () => {
    const storage = new MemoryStorage();

    saveDraft(
      {
        html: '<h1>Hello</h1>',
        sourceName: 'article.html',
      },
      storage,
    );

    removeDraft(storage);

    expect(loadDraft(storage)).toBeNull();
  });

  it('formats valid draft timestamps', () => {
    const result = formatDraftTimestamp('2026-04-30T12:30:00.000Z', 'en-US');

    expect(result).toContain('2026');
  });

  it('handles invalid draft timestamps', () => {
    expect(formatDraftTimestamp('not-a-date')).toBe('unknown time');
  });
});

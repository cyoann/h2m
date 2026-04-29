export interface DraftState {
  html: string;
  sourceName: string;
  updatedAt: string;
}

export interface SaveDraftInput {
  html: string;
  sourceName: string;
}

const STORAGE_KEY = 'h2m:draft:v1';

export function loadDraft(storage: Storage = globalThis.localStorage): DraftState | null {
  try {
    const rawDraft = storage.getItem(STORAGE_KEY);

    if (!rawDraft) {
      return null;
    }

    return parseDraft(JSON.parse(rawDraft));
  } catch {
    return null;
  }
}

export function saveDraft(draft: SaveDraftInput, storage: Storage = globalThis.localStorage): boolean {
  try {
    if (!draft.html.trim()) {
      removeDraft(storage);
      return true;
    }

    const nextDraft: DraftState = {
      html: draft.html,
      sourceName: draft.sourceName.trim() || 'h2m.html',
      updatedAt: new Date().toISOString(),
    };

    storage.setItem(STORAGE_KEY, JSON.stringify(nextDraft));
    return true;
  } catch {
    return false;
  }
}

export function removeDraft(storage: Storage = globalThis.localStorage): void {
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Storage may be unavailable in restricted browser modes.
  }
}

export function formatDraftTimestamp(isoTimestamp: string, locale = navigator.language): string {
  const date = new Date(isoTimestamp);

  if (Number.isNaN(date.getTime())) {
    return 'unknown time';
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function parseDraft(value: unknown): DraftState | null {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.html !== 'string' || typeof value.sourceName !== 'string' || typeof value.updatedAt !== 'string') {
    return null;
  }

  if (!value.html.trim()) {
    return null;
  }

  return {
    html: value.html,
    sourceName: value.sourceName.trim() || 'h2m.html',
    updatedAt: value.updatedAt,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

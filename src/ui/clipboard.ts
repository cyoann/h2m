export interface ClipboardPayload {
  content: string;
  format: 'html' | 'text';
}

export function readClipboardEventPayload(event: ClipboardEvent): ClipboardPayload | null {
  const data = event.clipboardData;

  if (!data) {
    return null;
  }

  const html = data.getData('text/html');

  if (html.trim()) {
    return {
      content: html,
      format: 'html',
    };
  }

  const text = data.getData('text/plain');

  if (text.trim()) {
    return {
      content: text,
      format: 'text',
    };
  }

  return null;
}

export async function readSystemClipboardPayload(): Promise<ClipboardPayload> {
  if (canReadRichClipboard()) {
    try {
      const items = await navigator.clipboard.read();

      for (const item of items) {
        if (item.types.includes('text/html')) {
          const blob = await item.getType('text/html');

          return {
            content: await blob.text(),
            format: 'html',
          };
        }
      }

      for (const item of items) {
        if (item.types.includes('text/plain')) {
          const blob = await item.getType('text/plain');

          return {
            content: await blob.text(),
            format: 'text',
          };
        }
      }
    } catch {
      // Fall back to readText below.
    }
  }

  if (canReadPlainClipboard()) {
    return {
      content: await navigator.clipboard.readText(),
      format: 'text',
    };
  }

  throw new Error('Clipboard read is unavailable.');
}

export function canReadPlainClipboard(): boolean {
  return window.isSecureContext && typeof navigator.clipboard?.readText === 'function';
}

export function canReadRichClipboard(): boolean {
  return window.isSecureContext && typeof navigator.clipboard?.read === 'function';
}

export function canWriteClipboard(): boolean {
  return window.isSecureContext && typeof navigator.clipboard?.writeText === 'function';
}

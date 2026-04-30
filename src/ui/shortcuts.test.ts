import { describe, expect, it, vi } from 'vitest';
import { handleShortcut, type ShortcutHandlers } from './shortcuts';

function createHandlers(): ShortcutHandlers {
  return {
    onOpen: vi.fn(),
    onPaste: vi.fn(async () => {}),
    onCopy: vi.fn(async () => {}),
    onDownload: vi.fn(),
    onClear: vi.fn(),
    onSettings: vi.fn(),
  };
}

describe('handleShortcut', () => {
  it('opens files with Ctrl+O', async () => {
    const handlers = createHandlers();
    const event = createShortcutEvent('o', { ctrlKey: true });

    await handleShortcut(event, handlers);

    expect(handlers.onOpen).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
  });

  it('keeps the native paste shortcut available', async () => {
    const handlers = createHandlers();
    const event = createShortcutEvent('v', { ctrlKey: true });

    await handleShortcut(event, handlers);

    expect(handlers.onPaste).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('pastes from the system clipboard with Ctrl+Shift+V', async () => {
    const handlers = createHandlers();
    const event = createShortcutEvent('v', { ctrlKey: true, shiftKey: true });

    await handleShortcut(event, handlers);

    expect(handlers.onPaste).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
  });

  it('opens settings with Ctrl+Comma', async () => {
    const handlers = createHandlers();
    const event = createShortcutEvent(',', { ctrlKey: true });

    await handleShortcut(event, handlers);

    expect(handlers.onSettings).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
  });

  it('ignores keys without Ctrl or Command', async () => {
    const handlers = createHandlers();
    const event = createShortcutEvent('o');

    await handleShortcut(event, handlers);

    expect(handlers.onOpen).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });
});

function createShortcutEvent(
  key: string,
  options: Pick<KeyboardEventInit, 'ctrlKey' | 'metaKey' | 'shiftKey'> = {},
): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  });
}

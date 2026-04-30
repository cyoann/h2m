export interface ShortcutHandlers {
  onOpen: () => void;
  onPaste: () => Promise<void>;
  onCopy: () => Promise<void>;
  onDownload: () => void;
  onClear: () => void;
  onSettings: () => void;
}

export async function handleShortcut(event: KeyboardEvent, handlers: ShortcutHandlers): Promise<void> {
  const key = event.key.toLowerCase();
  const hasPrimaryModifier = event.metaKey || event.ctrlKey;

  if (!hasPrimaryModifier) {
    return;
  }

  if (!event.shiftKey && key === 'o') {
    event.preventDefault();
    handlers.onOpen();
    return;
  }

  if (event.shiftKey && key === 'v') {
    event.preventDefault();
    await handlers.onPaste();
    return;
  }

  if (event.shiftKey && key === 'c') {
    event.preventDefault();
    await handlers.onCopy();
    return;
  }

  if (event.shiftKey && key === 's') {
    event.preventDefault();
    handlers.onDownload();
    return;
  }

  if (event.shiftKey && key === 'x') {
    event.preventDefault();
    handlers.onClear();
    return;
  }

  if (key === ',') {
    event.preventDefault();
    handlers.onSettings();
  }
}

import { createLayout } from '../ui/layout';

export function startApp(root: HTMLElement | null): void {
  if (!root) {
    throw new Error('h2m failed to start: missing #app root element.');
  }

  root.replaceChildren(createLayout());
}

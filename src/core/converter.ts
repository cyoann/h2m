import TurndownService from 'turndown';
import type { AppSettings } from './settings';
import { sanitizeHtml } from './sanitizer';

export interface ConversionResult {
  markdown: string;
  sanitizedHtml: string;
  inputCharacters: number;
  outputCharacters: number;
}

export function convertHtmlToMarkdown(dirtyHtml: string, settings: AppSettings): ConversionResult {
  const sanitizedHtml = sanitizeHtml(dirtyHtml, {
    removeComments: settings.removeComments,
  });

  if (!sanitizedHtml.trim()) {
    return {
      markdown: '',
      sanitizedHtml,
      inputCharacters: dirtyHtml.length,
      outputCharacters: 0,
    };
  }

  const service = createTurndownService(settings);
  const markdown = normalizeMarkdown(service.turndown(sanitizedHtml));

  return {
    markdown,
    sanitizedHtml,
    inputCharacters: dirtyHtml.length,
    outputCharacters: markdown.length,
  };
}

function createTurndownService(settings: AppSettings): TurndownService {
  const service = new TurndownService({
    headingStyle: settings.headingStyle,
    bulletListMarker: settings.bulletListMarker,
    codeBlockStyle: settings.codeBlockStyle,
    fence: '```',
    emDelimiter: '_',
    strongDelimiter: '**',
    linkStyle: 'inlined',
  });

  service.remove(['script', 'style', 'noscript']);

  service.addRule('strikethrough', {
    filter: ['del', 's', 'strike'],
    replacement(content) {
      return content ? `~~${content}~~` : '';
    },
  });

  return service;
}

function normalizeMarkdown(markdown: string): string {
  return markdown
    .split('\n')
    .map(normalizeListMarkerSpacing)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+|\n+$/g, '');
}

function normalizeListMarkerSpacing(line: string): string {
  return line.replace(/^([-+*]) {2,}(?=\S)/, '$1 ').replace(/^(\d+[.)]) {2,}(?=\S)/, '$1 ');
}

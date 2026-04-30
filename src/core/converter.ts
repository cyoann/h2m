import TurndownService from 'turndown';
import type { AppSettings } from './settings';
import { applyGfmRules, prepareGfmHtmlForConversion } from './gfm';
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
  const htmlForConversion = prepareGfmHtmlForConversion(sanitizedHtml, settings);
  const markdown = normalizeMarkdown(service.turndown(htmlForConversion));

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

  applyLinkRules(service, settings);
  applyImageRules(service, settings);
  applyStrikethroughRules(service, settings);
  applyGfmRules(service, settings);

  return service;
}

function applyLinkRules(service: TurndownService, settings: AppSettings): void {
  if (settings.linkMode === 'preserve') {
    return;
  }

  service.addRule('linksAsText', {
    filter(node) {
      return node.nodeName === 'A';
    },
    replacement(content) {
      return content;
    },
  });
}

function applyImageRules(service: TurndownService, settings: AppSettings): void {
  if (settings.imageMode === 'markdown') {
    return;
  }

  service.addRule('customImages', {
    filter(node) {
      return node.nodeName === 'IMG';
    },
    replacement(_content, node) {
      if (!(node instanceof HTMLImageElement)) {
        return '';
      }

      if (settings.imageMode === 'remove') {
        return '';
      }

      return node.alt.trim();
    },
  });
}

function applyStrikethroughRules(service: TurndownService, settings: AppSettings): void {
  service.addRule('strikethrough', {
    filter(node) {
      return ['DEL', 'S', 'STRIKE'].includes(node.nodeName);
    },
    replacement(content) {
      if (!content) {
        return '';
      }

      return settings.enableStrikethrough ? `~~${content}~~` : content;
    },
  });
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

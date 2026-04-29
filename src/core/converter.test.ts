import { describe, expect, it } from 'vitest';
import { convertHtmlToMarkdown } from './converter';
import { DEFAULT_SETTINGS, type AppSettings } from './settings';

describe('convertHtmlToMarkdown', () => {
  it('converts basic HTML into clean Markdown', () => {
    const result = convertHtmlToMarkdown(
      `
        <h1>Hello h2m</h1>
        <p>This is <strong>clean</strong> text.</p>
        <ul>
          <li>One</li>
          <li>Two</li>
        </ul>
      `,
      DEFAULT_SETTINGS,
    );

    expect(result.markdown).toBe(['# Hello h2m', '', 'This is **clean** text.', '', '- One', '- Two'].join('\n'));
  });

  it('sanitizes before converting', () => {
    const result = convertHtmlToMarkdown(
      `
        <h1>Hello</h1>
        <img src="x" onerror="alert(1)">
        <script>alert('bad')</script>
      `,
      DEFAULT_SETTINGS,
    );

    expect(result.markdown).toContain('# Hello');
    expect(result.markdown).toContain('![](x)');
    expect(result.markdown).not.toContain('alert');
    expect(result.sanitizedHtml).not.toContain('onerror');
    expect(result.sanitizedHtml).not.toContain('<script');
  });

  it('respects setext heading style', () => {
    const settings: AppSettings = {
      ...DEFAULT_SETTINGS,
      headingStyle: 'setext',
    };

    const result = convertHtmlToMarkdown('<h1>Hello</h1>', settings);

    expect(result.markdown).toBe(['Hello', '====='].join('\n'));
  });

  it('respects bullet marker preference', () => {
    const settings: AppSettings = {
      ...DEFAULT_SETTINGS,
      bulletListMarker: '*',
    };

    const result = convertHtmlToMarkdown('<ul><li>One</li><li>Two</li></ul>', settings);

    expect(result.markdown).toBe(['* One', '* Two'].join('\n'));
  });

  it('converts strikethrough tags', () => {
    const result = convertHtmlToMarkdown(
      '<p><del>Deleted</del> <s>Removed</s> <strike>Old</strike></p>',
      DEFAULT_SETTINGS,
    );

    expect(result.markdown).toBe('~~Deleted~~ ~~Removed~~ ~~Old~~');
  });

  it('returns empty Markdown for empty sanitized input', () => {
    const result = convertHtmlToMarkdown('<script>alert("bad")</script>', DEFAULT_SETTINGS);

    expect(result.markdown).toBe('');
    expect(result.outputCharacters).toBe(0);
  });
});

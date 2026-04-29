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

  it('can convert links to text only', () => {
    const result = convertHtmlToMarkdown('<p>Read <a href="https://example.com">the article</a>.</p>', {
      ...DEFAULT_SETTINGS,
      linkMode: 'text',
    });

    expect(result.markdown).toBe('Read the article.');
  });

  it('can convert images to alt text only', () => {
    const result = convertHtmlToMarkdown('<p><img src="photo.jpg" alt="A quiet desk"></p>', {
      ...DEFAULT_SETTINGS,
      imageMode: 'alt',
    });

    expect(result.markdown).toBe('A quiet desk');
  });

  it('can remove images', () => {
    const result = convertHtmlToMarkdown('<p>Before <img src="photo.jpg" alt="A quiet desk"> After</p>', {
      ...DEFAULT_SETTINGS,
      imageMode: 'remove',
    });

    expect(result.markdown).toBe('Before  After');
  });

  it('can disable strikethrough syntax', () => {
    const result = convertHtmlToMarkdown('<p><del>Deleted</del></p>', {
      ...DEFAULT_SETTINGS,
      enableStrikethrough: false,
    });

    expect(result.markdown).toBe('Deleted');
  });

  it('can preserve sanitized tables as HTML', () => {
    const result = convertHtmlToMarkdown(
      `
      <table style="color:red">
        <tr>
          <th>Name</th>
          <th>Value</th>
        </tr>
        <tr>
          <td>One</td>
          <td>1</td>
        </tr>
      </table>
    `,
      {
        ...DEFAULT_SETTINGS,
        preserveTables: true,
      },
    );

    expect(result.markdown).toContain('<table>');
    expect(result.markdown).toContain('<th>Name</th>');
    expect(result.markdown).not.toContain('style=');
  });

  it('returns empty Markdown for empty sanitized input', () => {
    const result = convertHtmlToMarkdown('<script>alert("bad")</script>', DEFAULT_SETTINGS);

    expect(result.markdown).toBe('');
    expect(result.outputCharacters).toBe(0);
  });
});

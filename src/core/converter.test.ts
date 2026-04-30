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

  it('converts simple tables to GitHub-Flavored Markdown by default', () => {
    const result = convertHtmlToMarkdown(
      `
      <table class="ws-table-all" id="customers"><tbody><tr><th>Company</th>
        <th>Contact</th>
        <th>Country</th>
      </tr>
      <tr>
        <td>Alfreds Futterkiste</td>
        <td>Maria Anders</td>
        <td>Germany</td>
      </tr>
      <tr>
        <td>Centro comercial Moctezuma</td>
        <td>Francisco Chang</td>
        <td>Mexico</td>
      </tr></tbody></table>
    `,
      DEFAULT_SETTINGS,
    );

    expect(result.markdown).toBe(
      [
        '| Company | Contact | Country |',
        '| --- | --- | --- |',
        '| Alfreds Futterkiste | Maria Anders | Germany |',
        '| Centro comercial Moctezuma | Francisco Chang | Mexico |',
      ].join('\n'),
    );
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
        tableMode: 'html',
      },
    );

    expect(result.markdown).toContain('<table>');
    expect(result.markdown).toContain('<th>Name</th>');
    expect(result.markdown).not.toContain('style=');
  });

  it('can flatten tables to plain text', () => {
    const result = convertHtmlToMarkdown(
      '<table><tr><th>Name</th><th>Value</th></tr><tr><td>One</td><td>1</td></tr></table>',
      {
        ...DEFAULT_SETTINGS,
        tableMode: 'text',
      },
    );

    expect(result.markdown).toBe(['Name', '', 'Value', '', 'One', '', '1'].join('\n'));
  });

  it('escapes table pipes and preserves inline formatting inside cells', () => {
    const result = convertHtmlToMarkdown(
      '<table><tr><th>Command</th><th>Meaning</th></tr><tr><td><code>a|b</code></td><td><strong>Either</strong> side</td></tr></table>',
      DEFAULT_SETTINGS,
    );

    expect(result.markdown).toBe(
      [
        '| Command | Meaning |',
        '| --- | --- |',
        '| `a\\|b` | **Either** side |',
      ].join('\n'),
    );
  });

  it('converts tables without headers using an empty Markdown header', () => {
    const result = convertHtmlToMarkdown(
      '<table><tr><td>One</td><td>Two</td></tr><tr><td>Three</td><td>Four</td></tr></table>',
      DEFAULT_SETTINGS,
    );

    expect(result.markdown).toBe(
      [
        '|     |     |',
        '| --- | --- |',
        '| One | Two |',
        '| Three | Four |',
      ].join('\n'),
    );
  });

  it('preserves table cell newlines as line breaks', () => {
    const result = convertHtmlToMarkdown(
      '<table><tr><th>Notes</th></tr><tr><td>One<br>Two</td></tr></table>',
      DEFAULT_SETTINGS,
    );

    expect(result.markdown).toBe(['| Notes |', '| --- |', '| One<br>Two |'].join('\n'));
  });

  it('handles table colspan with padded empty cells', () => {
    const result = convertHtmlToMarkdown(
      '<table><tr><th colspan="2">Name</th></tr><tr><td>Ada</td><td>Lovelace</td></tr></table>',
      DEFAULT_SETTINGS,
    );

    expect(result.markdown).toBe(
      [
        '| Name |     |',
        '| --- | --- |',
        '| Ada | Lovelace |',
      ].join('\n'),
    );
  });

  it('respects table cell alignment', () => {
    const result = convertHtmlToMarkdown(
      '<table><tr><th align="left">Name</th><th align="center">Score</th><th align="right">Rank</th></tr><tr><td>Ada</td><td>10</td><td>1</td></tr></table>',
      DEFAULT_SETTINGS,
    );

    expect(result.markdown).toBe(
      [
        '| Name | Score | Rank |',
        '| :--- | :---: | ---: |',
        '| Ada | 10  | 1   |',
      ].join('\n'),
    );
  });

  it('adds table captions before Markdown tables', () => {
    const result = convertHtmlToMarkdown(
      '<table><caption>Customer list</caption><tr><th>Name</th><th>Country</th></tr><tr><td>Ada</td><td>UK</td></tr></table>',
      DEFAULT_SETTINGS,
    );

    expect(result.markdown).toBe(
      ['Customer list', '', '| Name | Country |', '| --- | --- |', '| Ada | UK  |'].join('\n'),
    );
  });

  it('preserves complex tables as sanitized HTML in Markdown table mode', () => {
    const result = convertHtmlToMarkdown(
      '<table><tr><td><ul><li>One</li><li>Two</li></ul></td></tr></table>',
      DEFAULT_SETTINGS,
    );

    expect(result.markdown).toContain('<table>');
    expect(result.markdown).toContain('<ul>');
    expect(result.markdown).toContain('<li>One</li>');
  });

  it('ignores colgroup metadata when converting Markdown tables', () => {
    const result = convertHtmlToMarkdown(
      '<table><colgroup><col span="2"></colgroup><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>',
      DEFAULT_SETTINGS,
    );

    expect(result.markdown).toBe(['| A   | B   |', '| --- | --- |', '| 1   | 2   |'].join('\n'));
  });

  it('flattens outer layout tables and still converts inner data tables', () => {
    const result = convertHtmlToMarkdown(
      '<table><tr><td>Layout <table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table></td></tr></table>',
      DEFAULT_SETTINGS,
    );

    expect(result.markdown).toContain('Layout');
    expect(result.markdown).toContain('| A   | B   |');
    expect(result.markdown).toContain('| --- | --- |');
    expect(result.markdown).not.toContain('| Layout');
  });

  it('converts task list checkbox items', () => {
    const result = convertHtmlToMarkdown(
      '<ul><li><input type="checkbox" checked> Done</li><li><input type="checkbox"> Todo</li></ul>',
      DEFAULT_SETTINGS,
    );

    expect(result.markdown).toBe(['- [x] Done', '- [ ] Todo'].join('\n'));
  });

  it('converts task list checkboxes inside labels and spans', () => {
    const result = convertHtmlToMarkdown(
      '<ul><li><label><input type="checkbox" checked> Done</label></li><li><span><input type="checkbox"></span> Todo</li><li><span role="checkbox" aria-checked="true"></span> Aria</li></ul>',
      DEFAULT_SETTINGS,
    );

    expect(result.markdown).toBe(['- [x] Done', '- [ ] Todo', '- [x] Aria'].join('\n'));
  });

  it('can disable task list checkbox syntax', () => {
    const result = convertHtmlToMarkdown(
      '<ul><li><input type="checkbox" checked> Done</li></ul>',
      {
        ...DEFAULT_SETTINGS,
        enableTaskListItems: false,
      },
    );

    expect(result.markdown).toBe('- Done');
  });

  it('preserves highlighted code block languages', () => {
    const result = convertHtmlToMarkdown(
      '<div class="highlight-source-ts"><pre>const answer: number = 42;</pre></div>',
      DEFAULT_SETTINGS,
    );

    expect(result.markdown).toBe(['```ts', 'const answer: number = 42;', '```'].join('\n'));
  });

  it('preserves pre code language classes', () => {
    const result = convertHtmlToMarkdown(
      '<pre><code class="language-js">console.log(42)</code></pre>',
      DEFAULT_SETTINGS,
    );

    expect(result.markdown).toBe(['```js', 'console.log(42)', '```'].join('\n'));
  });

  it('can disable detected code block languages', () => {
    const result = convertHtmlToMarkdown(
      '<pre><code class="language-js">console.log(42)</code></pre>',
      {
        ...DEFAULT_SETTINGS,
        enableHighlightedCodeBlocks: false,
      },
    );

    expect(result.markdown).toBe(['```', 'console.log(42)', '```'].join('\n'));
  });

  it('returns empty Markdown for empty sanitized input', () => {
    const result = convertHtmlToMarkdown('<script>alert("bad")</script>', DEFAULT_SETTINGS);

    expect(result.markdown).toBe('');
    expect(result.outputCharacters).toBe(0);
  });
});

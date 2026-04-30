import { describe, expect, it } from 'vitest';
import { sanitizeHtml } from './sanitizer';

describe('sanitizeHtml', () => {
  it('removes executable elements and dangerous attributes', () => {
    const dirtyHtml = `
      <h1>Hello</h1>
      <img src="x" onerror="alert(1)">
      <script>alert('bad')</script>
      <style>body { display: none; }</style>
      <iframe src="https://example.com"></iframe>
    `;

    const cleanHtml = sanitizeHtml(dirtyHtml, {
      removeComments: true,
    });

    expect(cleanHtml).toContain('<h1>Hello</h1>');
    expect(cleanHtml).toContain('<img src="x">');
    expect(cleanHtml).not.toContain('onerror');
    expect(cleanHtml).not.toContain('<script');
    expect(cleanHtml).not.toContain('<style');
    expect(cleanHtml).not.toContain('<iframe');
  });

  it('removes comments when configured', () => {
    const cleanHtml = sanitizeHtml('<p>Hello</p><!-- secret -->', {
      removeComments: true,
    });

    expect(cleanHtml).toBe('<p>Hello</p>');
  });

  it('keeps comments when configured', () => {
    const cleanHtml = sanitizeHtml('<p>Hello</p><!-- note -->', {
      removeComments: false,
    });

    expect(cleanHtml).toContain('<p>Hello</p>');
  });


  it('keeps checkbox state for task list conversion while removing events', () => {
    const cleanHtml = sanitizeHtml('<input type="checkbox" checked onclick="alert(1)">', {
      removeComments: true,
    });

    expect(cleanHtml).toContain('type="checkbox"');
    expect(cleanHtml).toContain('checked');
    expect(cleanHtml).not.toContain('onclick');
  });

  it('forbids inline style attributes', () => {
    const cleanHtml = sanitizeHtml('<p style="color: red">Hello</p>', {
      removeComments: true,
    });

    expect(cleanHtml).toBe('<p>Hello</p>');
  });
});

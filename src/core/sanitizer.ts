import DOMPurify from 'dompurify';

export interface SanitizerOptions {
  removeComments: boolean;
}

const htmlCommentPattern = /<!--[\s\S]*?-->/g;

export function sanitizeHtml(dirtyHtml: string, options: SanitizerOptions): string {
  const preparedHtml = options.removeComments ? dirtyHtml.replace(htmlCommentPattern, '') : dirtyHtml;

  return DOMPurify.sanitize(preparedHtml, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'template'],
    FORBID_ATTR: ['style'],
    SANITIZE_DOM: true,
  });
}

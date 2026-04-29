export interface ImportedTextFile {
  name: string;
  content: string;
}

const readableExtensions = ['.html', '.htm', '.xhtml', '.xml', '.txt'];

export async function readTextFile(file: File): Promise<ImportedTextFile> {
  return {
    name: file.name,
    content: await file.text(),
  };
}

export function isLikelyReadableTextFile(file: File): boolean {
  const fileName = file.name.toLowerCase();

  return (
    file.type.startsWith('text/') ||
    file.type === 'application/xhtml+xml' ||
    file.type === 'application/xml' ||
    readableExtensions.some((extension) => fileName.endsWith(extension))
  );
}

export function deriveMarkdownFileName(sourceName: string): string {
  const cleanSourceName = sanitizeFileName(sourceName.trim() || 'h2m');
  const baseName = cleanSourceName.replace(
    /\.(html?|xhtml|xml|txt)$/i,
    '',
  );

  return `${baseName || 'h2m'}.md`;
}

export function downloadTextFile(
  content: string,
  fileName: string,
  mimeType = 'text/markdown;charset=utf-8',
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';

  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}

function sanitizeFileName(value: string): string {
  return value
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

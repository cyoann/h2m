import type TurndownService from 'turndown';
import type { AppSettings } from './settings';

type TableCellAlignment = 'left' | 'center' | 'right' | null;

interface TableCellData {
  content: string;
  align: TableCellAlignment;
}

const highlightClassPattern = /(?:^|\s)highlight-(?:text|source)-([a-z0-9_-]+)(?:\s|$)/i;
const codeLanguageClassPattern = /(?:^|\s)(?:language-|lang-|highlight-|code-?lang-)([a-z0-9_-]+)(?:\s|$)/i;
const complexTableSelectors = ['pre', 'ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'blockquote'];
const tableSkipCache = new WeakMap<HTMLTableElement, boolean>();
const tableHtmlCache = new WeakMap<HTMLTableElement, boolean>();


export function prepareGfmHtmlForConversion(html: string, settings: AppSettings): string {
  if (!settings.enableTaskListItems || !html.includes('role="checkbox"')) {
    return html;
  }

  const template = document.createElement('template');
  template.innerHTML = html;

  for (const checkbox of Array.from(template.content.querySelectorAll<HTMLElement>('[role="checkbox"]'))) {
    if (!checkbox.textContent?.trim()) {
      checkbox.textContent = '\u200b';
    }
  }

  return template.innerHTML;
}

export function applyGfmRules(service: TurndownService, settings: AppSettings): void {
  applyHighlightedCodeRules(service, settings);
  applyTaskListRules(service, settings);
  applyTableRules(service, settings);
}

function applyHighlightedCodeRules(service: TurndownService, settings: AppSettings): void {
  if (settings.codeBlockStyle !== 'fenced') {
    return;
  }

  if (!settings.enableHighlightedCodeBlocks) {
    applyPlainFencedCodeRule(service);
    return;
  }

  service.addRule('highlightedCodeBlock', {
    filter(node) {
      if (!(node instanceof HTMLElement) || node.nodeName !== 'DIV' || !highlightClassPattern.test(node.className)) {
        return false;
      }

      return node.firstElementChild?.nodeName === 'PRE';
    },
    replacement(_content, node, options) {
      if (!(node instanceof HTMLElement) || !(node.firstElementChild instanceof HTMLPreElement)) {
        return '';
      }

      const language = readHighlightedBlockLanguage(node.className);

      return renderFencedCode(node.firstElementChild.textContent ?? '', language, readFence(options.fence));
    },
  });

  service.addRule('fencedCodeBlockLanguage', {
    filter(node) {
      if (!(node instanceof HTMLPreElement)) {
        return false;
      }

      const code = getOnlyElementChild(node);

      return code instanceof HTMLElement && code.nodeName === 'CODE' && readCodeLanguage(code.className) !== '';
    },
    replacement(_content, node, options) {
      if (!(node instanceof HTMLPreElement)) {
        return '';
      }

      const code = getOnlyElementChild(node);
      const language = code instanceof HTMLElement ? readCodeLanguage(code.className) : '';

      return renderFencedCode(node.textContent ?? '', language, readFence(options.fence));
    },
  });
}

function applyPlainFencedCodeRule(service: TurndownService): void {
  service.addRule('plainFencedCodeBlock', {
    filter(node) {
      return node instanceof HTMLPreElement && getOnlyElementChild(node)?.nodeName === 'CODE';
    },
    replacement(_content, node, options) {
      if (!(node instanceof HTMLPreElement)) {
        return '';
      }

      return renderFencedCode(node.textContent ?? '', '', readFence(options.fence));
    },
  });
}

function applyTaskListRules(service: TurndownService, settings: AppSettings): void {
  if (!settings.enableTaskListItems) {
    return;
  }

  service.addRule('taskListItems', {
    filter(node) {
      return isTaskListCheckbox(node);
    },
    replacement(_content, node) {
      return isTaskListCheckboxChecked(node) ? '[x]' : '[ ]';
    },
  });
}

function applyTableRules(service: TurndownService, settings: AppSettings): void {
  if (settings.tableMode === 'html') {
    service.keep(['table']);
    return;
  }

  if (settings.tableMode === 'text') {
    return;
  }

  service.addRule('markdownTableCaption', {
    filter: 'caption',
    replacement() {
      return '';
    },
  });

  service.addRule('markdownTableColgroup', {
    filter: ['colgroup', 'col'],
    replacement() {
      return '';
    },
  });

  service.addRule('markdownTables', {
    filter: 'table',
    replacement(content, node) {
      if (!(node instanceof HTMLTableElement)) {
        return '';
      }

      if (tableShouldBePreservedAsHtml(node)) {
        return `\n\n${node.outerHTML}\n\n`;
      }

      if (tableShouldBeFlattened(node)) {
        return content;
      }

      const markdownTable = buildMarkdownTable(node, service);

      return markdownTable ? `\n\n${markdownTable}\n\n` : content;
    },
  });
}

function buildMarkdownTable(table: HTMLTableElement, service: TurndownService): string {
  const rows = Array.from(table.rows).map((row) => readTableRow(row, service)).filter((row) => row.length > 0);

  if (rows.length === 0) {
    return '';
  }

  const columnCount = Math.max(...rows.map((row) => row.length));
  const normalizedRows = rows.map((row) => normalizeTableRow(row, columnCount));
  const headingRowIndex = findHeadingRowIndex(table);
  const hasHeadingRow = headingRowIndex >= 0;
  const header = hasHeadingRow ? normalizedRows[headingRowIndex] : createEmptyTableHeader(columnCount);
  const alignments = getColumnAlignments(normalizedRows, columnCount);
  const body = hasHeadingRow ? normalizedRows.filter((_row, index) => index !== headingRowIndex) : normalizedRows;
  const caption = readTableCaption(table);
  const tableContent = [renderMarkdownTableRow(header), renderMarkdownDelimiterRow(alignments), ...body.map(renderMarkdownTableRow)]
    .filter(Boolean)
    .join('\n');

  return caption ? `${caption}\n\n${tableContent}` : tableContent;
}

function readTableRow(row: HTMLTableRowElement, service: TurndownService): TableCellData[] {
  return Array.from(row.cells).flatMap((cell) => readTableCell(cell, service));
}

function readTableCell(cell: HTMLTableCellElement, service: TurndownService): TableCellData[] {
  const content = cleanTableCellContent(service.turndown(cell.innerHTML));
  const colspan = readPositiveIntegerAttribute(cell, 'colspan');
  const cells: TableCellData[] = [
    {
      content,
      align: readTableCellAlignment(cell),
    },
  ];

  for (let index = 1; index < colspan; index += 1) {
    cells.push({ content: '', align: null });
  }

  return cells;
}

function findHeadingRowIndex(table: HTMLTableElement): number {
  return Array.from(table.rows).findIndex(isHeadingRow);
}

function isHeadingRow(row: HTMLTableRowElement): boolean {
  if (row.parentElement?.nodeName === 'THEAD') {
    return true;
  }

  if (row.cells.length === 0) {
    return false;
  }

  const parent = row.parentElement;
  const firstNonEmptyRow = parent ? firstRowWithCells(parent) : null;

  return row === firstNonEmptyRow && Array.from(row.cells).every((cell) => cell.nodeName === 'TH');
}

function firstRowWithCells(parent: Element): HTMLTableRowElement | null {
  for (const child of Array.from(parent.children)) {
    if (child instanceof HTMLTableRowElement && child.cells.length > 0) {
      return child;
    }
  }

  return null;
}

function createEmptyTableHeader(columnCount: number): TableCellData[] {
  return Array.from({ length: columnCount }, () => ({ content: '', align: null }));
}

function normalizeTableRow(row: TableCellData[], columnCount: number): TableCellData[] {
  const nextRow = [...row];

  while (nextRow.length < columnCount) {
    nextRow.push({ content: '', align: null });
  }

  return nextRow.slice(0, columnCount);
}

function getColumnAlignments(rows: TableCellData[][], columnCount: number): TableCellAlignment[] {
  return Array.from({ length: columnCount }, (_value, columnIndex) => getColumnAlignment(rows, columnIndex));
}

function getColumnAlignment(rows: TableCellData[][], columnIndex: number): TableCellAlignment {
  const votes: Record<Exclude<TableCellAlignment, null>, number> = {
    left: 0,
    center: 0,
    right: 0,
  };

  for (const row of rows) {
    const align = row[columnIndex]?.align;

    if (align) {
      votes[align] += 1;
    }
  }

  if (votes.center > votes.left && votes.center >= votes.right) {
    return 'center';
  }

  if (votes.right > votes.left) {
    return 'right';
  }

  return votes.left > 0 ? 'left' : null;
}

function renderMarkdownTableRow(row: TableCellData[]): string {
  return `| ${row.map((cell) => padMarkdownTableCell(cell.content)).join(' | ')} |`;
}

function renderMarkdownDelimiterRow(alignments: TableCellAlignment[]): string {
  return `| ${alignments.map(renderMarkdownDelimiterCell).join(' | ')} |`;
}

function renderMarkdownDelimiterCell(alignment: TableCellAlignment): string {
  if (alignment === 'center') {
    return ':---:';
  }

  if (alignment === 'right') {
    return '---:';
  }

  if (alignment === 'left') {
    return ':---';
  }

  return '---';
}

function readTableCellAlignment(cell: HTMLTableCellElement): TableCellAlignment {
  const align = cell.getAttribute('align')?.toLowerCase() ?? cell.style.textAlign.toLowerCase();

  if (align === 'center' || align === 'right' || align === 'left') {
    return align;
  }

  return null;
}

function cleanTableCellContent(content: string): string {
  return content
    .trim()
    .replace(/\r\n?/g, '\n')
    .replace(/ {2,}\n/g, '\n')
    .replace(/\n+/g, '<br>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\|/g, '\\|')
    .trim();
}

function padMarkdownTableCell(content: string): string {
  return content.padEnd(3, ' ');
}

function readTableCaption(table: HTMLTableElement): string {
  const caption = table.caption?.textContent?.trim() ?? '';

  return caption.replace(/\s+/g, ' ');
}

function tableShouldBePreservedAsHtml(table: HTMLTableElement): boolean {
  const cached = tableHtmlCache.get(table);

  if (cached !== undefined) {
    return cached;
  }

  const result = tableContainsComplexMarkdownContent(table) || tableHasCustomFormatting(table);

  tableHtmlCache.set(table, result);
  return result;
}

function tableContainsComplexMarkdownContent(table: HTMLTableElement): boolean {
  return complexTableSelectors.some((selector) => table.querySelector(selector) !== null);
}

function tableHasCustomFormatting(table: HTMLTableElement): boolean {
  if (nodeHasCustomFormatting(table)) {
    return true;
  }

  for (const row of Array.from(table.rows)) {
    if (nodeHasCustomFormatting(row)) {
      return true;
    }

    for (const cell of Array.from(row.cells)) {
      if (nodeHasCustomFormatting(cell)) {
        return true;
      }
    }
  }

  return false;
}

function nodeHasCustomFormatting(element: Element): boolean {
  return hasAnyAttribute(element, ['bgcolor', 'bordercolor', 'background']) || hasNonDefaultSpacing(element);
}

function hasAnyAttribute(element: Element, names: readonly string[]): boolean {
  return names.some((name) => {
    const value = element.getAttribute(name);

    return value !== null && value.trim() !== '';
  });
}

function hasNonDefaultSpacing(element: Element): boolean {
  if (element.nodeName !== 'TABLE') {
    return false;
  }

  return hasNonDefaultSpacingAttribute(element, 'cellpadding') || hasNonDefaultSpacingAttribute(element, 'cellspacing');
}

function hasNonDefaultSpacingAttribute(element: Element, name: string): boolean {
  const value = element.getAttribute(name);

  if (value === null) {
    return false;
  }

  const normalizedValue = value.trim().toLowerCase();

  return normalizedValue !== '' && normalizedValue !== '0' && normalizedValue !== '0px';
}

function tableShouldBeFlattened(table: HTMLTableElement): boolean {
  const cached = tableSkipCache.get(table);

  if (cached !== undefined) {
    return cached;
  }

  const result = table.rows.length === 0 || tableHasOnlyOneCell(table) || tableHasNestedTable(table);

  tableSkipCache.set(table, result);
  return result;
}

function tableHasOnlyOneCell(table: HTMLTableElement): boolean {
  return table.rows.length === 1 && (table.rows[0]?.cells.length ?? 0) <= 1;
}

function tableHasNestedTable(table: HTMLTableElement): boolean {
  return Array.from(table.querySelectorAll('table')).some((nestedTable) => nestedTable !== table);
}

function readPositiveIntegerAttribute(element: Element, attribute: string): number {
  const value = Number.parseInt(element.getAttribute(attribute) ?? '1', 10);

  return Number.isFinite(value) && value > 0 ? value : 1;
}

function renderFencedCode(code: string, language: string, fence: string): string {
  return `\n\n${fence}${language}\n${code.replace(/\n$/, '')}\n${fence}\n\n`;
}

function readFence(fence: string | undefined): string {
  return fence?.trim() || '```';
}

function readHighlightedBlockLanguage(className: string): string {
  return normalizeCodeLanguage(className.match(highlightClassPattern)?.[1] ?? '');
}

function readCodeLanguage(className: string): string {
  return normalizeCodeLanguage(className.match(codeLanguageClassPattern)?.[1] ?? '');
}

function normalizeCodeLanguage(language: string): string {
  return language.trim().toLowerCase().replace(/[^a-z0-9_+-]/g, '');
}

function getOnlyElementChild(element: Element): Element | null {
  const children = Array.from(element.children);

  return children.length === 1 ? children[0] ?? null : null;
}

function isTaskListCheckbox(node: Node): boolean {
  if (!(node instanceof HTMLElement)) {
    return false;
  }

  if (!isCheckboxLike(node)) {
    return false;
  }

  const parent = node.parentElement;
  const grandparent = parent?.parentElement ?? null;

  return (
    parent?.nodeName === 'LI' ||
    ((parent?.nodeName === 'LABEL' || parent?.nodeName === 'SPAN') && grandparent?.nodeName === 'LI')
  );
}

function isCheckboxLike(node: HTMLElement): boolean {
  return (node instanceof HTMLInputElement && node.type === 'checkbox') || node.getAttribute('role') === 'checkbox';
}

function isTaskListCheckboxChecked(node: Node): boolean {
  if (node instanceof HTMLInputElement) {
    return node.checked;
  }

  return node instanceof HTMLElement && node.getAttribute('aria-checked') === 'true';
}

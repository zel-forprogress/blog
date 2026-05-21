/**
 * 将飞书新版文档（docx）的 Block 结构转为 Markdown
 * @see https://open.feishu.cn/document/server-docs/docs/docs/docx-v1/document/list
 */

const BLOCK_TYPE_KEYS = [
  'page',
  'text',
  'heading1',
  'heading2',
  'heading3',
  'heading4',
  'heading5',
  'heading6',
  'heading7',
  'heading8',
  'heading9',
  'bullet',
  'ordered',
  'code',
  'quote',
  'equation',
  'todo',
  'bitable',
  'callout',
  'chat_card',
  'diagram',
  'divider',
  'file',
  'grid',
  'grid_column',
  'iframe',
  'image',
  'isv',
  'mindnote',
  'sheet',
  'table',
  'table_cell',
  'view',
  'quote_container',
  'task',
  'okr',
  'okr_objective',
  'okr_key_result',
  'okr_progress',
];

const CODE_LANG = {
  1: 'plaintext',
  2: 'abap',
  3: 'ada',
  7: 'bash',
  28: 'javascript',
  32: 'json',
  39: 'markdown',
  45: 'python',
  48: 'sql',
  56: 'typescript',
  63: 'yaml',
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function getBlockPayload(block) {
  const key = BLOCK_TYPE_KEYS[block.block_type - 1];
  return key ? block[key] : null;
}

function renderElement(el) {
  if (el.text_run) {
    let text = el.text_run.content ?? '';
    const style = el.text_run.text_element_style || {};

    if (style.link?.url) {
      let url = style.link.url;
      try {
        url = decodeURIComponent(url);
      } catch {
        /* keep encoded */
      }
      return `[${text}](${url})`;
    }

    if (style.inline_code) text = `\`${text}\``;
    if (style.bold) text = `**${text}**`;
    if (style.italic) text = `*${text}*`;
    if (style.strikethrough) text = `~~${text}~~`;
    return text;
  }

  if (el.mention_doc) {
    const title = el.mention_doc.title || '文档链接';
    const url = el.mention_doc.url || '';
    return url ? `[${title}](${url})` : title;
  }

  if (el.mention_user) {
    return `@${el.mention_user.user_id || 'user'}`;
  }

  if (el.equation?.content) {
    return `$${el.equation.content}$`;
  }

  return '';
}

function renderInline(elements) {
  if (!elements?.length) return '';
  return elements.map(renderElement).join('');
}

function renderParagraph(payload) {
  const text = renderInline(payload.elements);
  return text.trim() ? `${text}\n` : '';
}

function renderHeading(level, payload) {
  const text = renderInline(payload.elements).trim();
  if (!text) return '';
  const hashes = '#'.repeat(Math.min(level, 6));
  return `${hashes} ${text}\n`;
}

function renderCode(payload) {
  const lang = CODE_LANG[payload.style?.language] || '';
  const code = renderInline(payload.elements).replace(/\n$/, '');
  if (!code.trim()) return '';
  return `\`\`\`${lang}\n${code}\n\`\`\`\n`;
}

function renderQuote(payload) {
  const text = renderInline(payload.elements).trim();
  if (!text) return '';
  return text
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');
}

function renderTodo(payload) {
  const done = payload.style?.done;
  const text = renderInline(payload.elements).trim();
  return `- [${done ? 'x' : ' '}] ${text}\n`;
}

function renderImage(payload) {
  const token = payload.token || payload.image?.token;
  if (!token) return '';
  return `\n![image](https://open.feishu.cn/open-apis/drive/v1/medias/${token}/download)\n`;
}

function escapeTableCell(value) {
  return String(value ?? '')
    .replace(/\r?\n/g, '<br>')
    .replace(/\|/g, '\\|')
    .trim();
}

function columnName(n) {
  let name = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    name = String.fromCharCode(65 + r) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function renderMarkdownTable(rows) {
  const normalized = rows
    .map((row) => row.map(escapeTableCell))
    .filter((row) => row.some(Boolean));

  if (!normalized.length) return '';

  // 找出有效列（至少有一行在该列有内容）
  const maxCols = Math.max(...normalized.map((row) => row.length));
  const validCols = [];
  for (let col = 0; col < maxCols; col++) {
    if (normalized.some((row) => row[col]?.trim())) {
      validCols.push(col);
    }
  }

  if (!validCols.length) return '';

  const filtered = normalized.map((row) => validCols.map((col) => row[col] || ''));
  const header = filtered[0];
  const body = filtered.slice(1);
  const separator = Array(validCols.length).fill('---');

  return [
    `| ${header.join(' | ')} |`,
    `| ${separator.join(' | ')} |`,
    ...body.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');
}

function renderChildBlocks(block, ctx, inline = false) {
  const childIds = block.children || [];
  const rendered = childIds
    .map((childId) => {
      const child = ctx.map.get(childId);
      return child ? blockToMarkdown(child, ctx) : '';
    })
    .filter((md) => md?.trim());

  if (inline) {
    return rendered
      .join(' ')
      .replace(/\n+/g, ' ')
      .trim();
  }

  return rendered.join('\n\n');
}

function renderTable(block, ctx) {
  const table = block.table || {};
  const cells = table.cells?.length ? table.cells : block.children || [];
  const columnSize = table.property?.column_size || cells.length || 1;
  const rows = [];

  for (let i = 0; i < cells.length; i += columnSize) {
    const row = cells.slice(i, i + columnSize).map((cellId) => {
      const cell = ctx.map.get(cellId);
      return cell ? renderChildBlocks(cell, ctx, true) : '';
    });
    rows.push(row);
  }

  return renderMarkdownTable(rows);
}

function cellToText(cell) {
  if (cell === null || cell === undefined) return '';
  if (typeof cell === 'string' || typeof cell === 'number' || typeof cell === 'boolean') {
    return String(cell);
  }
  if (Array.isArray(cell)) {
    return cell
      .map((seg) => seg?.text || '')
      .join('')
      .trim();
  }
  if (typeof cell === 'object' && cell.text) {
    return String(cell.text);
  }
  return String(cell);
}

async function fetchSheetValues(token, payload) {
  const sheetToken = payload?.token || '';
  const lastUnderscore = sheetToken.lastIndexOf('_');
  if (lastUnderscore === -1) return [];
  const spreadsheetToken = sheetToken.slice(0, lastUnderscore);
  const sheetId = sheetToken.slice(lastUnderscore + 1);
  if (!spreadsheetToken || !sheetId) return [];

  const rowSize = Math.max(Number(payload.row_size) || 100, 1);
  const columnSize = Math.max(Number(payload.column_size) || 26, 1);
  const range = `${sheetId}!A1:${columnName(columnSize)}${rowSize}`;
  const url = `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();

  if (data.code !== 0) {
    throw new Error(`获取电子表格失败 (${sheetToken}): ${JSON.stringify(data)}`);
  }

  const raw = data.data?.valueRange?.values || [];
  return raw.map((row) => row.map(cellToText));
}

async function fetchAllBlocks(token, documentId) {
  const items = [];
  let pageToken = '';

  do {
    const qs = new URLSearchParams({ document_revision_id: '-1', page_size: '500' });
    if (pageToken) qs.set('page_token', pageToken);

    const url = `https://open.feishu.cn/open-apis/docx/v1/documents/${documentId}/blocks?${qs}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();

    if (data.code !== 0) {
      throw new Error(`获取文档块失败 (${documentId}): ${JSON.stringify(data)}`);
    }

    items.push(...(data.data?.items || []));
    pageToken = data.data?.has_more ? data.data.page_token : '';
    if (pageToken) await sleep(120);
  } while (pageToken);

  return items;
}

function blockToMarkdown(block, ctx) {
  const type = block.block_type;
  const payload = getBlockPayload(block);

  if (type === 1) return '';

  if (!payload && ![22, 32, 34].includes(type)) {
    return `<!-- 暂不支持的块类型: ${type} -->\n`;
  }

  switch (type) {
    case 2:
      // 有序列表后的说明段落不打断序号
      if (ctx.lastListType !== 'ordered') {
        ctx.orderedCounter = 0;
        ctx.lastListType = null;
      }
      return renderParagraph(payload);
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
    case 8:
    case 9:
    case 10:
    case 11:
      ctx.orderedCounter = 0;
      ctx.lastListType = null;
      return renderHeading(type - 2, payload);
    case 12:
      ctx.lastListType = 'bullet';
      ctx.orderedCounter = 0;
      return `- ${renderInline(payload.elements)}\n`;
    case 13: {
      if (ctx.lastListType !== 'ordered') ctx.orderedCounter = 0;
      ctx.lastListType = 'ordered';
      ctx.orderedCounter += 1;
      const seq = payload.style?.sequence;
      const n =
        seq && String(seq) !== 'auto' && /^\d+$/.test(String(seq))
          ? seq
          : String(ctx.orderedCounter);
      return `${n}. ${renderInline(payload.elements)}\n`;
    }
    case 14:
      // 列表项后的代码块不应打断有序列表序号
      return renderCode(payload);
    case 15:
      ctx.orderedCounter = 0;
      ctx.lastListType = null;
      return `${renderQuote(payload)}\n`;
    case 17:
      return renderTodo(payload);
    case 19:
    case 24:
    case 25:
    case 34:
      return renderChildBlocks(block, ctx);
    case 22:
      ctx.orderedCounter = 0;
      ctx.lastListType = null;
      return '---\n';
    case 27:
      return renderImage(payload);
    case 31:
      return renderTable(block, ctx);
    case 32:
      return renderChildBlocks(block, ctx);
    default:
      if (payload.elements) {
        const text = renderInline(payload.elements).trim();
        return text ? `${text}\n` : '';
      }
      return '';
  }
}

async function blockToMarkdownAsync(block, ctx) {
  if (block.block_type === 30) {
    const rows = await fetchSheetValues(ctx.token, block.sheet);
    return renderMarkdownTable(rows) || '<!-- 电子表格为空 -->\n';
  }

  return blockToMarkdown(block, ctx);
}

async function documentToMarkdown(blocks, token) {
  const map = new Map(blocks.map((b) => [b.block_id, b]));
  const page = blocks.find((b) => b.block_type === 1);
  if (!page?.children?.length) return '';

  const ctx = { orderedCounter: 0, lastListType: null, map, token };
  const parts = [];

  for (const childId of page.children) {
    const block = map.get(childId);
    if (!block) continue;
    const md = await blockToMarkdownAsync(block, ctx);
    if (md?.trim()) parts.push(md.trimEnd());
  }

  return `${parts.join('\n\n')}\n`;
}

async function fetchDocumentMarkdown(token, documentId) {
  const blocks = await fetchAllBlocks(token, documentId);
  return documentToMarkdown(blocks, token);
}

module.exports = {
  fetchAllBlocks,
  documentToMarkdown,
  fetchDocumentMarkdown,
};

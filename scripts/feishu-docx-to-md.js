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
  'divider',
  'file',
  'grid',
  'grid_column',
  'image',
  'iframe',
  'sheet',
  'table',
  'table_cell',
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

  if (!payload) {
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
    case 22:
      ctx.orderedCounter = 0;
      ctx.lastListType = null;
      return '---\n';
    case 27:
      return renderImage(payload);
    default:
      if (payload.elements) {
        const text = renderInline(payload.elements).trim();
        return text ? `${text}\n` : '';
      }
      return '';
  }
}

function documentToMarkdown(blocks) {
  const map = new Map(blocks.map((b) => [b.block_id, b]));
  const page = blocks.find((b) => b.block_type === 1);
  if (!page?.children?.length) return '';

  const ctx = { orderedCounter: 0, lastListType: null };
  const parts = [];

  for (const childId of page.children) {
    const block = map.get(childId);
    if (!block) continue;
    const md = blockToMarkdown(block, ctx);
    if (md?.trim()) parts.push(md.trimEnd());
  }

  return `${parts.join('\n\n')}\n`;
}

async function fetchDocumentMarkdown(token, documentId) {
  const blocks = await fetchAllBlocks(token, documentId);
  return documentToMarkdown(blocks);
}

module.exports = {
  fetchAllBlocks,
  documentToMarkdown,
  fetchDocumentMarkdown,
};

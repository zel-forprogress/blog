const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvFile();

const APP_ID = process.env.FEISHU_APP_ID;
const APP_SECRET = process.env.FEISHU_APP_SECRET;
let SPACE_ID = process.env.FEISHU_SPACE_ID;
const WIKI_NODE_TOKEN = process.env.FEISHU_WIKI_NODE_TOKEN || '';

/** 飞书知识库顶层文件夹 → Hugo content 子目录 */
const ROOT_FOLDERS = {
  知识库: 'wendang',
  日报: 'daily',
  项目开发文档: 'project',
};

const CONTENT_DIR = path.join(__dirname, '../content');
const STATE_FILE = path.join(__dirname, '.feishu-sync-state.json');

function requireEnv() {
  const missing = [];
  if (!APP_ID) missing.push('FEISHU_APP_ID');
  if (!APP_SECRET || APP_SECRET.includes('请在这里')) missing.push('FEISHU_APP_SECRET');
  if (!SPACE_ID && !WIKI_NODE_TOKEN) missing.push('FEISHU_SPACE_ID 或 FEISHU_WIKI_NODE_TOKEN');
  if (missing.length) {
    throw new Error(`缺少配置: ${missing.join(', ')}（编辑 scripts/.env）`);
  }
}

async function resolveSpaceId(token) {
  if (SPACE_ID) return SPACE_ID;
  const url = `https://open.feishu.cn/open-apis/wiki/v2/spaces/get_node?token=${encodeURIComponent(WIKI_NODE_TOKEN)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`无法从 URL 解析 space_id: ${JSON.stringify(data)}`);
  }
  const node = data.data?.node || data.data;
  SPACE_ID = node?.space_id || node?.origin_space_id;
  if (!SPACE_ID) {
    throw new Error(`get_node 未返回 space_id: ${JSON.stringify(data.data)}`);
  }
  console.log(`已从 wiki 节点解析 space_id: ${SPACE_ID}`);
  return SPACE_ID;
}

async function getTenantToken() {
  const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET }),
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error(`获取 token 失败: ${JSON.stringify(data)}`);
  return data.tenant_access_token;
}

async function listNodes(token, parentNodeToken = '') {
  const items = [];
  let pageToken = '';

  do {
    const qs = new URLSearchParams({ page_size: '50' });
    if (pageToken) qs.set('page_token', pageToken);
    if (parentNodeToken) qs.set('parent_node_token', parentNodeToken);

    const url = `https://open.feishu.cn/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes?${qs}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();

    if (data.code !== 0) {
      throw new Error(`列出节点失败: ${JSON.stringify(data)}`);
    }

    items.push(...(data.data?.items || []));
    pageToken = data.data?.has_more ? data.data.page_token : '';
  } while (pageToken);

  return items;
}

async function getDocxContent(token, documentId) {
  const url = `https://open.feishu.cn/open-apis/docx/v1/documents/${documentId}/raw_content`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (data.code !== 0) throw new Error(`读取文档失败 (${documentId}): ${JSON.stringify(data)}`);
  return data.data.content || '';
}

function slugify(title) {
  const base = title.replace(/[\\/:*?"<>|]/g, '-').trim();
  return base || 'untitled';
}

/** 日报标题如 2026.5.14 → 2026-05-14.md */
function resolveFilename(title, targetSection) {
  if (targetSection === 'daily') {
    const m = title.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
    if (m) {
      return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}.md`;
    }
  }
  return `${slugify(title)}.md`;
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function syncNode(token, node, state, targetSection) {
  if (node.obj_type !== 'docx') {
    console.log(`跳过 [${node.obj_type}]: ${node.title}`);
    return;
  }

  const key = node.node_token;
  const editTime = String(node.obj_edit_time || '');
  const filename = resolveFilename(node.title, targetSection);
  const relPath = `${targetSection}/${filename}`;

  if (state[key]?.edit_time === editTime && state[key]?.file === relPath) {
    console.log(`无变化: [${targetSection}] ${node.title}`);
    return;
  }

  const content = await getDocxContent(token, node.obj_token);
  await sleep(250);

  const date = editTime
    ? new Date(Number(editTime) * 1000).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const filePath = path.join(CONTENT_DIR, targetSection, filename);
  const safeTitle = node.title.replace(/"/g, '\\"');

  const md = `---
title: "${safeTitle}"
date: ${date}
feishu_node_token: "${node.node_token}"
feishu_edit_time: "${editTime}"
---

# ${node.title}

${content}
`;

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, md, 'utf-8');
  state[key] = { edit_time: editTime, file: relPath, section: targetSection };
  console.log(`已同步 [${targetSection}]: ${filePath}`);
}

async function walk(token, parentNodeToken, state, targetSection) {
  const nodes = await listNodes(token, parentNodeToken);

  for (const node of nodes) {
    if (node.has_child) {
      await walk(token, node.node_token, state, targetSection);
    }
    await syncNode(token, node, state, targetSection);
  }
}

async function main() {
  requireEnv();
  const token = await getTenantToken();
  await resolveSpaceId(token);

  console.log(`知识库 space_id: ${SPACE_ID}`);
  console.log('目录映射: 知识库→文档(wendang), 日报→daily, 项目开发文档→project');

  const state = loadState();
  const rootNodes = await listNodes(token, '');

  for (const node of rootNodes) {
    const targetSection = ROOT_FOLDERS[node.title];
    if (!targetSection) {
      console.log(`跳过未映射的根目录: ${node.title}`);
      continue;
    }

    console.log(`\n同步飞书「${node.title}」→ content/${targetSection}/`);

    if (!node.has_child) {
      await syncNode(token, node, state, targetSection);
      continue;
    }

    await walk(token, node.node_token, state, targetSection);
  }

  saveState(state);
  console.log('\n飞书同步完成');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

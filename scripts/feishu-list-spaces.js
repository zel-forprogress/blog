/**
 * 本地工具：列出可访问的知识库 space_id（不提交密钥，用环境变量或 .env）
 */
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
const WIKI_NODE_TOKEN = process.env.FEISHU_WIKI_NODE_TOKEN;

async function main() {
  if (!APP_ID || !APP_SECRET || APP_SECRET.includes('请在这里')) {
    console.error('请在 scripts/.env 中配置 FEISHU_APP_ID 和 FEISHU_APP_SECRET');
    process.exit(1);
  }

  const tr = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET }),
  });
  const tj = await tr.json();
  if (tj.code !== 0) {
    console.error('token 失败:', tj);
    process.exit(1);
  }

  const res = await fetch('https://open.feishu.cn/open-apis/wiki/v2/spaces?page_size=50', {
    headers: { Authorization: `Bearer ${tj.tenant_access_token}` },
  });
  const data = await res.json();
  if (data.code !== 0) {
    console.error('列表失败:', data);
    process.exit(1);
  }

  console.log('\n知识库列表（可把 space_id 填进 .env 的 FEISHU_SPACE_ID）：\n');
  for (const s of data.data?.items || []) {
    console.log(`  名称: ${s.name}`);
    console.log(`  space_id: ${s.space_id}`);
    console.log('');
  }

  if (WIKI_NODE_TOKEN) {
    const nr = await fetch(
      `https://open.feishu.cn/open-apis/wiki/v2/spaces/get_node?token=${encodeURIComponent(WIKI_NODE_TOKEN)}`,
      { headers: { Authorization: `Bearer ${tj.tenant_access_token}` } }
    );
    const nd = await nr.json();
    if (nd.code === 0) {
      const node = nd.data?.node || nd.data;
      console.log('当前 .env 中 FEISHU_WIKI_NODE_TOKEN 对应：');
      console.log(`  space_id: ${node?.space_id || node?.origin_space_id}`);
      console.log(`  标题: ${node?.title || '(无)'}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

const fs = require('fs');
const path = require('path');

// 配置
const API_KEY = process.env.DASHSCOPE_API_KEY;
const API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
const CONTENT_DIR = path.join(__dirname, '../content');

// 读取最近的内容
function getRecentContent() {
  const sections = ['docs', 'daily', 'agent'];
  const content = [];

  for (const section of sections) {
    const dir = path.join(CONTENT_DIR, section);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.md') && f !== '_index.md')
      .sort()
      .reverse()
      .slice(0, 3); // 最近3个文件

    for (const file of files) {
      const content_text = fs.readFileSync(path.join(dir, file), 'utf-8');
      const title = content_text.match(/title:\s*["']?(.+?)["']?\s*$/m)?.[1] || file;
      content.push(`[${section}] ${title}`);
    }
  }

  return content.join('\n');
}

// 调用通义千问 API
async function generateReport(recentContent) {
  const today = new Date().toISOString().split('T')[0];

  const prompt = `你是一个AI助手，负责为技术博客生成每日总结日报。

今天的日期是：${today}

最近网站更新的内容：
${recentContent}

请根据这些信息，生成一份简洁的日报，包含：
1. 今日更新概览
2. 内容分类统计
3. 简短总结

要求：
- 使用中文
- 格式为 Markdown
- 保持简洁，不超过 300 字
- 直接输出 Markdown 内容，不要包含代码块标记`;

  console.log('API_KEY 存在:', !!API_KEY);
  console.log('API_URL:', API_URL);

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen-turbo',
      input: {
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      parameters: {
        result_format: 'message'
      }
    })
  });

  console.log('响应状态:', response.status);
  const data = await response.json();
  console.log('API 响应:', JSON.stringify(data, null, 2));

  if (data.output && data.output.choices) {
    return data.output.choices[0].message.content;
  }

  throw new Error('API 调用失败: ' + JSON.stringify(data));
}

// 生成 Markdown 文件
function createMarkdown(content, date) {
  return `---
title: "Agent 日志 - ${date}"
date: ${date}
---

# Agent 日志

${content}
`;
}

// 主函数
async function main() {
  const today = new Date().toISOString().split('T')[0];
  const targetFile = path.join(CONTENT_DIR, 'agent', `${today}.md`);

  // 检查今天是否已生成
  if (fs.existsSync(targetFile)) {
    console.log(`今日日报已存在: ${targetFile}`);
    return;
  }

  console.log('正在获取最近内容...');
  const recentContent = getRecentContent();

  console.log('正在调用通义千问 API...');
  const report = await generateReport(recentContent);

  console.log('正在生成日报文件...');
  const markdown = createMarkdown(report, today);

  fs.writeFileSync(targetFile, markdown, 'utf-8');
  console.log(`日报已生成: ${targetFile}`);
}

main().catch(err => {
  console.error('错误:', err);
  process.exit(1);
});

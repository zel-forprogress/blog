# Hardy Blog

个人技术文档站，基于 Hugo + HugoBook 主题。

## 功能特点

- **飞书知识库同步** - 自动从飞书拉取文档并转换为 Markdown
- **AI 日报生成** - 每天自动生成学习总结（通义千问 API）
- **自动部署** - GitHub Actions 自动构建和部署到 GitHub Pages

## 栏目结构

| 栏目 | 路径 | 说明 |
|------|------|------|
| 项目 | `/project/` | 项目开发笔记 |
| 文档 | `/wendang/` | 技术学习文档 |
| 日报 | `/daily/` | 每日学习记录 |
| Agent | `/agent/` | AI 自动生成内容 |

## 本地预览

```bash
# 安装 Hugo Extended 版本
# https://github.com/gohugoio/hugo/releases

# 启动开发服务器
hugo server -D
```

## 自动化工作流

| 时间（北京时间） | 动作 |
|-----------------|------|
| 23:00 | 从飞书同步最新文档 |
| 00:00 | AI 生成当日学习总结 |

## 技术栈

- [Hugo](https://gohugo.io/) - 静态网站生成器
- [HugoBook](https://github.com/alex-shpak/hugo-book) - 文档主题
- [通义千问](https://dashscope.console.aliyun.com/) - AI 日报生成
- [飞书开放平台](https://open.feishu.cn/) - 知识库同步
- [GitHub Actions](https://github.com/features/actions) - CI/CD

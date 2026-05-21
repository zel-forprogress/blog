---
title: "Next.js"
date: 2026-04-30
feishu_node_token: "BPiJwqVWViS7wBk2ScTcYHv5nrc"
feishu_edit_time: "1777527071"
---

Next.js 是一个把 React 从纯前端库升级为全栈应用框架的生产力工具，让你通过文件即路由、服务端组件和开箱即用的优化，简单高效地构建现代 Web 应用。

使用 Next.js，你可以用 JavaScript/TypeScript 这一种语言，在同一个项目里同时编写：

- 前端：React 组件（UI 交互、页面渲染）

- 后端：API Routes、Server Actions、数据获取、数据库查询等

### 具体体现：

| 层级 | 传统方式 | Next.js 方式 |
| --- | --- | --- |
| 语言 | 前端 JS + 后端（Java/Go/PHP等） | 统一用 JavaScript/TypeScript |
| 项目 | 前后端分离，两个仓库/两个部署 | 一个项目，一键部署 |
| 接口 | 需要定义 REST/GraphQL，通过 HTTP 调用 | 直接导入函数或调用 Server Action，无需手动写接口 |
| 数据获取 | 前端 fetch → 后端 → 返回 JSON | 服务端组件里直接 await db.query() |

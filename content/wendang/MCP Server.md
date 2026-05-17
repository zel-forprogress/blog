---
title: "MCP Server"
date: 2026-04-30
feishu_node_token: "Wbpqwj97WiIaMZkDTbtctOVMnfg"
feishu_edit_time: "1777529477"
---

MCP Server 是 **Model Context Protocol** 的缩写，是 Anthropic 推出的一个开放协议，让 AI 模型可以调用外部工具。

## 简单理解

```plaintext
传统方式：
你 ──打字──> Claude ──回答──> 你
（Claude 只能聊天，不能操作外部世界）

MCP 方式：
你 ──提问──> Claude ──调用工具──> MCP Server ──执行──> 返回结果
                                        │
                                        ├── 读写文件
                                        ├── 查询数据库
                                        ├── 调用API
                                        └── 任何你能编程实现的事
```

MCP 就是一个**标准化的插件系统**。你写一个 Python/TypeScript 脚本，声明它提供哪些工具，Agent 就能在对话中自动调用这些工具。类似于给浏览器写扩展插件，只不过是给 AI Agent 写的。

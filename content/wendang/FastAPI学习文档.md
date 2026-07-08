---
title: "FastAPI学习文档"
date: 2026-07-08
feishu_node_token: "OMgjwbSiUiSjiZk3qKKc9DDOncf"
feishu_edit_time: "1783476049"
---

## FastAPI 技术栈

FastAPI 构建在两个核心库之上：

| 组件 | 作用 | 说明 |
| --- | --- | --- |
| Starlette | Web 框架层 | 提供路由、中间件、WebSocket 等基础 Web 功能，FastAPI 直接继承自 Starlette |
| Pydantic | 数据校验层 | 基于 Python 类型提示进行数据校验、序列化和文档生成 |
| Uvicorn | ASGI 服务器 | 基于 uvloop 和 httptools 的高性能 ASGI 服务器，用于运行 FastAPI 应用 |

FastAPI 是 Starlette 的子类，因此你可以使用 Starlette 的所有功能。同时 FastAPI 完全兼容 Pydantic，包括基于 Pydantic 的 ORM（如 SQLModel）等外部库。

ASGI（Asynchronous Server Gateway Interface）是 Python 的**异步 Web 服务器接口规范**，相当于异步版的 WSGI。

```plaintext
WSGI（同步）:  Django/Flask + Gunicorn → 只能处理同步请求
ASGI（异步）:  FastAPI + Uvicorn     → 支持异步、WebSocket、流式响应
```

FastAPI 应用是异步框架，需要一个能理解异步的服务器来运行——这就是 Uvicorn 存在的意义。

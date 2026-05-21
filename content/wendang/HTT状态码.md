---
title: "HTT状态码"
date: 2026-04-22
feishu_node_token: "NZ69w6V6rihhhikrcgmcb6dknof"
feishu_edit_time: "1776826378"
---

### 🟢 1xx Informational（信息性）

| 状态码 | 英文名称 | 中文含义 | 常见场景 |
| --- | --- | --- | --- |
| 100 | Continue | 继续 | 服务器已接收请求头，客户端可继续发送请求体 |
| 101 | Switching Protocols | 切换协议 | 同意升级协议（如 HTTP → WebSocket） |
| 103 | Early Hints | 早期提示 | 提前返回部分响应头（如预加载 CSS/JS，提升首屏性能） |

### 🟢 2xx Success（成功）

| 状态码 | 英文名称 | 中文含义 | 常见场景 |
| --- | --- | --- | --- |
| 200 | OK | 成功 | 请求正常完成，返回响应体 |
| 201 | Created | 已创建 | 请求成功并创建新资源（常用于 POST） |
| 202 | Accepted | 已接受 | 请求已入队/异步处理中，结果稍后获取 |
| 204 | No Content | 无内容 | 请求成功，但无返回体（常用于 DELETE/PUT） |
| 206 | Partial Content | 部分内容 | 范围请求成功，用于断点续传、视频分片加载 |

### 🟡 3xx Redirection（重定向）

| 状态码 | 英文名称 | 中文含义 | 常见场景 |
| --- | --- | --- | --- |
| 301 | Moved Permanently | 永久重定向 | 资源已永久迁移，建议更新书签/SEO权重转移 |
| 302 | Found | 临时重定向 | 资源临时迁移，默认将请求方法转为 GET |
| 303 | See Other | 查看其他地址 | 明确指示客户端用 GET 访问新 URL（防重复提交） |
| 304 | Not Modified | 未修改 | 缓存有效，客户端使用本地缓存（条件请求命中） |
| 307 | Temporary Redirect | 临时重定向 | 保持原请求方法不变（替代 302 的严格场景） |
| 308 | Permanent Redirect | 永久重定向 | 保持原请求方法不变的永久跳转（替代 301） |

### 🟠 4xx Client Error（客户端错误）

| 状态码 | 英文名称 | 中文含义 | 常见场景 |
| --- | --- | --- | --- |
| 400 | Bad Request | 错误请求 | 参数缺失、JSON 格式错误、语法无效 |
| 401 | Unauthorized | 未授权 | 未登录或凭证无效，需重新认证 |
| 403 | Forbidden | 禁止访问 | 已认证但权限不足，或被策略/IP 拦截 |
| 404 | Not Found | 未找到 | 请求的路径或资源不存在 |
| 405 | Method Not Allowed | 方法不允许 | 使用了不支持的 HTTP 方法（如 GET 调 POST 接口） |
| 408 | Request Timeout | 请求超时 | 客户端发送请求过慢，服务器主动断开 |
| 409 | Conflict | 冲突 | 请求与当前资源状态冲突（如并发修改、重复创建） |
| 413 | Payload Too Large | 请求体过大 | 上传文件/数据超过服务器或框架限制 |
| 415 | Unsupported Media Type | 不支持的媒体类型 | Content-Type 不被服务端接受 |
| 422 | Unprocessable Entity | 无法处理的实体 | 格式正确但业务校验失败（API 常用） |
| 429 | Too Many Requests | 请求过多 | 触发限流/频率限制，需等待后重试 |
| 451 | Unavailable For Legal Reasons | 因法律原因不可用 | 内容被依法屏蔽/下架 |

### 🔴 5xx Server Error（服务器错误）

| 状态码 | 英文名称 | 中文含义 | 常见场景 |
| --- | --- | --- | --- |
| 500 | Internal Server Error | 内部服务器错误 | 服务端代码抛异常、未捕获错误、配置故障 |
| 501 | Not Implemented | 未实现 | 服务器不支持该请求方法或功能 |
| 502 | Bad Gateway | 错误网关 | 反向代理/网关收到上游无效响应（如 PHP-FPM 崩溃、后端重启） |
| 503 | Service Unavailable | 服务不可用 | 服务器过载、维护中、依赖服务宕机（常配合 Retry-After） |
| 504 | Gateway Timeout | 网关超时 | 上游服务器未在限定时间内响应（常见于慢 SQL、外部 API 超时） |

状态码

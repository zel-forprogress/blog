---
title: "Ragent项目开发"
date: 2026-05-18
feishu_node_token: "BN1DwvzhDiYp7xkkZH4cjYwJnle"
feishu_edit_time: "1779095859"
---

Ragent（[官方介绍链接](https://nageoffer.com/ragent)）是一个面向企业场景的 Agentic RAG 平台：**从文档入库**、**向量索引**到**多路检索**、**意图识别**、**MCP 工具调用**和**流式问答**，形成完整闭环。定位是 Java 后端开发者学习/落地 AI 应用的开源参考实现，而不是「调 API + 向量库」的 Demo。

### 技术栈

<!-- 暂不支持的块类型: 30 -->

### 项目模块

```
ragent/
├── bootstrap/      # 业务启动模块（核心业务逻辑）
├── framework/      # 通用基础设施层（与业务无关）
├── infra-ai/       # AI基础设施层（屏蔽模型供应商差异）
├── mcp-server/     # MCP服务器模块
└── frontend/       # React前端（约18000行代码）
```

### 核心特性

1. **多路检索并行 + 后处理流水线**

2. **模型路由 + 首包探测 + 自动降级**

3. **可编排的文档入库 Pipeline**

4. **分布式排队限流（Redis ZSET + Pub/Sub）**

5. **8个专用线程池 + TTL上下文透传**

6. **三态熔断器（CLOSED → OPEN → HALF_OPEN）**

7. **全链路 Trace 可观测性**

8. **完整管理后台 + 用户问答界面**

## 一、启动

使用docker来部署启动所需要的中间件，不影响我们的本地环境，方遍又快捷

**1. 启动 Docker 中间件**（如果还没启动）（让ai编辑一份docker-compose.yml文件；需要先运行docker desktop）

```bash
docker compose up -d
```

**2. 编译项目**（首次或代码有改动时）

```bash
mvn clean install -DskipTests
```

**3. 启动后端**（新终端）

```bash
mvn spring-boot:run -pl bootstrap
```

**4. 启动前端**（新终端）

```bash
cd frontend
npm run dev
```

## 二、学习实践-(以提问的方式来学习)

### **Q1:文档入库：这个项目知识库管理背后的处理逻辑是怎么样的？** 细分为：

- 用户上传的文件存储在哪里？

- 如何对文档进行embedding的？（总览）

- 分块有什么策略？具体怎么来分的？

- 用户提问的时候是怎么检索并回答问题？

- 用户与该RAG的聊天记录是怎么存储的？

<!-- 暂不支持的块类型: 22 -->

## 回答

### Q1A1: 用户上传的文件存储在哪里？

用户上传文件后，调用 `upload()` 方法：

- 代码位置：`bootstrap\src\main\java\com\nageoffer\ai\ragent\knowledge\service\impl\KnowledgeDocumentServiceImpl.java`

- 文件存入 MinIO（对象存储）（启动MinIO后，可以通过它的web控制台来查看信息。默认监听地址为：[http://localhost:9001](http://localhost:9001/)，默认的用户名与密码都是：rustfsadmin）

- 文档元信息写入数据库 `t_knowledge_document` 表(PostgreSQL数据库中)，状态为 `pending`

<!-- 暂不支持的块类型: 22 -->

### Q2A2: 如何对文档进行embedding的？

文档从上传到完成 Embedding 存入向量数据库，经过一条基于**节点编排**的 Ingestion（吸收） Pipeline，每个节点负责一个独立的处理步骤。通过 `IngestionContext` 共享状态，按顺序执行，上一个节点的输出作为下一个节点的输入

```
文档上传 → Fetcher → Parser → [Enhancer] → Chunker(含Embedding) → [Enricher] → Indexer → 向量数据库
```

#### Pipeline 节点执行流程总览

由 `IngestionEngine` 编排执行，每个节点都实现 `IngestionNode` 接口：

<!-- 暂不支持的块类型: 30 -->

- **Fetcher**- 文档获取节点（从多元化存储介质中检索并载入文档原始字节流）：

- **Parser**- 文档解析节点（将输入的字节流解析为结构化的文本或文档对象）：

- **EnhancerNode -** 文档增强节点（通过大模型对整个文档进行AI增强处理）：

- **ChunkerNode** - 文本分块节点（将完整文本切分成多个较小的文本块（Chunk））

- **EnricherNode** - 分块增强节点（对每个文档分片进行信息提取或补充 ）：

- **IndexerNode** - 索引节点（将处理后的文档分块数据索引到向量数据库中）

## 数据流

```
原始文档 → FetcherNode(字节流) → ParserNode(结构化文本) → EnhancerNode(增强文本) 
→ ChunkerNode(分块+向量) → EnricherNode(分块增强) → IndexerNode(向量存储)
```

<!-- 暂不支持的块类型: 22 -->

### Q3A3: 分块有什么策略？具体怎么来分的？

### Q4A4: 用户提问的时候是怎么检索并回答问题？

### Q5A5: 用户与该RAG的聊天记录是怎么存储的？

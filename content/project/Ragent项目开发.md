---
title: "Ragent项目开发"
date: 2026-05-27
feishu_node_token: "BN1DwvzhDiYp7xkkZH4cjYwJnle"
feishu_edit_time: "1779850582"
---

Ragent（[官方介绍链接](https://nageoffer.com/ragent)）是一个面向企业场景的 Agentic RAG 平台：**从文档入库**、**向量索引**到**多路检索**、**意图识别**、**MCP 工具调用**和**流式问答**，形成完整闭环。定位是 Java 后端开发者学习/落地 AI 应用的开源参考实现，而不是「调 API + 向量库」的 Demo。

### 技术栈

| 类别 | 技术 |
| --- | --- |
| 后端框架 | Spring Boot 3.5.7 (Java 17) |
| 向量数据库 | Milvus 2.6.6 |
| 文档解析 | Apache Tika 3.2.3 |
| ORM | MyBatis-Plus 3.5.14 |
| 对象存储 | AWS S3 |
| 认证授权 | Sa-Token 1.43.0 |
| 缓存/分布式锁 | Redisson 4.0.0 |
| 消息队列 | RocketMQ 2.3.5 |
| MCP协议 | MCP SDK 1.1.2 |
| 前端 | React + TypeScript + Vite |

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

1. **启动 Docker 中间件**（如果还没启动）（让ai编辑一份docker-compose.yml文件；需要先运行docker desktop）

```bash
docker compose up -d
```

2. **编译项目**（首次或代码有改动时）

```bash
mvn clean install -DskipTests
```

3. **启动后端**（新终端）

```bash
mvn spring-boot:run -pl bootstrap
```

4. **启动前端**（新终端）

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

---

## 回答

### Q1A1: 用户上传的文件存储在哪里？

用户上传文件后，调用 `upload()` 方法：

- 代码位置：`bootstrap\src\main\java\com\nageoffer\ai\ragent\knowledge\service\impl\KnowledgeDocumentServiceImpl.java`

- 文件存入 MinIO（对象存储）（启动MinIO后，可以通过它的web控制台来查看信息。默认监听地址为：[http://localhost:9001](http://localhost:9001/)，默认的用户名与密码都是：rustfsadmin）

- 文档元信息写入数据库 `t_knowledge_document` 表(PostgreSQL数据库中)，状态为 `pending`

---

### Q2A2: 如何对文档进行embedding的？

文档从上传到完成 Embedding 存入向量数据库，经过一条基于**节点编排**的 Ingestion（吸收） Pipeline，每个节点负责一个独立的处理步骤。通过 `IngestionContext` 共享状态，按顺序执行，上一个节点的输出作为下一个节点的输入

```
文档上传 → Fetcher → Parser → [Enhancer] → Chunker(含Embedding) → [Enricher] → Indexer → 向量数据库
```

#### Pipeline 节点执行流程总览

由 `IngestionEngine` 编排执行，每个节点都实现 `IngestionNode` 接口：

| 节点 | 类名 | 职责 |
| --- | --- | --- |
| Fetcher | FetcherNode | 从不同来源获取文档原始内容（S3、本地文件、HTTP URL、飞书） |
| Parser | ParserNode | 使用 Apache Tika 解析文档（PDF/DOC/DOCX/Markdown 等）→ 纯文本 |
| Enhancer | EnhancerNode | 可选，用 LLM 增强文档内容（如补充上下文） |
| Chunker | ChunkerNode | 核心：文本分块 + Embedding 向量化 |
| Enricher | EnricherNode | 可选，用 LLM 为每个 chunk 生成关键词/摘要/结构化元数据 |
| Indexer | IndexerNode | 将带 embedding 的 chunk 写入向量数据库 |

- **Fetcher**- 文档获取节点（从多元化存储介质中检索并载入文档原始字节流）：
  - 采用策略模式（Strategy Pattern），根据`SourceType`动态路由到具体的`DocumentFetcher`实现；
  
  
  - 支持多种数据源：本地文件系统（Local FS）、HTTP/HTTPS、OSS等; 
  
  
  - **幂等性检查**：若上下文中已预置原始字节，则自动跳过获取流程，避免重复I/O；
  
  
  - 检测文档MIME类型，设置到上下文中供**后续节点**使用。

- **Parser**- 文档解析节点（将输入的字节流解析为结构化的文本或文档对象）：
  - 使用Apache Tika作为核心解析器，支持PDF、Word、Excel、PPT等多种格式；
  
  
  - **文件类型验证**：根据配置的`ParserSettings`规则验证文件类型是否允许处理；
  
  
  - 解析规则匹配：支持按MIME类型和文件名扩展名匹配规则；
  
  
  - 生成结构化文档对象（`StructuredDocument`），包含文本内容和元数据。

- **EnhancerNode -** 文档增强节点（通过大模型对整个文档进行AI增强处理）：
  - 支持多种增强任务类型：`CONTEXT_ENHANCE`：上下文增强，改善文档表达，`KEYWORDS`：关键词提取，`QUESTIONS`：问题生成（用于检索增强），`METADATA`：元数据提取。
  
  
  - 使用`EnhancerPromptManager`管理提示词模板，支持自定义系统提示词和用户提示词。
  
  
  - 优先使用增强后的文本（`enhancedText`），若无则使用原始文本。将任务结果应用到上下文的不同字段中

- **ChunkerNode** - 文本分块节点（将完整文本切分成多个较小的文本块（Chunk）） 
  - 支持多种分块策略，通过`ChunkingStrategyFactory`获取具体策略实现
  
  
  - **可配置参数**：分块大小（chunkSize，默认512）和重叠大小（overlapSize，默认128）
  
  
  - 使用`ChunkEmbeddingService`为切分后的文本块生成向量嵌入（Embedding）
  
  
  - 将处理后的分块设置到上下文中供后续节点使用

- **EnricherNode** - 分块增强节点（对每个文档分片进行信息提取或补充 ）：
  - 针对每个分块单独调用大模型进行增强处理
  
  
  - 支持的任务类型： 
    - `KEYWORDS`：关键词提取
    
    
    - `SUMMARY`：摘要生成
    
    
    - `METADATA`：元数据补充
    
  
  
  - 可配置是否附加文档级元数据到分块中
  
  
  - 使用`EnricherPromptManager`管理提示词模板，支持变量替换（text, content, chunkIndex等）

- **IndexerNode** - 索引节点（将处理后的文档分块数据索引到向量数据库中）
  - 确保向量空间存在，如不存在则自动创建
  
  
  - 构建包含丰富元数据的行数据： 
    - chunk_id、content、embedding等核心字段
    
    
    - chunk_index、task_id、pipeline_id等上下文信息
    
    
    - 可配置附加的元数据字段
    
  
  
  - 支持批量插入到Milvus等向量数据库
  
  
  - **事务控制**：当`skipIndexerWrite=true`时，仅做校验不执行写入，由调用方统一在事务中完成向量持久化

## 数据流

```
原始文档 → FetcherNode(字节流) → ParserNode(结构化文本) → EnhancerNode(增强文本) 
→ ChunkerNode(分块+向量) → EnricherNode(分块增强) → IndexerNode(向量存储)
```

---

### Q3A3: 分块有什么策略？具体怎么来分的？

该项目实现了**两种分块策略**，通过策略模式进行管理，支持灵活切换。

- 策略一：FIXED_SIZE（固定大小切分） 
  - 固定分块策略（`FIXED_SIZE`）是将文档按**固定字符数**切分成小块的方法，同时保留相邻块之间的**重叠部分**，以保持上下文连续性。
  
  
  - 两个参数：chuckSize（默认值512，每个块的目标字符数）,overlapSize(默认值128，相邻块的重叠字符数)
  
  
  - 工作流程        
  原始文本: "这是一段示例文本，用于演示固定分块策略的工作原理..."
  ↓
  
  
  1. 归一化处理 (normalizeText)（修复**格式问题**，如多余的换行）
  ↓
  
  
  2. 按 chunkSize 切分，保留 overlapSize 重叠（滑动窗口切分，从文本起始位置开始，按 `chunkSize` 大小向前推进；计算目标结束位置 `targetEnd = start + chunkSize`；调用 `adjustToBoundary()` 将结束位置**对齐到自然边界**）
  ↓
  
  
  3. 边界对齐 (adjustToBoundary)（- 在 `overlapSize` 范围内向前回退寻找更优的切分点；找不到合适边界则直接在 `targetEnd` 处硬切）
  ↓
  
  
  4. 生成 VectorChunk 列表（**切分好的文本块打包成对象**：
   VectorChunk {
   chunkId: "1234567890",      // 唯一ID，雪花算法
   index: 0,                   // 第几个块
   content: "这是第一块内容",    // 文本内容
   embedding: [0.1, 0.2, ...]  // 向量（后面调用embedding生成，然后填充）
   }）

- 策略二：STRUCTURE_AWARE（结构感知切分 / Markdown友好） 
  - 这是一种**Markdown友好**的智能分块策略，它会识别文档的结构元素，**只在结构边界处切分**，不会破坏文档的完整性。不像固定大小切分可能把一句话从中间切断，结构感知切分会识别Markdown的结构，在合理的位置分割。
  
  
  - 四个参数：targetChars（是打包时的**理想目标**，不是硬性要求）、overlapChars（相邻块重叠大小）、maxChars（块的硬上限）、minChars（块的最小下限）

### Q4A4: 用户提问的时候是怎么检索并回答问题？

**完整流程：**
 用户提问
 │
 ▼
 ① 记忆加载（loadMemory）【加载对话历史，让 LLM 理解上下文。】
 │
 ▼
 ② 查询改写 + 拆分（rewriteQuery）
 │
 ▼
 ③ 意图解析（resolveIntents）
 │
 ▼
 ④ 歧义引导检查（handleGuidance）──→ 有歧义？直接返回引导提示
 │ 无歧义
 ▼
 ⑤ 纯系统响应检查（handleSystemOnly）──→ 纯系统意图？直接用系统Prompt回答
 │ 非纯系统
 ▼
 ⑥ 多通道检索（retrieve）
 │
 ▼
 ⑦ Prompt 组装 + LLM 流式回答（streamRagResponse）
 │
 ▼
 返回给用户

### Q5A5: 用户与该RAG的聊天记录是怎么存储的？

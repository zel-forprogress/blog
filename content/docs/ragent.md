---
title: "Ragent 项目学习笔记"
weight: 2
---

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
cd d\frontend
npm run dev
```

## 二、学习实践-(以提问的方式来学习)

### **Q1:这个项目知识库管理背后的处理逻辑是怎么样的？** 细分为：

- 用户上传的文件存储在哪里？
- 如何将文档进行切分的（文档的处理方式）？
- 如何切分快如何存入向量数据库中的？
- 用户提问的时候是怎么检索并回答问题？
- 用户与该RAG的聊天记录是怎么存储的？

---

## 回答

### Q1A1: 用户上传的文件存储在哪里？
用户上传文件后，调用 `upload()` 方法：
- 代码位置：`bootstrap\src\main\java\com\nageoffer\ai\ragent\knowledge\service\impl\KnowledgeDocumentServiceImpl.java`
- 文件存入 MinIO（对象存储）（启动MinIO后，可以通过它的web控制台来查看信息。默认监听地址为：**[http://localhost:9001](http://localhost:9001/)**，默认的用户名与密码都是：rustfsadmin）
- 文档元信息写入数据库 `t_knowledge_document` 表(PostgreSQL数据库中)，状态为 `pending`
### Q2A2: 如何将文档进行切分的？

本项目支持两种分块方式

**1. 固定大小分块（FixedSizeTextChunker）**

**2. 结构感知分块（StructureAwareTextChunker）**
### Q3A3: 如何切分快如何存入向量数据库中的？


### Q4A4: 用户提问的时候是怎么检索并回答问题？

### Q5A5: 用户与该RAG的聊天记录是怎么存储的？

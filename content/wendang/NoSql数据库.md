---
title: "NoSql数据库"
date: 2026-04-17
feishu_node_token: "I8dww4HM0ihwHikBuntcU4Mjn7f"
feishu_edit_time: "1776398057"
---

# **一、定义**

**NoSQL **的全称最早是 Not Only SQL（不仅仅是 SQL），意思是它不强制使用关系型数据库的 SQL 语法，而是提供更灵活的方式来操作数据。

- **我们不能**在大多数 NoSQL 里直接复制关系型数据库的复杂 SQL（如带 JOIN、多表事务、外键约束等）。

- 但很多现代 NoSQL 提供了 **SQL-like** 或 **SQL 兼容层**，让熟悉 SQL 的开发者上手更容易。

# 二、特性

**NoSQL **数据库被设计成天生支持分布式，这是它与传统关系型数据库（SQL）最大的区别之一

#### 1. **分布式（Distributed）**

- 意思是：数据库不是跑在一台服务器上，而是**自动分布在多台服务器（节点）上**组成一个集群。

- **为什么需要分布式？**

- **NoSQL 的优势**：

#### 2. **数据分片（Sharding / Data Partitioning）**

- **分片**就是把一份大数据“切成小块”（shards），然后把这些小块分散存储到不同的服务器上。

- **怎么切？** 常见规则：

- **好处**：

- **NoSQL 天生支持**：MongoDB 有自动分片（Auto-Sharding），Cassandra 通过一致性哈希环实现分片，DynamoDB 完全自动管理分片。

#### 3. **数据冗余（Data Redundancy / Replication）**

- 为了高可用，同一份数据会在多个节点上**复制多份**（通常 3 份或更多）。

- 一台节点挂掉时，其他副本还能提供服务，不会丢失数据。

- 这也是 NoSQL “天生支持”的特性之一。

# 三、总结

分片后会带来一些挑战：跨分片的事务（分布式事务）很复杂，所以 NoSQL 通常采用**最终一致性**（BASE 原则），而不是 SQL 的强一致性（ACID）。

现代有些“NewSQL”数据库（如 CockroachDB、TiDB）试图结合 SQL 的易用性和 NoSQL 的分布式能力。

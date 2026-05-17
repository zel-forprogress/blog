---
title: "Transformer"
date: 2026-04-28
feishu_node_token: "WoAawQXxHi1t2gkp8LIcdvfOnBT"
feishu_edit_time: "1777355752"
---

# Transformer

Transformer
① Transformer 是什么？
全称：Transformer 架构
它是目前几乎所有大语言模型（ChatGPT、Llama、Qwen、DeepSeek 等）的核心骨架。
主要特点：抛弃了传统的 RNN、LSTM，完全使用 Self-Attention（自注意力机制） 来处理序列数据。
优点：并行计算能力强，能很好地捕捉长距离依赖关系。
简单说：Transformer 是一种强大的神经网络结构。
② BERT 是什么？
BERT = Bidirectional Encoder Representations from Transformers
中文：基于 Transformer 的双向编码器表示
BERT 是 Google 在 2018 年发布的预训练语言模型，它使用了 Transformer 中的 Encoder（编码器）部分。
BERT 的最大创新是双向理解：它能同时看一个词的左边和右边上下文（而之前的模型大多只能看一边）。
BERT 一经发布就大幅刷新了各种 NLP 任务的记录，后来几乎所有现代语言模型都受到了它的影响。
③ [CLS] 是什么？为什么会出现？
[CLS] 是 “Class” 的缩写，中文常称为 分类标记 或 句首标记。
它的作用是：
在 BERT 处理文本时，会在输入文本的最前面自动加上一个特殊的 Token：[CLS]。
例如输入句子：

“今天天气很好”
经过 Tokenizer 处理后变成：

[CLS] 今 天 天 气 很 好
BERT 的 Transformer 编码器会对整个序列（包括 [CLS]）进行处理。
关键点来了：
通过自注意力机制（Self-Attention），[CLS] 这个位置会逐渐“吸收”整个句子的所有信息。
训练时，BERT 被专门训练成：让 [CLS] 的最终向量能代表整个句子的整体语义。
因此，在做文本分类、情感分析、相似度计算等任务时，人们通常直接取出 [CLS] 位置的向量来代表整个文本块，而不需要再对所有 Token 做平均。


---
title: "TailwindCSS与传统CSS"
date: 2026-04-30
feishu_node_token: "LuhawDoStibhnLk3TFBcVjKznYd"
feishu_edit_time: "1777532184"
---

## 🎯 场景：创建一个用户卡片

假设你需要做一个这样的用户卡片：

- 白色背景、圆角、阴影

- 内边距、外边距

- 标题大号加粗、文字灰色

- 按钮蓝色背景、白色文字、圆角

---

## 📝 传统 CSS 写法

你先要写一个 CSS 文件：

`/* styles.css */`

`.card {`

`  background-color: white;`

`  border-radius: 8px;`

`  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);`

`  padding: 20px;`

`  margin: 16px;`

`  max-width: 300px;`

`}`

`.title {`

`  font-size: 24px;`

`  font-weight: bold;`

`  color: #374151;`

`  margin-bottom: 12px;`

`}`

`.button {`

`  background-color: #3b82f6;`

`  color: white;`

`  padding: 8px 16px;`

`  border-radius: 6px;`

`  border: none;`

`  cursor: pointer;`

`}`

`.button:hover {`

`  background-color: #2563eb;`

`}`

然后在 HTML 里用上这些类名：

`<div class="card">`

`  <h2 class="title">张三</h2>`

`  <p>这是一段介绍文字</p>`

`  <button class="button">查看详情</button>`

`</div>`

问题：

- 你需要来回切换 HTML 和 CSS 文件

- 要给各种东西起名字（`.card`、`.title`、`.button`...）

- 改一个样式要去 CSS 里找对应的类名

---

## ✨ Tailwind CSS 写法

你只需要写 HTML，不用离开这个文件：

`<div class="bg-white rounded-lg shadow-md p-5 m-4 max-w-sm">`

`  <h2 class="text-2xl font-bold text-gray-700 mb-3">张三</h2>`

`  <p class="text-gray-500 mb-4">这是一段介绍文字</p>`

`  <button class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition">`

`    查看详情`

`  </button>`

`</div>`

看到区别了吗？ 所有样式都写在 `class` 属性里，用的是 Tailwind 提供的工具类。

---

## 🔍 常用 Tailwind 类名对照表

| 想要的效果 | Tailwind 类名 | 大致对应的 CSS |
| --- | --- | --- |
| 白色背景 | bg-white | background-color: white |
| 蓝色背景 | bg-blue-500 | background-color: #3b82f6 |
| 圆角（小/中/大） | rounded / rounded-lg / rounded-full | border-radius: 0.25rem / 0.5rem / 9999px |
| 阴影 | shadow / shadow-md / shadow-lg | box-shadow: ... |
| 内边距 | p-4（四周）、px-4（左右）、py-2（上下） | padding: 1rem / 0 1rem / 0.5rem 0 |
| 外边距 | m-4、mt-2（上）、mb-3（下） | margin |
| 文字大小 | text-sm、text-xl、text-2xl | font-size |
| 文字粗细 | font-normal、font-bold | font-weight |
| 文字颜色 | text-gray-500、text-red-600 | color |
| 弹性布局 | flex、justify-between、items-center | display: flex + 对齐属性 |
| 网格布局 | grid、grid-cols-3、gap-4 | display: grid + 列数 + 间距 |
| 悬停效果 | hover:bg-blue-600 | &:hover { background-color } |
| 响应式（手机优先） | md:flex、lg:text-2xl | 屏幕宽度 >= 768px 时才应用 |

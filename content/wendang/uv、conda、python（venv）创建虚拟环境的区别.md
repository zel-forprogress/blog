---
title: "uv、conda、python（venv）创建虚拟环境的区别"
date: 2026-04-28
feishu_node_token: "YCNUw35yci0qx3k35Yxc1wqenA0"
feishu_edit_time: "1777345696"
---

# **Python 自己的虚拟环境（venv）**

# **uv（强烈推荐了解的新工具）**

# **Conda（Anaconda / Miniconda）**

**实际使用建议（2026 年）**

- **纯 Python 项目**（Web 后端、脚本、自动化、学习等）→ **强烈推荐 uv** 它目前是速度和体验最好的选择，很多人都已经“删掉 conda 改用 uv”了。

- **数据科学 / 机器学习 / 需要 GPU** → **继续用 Conda（或 micromamba / pixi）** 因为 uv 还无法完美替代 conda 处理非 Python 二进制依赖。

- **极简主义** → 直接用 **venv + pip**（或 venv + uv pip）。

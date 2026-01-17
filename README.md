# CiteRepo - 下一代智能学术文献科研助手

> **本项目由阿里云ESA提供加速、计算和保护**
> <img width="7534" height="844" alt="图片" src="https://github.com/user-attachments/assets/89bc0e51-66b5-44b5-95da-ae56e0a1373f" />


## 📖 项目简介

**CiteRepo** 是一个基于 Web 的现代化科研文献管理与深度分析平台。它不再仅仅是一个 PDF 阅读器，而是将静态的学术论文转化为可交互的知识库。通过集成先进的大语言模型（DeepSeek V3 / Alibaba DashScope），CiteRepo 能够辅助科研人员完成从**文献管理**、**深度阅读**、**批判性分析**到**跨文对比**的全流程工作。

本项目完全部署于 **阿里云 ESA (Edge Security Acceleration) Pages**，利用边缘计算节点实现了全球毫秒级访问加速。

---

## 🏆 核心竞争力分析

本项目严格遵循大赛评选标准，从以下三个维度进行设计与实现：

### 1. 💡 创意卓越 (Creativity)
CiteRepo 突破了传统阅读器的工具属性，引入了**“内容形态转换”**的创新概念：
*   **AI 播客生成 (Audio Overview):** 模仿 NotebookLM，将枯燥的论文自动转化为两位主持人（专家与好奇者）之间的生动对话脚本，让科研人员可以在通勤时“听”懂论文核心。
*   **角色扮演式分析:** 引入 "Reviewer #2"（严苛审稿人）AI 角色，专门对论文进行批判性思维审查，帮助用户发现逻辑漏洞。
*   **可视化概念图谱:** 自动提取论文核心概念并生成 Mermaid.js 思维导图，一键理清复杂理论关系。

### 2. 🚀 应用价值 (Practicality)
直击科研人员痛点，具备极高的“部署即用”价值：
*   **多文档对比矩阵:** 支持同时打开多篇论文（如原文与翻译版、同领域的不同论文），AI 自动生成横向对比矩阵（方法论、数据集、结论），极大提升综述撰写效率。
*   **精准区域分析:** 很多论文的关键信息藏在图表中。CiteRepo 支持**框选截图分析**，直接解析图表数据和公式含义。
*   **无障碍阅读:** 内置沉浸式全文翻译与术语解释，打破语言障碍。

### 3. 🛠️ 技术探索 (Technical Depth)
本项目深度整合了前端工程化与边缘计算生态：
*   **边缘部署 (ESA Pages):** 利用阿里云 ESA Pages 的静态资源托管与 CDN 加速，确保大体积 PDF 文件和应用资源的秒级加载。
*   **高难度 PDF 渲染:** 攻克了 PDF.js 在现代打包工具中的版本兼容难题（采用 Global Injection 方案），实现了精准的 Text Layer 覆盖，支持高精度的划词与高亮。
*   **流式 AI 交互:** 基于 React + Vite 构建高性能 SPA，集成 Mermaid 渲染引擎与 Markdown 实时预览，实现了丝滑的人机交互体验。

---

## ✨ 功能特性

*   **📂 文献导入与管理**: 本地 PDF 秒级导入，支持元数据编辑与标签管理。
*   **📖 沉浸式阅读器**: 双屏/三屏分栏模式，支持原文与 AI 分析结果对照阅读。
*   **🧠 智能辅助**:
    *   **划词提问**: 选中文字即可获得背景补充或概念解释。
    *   **全文翻译**: 保持 Markdown 格式的学术级翻译。
    *   **方法论拆解**: 自动提取算法流程与复现难点。
*   **📊 可视化与多模态**: 自动生成学术概念图谱、AI 播客脚本。

---

## 🛠️ 技术栈

*   **Frontend:** React 18, TypeScript, Vite
*   **Styling:** Tailwind CSS (Typography plugin)
*   **PDF Core:** PDF.js (Custom Integration)
*   **Visualization:** Mermaid.js, Lucide React
*   **AI Service:** Alibaba Cloud DashScope API (DeepSeek Model)
*   **Deployment:** Alibaba Cloud ESA Pages

---

## 🚀 本地运行

1. 克隆仓库：
   ```bash
   git clone https://github.com/weichu2002/paperreader.git

    安装依赖：
    code Bash

    npm install

    启动开发服务器：
    code Bash

    npm run dev

    构建生产版本：
    code Bash

    npm run build

    构建产物位于 dist 目录，可直接上传至阿里云 ESA Pages。

📄 声明

本作品为原创开发，仅用于阿里云 ESA 开发者大赛参赛展示。所有引用的第三方库均遵循其开源协议。


import { Repo, Run, RunStatus, Asset, RepoFile } from '../types';
import { MOCK_DELAY } from '../constants';

// --- CONFIGURATION ---
const API_KEY = 'sk-26d09fa903034902928ae380a56ecfd3';
const BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const MODEL_NAME = "deepseek-v3"; 

// --- STATE MANAGEMENT (In-Memory Only) ---
let repos: Repo[] = [];
let runs: Run[] = [];
let assets: Asset[] = [];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- HELPER: Extract Text from PDF (FULL CONTENT) ---
const extractPdfText = async (file: File): Promise<string> => {
  try {
    // Access global PDF.js library injected via <script> in index.html
    const PDFJS = window.pdfjsLib;
    if (!PDFJS) throw new Error("PDF.js library not loaded");

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = PDFJS.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";

    // Limit pages
    const maxPages = Math.min(pdf.numPages, 50);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += `\n\n--- Page ${i} ---\n\n` + pageText;
    }

    return fullText;
  } catch (error) {
    console.error("PDF Extraction Failed:", error);
    return "Error extracting text from PDF. Please ensure it is a valid text-based PDF.";
  }
};

// --- HELPER: Call AI API ---
const callAI = async (messages: any[]) => {
  try {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: messages,
        stream: false,
        max_tokens: 4096 
      })
    });

    if (!response.ok) {
       const err = await response.text();
       throw new Error(`API Error: ${err}`);
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response generated.";
  } catch (error) {
    console.error("AI Call Failed:", error);
    throw error;
  }
};

// --- SPECIALIZED PROMPTS ---
const PROMPTS = {
    TRANSLATE: "你是一位专业的学术论文翻译家。请将提供的英文论文片段翻译成中文。要求：\n1. 保持Markdown格式（标题、列表、代码块）。\n2. 保留数学公式的LaTeX格式。\n3. 术语翻译准确、学术化。\n4. 不要输出任何开场白或结束语，直接输出翻译后的正文。",
    METHODOLOGY: `你是一位精通算法和实验设计的资深研究员。请用**中文**提取这篇论文的【研究方法论】并生成一份教学指南。
    输出要求：
    1. **核心算法流程**：用清晰的步骤描述模型是如何工作的。
    2. **数学原理拆解**：解释关键公式的物理含义。
    3. **实施细节**：列出超参数、训练技巧或特殊的数据处理方法。
    4. **复现难点预警**：指出在复现这个方法时最容易踩的坑。
    请用 Markdown 格式输出，确保全文为中文。`,
    CRITIQUE: `你现在是 "Reviewer #2"（以严苛著称的审稿人）。请用**中文**对这篇论文进行【批判性思维训练】分析。
    输出要求：
    1. **逻辑漏洞**：指出论文论证链条中的薄弱环节。
    2. **证据强度评估**：实验结果是否真的足以支持其宣称的结论？有没有过度主张（Overclaiming）？
    3. **替代解释**：目前的实验现象是否可能由其他原因导致？
    4. **偏见识别**：作者在选择基线（Baselines）或数据集时是否存在选择偏差？
    请用 Markdown 输出，保持客观、犀利、有理有据，必须是中文。`,
    GRAPH: `你是一位知识图谱专家。请分析这篇论文的核心概念，并生成一个 Mermaid.js 的流程图或思维导图代码来展示这些概念之间的关系（因果、包含、对比等）。
    重要：
    1. **只输出 Mermaid 代码块**，不要任何解释文字。
    2. 使用 graph TD 或 mindmap 语法。
    3. **节点内容必须是中文翻译**。
    4. 确保代码语法正确，可以被 Mermaid 渲染。`,
    GAPS: `你是一位具有前瞻性眼光的战略科学家。请基于这篇论文的内容，通过【研究问题发现引擎】挖掘未来的机会。请用**中文**回答。
    输出要求：
    1. **未解决的问题**：这篇论文留下了哪些“坑”没填？
    2. **潜在矛盾点**：这篇论文的结论是否与主流观点或其他经典论文有冲突？
    3. **跨学科灵感**：这个方法还能应用到哪些其他领域（如生物、金融、艺术）？
    4. **下一步研究建议**：如果我是博士生，沿着这个方向做研究，下一个题目应该是什么？
    请用 Markdown 输出。`,
    COMPARE: `你是一位学术综述作者。请对提供的这几篇（或两部分）内容进行【对比矩阵分析】。请用**中文**回答。
    请生成一个 Markdown 表格，横向是不同的文档/部分，纵向是以下维度：
    1. 核心问题 (Core Problem)
    2. 方法论 (Methodology)
    3. 数据集 (Dataset)
    4. 关键结果 (Key Results)
    5. 局限性 (Limitations)
    并在表格下方总结它们之间的主要矛盾或互补关系。`,
    PODCAST: `你是一档热门科技播客的制作人。请阅读这篇论文，并生成一段**两位主持人（A 和 B）之间的对话脚本**。
    角色设定：
    *   **主持人A**：好奇心强，负责提问和引导话题，代表普通听众的视角。
    *   **主持人B**：领域专家，风趣幽默，善于用通俗的比喻解释复杂概念。
    要求：
    1.  **全中文对话**，口语化，生动自然，不要像念稿子。
    2.  以“欢迎收听今天的 Deep Dive”开场。
    3.  核心内容要涵盖论文解决的问题、创新点以及它为什么重要。
    4.  使用 Markdown 格式，用 **主持人A:** 和 **主持人B:** 标记。
    5.  时长控制在 5-8 分钟的阅读量。`
};


// --- API CLIENT ---

export const ApiService = {
  // GET /api/repos (Get all repos)
  getRepos: async (): Promise<Repo[]> => {
    return [...repos].sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime());
  },

  // POST /api/import
  importRepo: async (file: File): Promise<Repo> => {
    let pageCount = 0;
    try {
        const PDFJS = window.pdfjsLib;
        if (PDFJS) {
            const ab = await file.arrayBuffer();
            const pdf = await PDFJS.getDocument({ data: ab }).promise;
            pageCount = pdf.numPages;
        }
    } catch (e) { console.warn(e); }
    
    const fileId = `file-${Date.now()}`;
    const repoId = `repo-${Date.now()}`;

    const newRepo: Repo = {
      id: repoId,
      name: file.name.replace('.pdf', ''),
      description: 'Imported document',
      authors: ['Unknown Author'], // Mock extraction
      year: new Date().getFullYear().toString(),
      tags: ['New Import'],
      importedAt: new Date().toISOString(),
      pageCount: pageCount || 1, 
      files: [
        {
          id: fileId,
          name: file.name,
          type: 'pdf',
          category: 'original',
          file: file, // Keep in memory for current session
          createdAt: new Date().toISOString()
        }
      ]
    };

    repos.push(newRepo);
    return newRepo;
  },

  updateRepoMetadata: async (repoId: string, updates: Partial<Repo>): Promise<void> => {
    const repo = repos.find(r => r.id === repoId);
    if (repo) {
        Object.assign(repo, updates);
    }
  },

  renameRepo: async (repoId: string, newName: string): Promise<void> => {
    const repo = repos.find(r => r.id === repoId);
    if (repo) {
        repo.name = newName;
    }
  },

  deleteRepo: async (repoId: string): Promise<void> => {
    repos = repos.filter(r => r.id !== repoId);
  },

  getRepo: async (repoId: string): Promise<Repo | undefined> => {
    return repos.find(r => r.id === repoId);
  },

  getRepoRuns: async (repoId: string): Promise<Run[]> => {
    return runs.filter(r => r.repoId === repoId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getRepoAssets: async (repoId: string): Promise<Asset[]> => {
    const runIds = runs.filter(r => r.repoId === repoId).map(r => r.id);
    return assets.filter(a => runIds.includes(a.runId));
  },

  shareRepo: async (repoId: string): Promise<{ token: string; url: string }> => {
    await delay(MOCK_DELAY);
    const token = btoa(`${repoId}-${Date.now()}`);
    const baseUrl = window.location.href.split('#')[0];
    return { token, url: `${baseUrl}#/share/${token}` };
  },

  // --- CORE GENERATION FUNCTIONS ---

  generateTranslation: async (repoId: string): Promise<RepoFile> => {
    return await processFileGeneration(repoId, 'translation', '全文翻译.md', async (text) => {
        const pages = text.split(/--- Page \d+ ---/).filter(p => p.trim().length > 0);
        const CHUNK_SIZE = 2;
        let result = `# 中文全译本\n\n`;
        for (let i = 0; i < Math.min(pages.length, 6); i += CHUNK_SIZE) { 
            const chunk = pages.slice(i, i + CHUNK_SIZE).join('\n');
            const res = await callAI([
                { role: "system", content: PROMPTS.TRANSLATE },
                { role: "user", content: chunk }
            ]);
            result += res + "\n\n---\n\n";
        }
        return result;
    });
  },

  generateMethodology: async (repoId: string): Promise<RepoFile> => {
    return await processFileGeneration(repoId, 'analysis', '研究方法论解析.md', async (text) => {
        return await callAI([
            { role: "system", content: PROMPTS.METHODOLOGY },
            { role: "user", content: `Full Paper Content:\n${text}` }
        ]);
    });
  },

  generateCritique: async (repoId: string): Promise<RepoFile> => {
    return await processFileGeneration(repoId, 'analysis', '批判性思维审查.md', async (text) => {
        return await callAI([
            { role: "system", content: PROMPTS.CRITIQUE },
            { role: "user", content: `Full Paper Content:\n${text}` }
        ]);
    });
  },

  generateConceptGraph: async (repoId: string): Promise<RepoFile> => {
    return await processFileGeneration(repoId, 'analysis', '学术概念图谱.md', async (text) => {
        return await callAI([
            { role: "system", content: PROMPTS.GRAPH },
            { role: "user", content: `Analyze the concepts in this paper:\n${text}` }
        ]);
    });
  },

  generateResearchGaps: async (repoId: string): Promise<RepoFile> => {
    return await processFileGeneration(repoId, 'analysis', '研究缺口与趋势.md', async (text) => {
        return await callAI([
            { role: "system", content: PROMPTS.GAPS },
            { role: "user", content: `Find research gaps in this paper:\n${text}` }
        ]);
    });
  },

  generatePodcastScript: async (repoId: string): Promise<RepoFile> => {
    return await processFileGeneration(repoId, 'analysis', 'AI播客脚本(Deep Dive).md', async (text) => {
        return await callAI([
            { role: "system", content: PROMPTS.PODCAST },
            { role: "user", content: `Create a podcast script for this paper:\n${text}` }
        ]);
    });
  },

  generateComparisonMatrix: async (repoId: string, filesToCompare: RepoFile[]): Promise<RepoFile> => {
    const repo = repos.find(r => r.id === repoId);
    if (!repo) throw new Error("Repo not found");
    
    // Fetch text from provided files objects (can be from any repo)
    const texts: string[] = [];
    for (const f of filesToCompare) {
        if (f.file) {
            texts.push(`Document (${f.name}):\n` + (await extractPdfText(f.file)).slice(0, 10000));
        } else if (f.content) {
            texts.push(`Document (${f.name}):\n` + f.content.slice(0, 10000));
        }
    }

    const content = await callAI([
        { role: "system", content: PROMPTS.COMPARE },
        { role: "user", content: `Compare the following texts:\n\n${texts.join('\n\n----------------\n\n')}` }
    ]);

    const newFile: RepoFile = {
        id: `file-${Date.now()}-compare`,
        name: `对比矩阵分析.md`,
        type: 'markdown',
        category: 'comparison',
        content: content,
        createdAt: new Date().toISOString()
    };
    repo.files.push(newFile);
    return newFile;
  },

  // --- RUN/CHAT ---

  createRun: async (repoId: string, type: Run['type'], input: Run['input']): Promise<Run> => {
    await delay(300);
    const newRun: Run = {
      id: `run-${Date.now()}`,
      repoId,
      type,
      status: RunStatus.QUEUED,
      input,
      createdAt: new Date().toISOString()
    };
    runs.unshift(newRun);
    processRun(newRun.id);
    return newRun;
  },
};

// --- INTERNAL HELPERS ---

async function processFileGeneration(repoId: string, category: 'translation' | 'analysis' | 'comparison', fileName: string, aiLogic: (text: string) => Promise<string>): Promise<RepoFile> {
    const repo = repos.find(r => r.id === repoId);
    if (!repo) throw new Error("Repo not found");
    const original = repo.files.find(f => f.category === 'original');
    
    if (!original || !original.file) throw new Error("No PDF found");

    const text = await extractPdfText(original.file);
    const content = await aiLogic(text);

    const newFile: RepoFile = {
        id: `file-${Date.now()}`,
        name: fileName,
        type: 'markdown',
        category,
        content,
        createdAt: new Date().toISOString()
    };
    repo.files.push(newFile);
    return newFile;
  }

const processRun = async (runId: string) => {
  const run = runs.find(r => r.id === runId);
  if (!run) return;
  run.status = RunStatus.PROCESSING;

  try {
    let systemPrompt = "你是一个学术助手。请用中文回答。";
    let userContent = "";
    
    if (run.type === 'text_selection') {
      systemPrompt = "你是一位学术导师。请针对用户选中的文本进行【概念解释】、【背景补充】或【批判性引导】。请用**中文**回答。";
      userContent = `Context: "${run.input.context}"\nSelected: "${run.input.text}"\nPrompt: "${run.input.prompt || "请解释这个概念，并给出相关文献推荐。"}"`;
    } else {
        userContent = run.input.prompt || "Hello";
    }

    const output = await callAI([
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
    ]);

    run.output = output;
    run.status = RunStatus.COMPLETED;
  } catch (error) {
    run.status = RunStatus.FAILED;
    run.output = "AI Processing Failed";
  }
};

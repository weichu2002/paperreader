
export interface RepoFile {
  id: string;
  name: string;
  type: 'pdf' | 'markdown';
  category: 'original' | 'translation' | 'analysis' | 'comparison';
  content?: string; // For markdown files
  file?: File; // For PDF files (blob)
  createdAt: string;
}

export interface Repo {
  id: string;
  name: string;
  description: string;
  authors?: string[];
  year?: string;
  tags?: string[];
  files: RepoFile[]; 
  importedAt: string;
  pageCount: number; 
}

export enum RunStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface Asset {
  id: string;
  runId: string;
  type: 'image' | 'chart' | 'json';
  url: string; 
  title: string;
}

export interface Run {
  id: string;
  repoId: string;
  type: 'text_selection' | 'region_selection' | 'chat';
  status: RunStatus;
  input: {
    text?: string;
    context?: string;
    bbox?: number[]; // [x, y, w, h] normalized
    page?: number;
    prompt?: string;
  };
  output?: string; // Markdown content
  assets?: Asset[];
  createdAt: string;
}

export interface SelectionData {
  text: string;
  context: string;
  page: number;
}

export interface RegionData {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

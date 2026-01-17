
import React, { useEffect, useState, useCallback } from 'react';
import { Run, RunStatus, Asset } from '../../types';
import { ApiService } from '../../services/api';
import { Loader2, CheckCircle2, AlertCircle, Play, Image as ImageIcon, FileText, ChevronDown, ChevronUp, ChevronsRight, ChevronsLeft, Sidebar, Lightbulb, Search, MessageSquare, Sparkles } from 'lucide-react';
import { POLLING_INTERVAL } from '../../constants';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface RunPanelProps {
  repoId: string;
  activeSelection?: { type: 'text' | 'region', preview: string };
  onRunCreate: (prompt: string) => void;
  shouldRefresh: number; 
}

const SUGGESTED_QUESTIONS = [
    "总结这篇论文的主要贡献",
    "这个方法的局限性是什么？",
    "与 Transformer 架构有何不同？",
    "实验数据是否充分？"
];

const RunPanel: React.FC<RunPanelProps> = ({ repoId, activeSelection, onRunCreate, shouldRefresh }) => {
  const [runs, setRuns] = useState<Run[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Sidebar State
  const [width, setWidth] = useState(400);
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    let interval: any;
    const fetchRuns = async () => {
      try {
        const data = await ApiService.getRepoRuns(repoId);
        setRuns(data);
      } catch (e) { console.error(e); }
    };
    fetchRuns();
    interval = setInterval(fetchRuns, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [repoId, shouldRefresh]);

  const handleRun = async (customPrompt?: string) => {
    const textToSend = customPrompt || prompt;
    if (!textToSend.trim() && !activeSelection) return;
    setIsSubmitting(true);
    await onRunCreate(textToSend);
    setPrompt('');
    setIsSubmitting(false);
  };

  const startResizing = useCallback(() => setIsDragging(true), []);
  const stopResizing = useCallback(() => setIsDragging(false), []);
  const resize = useCallback((mouseEvent: MouseEvent) => {
    if (isDragging) {
      const newWidth = document.body.clientWidth - mouseEvent.clientX;
      if (newWidth > 300 && newWidth < 800) setWidth(newWidth);
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
    } else {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResizing);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
    }
    return () => {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResizing);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
    };
  }, [isDragging, resize, stopResizing]);

  if (isCollapsed) {
    return (
      <div className="w-12 border-l border-gray-200 bg-white flex flex-col items-center py-4 gap-4 flex-shrink-0 z-30">
        <button 
          onClick={() => setIsCollapsed(false)}
          className="p-2 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors"
        >
          <ChevronsLeft size={20} />
        </button>
        <div className="writing-vertical-rl transform rotate-180 text-gray-400 text-sm font-semibold tracking-wider">
          AI 助手
        </div>
      </div>
    );
  }

  return (
    <div 
        style={{ width: width }}
        className="bg-white border-l border-gray-200 flex flex-col h-full shadow-xl z-30 flex-shrink-0 relative"
    >
      <div
        onMouseDown={startResizing}
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-500/30 z-50 flex items-center justify-center -ml-0.5 group touch-none"
      >
          <div className="w-[1px] h-full bg-transparent group-hover:bg-indigo-400 transition-colors delay-75"></div>
      </div>

      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Sparkles size={16} className="text-indigo-500"/> AI 学术助手</h2>
        </div>
        <button onClick={() => setIsCollapsed(true)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
          <ChevronsRight size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50">
        {runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-4 px-8">
            <div className="bg-indigo-50 p-4 rounded-full">
                <MessageSquare size={32} className="text-indigo-400" />
            </div>
            <p className="text-center">随时为您服务。您可以划选文本进行提问，或者尝试以下问题：</p>
            <div className="grid grid-cols-1 gap-2 w-full mt-2">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button 
                        key={i} 
                        onClick={() => handleRun(q)}
                        className="text-left text-xs bg-white border border-gray-200 p-3 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all text-gray-600"
                    >
                        {q}
                    </button>
                ))}
            </div>
          </div>
        ) : (
          runs.map(run => <RunItem key={run.id} run={run} />)
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        {activeSelection && (
          <div className="mb-3 bg-indigo-50 border border-indigo-100 p-3 rounded-lg text-xs text-indigo-900 shadow-sm animate-in slide-in-from-bottom-2 fade-in">
            <div className="flex justify-between items-center mb-2">
                <span className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${activeSelection.type === 'text' ? 'bg-blue-500' : 'bg-orange-500'}`}></span>
                    已选上下文
                </span>
                <button onClick={() => {}} className="text-indigo-400 hover:text-indigo-700 font-bold">✕</button>
            </div>
            
            <div className="italic opacity-80 max-h-16 overflow-y-auto custom-scrollbar text-[11px] bg-white/50 p-2 rounded border border-indigo-100 mb-2">
              "{activeSelection.preview}"
            </div>
            
            <div className="flex gap-2">
                <button onClick={() => handleRun("请解释选中的这个学术概念，并给出背景知识。")} className="flex-1 bg-white border border-indigo-200 text-indigo-700 py-1.5 rounded hover:bg-indigo-100 transition-colors text-center font-medium">解释概念</button>
                <button onClick={() => handleRun("请批判性地评估这段论证的逻辑有效性。")} className="flex-1 bg-white border border-indigo-200 text-indigo-700 py-1.5 rounded hover:bg-indigo-100 transition-colors text-center font-medium">分析逻辑</button>
            </div>
          </div>
        )}
        
        <div className="relative shadow-sm">
          <textarea 
            className="w-full border border-gray-300 rounded-xl p-3 pr-12 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[50px] resize-none bg-gray-50 focus:bg-white transition-colors"
            placeholder={activeSelection ? "针对选中的内容提问..." : "输入问题..."}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleRun();
              }
            }}
          />
          <button 
            onClick={() => handleRun()}
            disabled={isSubmitting || (!prompt && !activeSelection)}
            className="absolute bottom-2 right-2 bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
          </button>
        </div>
      </div>
    </div>
  );
};

const RunItem: React.FC<{ run: Run }> = ({ run }) => {
  // Always expanded by default in chat view
  return (
    <div className="flex flex-col gap-2">
      {/* User Message */}
      <div className="flex justify-end">
          <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[90%] text-sm shadow-sm border border-gray-200">
             {run.input.text && (
                 <div className="mb-2 text-xs text-gray-500 italic border-l-2 border-gray-300 pl-2">
                     Context: "{run.input.text.substring(0, 50)}..."
                 </div>
             )}
             {run.input.prompt || (run.type === 'text_selection' ? '分析选中的文本' : '...')}
          </div>
      </div>

      {/* AI Response */}
      <div className="flex justify-start">
         <div className={`bg-white text-gray-900 rounded-2xl rounded-tl-sm px-5 py-4 max-w-[95%] text-sm shadow-sm border border-gray-200 ${run.status === 'processing' ? 'animate-pulse' : ''}`}>
            {run.status === 'processing' ? (
                <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 size={14} className="animate-spin"/> 正在思考...
                </div>
            ) : run.status === RunStatus.FAILED ? (
                <div className="text-red-500 flex items-center gap-2"><AlertCircle size={14}/> 生成失败</div>
            ) : (
                <div className="prose prose-sm prose-indigo max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{run.output || ''}</ReactMarkdown>
                </div>
            )}
         </div>
      </div>
      
      <div className="text-[10px] text-center text-gray-300">
        {new Date(run.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
};

export default RunPanel;

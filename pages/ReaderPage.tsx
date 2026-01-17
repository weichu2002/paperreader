
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import Layout from '../components/ui/Layout';
import DocumentViewer from '../components/Reader/DocumentViewer';
import TextViewer from '../components/Reader/TextViewer';
import RunPanel from '../components/Reader/RunPanel';
import { ApiService } from '../services/api';
import { SelectionData, RegionData, Repo, RepoFile } from '../types';
import { ArrowLeft, Check, LayoutPanelLeft, Link2, Table, Loader2, Plus, X, FileText, ChevronRight } from 'lucide-react';

// Extended type to track where a file came from
type ViewableFile = RepoFile & { originRepoId: string; originRepoName: string };

const ReaderPage: React.FC = () => {
  const { repoId } = useParams<{ repoId: string }>();
  const [searchParams] = useSearchParams();
  const [repo, setRepo] = useState<Repo | null>(null);
  
  // State for files currently open in the viewer (can be from different repos)
  const [viewingFiles, setViewingFiles] = useState<ViewableFile[]>([]);
  
  const [activeSelection, setActiveSelection] = useState<{ type: 'text' | 'region', data: SelectionData | RegionData, preview: string } | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Contrast Mode State
  const [syncScroll, setSyncScroll] = useState(false);
  const [generatingMatrix, setGeneratingMatrix] = useState(false);
  
  // Add File Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [allRepos, setAllRepos] = useState<Repo[]>([]);
  
  // Use a Map to store refs to the *scrollable* DOM elements
  const scrollRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Initial Load
  useEffect(() => {
    if (repoId) {
        // Load the main repo context
        ApiService.getRepo(repoId).then(r => {
            if (r) {
                setRepo(r);
                
                // Determine initial files to view based on URL param
                const requestedFileId = searchParams.get('fileId');
                let initialFiles: ViewableFile[] = [];

                if (requestedFileId) {
                    const found = r.files.find(f => f.id === requestedFileId);
                    if (found) {
                        initialFiles = [{ ...found, originRepoId: r.id, originRepoName: r.name }];
                    }
                }

                // Default: if no specific file requested AND no files currently viewing, open the first one
                if (initialFiles.length === 0 && viewingFiles.length === 0 && r.files.length > 0) {
                    initialFiles = [{ ...r.files[0], originRepoId: r.id, originRepoName: r.name }];
                }
                
                // Only update state if we have new initial files to show and nothing is currently shown
                if (initialFiles.length > 0 && viewingFiles.length === 0) {
                    setViewingFiles(initialFiles);
                }
            }
        });
        
        // Load all repos for the "Add File" feature
        ApiService.getRepos().then(setAllRepos);
    }
  }, [repoId, searchParams]); // Add searchParams to dependency

  // Synchronized Scrolling Logic
  const handleScroll = (sourceFileId: string, e: React.UIEvent<HTMLDivElement>) => {
      if (!syncScroll) return;
      const target = e.currentTarget;
      const percentage = target.scrollTop / (target.scrollHeight - target.clientHeight);

      viewingFiles.forEach(file => {
          if (file.id !== sourceFileId) {
              const el = scrollRefs.current.get(file.id);
              if (el) {
                  el.scrollTop = percentage * (el.scrollHeight - el.clientHeight);
              }
          }
      });
  };

  const generateComparison = async () => {
      if (!repoId || viewingFiles.length < 2) return;
      setGeneratingMatrix(true);
      try {
        // Pass the full file objects to the API
        await ApiService.generateComparisonMatrix(repoId, viewingFiles);
        // Refresh repo to show the new comparison file
        ApiService.getRepo(repoId).then(r => r && setRepo(r));
        setRefreshTrigger(prev => prev + 1);
      } catch(e) {
          alert("生成对比失败");
      } finally {
        setGeneratingMatrix(false);
      }
  };

  const handleTextSelect = (data: SelectionData) => {
    setActiveSelection({ type: 'text', data, preview: data.text });
  };

  const handleRegionSelect = (data: RegionData) => {
    setActiveSelection({ type: 'region', data, preview: `第 ${data.page} 页区域 (x:${data.x.toFixed(2)}, y:${data.y.toFixed(2)})` });
  };

  const handleRunCreate = async (prompt: string) => {
    if (!activeSelection || !repoId) return;
    const type = activeSelection.type === 'text' ? 'text_selection' : 'region_selection';
    const input: any = { prompt };

    if (activeSelection.type === 'text') {
      const d = activeSelection.data as SelectionData;
      input.text = d.text;
      input.context = d.context;
      input.page = d.page;
    } else {
      const d = activeSelection.data as RegionData;
      input.bbox = [d.x, d.y, d.width, d.height];
      input.page = d.page;
    }

    await ApiService.createRun(repoId, type, input);
    setActiveSelection(undefined);
    setRefreshTrigger(prev => prev + 1);
  };

  // Helper to register ref
  const setRef = (id: string, el: HTMLDivElement | null) => {
      if (el) scrollRefs.current.set(id, el);
      else scrollRefs.current.delete(id);
  };

  const addFileToView = (repo: Repo, file: RepoFile) => {
      if (viewingFiles.some(f => f.id === file.id)) return; // Already open
      if (viewingFiles.length >= 3) {
          alert("最多同时查看 3 个文件");
          return;
      }
      setViewingFiles([...viewingFiles, { ...file, originRepoId: repo.id, originRepoName: repo.name }]);
      setShowAddModal(false);
  };

  const removeFileFromView = (fileId: string) => {
      setViewingFiles(prev => prev.filter(f => f.id !== fileId));
  };

  if (!repoId || !repo) return null;

  return (
    <Layout>
      <div className="flex h-full w-full flex-col">
        {/* Top File Bar */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between shrink-0 z-20 shadow-sm">
             <div className="flex items-center gap-4 overflow-x-auto no-scrollbar flex-1">
                <Link to={`/repo/${repoId}`} className="text-gray-500 hover:text-indigo-600 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div className="h-6 w-px bg-gray-200 mx-2"></div>
                
                <div className="flex items-center gap-2">
                    {/* Active Tabs */}
                    {viewingFiles.map(file => (
                        <div
                            key={file.id}
                            className={`
                                pl-3 pr-2 py-1.5 rounded-full text-xs font-medium border flex items-center gap-2 transition-all whitespace-nowrap
                                bg-indigo-600 text-white border-indigo-600 shadow-sm
                            `}
                        >
                            <span className="max-w-[100px] truncate">{file.name}</span>
                            <button 
                                onClick={() => removeFileFromView(file.id)}
                                className="hover:bg-indigo-500 rounded-full p-0.5"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                    
                    {/* Add File Button */}
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="p-1.5 rounded-full border border-dashed border-gray-300 text-gray-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                        title="添加对比文件"
                    >
                        <Plus size={16} />
                    </button>
                </div>
             </div>
             
             <div className="flex items-center gap-3">
                 {/* Contrast Tools */}
                 {viewingFiles.length > 1 && (
                     <div className="flex items-center gap-2 border-r border-gray-200 pr-3 mr-1">
                         <button 
                            onClick={() => setSyncScroll(!syncScroll)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${syncScroll ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
                         >
                             <Link2 size={14} className={syncScroll ? "" : "opacity-50"} /> 同步滚动
                         </button>
                         <button 
                            onClick={generateComparison}
                            disabled={generatingMatrix}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                         >
                             {generatingMatrix ? <Loader2 size={14} className="animate-spin"/> : <Table size={14} />} 
                             生成对比矩阵
                         </button>
                     </div>
                 )}
                 <div className="text-xs text-gray-400 font-medium uppercase tracking-wider flex items-center gap-2">
                     <LayoutPanelLeft size={14}/> 视图 ({viewingFiles.length})
                 </div>
             </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
            {viewingFiles.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-100">
                    <p>暂无打开的文件</p>
                    <button onClick={() => setShowAddModal(true)} className="mt-4 text-indigo-600 hover:underline">打开文件</button>
                </div>
            ) : (
                <div className={`flex-1 grid gap-1 bg-gray-200 h-full overflow-hidden
                    ${viewingFiles.length === 1 ? 'grid-cols-1' : ''}
                    ${viewingFiles.length === 2 ? 'grid-cols-2' : ''}
                    ${viewingFiles.length === 3 ? 'grid-cols-3' : ''}
                `}>
                    {viewingFiles.map(file => (
                        <div key={file.id} className="relative bg-white h-full overflow-hidden flex flex-col border-r border-gray-200 last:border-r-0">
                            <div className="bg-gray-50 border-b border-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-2 truncate">
                                    <span className="text-gray-400 font-normal">{file.originRepoName} /</span>
                                    <span className="truncate">{file.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {syncScroll && <Link2 size={10} className="text-indigo-400"/>}
                                    <button onClick={() => removeFileFromView(file.id)} className="text-gray-400 hover:text-red-500">
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex-1 relative overflow-hidden">
                                {file.type === 'pdf' ? (
                                    <DocumentViewer 
                                        file={file.file}
                                        onTextSelect={handleTextSelect}
                                        onRegionSelect={handleRegionSelect}
                                        onScroll={(e) => handleScroll(file.id, e)}
                                        scrollRef={{ 
                                            get current() { return scrollRefs.current.get(file.id) || null; },
                                            set current(v) { setRef(file.id, v); }
                                        }}
                                    />
                                ) : file.type === 'markdown' ? (
                                    <TextViewer 
                                        content={file.content || ''} 
                                        onScroll={(e) => handleScroll(file.id, e)}
                                        scrollRef={(el) => setRef(file.id, el)}
                                    />
                                ) : (
                                    <div className="p-10 text-center text-gray-400">不支持的文件类型</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <RunPanel 
                repoId={repoId} 
                activeSelection={activeSelection ? { type: activeSelection.type, preview: activeSelection.preview } : undefined}
                onRunCreate={handleRunCreate}
                shouldRefresh={refreshTrigger}
            />
        </div>

        {/* Add File Modal */}
        {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">添加文件到阅读视图</h3>
                        <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={20}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {allRepos.map(r => (
                            <div key={r.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 px-4 py-2 text-sm font-bold text-gray-700 border-b border-gray-100 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                                    {r.name}
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {r.files.map(f => {
                                        const isOpen = viewingFiles.some(vf => vf.id === f.id);
                                        return (
                                            <button 
                                                key={f.id}
                                                disabled={isOpen}
                                                onClick={() => addFileToView(r, f)}
                                                className="w-full text-left px-4 py-3 hover:bg-indigo-50 flex items-center justify-between group transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <FileText size={16} className="text-gray-400 group-hover:text-indigo-500"/>
                                                    <span className="text-sm text-gray-700 font-medium">{f.name}</span>
                                                    <span className="text-[10px] uppercase bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                                        {f.category === 'original' ? '原文' : f.category}
                                                    </span>
                                                </div>
                                                {isOpen ? (
                                                    <span className="text-xs text-green-600 font-medium flex items-center gap-1"><Check size={12}/> 已打开</span>
                                                ) : (
                                                    <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-500"/>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>
    </Layout>
  );
};

export default ReaderPage;

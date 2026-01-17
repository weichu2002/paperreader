
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, Clock, ChevronRight, MoreVertical, Trash2, Edit2, Tag, Book, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import Layout from '../components/ui/Layout';
import { Repo } from '../types';
import { ApiService } from '../services/api';

const Home: React.FC = () => {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadRepos();
    // Close menus on click outside
    const handleClickOutside = () => setMenuOpenId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const loadRepos = async () => {
    try {
      const data = await ApiService.getRepos();
      setRepos(data);
    } catch (err) {
      console.error("Failed to load repos", err);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsImporting(true);
      try {
        const newRepo = await ApiService.importRepo(e.target.files[0]);
        setRepos(prev => [newRepo, ...prev]);
      } catch (err) {
        console.error(err);
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('确定要删除这个项目吗？')) {
      await ApiService.deleteRepo(id);
      setRepos(prev => prev.filter(r => r.id !== id));
    }
  };

  const startRename = (e: React.MouseEvent, repo: Repo) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(repo.id);
    setEditName(repo.name);
    setMenuOpenId(null);
  };

  const saveRename = async () => {
    if (editingId && editName.trim()) {
      await ApiService.renameRepo(editingId, editName);
      setRepos(prev => prev.map(r => r.id === editingId ? { ...r, name: editName } : r));
    }
    setEditingId(null);
  };

  return (
    <Layout>
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-5xl mx-auto px-8 py-12">
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">我的文献库</h1>
              <p className="text-gray-500 mt-2 text-lg">管理您的学术论文与研究分析。</p>
            </div>
            <button 
              onClick={handleImportClick}
              disabled={isImporting}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2 disabled:opacity-70"
            >
              {isImporting ? <span className="animate-spin">⏳</span> : <Plus size={20} />}
              导入 PDF
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".pdf" 
            />
          </div>

          {/* User Guide Card */}
          <div className="mb-10 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl overflow-hidden shadow-sm">
             <div 
                className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-indigo-50/50 transition-colors"
                onClick={() => setShowGuide(!showGuide)}
             >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full"><HelpCircle size={20} /></div>
                    <h2 className="font-semibold text-gray-800">CiteRepo 使用说明书</h2>
                </div>
                {showGuide ? <ChevronUp size={20} className="text-gray-400"/> : <ChevronDown size={20} className="text-gray-400"/>}
             </div>
             
             {showGuide && (
                 <div className="px-6 pb-6 pt-0 text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-3">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">1</div> 导入与管理</h3>
                        <p>点击右上角的“导入 PDF”按钮上传论文。在列表中可以重命名、删除或添加标签来组织您的文献。</p>
                        
                        <h3 className="font-bold text-gray-900 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">2</div> 智能阅读器</h3>
                        <p>点击“进入阅读器”查看 PDF。您可以划词（文本选择）或截图（区域选择），然后右侧的 AI 助手会自动针对选区进行解释或分析。</p>
                    </div>
                    <div className="space-y-3">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">3</div> 资源指南与播客</h3>
                        <p>在项目详情页，使用“资源指南”生成方法论解析、批判性审查等深度报告。试试新的“音频概览”，生成一段双人对话脚本！</p>
                        
                        <h3 className="font-bold text-gray-900 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">4</div> 对比矩阵</h3>
                        <p>在阅读器中，选中多个文件（如原文和翻译），点击“生成对比矩阵”来横向分析不同文档的异同。</p>
                    </div>
                 </div>
             )}
          </div>

          <div className="grid gap-6">
            {repos.length === 0 && (
                <div className="text-center py-20 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <Book size={48} className="mx-auto mb-4 opacity-20"/>
                    <p>还没有文献，请点击右上角导入。</p>
                </div>
            )}
            {repos.map(repo => (
              <div 
                key={repo.id} 
                className="group relative block bg-white border border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <Link to={`/repo/${repo.id}`} className="flex gap-4 flex-1">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                      <FileText size={24} />
                    </div>
                    <div className="flex-1">
                      {editingId === repo.id ? (
                        <div className="flex items-center gap-2" onClick={e => e.preventDefault()}>
                          <input 
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="border rounded px-2 py-1 text-lg font-semibold w-full"
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && saveRename()}
                            onClick={e => e.stopPropagation()}
                          />
                          <button onClick={saveRename} className="text-green-600 text-sm font-bold">保存</button>
                        </div>
                      ) : (
                        <h3 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {repo.name}
                        </h3>
                      )}
                      <p className="text-gray-500 mt-1 line-clamp-1">{repo.description}</p>
                      
                      <div className="flex items-center gap-4 mt-4">
                        <div className="text-sm text-gray-400 flex items-center gap-4">
                            <span className="flex items-center gap-1"><Clock size={14} /> {new Date(repo.importedAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{repo.files.length} 个文件</span>
                        </div>
                        {repo.tags && repo.tags.length > 0 && (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-px bg-gray-200"></div>
                                {repo.tags.map(tag => (
                                    <span key={tag} className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[10px] font-medium border border-indigo-100 flex items-center gap-0.5">
                                        <Tag size={8} /> {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                      </div>
                    </div>
                  </Link>
                  
                  <div className="flex items-center gap-2 relative">
                     <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === repo.id ? null : repo.id);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
                     >
                        <MoreVertical size={20} />
                     </button>
                     
                     {menuOpenId === repo.id && (
                       <div className="absolute top-10 right-0 bg-white shadow-xl border border-gray-100 rounded-lg py-1 w-32 z-10">
                         <button 
                           onClick={(e) => startRename(e, repo)}
                           className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                         >
                           <Edit2 size={14} /> 重命名
                         </button>
                         <button 
                           onClick={(e) => handleDelete(e, repo.id)}
                           className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                         >
                           <Trash2 size={14} /> 删除
                         </button>
                       </div>
                     )}

                     <Link to={`/repo/${repo.id}`} className="text-gray-300 group-hover:text-indigo-500 transition-colors ml-2">
                        <ChevronRight size={24} />
                     </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default Home;

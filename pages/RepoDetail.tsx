
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/ui/Layout';
import { Repo, Asset } from '../types';
import { ApiService } from '../services/api';
import { FileText, Share2, Layers, Image as ImageIcon, Sparkles, Languages, FileSearch, BrainCircuit, GitBranch, Microscope, AlertTriangle, Tag, User, Calendar, Plus, Headphones } from 'lucide-react';

const RepoDetail: React.FC = () => {
  const { repoId } = useParams<{ repoId: string }>();
  const [repo, setRepo] = useState<Repo | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadData();
  }, [repoId]);

  const loadData = async () => {
    if (!repoId) return;
    try {
      const r = await ApiService.getRepo(repoId);
      setRepo(r || null);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionName: string, apiCall: () => Promise<any>) => {
    if (!repoId || processing) return;
    setProcessing(actionName);
    try {
        await apiCall();
        await loadData();
    } catch (e) {
        alert(`${actionName} 失败`);
    } finally {
        setProcessing(null);
    }
  };

  const addTag = async () => {
    if (repo && newTag.trim()) {
        const updatedTags = [...(repo.tags || []), newTag.trim()];
        await ApiService.updateRepoMetadata(repo.id, { tags: updatedTags });
        setRepo({ ...repo, tags: updatedTags });
        setNewTag('');
    }
  };

  if (loading) return <Layout><div className="p-10">加载中...</div></Layout>;
  if (!repo) return <Layout><div className="p-10">找不到该文献库</div></Layout>;

  return (
    <Layout>
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 px-8 py-6 flex items-center justify-between bg-white">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link to="/" className="hover:text-gray-800">文献列表</Link> 
              <span>/</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{repo.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <div className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                    <User size={12} /> {repo.authors?.[0] || '未知作者'}
                </div>
                <div className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                    <Calendar size={12} /> {repo.year || 'N/A'}
                </div>
            </div>
          </div>
          <div className="flex gap-3">
             <button 
              onClick={() => ApiService.shareRepo(repo.id).then(r => alert("分享链接: " + r.url))}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium text-sm flex items-center gap-2 border border-gray-200"
            >
              <Share2 size={16} /> 分享
            </button>
            <Link 
              to={`/repo/${repo.id}/reader`}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-sm"
            >
              <FileText size={16} /> 进入阅读器
            </Link>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Analysis & Files */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* Academic Analysis Suite */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Sparkles size={20} className="text-indigo-600"/> 资源指南 (Source Guide)
                        </h2>
                        <span className="text-xs font-medium px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">AI 生成</span>
                    </div>
                    
                    {/* NotebookLM Style Podcast Feature */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg text-white shadow-md relative overflow-hidden group">
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-lg flex items-center gap-2"><Headphones size={20}/> 音频概览 (Audio Overview)</h3>
                                <p className="text-gray-300 text-sm mt-1">生成一段由两位 AI 主持人对话的深度解析脚本。</p>
                            </div>
                            <button 
                                onClick={() => handleAction('podcast', () => ApiService.generatePodcastScript(repo.id))}
                                disabled={!!processing}
                                className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-100 disabled:opacity-70 transition-colors"
                            >
                                {processing === 'podcast' ? '生成中...' : '生成脚本'}
                            </button>
                        </div>
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-500 rounded-full blur-3xl opacity-30"></div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ActionCard 
                            icon={<Microscope size={24} />}
                            color="blue"
                            title="方法论解析"
                            desc="深度拆解算法流程与实现细节"
                            onClick={() => handleAction('method', () => ApiService.generateMethodology(repo.id))}
                            loading={processing === 'method'}
                        />
                        <ActionCard 
                            icon={<AlertTriangle size={24} />}
                            color="orange"
                            title="批判性审查"
                            desc="识别逻辑漏洞、偏见与证据不足"
                            onClick={() => handleAction('critique', () => ApiService.generateCritique(repo.id))}
                            loading={processing === 'critique'}
                        />
                        <ActionCard 
                            icon={<GitBranch size={24} />}
                            color="purple"
                            title="学术概念图谱"
                            desc="可视化关键概念的逻辑关系"
                            onClick={() => handleAction('graph', () => ApiService.generateConceptGraph(repo.id))}
                            loading={processing === 'graph'}
                        />
                         <ActionCard 
                            icon={<BrainCircuit size={24} />}
                            color="emerald"
                            title="研究缺口发现"
                            desc="挖掘未解决问题与未来趋势"
                            onClick={() => handleAction('gaps', () => ApiService.generateResearchGaps(repo.id))}
                            loading={processing === 'gaps'}
                        />
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <button 
                             onClick={() => handleAction('trans', () => ApiService.generateTranslation(repo.id))}
                             disabled={!!processing}
                             className="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-2 font-medium"
                        >
                            {processing === 'trans' ? <span className="animate-spin">⏳</span> : <Languages size={16} />}
                            生成全文翻译
                        </button>
                    </div>
                </div>

                {/* File Workspace */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2">
                        <Layers size={20} className="text-gray-500"/> 工作区文件
                    </h2>
                    <div className="space-y-3">
                        {repo.files.map(file => (
                            <Link 
                                to={`/repo/${repo.id}/reader?fileId=${file.id}`}
                                key={file.id} 
                                className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-white hover:border-indigo-300 hover:shadow-sm transition-all group"
                            >
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className={`p-2 rounded-lg shrink-0 ${
                                        file.category === 'original' ? 'bg-red-100 text-red-600' : 
                                        file.category === 'comparison' ? 'bg-green-100 text-green-600' :
                                        file.category === 'translation' ? 'bg-blue-100 text-blue-600' :
                                        'bg-purple-100 text-purple-600'
                                    }`}>
                                        <FileText size={20} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-medium text-gray-900 truncate pr-2" title={file.name}>{file.name}</div>
                                        <div className="text-xs text-gray-500 flex gap-2 mt-1">
                                            <span className="capitalize px-2 py-0.5 rounded-full bg-gray-100 text-xs font-semibold tracking-wide shrink-0">
                                                {file.category === 'original' ? '原文' : 
                                                 file.category === 'translation' ? '翻译' : 
                                                 file.category === 'analysis' ? '分析' : 
                                                 file.category === 'comparison' ? '对比' : file.category}
                                            </span>
                                            <span className="self-center whitespace-nowrap">{new Date(file.createdAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-indigo-600 opacity-0 group-hover:opacity-100 font-medium text-sm flex items-center gap-1 shrink-0 ml-2">
                                    打开 <FileText size={14}/>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Metadata & Tags */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold mb-4 text-gray-800">元数据</h2>
                    <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed mb-6">
                        <p>{repo.description}</p>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">标签</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {repo.tags?.map(tag => (
                                    <span key={tag} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-medium border border-indigo-100 flex items-center gap-1">
                                        <Tag size={10} /> {tag}
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input 
                                    className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                                    placeholder="添加标签..."
                                    value={newTag}
                                    onChange={e => setNewTag(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addTag()}
                                />
                                <button onClick={addTag} className="bg-gray-100 hover:bg-gray-200 p-1 rounded text-gray-600">
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">页数</div>
                                <div className="text-lg font-semibold text-gray-900">{repo.pageCount}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">导入时间</div>
                                <div className="text-sm font-semibold text-gray-900">{new Date(repo.importedAt).toLocaleDateString()}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
};

const ActionCard: React.FC<{icon: any, color: string, title: string, desc: string, onClick: () => void, loading: boolean}> = ({icon, color, title, desc, onClick, loading}) => {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600 hover:border-blue-300',
        orange: 'bg-orange-50 text-orange-600 hover:border-orange-300',
        purple: 'bg-purple-50 text-purple-600 hover:border-purple-300',
        emerald: 'bg-emerald-50 text-emerald-600 hover:border-emerald-300',
    };
    
    return (
        <button 
            onClick={onClick}
            disabled={loading}
            className={`flex flex-col gap-3 p-5 rounded-xl border border-transparent transition-all text-left ${colorClasses[color]} ${loading ? 'opacity-70 cursor-wait' : ''}`}
        >
            <div className="flex justify-between items-start w-full">
                <div className={`p-3 bg-white rounded-lg shadow-sm`}>
                    {loading ? <span className="animate-spin block">⏳</span> : icon}
                </div>
            </div>
            <div>
                <h3 className="font-bold text-gray-900">{title}</h3>
                <p className="text-xs opacity-80 mt-1 leading-relaxed">{desc}</p>
            </div>
        </button>
    )
}

export default RepoDetail;

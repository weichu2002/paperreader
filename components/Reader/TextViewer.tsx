
import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ZoomIn, ZoomOut, Maximize, Move } from 'lucide-react';

interface TextViewerProps {
  content: string;
  scrollRef?: React.RefCallback<HTMLDivElement>;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

declare global {
  interface Window {
    mermaid: any;
  }
}

// 缩放平移组件
const ZoomableMermaid: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale(s => Math.min(Math.max(0.5, s * delta), 5));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const reset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50 my-6 group h-[500px]">
       {/* Controls */}
       <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded shadow-sm border border-gray-200">
          <button onClick={() => setScale(s => Math.min(s + 0.2, 5))} className="p-1 hover:bg-gray-100 rounded" title="放大"><ZoomIn size={16}/></button>
          <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-1 hover:bg-gray-100 rounded" title="缩小"><ZoomOut size={16}/></button>
          <button onClick={reset} className="p-1 hover:bg-gray-100 rounded" title="重置"><Maximize size={16}/></button>
       </div>
       <div className="absolute top-2 left-2 z-10 bg-white/50 px-2 py-1 text-xs text-gray-500 rounded pointer-events-none flex items-center gap-1">
          <Move size={12} /> 拖拽平移 | 滚轮缩放
       </div>

       <div 
        className="w-full h-full cursor-move flex items-center justify-center overflow-hidden"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
       >
         <div 
            style={{ 
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
         >
            {children}
         </div>
       </div>
    </div>
  );
};

const TextViewer: React.FC<TextViewerProps> = ({ content, scrollRef, onScroll }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize mermaid when content changes
    if (window.mermaid && containerRef.current) {
      window.mermaid.init(undefined, containerRef.current.querySelectorAll('.mermaid-code'));
    }
  }, [content]);

  return (
    <div 
        ref={(el) => {
            // Internal ref for mermaid init
            (containerRef as any).current = el;
            // External ref for sync scrolling
            if (scrollRef) scrollRef(el);
        }}
        onScroll={onScroll}
        className="h-full w-full overflow-y-auto bg-white p-8 scroll-smooth"
    >
      <div className="max-w-3xl mx-auto pb-20">
        <article className="prose prose-indigo max-w-none">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              code({node, className, children, ...props}) {
                const match = /language-mermaid/.test(className || '');
                if (match) {
                  return (
                    <ZoomableMermaid>
                        <div className="mermaid-code bg-transparent">
                            {String(children).replace(/\n$/, '')}
                        </div>
                    </ZoomableMermaid>
                  );
                }
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
};

export default TextViewer;

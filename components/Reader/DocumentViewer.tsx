
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SAMPLE_PDF_TEXT } from '../../constants';
import { SelectionData, RegionData } from '../../types';
import { MousePointer2, Crop, Loader2, AlertCircle } from 'lucide-react';

const TEXT_LAYER_CSS = `
  .textLayer {
    position: absolute;
    text-align: initial;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
    opacity: 0.2; 
    line-height: 1.0;
    pointer-events: auto;
  }
  .textLayer ::selection {
    background: rgba(0, 0, 255, 0.3);
  }
  .textLayer span {
    color: transparent;
    position: absolute;
    white-space: pre;
    cursor: text;
    transform-origin: 0% 0%;
  }
  .region-mode .textLayer {
    pointer-events: none;
  }
`;

interface DocumentViewerProps {
  file?: File;
  onTextSelect: (data: SelectionData) => void;
  onRegionSelect: (data: RegionData) => void;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  scrollRef?: React.RefObject<HTMLDivElement>;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ file, onTextSelect, onRegionSelect, onScroll, scrollRef }) => {
  const [mode, setMode] = useState<'text' | 'region'>('text');
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Interaction State
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number, y: number } | null>(null);
  const [currentRegion, setCurrentRegion] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const localRef = useRef<HTMLDivElement>(null);
  const actualRef = scrollRef || localRef; // Use external ref if provided

  // Load PDF
  useEffect(() => {
    if (!file) {
      setPdfDocument(null);
      setNumPages(0);
      return;
    }

    const loadPdf = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const PDFJS = window.pdfjsLib;
        if (!PDFJS) throw new Error("PDF.js library failed to load.");

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = PDFJS.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        setPdfDocument(pdf);
        setNumPages(pdf.numPages);
      } catch (err: any) {
        console.error("Error loading PDF:", err);
        setError(err.message || "Failed to load PDF.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [file]);

  // Handle Text Selection
  const handleMouseUp = () => {
    if (mode === 'region') return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const text = selection.toString().trim();
    if (text.length > 0) {
      let currentNode = selection.anchorNode;
      let pageNum = 1;
      
      while (currentNode && actualRef.current && actualRef.current.contains(currentNode)) {
         if (currentNode instanceof HTMLElement && currentNode.dataset.pageNumber) {
             pageNum = parseInt(currentNode.dataset.pageNumber);
             break;
         }
         currentNode = currentNode.parentNode;
      }

      const context = selection.anchorNode?.parentElement?.innerText || text;
      onTextSelect({ text, context, page: pageNum });
    }
  };

  // Region Selection Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode !== 'region') return;
    const pageContainer = (e.target as HTMLElement).closest('.page-container');
    if (!pageContainer) return;
    const rect = pageContainer.getBoundingClientRect();
    setIsDrawing(true);
    setStartPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setCurrentRegion(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !startPoint || mode !== 'region') return;
    const pageContainer = (e.target as HTMLElement).closest('.page-container');
    if (!pageContainer) return;
    const rect = pageContainer.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    setCurrentRegion({
      x: Math.min(startPoint.x, currentX),
      y: Math.min(startPoint.y, currentY),
      w: Math.abs(currentX - startPoint.x),
      h: Math.abs(currentY - startPoint.y)
    });
  };

  const handleRegionMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !currentRegion || mode !== 'region') {
       setIsDrawing(false);
       return;
    }
    const pageContainer = (e.target as HTMLElement).closest('.page-container');
    if (pageContainer && pageContainer instanceof HTMLElement) {
       const pageNum = parseInt(pageContainer.dataset.pageNumber || '1');
       const { width, height } = pageContainer.getBoundingClientRect();
       onRegionSelect({
         x: currentRegion.x / width,
         y: currentRegion.y / height,
         width: currentRegion.w / width,
         height: currentRegion.h / height,
         page: pageNum
       });
    }
    setIsDrawing(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-200">
      <style>{TEXT_LAYER_CSS}</style>
      
      {/* Toolbar */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-center gap-4 px-4 shadow-sm z-20 sticky top-0 shrink-0">
        <button 
          onClick={() => setMode('text')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'text' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <MousePointer2 size={16} /> 文本选择模式
        </button>
        <button 
          onClick={() => setMode('region')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'region' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <Crop size={16} /> 区域截图模式
        </button>
      </div>

      {/* Main Viewer Area */}
      <div 
        ref={actualRef}
        onScroll={onScroll}
        className={`flex-1 overflow-y-auto p-8 flex flex-col items-center gap-8 select-text ${mode === 'region' ? 'region-mode cursor-crosshair' : ''}`}
        onMouseUp={handleMouseUp}
      >
        {!file ? (
           <div className="bg-white p-12 shadow-lg max-w-2xl text-center rounded-lg">
             <AlertCircle className="mx-auto text-indigo-500 mb-4" size={48} />
             <h3 className="text-xl font-semibold mb-2">未加载 PDF</h3>
             <p className="text-gray-500">请导入一个 PDF 文件开始阅读。</p>
           </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-4">
            <Loader2 size={32} className="animate-spin text-indigo-600" />
            <p>正在渲染 PDF...</p>
          </div>
        ) : (
          Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
            <div 
              key={pageNum}
              className="page-wrapper relative shadow-lg"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleRegionMouseUp}
            >
              <PDFPage pdf={pdfDocument} pageNumber={pageNum} scale={1.5} />
              {mode === 'region' && isDrawing && currentRegion && (
                <div 
                  className="absolute border-2 border-indigo-500 bg-indigo-500/20 pointer-events-none z-50"
                  style={{ left: currentRegion.x, top: currentRegion.y, width: currentRegion.w, height: currentRegion.h }}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const PDFPage: React.FC<{ pdf: any; pageNumber: number; scale: number }> = ({ pdf, pageNumber, scale }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pdf || !canvasRef.current || !textLayerRef.current) return;
    let isCancelled = false;

    const renderPage = async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d');
        if (!context) return;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;
        if (isCancelled) return;

        const textLayerDiv = textLayerRef.current!;
        textLayerDiv.innerHTML = ''; 
        textLayerDiv.style.width = `${viewport.width}px`;
        textLayerDiv.style.height = `${viewport.height}px`;
        textLayerDiv.style.setProperty('--scale-factor', `${scale}`);

        const textContent = await page.getTextContent();
        
        // Use Global PDFJS
        window.pdfjsLib.renderTextLayer({
          textContentSource: textContent,
          container: textLayerDiv,
          viewport: viewport,
          textDivs: []
        });
      } catch (err) { console.error(err); }
    };
    renderPage();
    return () => { isCancelled = true; };
  }, [pdf, pageNumber, scale]);

  return (
    <div className="page-container bg-white relative" data-page-number={pageNumber} style={{ minHeight: '200px' }}>
      <canvas ref={canvasRef} className="block pointer-events-none" />
      <div ref={textLayerRef} className="textLayer" />
    </div>
  );
};

export default DocumentViewer;
